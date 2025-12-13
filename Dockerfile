# === BUILDER STAGE ===
FROM node:20-alpine AS builder

# Install dependencies for building
RUN apk add --no-cache libc6-compat

# Set working directory
WORKDIR /app

# Install pnpm globally (cached layer)
RUN npm install -g pnpm@latest

# Copy package files first (changes rarely = better caching)
COPY package.json pnpm-lock.yaml ./

# Install all dependencies (cached unless package.json changes)
RUN pnpm install --frozen-lockfile

# Copy source code (changes frequently but doesn't invalidate deps)
COPY . .

# Accept build argument for chain selection (defaults to base-sepolia)
ARG CHAIN=base-sepolia

# Copy appropriate .env file based on CHAIN arg
# Vite bakes env vars at build time, so we need the .env file before building
RUN cp .env.${CHAIN} .env || cp .env.base-sepolia .env

# Build application (only runs when source changes)
RUN pnpm run build

# === PRODUCTION STAGE ===
FROM nginx:alpine AS runner

# Install curl for health checks
RUN apk add --no-cache curl

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Switch to non-root user
RUN addgroup --system --gid 1001 nginx && \
    adduser --system --uid 1001 -G nginx nginx

# Runtime configuration
EXPOSE 80
ENV NODE_ENV=production

# Health check with optimized timing
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:80/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]