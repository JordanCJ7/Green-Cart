# Multi-stage build for Inventory Service

# Stage 1: builder
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies including dev dependencies for TypeScript build
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# Copy source and build
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Stage 2: runtime
FROM node:22-alpine AS runner

WORKDIR /app

# Create non-root runtime user
RUN addgroup -S app && adduser -S app -G app

# Install only production dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

# Copy compiled output
COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production

USER app

EXPOSE 8082

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
	CMD node -e "require('http').get('http://localhost:8082/health',(r)=>{if(r.statusCode!==200)process.exit(1)})"

CMD ["node", "dist/index.js"]
