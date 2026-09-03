# Hecy Blog

Hecy Blog 是一个中文优先的个人内容系统：静态前台负责展示文章、产品和项目，独立后台负责编辑、预览、发布、媒体和构建管理。正文使用统一的 Markdown / MDX 安全子集编辑器。

## 目录

- `apps/site`：Next.js 静态前台，可部署到对象存储、Nginx 或其他静态文件托管。
- `apps/admin`：Next.js 服务端后台，包含用户名/密码登录、内容 CRUD、发布队列和设置。
- `packages/content`：共享类型、种子数据、Drizzle schema 和校验规则。
- `docs`：部署、迁移和运维说明。

## 本地启动

~~~powershell
pnpm install
Copy-Item .env.example apps/admin/.env.local
Copy-Item apps/site/.env.example apps/site/.env.local
pnpm dev
~~~

- 前台：<http://localhost:3000>
- 后台：<http://localhost:3001/login>
- 开发模式默认用户名为 `hecy`；请把 `apps/admin/.env.local` 中的 `ADMIN_PASSWORD` 改成自己的密码。示例中的 `DATABASE_URL` 默认留空，后台会使用内存演示数据；需要持久化时再启动 PostgreSQL 并填写连接串。

如果需要真实 PostgreSQL：

~~~powershell
docker compose up -d postgres
pnpm db:push
pnpm db:seed
~~~

没有配置 `DATABASE_URL` 时，开发环境后台会使用内置演示数据，方便先预览界面；生产环境必须配置 PostgreSQL、`ADMIN_PASSWORD_HASH` 和 `AUTH_SECRET`。生产构建还必须配置 `CONTENT_API_URL`；只有明确设置 `ALLOW_SEED_FALLBACK=true` 时才允许使用种子快照。

## 发布流程

后台采用“草稿 → 私有预览 → 手动发布 → 触发静态构建”的流程。GitHub Actions 工作流位于 `.github/workflows/site.yml`，可通过 `repository_dispatch` 或手动执行。

更多说明见 `docs/`。

提交前可以运行完整检查：

~~~powershell
pnpm lint
pnpm test
pnpm typecheck
pnpm build
~~~

`pnpm build` 会按生产模式校验 `CONTENT_API_URL`。本地尚未启动后台 API 时，可明确开启演示快照：

~~~powershell
$env:ALLOW_SEED_FALLBACK="true"
pnpm build
~~~
