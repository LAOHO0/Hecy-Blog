# syntax=docker/dockerfile:1
# 前台动态渲染服务专用镜像：只构建与包含 site 运行所需内容。
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@11.19.0 --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY apps/site/package.json apps/site/
COPY packages/content/package.json packages/content/
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/site/node_modules ./apps/site/node_modules
COPY --from=deps /app/packages/content/node_modules ./packages/content/node_modules
COPY packages/content packages/content
COPY apps/site apps/site
# 动态渲染模式构建无需内容 API（详情页不预渲染）；prebuild 按模式适配段配置
RUN pnpm --filter @hecy/site build

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/site/node_modules ./apps/site/node_modules
COPY --from=build /app/packages/content ./packages/content
COPY --from=build /app/apps/site/.next ./apps/site/.next
COPY apps/site/public apps/site/public/
COPY apps/site/package.json apps/site/next.config.ts apps/site/
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
EXPOSE 3000
WORKDIR /app/apps/site
CMD ["pnpm", "start"]
