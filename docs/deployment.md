# 部署说明

## 1. 准备 PostgreSQL

~~~powershell
docker compose up -d postgres
pnpm install
pnpm db:push
pnpm db:seed
~~~

生产环境请使用托管 PostgreSQL，并设置每日备份与 7–30 天保留周期。
仓库中的 `docker-compose.yml` 仅用于本地开发，数据库端口只绑定到 `127.0.0.1`；生产环境不要直接暴露 PostgreSQL。

## 2. 配置后台

将 `.env.example` 复制为 `apps/admin/.env.local`，将 `apps/site/.env.example` 复制为 `apps/site/.env.local`，并至少设置：

- DATABASE_URL
- ADMIN_USERNAME
- ADMIN_PASSWORD_HASH
- AUTH_SECRET
- ADMIN_ORIGIN
- BUILD_WEBHOOK_SECRET

如果部署在反向代理后面，请确保代理会覆盖客户端传入的 `x-forwarded-for`，避免登录限流被伪造请求头绕过。

如果前台与后台不在同一域名，请同时设置 `SITE_ORIGIN`，它会用于公开 API 的 CORS 响应头。

生成 bcrypt 密码哈希可以使用：

~~~powershell
pnpm --filter @hecy/admin exec tsx -e "import bcrypt from 'bcryptjs'; bcrypt.hash(process.argv[1], 12).then(console.log)" "你的强密码"
~~~

## 3. 配置前台构建

在 GitHub Actions Secrets 中设置：

- CONTENT_API_URL：后台的只读公开接口地址（GitHub Actions 必须能够访问），例如 https://admin.example.com/api/public
- NEXT_PUBLIC_SITE_URL：前台最终域名
- ALLOW_SEED_FALLBACK：默认关闭；仅在本地/演示构建且明确接受种子快照时设为 `true`
- ADMIN_ORIGIN、BUILD_WEBHOOK_SECRET：用于让 GitHub Actions 将构建状态回传后台
- 可选 DEPLOY_HOST、DEPLOY_USER、DEPLOY_PATH、DEPLOY_SSH_KEY、DEPLOY_KNOWN_HOSTS：用于 SSH 上传 apps/site/out；其中 `DEPLOY_KNOWN_HOSTS` 应保存目标服务器的已确认 host key

后台触发 GitHub 构建时，`GITHUB_TOKEN` 需要具备目标仓库的 `Contents: Read and write` 权限，以调用 `repository_dispatch`。

推送到 `main`，或从后台点击“发布”，都会触发 `site.yml`。工作流始终先上传构建产物；只有同时配置 `DEPLOY_HOST`、`DEPLOY_USER`、`DEPLOY_PATH`、`DEPLOY_SSH_KEY` 和 `DEPLOY_KNOWN_HOSTS` 时才会继续通过 rsync 部署到服务器。不要在工作流中无验证地使用 `ssh-keyscan`。

## 4. 域名建议

域名尚未确定时可以先使用：

- 前台：未来的主域名
- 后台：admin.未来域名

代码中没有写死域名，均通过环境变量读取。
