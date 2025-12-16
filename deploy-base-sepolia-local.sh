#!/bin/bash

# =============================================================================
# Deploy to Production - Base Sepolia (Local Simulation)
# =============================================================================
# This script simulates ONLY the "Deploy to Production" section from
# .github/workflows/base-sepolia.yml (deploy-base-sepolia job)
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
DOMAIN="base-sepolia-app.scalex.money"
COMPOSE_FILE="docker-compose.base-sepolia.yml"

echo -e "${BLUE}=========================================="
echo -e "🚀 DEPLOY TO PRODUCTION - BASE SEPOLIA"
echo -e "==========================================${NC}"
echo ""

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Step 1: Deploy to production
deploy_to_production() {
    log_info "Deploying Base Sepolia frontend..."
    echo ""

    # Clean up Docker resources to prevent disk space issues
    echo "=== Cleaning Docker resources ==="
    docker system prune -f --volumes
    docker image prune -a -f --filter "until=24h"

    # Set up environment variables
    cp .env.base-sepolia .env
    log_success "Environment variables set up"
    echo ""

    # Build services
    echo "=== Building Base Sepolia services ==="
    if docker-compose -f "$COMPOSE_FILE" build --no-cache; then
        log_success "Build completed"
    else
        log_error "Build failed, checking build logs..."
        docker-compose -f "$COMPOSE_FILE" build --no-cache --progress=plain
        exit 1
    fi
    echo ""

    # Stop existing services
    echo "=== Stopping existing services ==="
    docker-compose -f "$COMPOSE_FILE" down --remove-orphans || true
    log_success "Existing services stopped"
    echo ""

    # Start services
    echo "=== Starting Base Sepolia services ==="
    if docker-compose -f "$COMPOSE_FILE" up -d; then
        log_success "Services started"
    else
        log_error "Service start failed, checking logs..."
        docker-compose -f "$COMPOSE_FILE" logs
        exit 1
    fi
    echo ""

    # Check initial service status
    echo "=== Checking initial service status ==="
    sleep 15
    docker-compose -f "$COMPOSE_FILE" ps
    echo ""
}

# Step 2: Show Container Logs
show_container_logs() {
    echo "=========================================="
    echo "📋 CONTAINER LOGS AND STATUS"
    echo "=========================================="
    echo ""

    echo "=== 1. CONTAINER STATUS ==="
    docker-compose -f "$COMPOSE_FILE" ps
    echo ""

    echo "=== 2. FRONTEND CONTAINER LOGS (last 100 lines) ==="
    docker-compose -f "$COMPOSE_FILE" logs --tail=100 frontend-base-sepolia
    echo ""

    echo "=== 3. STARTUP VERIFICATION ==="
    # Check if container is running
    CONTAINER_STATUS=$(docker-compose -f "$COMPOSE_FILE" ps -q frontend-base-sepolia)
    if [ -n "$CONTAINER_STATUS" ]; then
        log_success "Frontend container is running: $CONTAINER_STATUS"

        # Check container startup time
        STARTED_AT=$(docker inspect --format='{{.State.StartedAt}}' $CONTAINER_STATUS)
        echo "Container started at: $STARTED_AT"

        # Check if application is ready internally
        echo "Testing internal health endpoint..."
        if timeout 30s docker-compose -f "$COMPOSE_FILE" exec -T frontend-base-sepolia curl -f http://localhost/health > /dev/null 2>&1; then
            log_success "Internal health check passed"
        else
            echo "⚠️ Internal health check failed - application may still be starting"
        fi
    else
        log_error "Frontend container is NOT running"
        echo "All containers status:"
        docker-compose -f "$COMPOSE_FILE" ps -a
        echo "Docker events (last 10):"
        docker events --since 10m --format "{{.Time}} {{.Status}} {{.Actor.Attributes.name}}" | tail -10
        exit 1
    fi
    echo ""

    echo "=== 4. SYSTEM RESOURCES ==="
    echo "Available disk space:"
    df -h | grep -E "(Filesystem|/dev/)" || df -h | head -2
    echo ""
    echo "Memory usage:"
    if command -v free &> /dev/null; then
        free -h
    else
        # macOS alternative
        vm_stat | head -5
    fi
    echo ""
    echo "Docker system info:"
    docker system df
    echo ""
}

