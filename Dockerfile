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

# Build application (only runs when source changes)
RUN pnpm run build

# === PRODUCTION STAGE ===
FROM node:20-alpine AS runner

# Install curl for health checks
RUN apk add --no-cache curl

# Set working directory
WORKDIR /app

# Create security user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy only necessary files from builder stage
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Switch to non-root user
USER nextjs

# Runtime configuration
EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check with optimized timing
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start the application using standalone server
CMD ["node", "server.js"]