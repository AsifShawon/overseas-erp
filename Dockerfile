# syntax=docker/dockerfile:1.7

FROM node:22-bookworm-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS builder
ENV DATABASE_URL=postgresql://overseas:overseas_dev_password@localhost:5432/overseas_erp_dev?schema=public
COPY . .
RUN npm run db:generate
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/generated ./generated
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
RUN mkdir -p /app/storage && chown -R node:node /app
USER node
EXPOSE 3000
CMD ["node", "server.js"]
