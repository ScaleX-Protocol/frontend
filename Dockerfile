# === BUILDER STAGE ===
FROM node:20-alpine AS builder

# Install build dependencies
RUN apk add --no-cache libc6-compat python3 make g++

# Install pnpm
RUN npm install -g pnpm@latest

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Copy environment file to web app directory
ARG CHAIN=base-sepolia
RUN cp .env.${CHAIN} apps/web/.env || (echo "Environment file for ${CHAIN} not found, using base-sepolia" && cp .env.base-sepolia apps/web/.env)

# Build using pnpm dlx to run vite (works in monorepo)
RUN cd apps/web && pnpm vite build

# === PRODUCTION STAGE ===
FROM nginx:alpine AS runner

# Install curl for health checks
RUN apk add --no-cache curl

# Copy built application
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create non-root user
RUN addgroup --system --gid 1001 nginx || true && \
    adduser --system --uid 1001 -G nginx nginx || true

# Configuration
EXPOSE 80
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]