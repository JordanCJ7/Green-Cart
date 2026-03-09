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

# Lock copied artifacts to read/execute only so runtime cannot modify shipped files.
# Keep a dedicated cache path writable for runtime image optimizations.
RUN chmod -R a-w ./public ./.next/static ./ \
	&& mkdir -p ./.next/cache \
	&& chown -R app:app ./.next/cache \
	&& chmod -R u+w,go-w ./.next/cache

USER app
EXPOSE 3000
CMD ["node", "server.js"]
