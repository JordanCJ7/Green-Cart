FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY app ./app
COPY lib ./lib
COPY public ./public
COPY next.config.mjs ./
COPY next-env.d.ts ./
COPY tsconfig.json ./
COPY .eslintrc.json ./
COPY package.json ./
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production

RUN addgroup -S app && adduser -S app -G app

COPY --from=build --chown=app:app /app/public ./public
COPY --from=build --chown=app:app /app/.next/standalone ./
COPY --from=build --chown=app:app /app/.next/static ./.next/static

USER app
EXPOSE 3000
CMD ["node", "server.js"]
