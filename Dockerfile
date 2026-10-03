# Сборка: next build → standalone (server.js + минимум node_modules).
FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 NEXT_TELEMETRY_DISABLED=1
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
# Миграции применяются при старте сервера (src/instrumentation.ts).
COPY --from=build /app/drizzle ./drizzle
USER node
EXPOSE 3000
CMD ["node", "server.js"]
