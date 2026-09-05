# syntax=docker/dockerfile:1
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@11.19.0 --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY apps/admin/package.json apps/admin/
COPY apps/site/package.json apps/site/
COPY packages/content/package.json packages/content/
RUN pnpm install --frozen-lockfile

FROM base AS build
# pnpm --filter 需要 workspace 清单；admin 的 tsconfig 继承根目录 tsconfig.base.json
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/admin/node_modules ./apps/admin/node_modules
COPY --from=deps /app/packages/content/node_modules ./packages/content/node_modules
COPY packages/content packages/content
COPY apps/admin apps/admin
COPY apps/site apps/site
RUN pnpm --filter @hecy/admin build && pnpm --filter @hecy/site build

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/admin/node_modules ./apps/admin/node_modules
COPY --from=build /app/packages/content ./packages/content
COPY --from=build /app/apps/admin/.next ./apps/admin/.next
COPY --from=build /app/apps/admin/public ./apps/admin/public
COPY apps/admin/package.json apps/admin/
# 数据库初始化脚本：容器启动时 entrypoint 会执行 db:push / seed-if-empty
COPY apps/admin/drizzle.config.ts apps/admin/drizzle.config.ts
COPY apps/admin/scripts apps/admin/scripts/
# 动态渲染模式（BUILD_MODE=isr）：site 容器直接 next start 使用镜像内 .next；
COPY --from=build /app/apps/site/.next ./apps/site/.next
# 本机构建模式（BUILD_MODE=local）：前台源码与依赖留在镜像内，
# 后台点发布时在容器里对 /app/apps/site 执行 next build，产物写入挂载的 out-live 卷。
# 产物不直接写挂载点：Next.js 导出会 rm 整个 out 目录，对 bind mount 会报 EBUSY，
# 因此构建写入非挂载的 out/，再由 local-build 同步到 out-live。
COPY --from=deps /app/apps/site/node_modules ./apps/site/node_modules
COPY packages/content packages/content
COPY apps/site/package.json apps/site/tsconfig.json apps/site/next.config.ts apps/site/next-env.d.ts apps/site/
COPY apps/site/src apps/site/src/
COPY apps/site/public apps/site/public/
COPY tsconfig.base.json ./
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
EXPOSE 3001
WORKDIR /app/apps/admin
# .env 由 docker-compose 注入，不打进镜像
CMD ["sh", "scripts/entrypoint.sh"]
