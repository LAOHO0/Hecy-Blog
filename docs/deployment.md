# 部署说明

## 0. 一键部署（推荐）

### 方式 A：宿主机直跑（脚本）

在 VPS 上执行：

~~~bash
git clone https://github.com/LAOHO0/blog-test.git && cd blog-test
./scripts/deploy.sh --init     # 首次：装依赖、建表、生成 systemd 服务
./scripts/deploy.sh            # 以后每次更新：拉取最新代码并重建重启
~~~

`--init` 会先生成 `apps/admin/.env.local` 模板并退出，填好 `DATABASE_URL`、`ADMIN_PASSWORD_HASH`、`AUTH_SECRET`、`ADMIN_ORIGIN`、`BUILD_WEBHOOK_SECRET` 后重新执行即可。后台以 systemd 服务运行（`hecy-admin`），仅监听 `127.0.0.1:3001`，由 Nginx 反代对外。脚本默认安装目录为 `/opt/hecy-blog`，可用 `APP_DIR=/your/path` 覆盖。

### 方式 B：Docker Compose

~~~bash
git clone https://github.com/LAOHO0/blog-test.git && cd blog-test
cp .env.example .env.deploy    # 填好必填项（DATABASE_URL 会被 compose 覆盖为容器内地址）
docker compose up -d --build   # 同时启动 PostgreSQL + 后台
docker compose exec admin pnpm db:push
~~~

更新版本同样是 `git pull && docker compose up -d --build`。两个方案都只把端口绑在 `127.0.0.1`，务必由 Nginx/Caddy 反代并配置 HTTPS 后再对外。

### Nginx 反代参考

~~~nginx
server {
    listen 443 ssl http2;
    server_name admin.example.com;
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
~~~

前台静态文件在 GitHub Actions 构建完成后由 rsync 自动部署（配置 `DEPLOY_*` Secrets），或手动从 Actions 产物 `hecy-site` 下载解压到 Web 目录。

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
