# syntax=docker/dockerfile:1
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@11.19.0 --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/admin/package.json apps/admin/
COPY apps/site/package.json apps/site/
COPY packages/content/package.json packages/content/
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/admin/node_modules ./apps/admin/node_modules
COPY --from=deps /app/packages/content/node_modules ./packages/content/node_modules
COPY packages/content packages/content
COPY apps/admin apps/admin
RUN pnpm --filter @hecy/admin build

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/admin/node_modules ./apps/admin/node_modules
COPY --from=build /app/packages/content ./packages/content
COPY --from=build /app/apps/admin/.next ./apps/admin/.next
COPY --from=build /app/apps/admin/public ./apps/admin/public
COPY apps/admin/package.json apps/admin/
EXPOSE 3001
WORKDIR /app/apps/admin
# .env 由 docker-compose env_file 注入，不打进镜像
CMD ["pnpm", "start"]
