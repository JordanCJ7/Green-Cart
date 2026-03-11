# ─── Stage 1: Builder ─────────────────────────────────────────────────────────
# Using node:22-alpine for production stability and smaller image size
# hadolint ignore=DL3018,DL3028
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files and install all deps (including devDeps for tsc)
COPY package*.json ./
RUN npm ci --ignore-scripts

# Copy source and compile
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ─── Stage 2: Runner ──────────────────────────────────────────────────────────
# Using node:22-alpine for production stability and smaller image size
# hadolint ignore=DL3018,DL3028
FROM node:22-alpine AS runner

RUN addgroup -S app && adduser -S app -G app

WORKDIR /app

# Copy compiled output and production deps only
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

COPY --from=builder /app/dist ./dist

USER app

EXPOSE 8081

ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8081/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

CMD ["node", "dist/index.js"]
