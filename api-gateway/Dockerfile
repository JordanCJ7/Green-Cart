# ─── Stage 1: Dependencies ────────────────────────────────────────────────────
# Install only production dependencies in this stage so we can copy them
# cleanly into the final image without dev tooling.
# hadolint ignore=DL3018,DL3028
FROM node:22-alpine AS deps

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

# ─── Stage 2: Runner ──────────────────────────────────────────────────────────
# hadolint ignore=DL3018,DL3028
FROM node:22-alpine AS runner

# Create a non-root user to run the process
RUN addgroup -S app && adduser -S app -G app

WORKDIR /app

# Copy production node_modules from the deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source (no build step needed — plain JS)
COPY package*.json ./
COPY src ./src

USER app

EXPOSE 8080

ENV NODE_ENV=production

# Cloud Run sets PORT automatically; our app reads it via config.js
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 8080) + '/health', (r) => { if (r.statusCode !== 200) throw new Error(r.statusCode) })"

CMD ["node", "src/index.js"]
