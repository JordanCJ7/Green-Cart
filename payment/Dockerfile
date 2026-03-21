# Multi-stage build for Payment Service
# Stage 1: Builder
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies (including devDeps for build)
RUN npm ci --ignore-scripts

# Copy source code
COPY src ./src
COPY tsconfig.json .

# Build TypeScript
RUN npm run build

# Stage 2: Runtime
FROM node:22-alpine

WORKDIR /app

# Create app user (non-root)
RUN addgroup -g 1001 -S app && adduser -S app -u 1001

# Copy package files
COPY package.json package-lock.json ./

# Install production dependencies only
RUN npm ci --ignore-scripts --omit=dev

# Copy compiled code from builder
COPY --from=builder /app/dist ./dist

# Install curl for health checks (before switching to non-root user)
RUN apk add --no-cache curl

# Switch to app user
USER app

# Expose port
EXPOSE 8083
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8083/health || exit 1

# Start service
CMD ["node", "dist/index.js"]
