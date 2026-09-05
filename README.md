# Hecy Blog

Hecy Blog 是一个中文优先的个人内容管理与展示系统，用于发布文章、产品和项目。项目由静态前台与独立管理后台组成，正文统一使用 Markdown / MDX 安全子集，产品和项目额外提供结构化字段。

## 主要功能

- 中文管理后台，支持用户名和密码登录
- 文章、产品、项目的创建、编辑、预览、发布和撤回
- 产品状态、价格、平台、链接等结构化字段
- 项目角色、周期、技术栈、仓库、项目链接等结构化字段
- 内容版本记录、媒体管理、站点设置和构建记录
- 响应式静态前台，支持浅色/深色主题
- 三种前台构建模式：VPS 本机构建（推荐）、Vercel Deploy Hook、GitHub Actions（可选 SSH 自动部署）
- PostgreSQL 持久化，开发环境可使用内存演示数据

## 项目结构

| 路径 | 说明 |
| --- | --- |
| `apps/site` | Next.js 静态前台，展示文章、产品和项目 |
| `apps/admin` | Next.js 服务端管理后台，提供认证、内容 API 和构建管理 |
| `packages/content` | 前后台共享的类型、校验、Drizzle schema 和种子数据 |
| `docs` | 架构、部署和内容迁移说明 |

## 环境要求

- Node.js 22
- pnpm 11.19.0
- PostgreSQL 16（生产环境必需，本地预览可选）

## 本地运行

```powershell
git clone https://github.com/LAOHO0/Hecy-Blog.git
cd Hecy-Blog
pnpm install

Copy-Item .env.example apps/admin/.env.local
Copy-Item apps/site/.env.example apps/site/.env.local
```

编辑 `apps/admin/.env.local`，至少为本地登录设置密码：

```env
ADMIN_USERNAME=hecy
ADMIN_PASSWORD=请设置自己的本地测试密码
```

然后启动前后台：

```powershell
pnpm dev
```

- 前台：<http://localhost:3000>
- 后台登录：<http://localhost:3001/login>
- 公开内容 API：<http://localhost:3001/api/public>

默认用户名是 `hecy`，项目没有内置默认密码。登录密码以 `apps/admin/.env.local` 中的 `ADMIN_PASSWORD` 为准，修改环境变量后需要重启后台服务。

未配置 `DATABASE_URL` 时，后台在开发环境使用内存演示数据。服务重启后，新增或修改的内容不会保留。

## 使用 PostgreSQL

启动本地数据库：

```powershell
docker compose up -d postgres
```

在 `apps/admin/.env.local` 中配置连接串：

```env
DATABASE_URL=postgresql://hecy:hecy@127.0.0.1:5432/hecy_blog
```

初始化表结构和种子数据：

```powershell
pnpm db:push
pnpm db:seed
```

Docker Compose 既可用于本地开发，也是 VPS 生产部署的推荐方式（多项目共存时尤其合适）：数据库端口只绑定 `127.0.0.1`，不要直接对外暴露；数据经 Docker 数据卷持久化，仍需按策略备份。

## 内容发布流程

1. 登录后台，新建文章、产品或项目。
2. 保存草稿并通过私有预览检查内容。
3. 点击发布，将内容写入公开 API。
4. 触发静态前台重新构建和部署。

`apps/site` 使用静态导出，内容在构建时从 `CONTENT_API_URL` 读取。因此，后台发布内容后，已经部署的前台不会自动变化，必须重新构建并部署 `apps/site/out`。

生产环境推荐用 VPS 单机模式：后台配置 `BUILD_MODE=local` 后，点发布即由后台在本机直接重建前台并回写构建状态，无需 GitHub Actions 中转。Docker 部署用 `./scripts/docker-init.sh` 生成 `.env`（密码哈希自动转义、AUTH_SECRET 随机生成），再 `docker compose up -d --build` 即可，建表与种子在容器启动时自动完成。Vercel（Deploy Hook）与 GitHub Actions 两种远程模式详见 [部署说明](docs/deployment.md)。

本地构建前台时，先确保后台运行在 `3001` 端口：

```powershell
$env:CONTENT_API_URL="http://localhost:3001/api/public"
$env:NEXT_PUBLIC_SITE_URL="http://localhost:3000"
$env:ALLOW_SEED_FALLBACK="false"
pnpm --filter @hecy/site build
```

如果只是离线查看仓库内置的种子快照，可以明确启用回退：

```powershell
$env:ALLOW_SEED_FALLBACK="true"
pnpm --filter @hecy/site build
```

## 生产配置

生产环境至少需要配置：

- 后台：`DATABASE_URL`、`ADMIN_USERNAME`、`ADMIN_PASSWORD_HASH`、`AUTH_SECRET`、`ADMIN_ORIGIN`
- 前台构建：`CONTENT_API_URL`、`NEXT_PUBLIC_SITE_URL`
- 构建回调：`BUILD_WEBHOOK_SECRET`（仅 GitHub Actions 模式需要）
- 构建模式三选一：`BUILD_MODE=local`（VPS 单机，推荐）/ `VERCEL_DEPLOY_HOOK_URL`（Vercel）/ `GITHUB_OWNER`、`GITHUB_REPO`、`GITHUB_TOKEN`（GitHub Actions）

生成 bcrypt 密码哈希：

```powershell
pnpm --filter @hecy/admin exec tsx -e "import bcrypt from 'bcryptjs'; bcrypt.hash(process.argv[1], 12).then(console.log)" "你的强密码"
```

生成 `AUTH_SECRET` 时请使用至少 32 字节的随机值。真实密码、哈希、令牌和数据库连接串只能放在部署环境变量或 GitHub Secrets 中，不要提交到仓库。

## GitHub Actions 构建（可选的远程模式）

VPS 单机（`BUILD_MODE=local`）或 Vercel 部署不需要本节；GitHub Actions 仅作为可选的远程构建模式保留。`.github/workflows/site.yml` 会在前台源码推送到 `main`、后台发送 `repository_dispatch`，或手动运行工作流时构建静态前台。

在 GitHub Actions Secrets 中配置：

- 必需（正式上线）：`CONTENT_API_URL`、`NEXT_PUBLIC_SITE_URL`
- 构建状态回传：`ADMIN_ORIGIN`、`BUILD_WEBHOOK_SECRET`
- 可选服务器部署：`DEPLOY_HOST`、`DEPLOY_USER`、`DEPLOY_PATH`、`DEPLOY_SSH_KEY`、`DEPLOY_KNOWN_HOSTS`

未配置 `CONTENT_API_URL` 时，工作流会输出警告并回退到仓库内置的种子内容构建（演示数据），流水线不会失败；配置 Secrets 后下一次构建自动切换为真实数据。显式设置 `ALLOW_SEED_FALLBACK=false`（且未配 API）可让缺配置直接报错。未配置服务器部署参数时，工作流只生成并保留名为 `hecy-site` 的构建产物，不会自动发布到服务器。管理后台本身是 Node.js 服务，需要单独部署，并确保 GitHub Actions 可以访问它的公开内容 API。

部署方式的选择：单台 VPS 推荐 Docker Compose（多项目共存）或宿主机脚本；全托管可选 Vercel（前后台双项目 + Neon）。三种方式的完整步骤、Nginx 配置和环境变量清单见 [部署说明](docs/deployment.md)，其余文档：

- [架构说明](docs/architecture.md)
- [内容迁移说明](docs/migration.md)

## 质量检查

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```