# Step 3: Run health check
run_health_check() {
    echo "=========================================="
    echo "🌐 HEALTH CHECKS"
    echo "=========================================="
    sleep 30
    echo ""

    # Check health endpoint (local version)
    echo "--- Testing Health Endpoint ---"

    # Get the mapped port for local testing
    LOCAL_PORT=$(docker-compose -f "$COMPOSE_FILE" port frontend-base-sepolia 80 2>/dev/null | cut -d':' -f2)

    if [ -n "$LOCAL_PORT" ]; then
        log_info "Testing on localhost:$LOCAL_PORT"

        for attempt in {1..5}; do
            response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$LOCAL_PORT/health)
            echo "Attempt $attempt: HTTP $response"

            if [ "$response" = "200" ]; then
                log_success "Health check passed (HTTP $response)"
                break
            else
                echo "⏳ Health check failed (HTTP $response) - retrying in 15s..."
                sleep 15

                if [ $attempt -eq 5 ]; then
                    log_error "Health check failed after 5 attempts (HTTP $response)"
                    echo "Debugging - checking container logs:"
                    docker-compose -f "$COMPOSE_FILE" logs --tail=20 frontend-base-sepolia
                    echo "Debugging - checking container status:"
                    docker-compose -f "$COMPOSE_FILE" ps
                    echo "Debugging - testing local connectivity:"
                    docker-compose -f "$COMPOSE_FILE" exec -T frontend-base-sepolia curl -f http://localhost/health || echo "Local health check failed"
                    exit 1
                fi
            fi
        done

        # Check main application with redirect following
        main_response=$(curl -s -L -o /dev/null -w "%{http_code}" http://localhost:$LOCAL_PORT)
        if [ "$main_response" = "200" ]; then
            log_success "Main app health check passed (HTTP $main_response)"
        else
            echo "⚠️ Main app health check: HTTP $main_response"
        fi

        # Performance check
        start_time=$(date +%s%N)
        curl -s http://localhost:$LOCAL_PORT > /dev/null
        end_time=$(date +%s%N)
        response_time=$(echo "scale=2; ($end_time - $start_time) / 1000000" | bc)
        echo "📊 Response time: ${response_time}ms"
    else
        log_info "Could not determine local port, testing directly via container..."
        if docker-compose -f "$COMPOSE_FILE" exec -T frontend-base-sepolia curl -f http://localhost/health > /dev/null 2>&1; then
            log_success "Container internal health check passed"
        else
            log_error "Container health check failed"
            exit 1
        fi
    fi
    echo ""
}

# Step 4: Verify Container Status
verify_container_status() {
    echo "=========================================="
    echo "🔍 CONTAINER VERIFICATION"
    echo "=========================================="
    echo ""

    echo "=== 1. CONTAINER STATUS CHECK ==="
    docker-compose -f "$COMPOSE_FILE" ps
    echo ""

    echo "=== 2. DETAILED CONTAINER INSPECTION ==="
    FRONTEND_STATUS=$(docker-compose -f "$COMPOSE_FILE" ps -q frontend-base-sepolia)
    if [ -n "$FRONTEND_STATUS" ]; then
        log_success "Frontend container is running: $FRONTEND_STATUS"

        echo ""
        echo "=== 3. CONTAINER HEALTH CHECK ==="
        # Test container internal health
        if docker-compose -f "$COMPOSE_FILE" exec -T frontend-base-sepolia curl -f http://localhost/health > /dev/null 2>&1; then
            log_success "Internal container health: PASS"
        else
            log_error "Internal container health: FAIL"
            echo "Container logs (last 15 lines):"
            docker-compose -f "$COMPOSE_FILE" logs --tail=15 frontend-base-sepolia
            exit 1
        fi

        echo ""
        echo "=== 4. RESOURCE USAGE ==="
        docker stats --no-stream $FRONTEND_STATUS || echo "Could not get container stats"

        echo ""
        echo "=== 5. LATEST LOGS ==="
        docker-compose -f "$COMPOSE_FILE" logs --tail=20 frontend-base-sepolia
    else
        log_error "Frontend container is NOT running"
        echo "Debugging container failure:"
        docker-compose -f "$COMPOSE_FILE" logs frontend-base-sepolia
        docker-compose -f "$COMPOSE_FILE" ps -a
        exit 1
    fi
    echo ""
}

# Main execution
main() {
    deploy_to_production
    show_container_logs
    run_health_check
    verify_container_status

    echo -e "${GREEN}=========================================="
    echo -e "✅ DEPLOYMENT COMPLETED SUCCESSFULLY"
    echo -e "==========================================${NC}"
    echo ""
    echo -e "${BLUE}Container is running on:${NC}"
    LOCAL_PORT=$(docker-compose -f "$COMPOSE_FILE" port frontend-base-sepolia 80 2>/dev/null | cut -d':' -f2)
    if [ -n "$LOCAL_PORT" ]; then
        echo -e "  ${GREEN}http://localhost:$LOCAL_PORT${NC}"
    else
        echo -e "  ${GREEN}http://localhost:3000${NC} (default)"
    fi
    echo ""
    echo -e "${YELLOW}To stop the container:${NC}"
    echo -e "  ${BLUE}docker-compose -f $COMPOSE_FILE down${NC}"
    echo ""
}

# Run main
main
