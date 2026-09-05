# 部署说明

## 0. Vercel 部署（方案 B，全平台托管）

前后台拆成 Vercel 上的两个项目，共用一个托管 PostgreSQL（推荐 Neon 免费套餐）。
此方案无需 VPS；若你已有 VPS，后台也可以按第 1 节部署在 VPS 上，只把前台交给 Vercel（此时跳过后台项目部分，`VERCEL_DEPLOY_HOOK_URL` 一样适用）。

### 0.1 准备托管 PostgreSQL

1. 注册 [Neon](https://neon.tech)（免费套餐足够个人博客），创建项目，复制连接串（形如 `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require`）。
2. 本地执行一次建表与种子（用同一条连接串）：

~~~bash
DATABASE_URL="neon连接串" pnpm db:push
DATABASE_URL="neon连接串" pnpm db:seed
~~~

### 0.2 部署后台（admin 项目）

1. Vercel → Add New Project → 导入 `LAOHO0/Hecy-Blog` 仓库。
2. Root Directory 设为 `apps/admin`，框架预设 Next.js（默认即可）。
3. 环境变量：

| 变量 | 值 |
| --- | --- |
| `DATABASE_URL` | Neon 连接串 |
| `DATABASE_POOL_MAX` | `1`（serverless 必配，防止打满连接数） |
| `ADMIN_USERNAME` | 你的管理员用户名 |
| `ADMIN_PASSWORD_HASH` | bcrypt 哈希（生成方式见第 3 节） |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `ADMIN_ORIGIN` | 后台的最终域名，如 `https://admin.example.com` |
| `SITE_ORIGIN` | 前台最终域名，用于公开 API 的 CORS |
| `VERCEL_DEPLOY_HOOK_URL` | 第 0.3 步创建的 Deploy Hook 地址 |
| S3 五项（可选） | 需要图片上传时配置 |

4. 部署完成后绑定自定义域名（如 `admin.example.com`），这个地址就是 `ADMIN_ORIGIN` 与 `CONTENT_API_URL` 的主机部分。

### 0.3 部署前台（site 项目）

1. Vercel → Add New Project → 再次导入同一仓库。
2. Root Directory 设为 `apps/site`。
3. 环境变量：

| 变量 | 值 |
| --- | --- |
| `CONTENT_API_URL` | `https://admin.example.com/api/public` |
| `NEXT_PUBLIC_SITE_URL` | 前台最终域名，如 `https://www.example.com` |
| `ALLOW_SEED_FALLBACK` | 留空（生产必须走真实数据） |

4. 部署完成后绑定前台域名。

### 0.4 打通"后台点发布 → 前台自动重建"

1. 前台项目 → Settings → Deploy Hooks → 创建一个 Hook（名字随意，分支 `main`），复制生成的 URL。
2. 把该 URL 填到后台项目的 `VERCEL_DEPLOY_HOOK_URL` 环境变量并 Redeploy 生效。
3. 之后在后台点"发布"，会直接唤起前台在 Vercel 的重建；不再需要配置 `GITHUB_TOKEN` 等 GitHub 触发变量。
4. 注意：Deploy Hook 触发的部署没有构建状态回调（`BUILD_WEBHOOK_SECRET`/`ADMIN_ORIGIN` 仅 GitHub Actions 模式需要），后台构建记录会停在"已触发"语义的队列态，属预期行为。

### 0.5 与 VPS 方案的关系

两种部署可共存：后台在 VPS、前台在 Vercel 时，只需在 VPS 的 `.env.local` 里配 `VERCEL_DEPLOY_HOOK_URL`，后台点发布同样直接唤起 Vercel 重建，绕开 GitHub Actions 中转。

## 1. VPS 单机部署（推荐：发布不经过 GitHub）

有 VPS 时最简单可靠的方案：后台、PostgreSQL、前台构建全部在同一台机器上，
后台点"发布"由后台**直接本机构建前台**，全程不需要 GitHub Actions / Vercel 参与，
GitHub 只作为代码备份。构建模式由 `BUILD_MODE` 决定（详见 1.4）。

### 方式 A：宿主机直跑（脚本）

在 VPS 上执行：

~~~bash
git clone https://github.com/LAOHO0/Hecy-Blog.git && cd Hecy-Blog
./scripts/deploy.sh --init     # 首次：装依赖、建表、生成 systemd 服务
./scripts/deploy.sh            # 以后每次更新：拉取最新代码并重建重启
~~~

`--init` 会先生成 `apps/admin/.env.local` 模板并退出，填好必填项（见 1.4）后重新执行即可。后台以 systemd 服务运行（`hecy-admin`），仅监听 `127.0.0.1:3001`，由 Nginx 反代对外。脚本默认安装目录为 `/opt/hecy-blog`，可用 `APP_DIR=/your/path` 覆盖。

### 方式 B：Docker Compose（多项目共用一台 VPS 时推荐）

compose 里已内置 `BUILD_MODE=local`：后台点发布会在**容器内**直接重建前台，
静态产物落到仓库根目录的 `site-out/`（bind mount），宿主机 Nginx 直接指向该目录。
最适合一台 VPS 跑多个项目、不想让本项目的 Node/PostgreSQL 污染全局环境的情况。

~~~bash
git clone https://github.com/LAOHO0/Hecy-Blog.git && cd Hecy-Blog
cp .env.example .env.deploy    # 必填：ADMIN_USERNAME / ADMIN_PASSWORD_HASH / AUTH_SECRET / ADMIN_ORIGIN
                               # 以及 NEXT_PUBLIC_SITE_URL（前台域名，构建时写入页面链接）
docker compose up -d --build   # 一键启动 PostgreSQL + 后台
docker compose exec admin pnpm db:push   # 初始化表结构（首次一次即可）
~~~

验证部署成功：浏览器打开 `ADMIN_ORIGIN` 能看到后台登录页即正常。此后在后台点"发布"，约半分钟后 `site-out/` 内容更新，前台自动生效。更新版本同样是 `git pull && docker compose up -d --build`。

Nginx 前台 server 块把 root 指向产物目录即可（假设仓库克隆在 `/opt/Hecy-Blog`）：

~~~nginx
server {
    listen 443 ssl http2;
    server_name www.example.com;
    root /opt/Hecy-Blog/site-out;
    index index.html;
    location / {
        try_files $uri $uri/ $uri/index.html =404;
    }
}
~~~

后台（3001）仍按 1.3 的反代方式配置。端口只绑定在 `127.0.0.1`，务必由 Nginx/Caddy 反代并配置 HTTPS 后再对外。

### 1.3 Nginx 反代参考

前后台各一个 server 块：后台反代 3001 端口，前台的 root 直接指向静态产物目录
（默认模式是本机构建，产物在 `apps/site/out`；用 `SITE_BUILD_DIR` 自定义路径时按需调整）。

~~~nginx
# 后台
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

# 前台（静态文件）
server {
    listen 443 ssl http2;
    server_name www.example.com;
    root /opt/hecy-blog/apps/site/out;
    index index.html;
    location / {
        try_files $uri $uri/ $uri/index.html =404;
    }
}
~~~

### 1.4 环境变量与构建模式

方式 A（宿主机直跑）的 `apps/admin/.env.local` 必填项：

- DATABASE_URL（本机 PostgreSQL 形如 `postgresql://hecy:密码@127.0.0.1:5432/hecy`）
- ADMIN_USERNAME、ADMIN_PASSWORD_HASH、AUTH_SECRET
- ADMIN_ORIGIN（后台对外的完整地址，如 https://admin.example.com）
- BUILD_MODE=local（启用本机构建）
- SITE_BUILD_DIR（可选；前台代码目录，默认 `<安装目录>/apps/site`）

方式 B（Docker）无需手工设置这些：compose 已内置 `BUILD_MODE=local`、
`SITE_BUILD_DIR=/app/apps/site` 与容器内的 `CONTENT_API_URL`，你只需要在
`.env.deploy` 填管理员凭据、`ADMIN_ORIGIN` 和 `NEXT_PUBLIC_SITE_URL`。

宿主机方式还需要前台目录有 `apps/site/.env.local`，至少包含：

- CONTENT_API_URL=http://127.0.0.1:3001/api/public（本机后台只读接口）
- NEXT_PUBLIC_SITE_URL=https://www.example.com（前台最终域名）

工作方式：后台点"发布"→ 数据库状态更新 → 后台以子进程在前台目录执行
`pnpm exec next build` → 构建从 `CONTENT_API_URL` 读取已发布内容生成
`apps/site/out`（Docker 方式经挂载落到仓库根目录 `site-out/`）→
成功/失败状态直接写回后台"构建"页（无需任何回调 Secret）。

`BUILD_MODE` 三种取值并存，按需选择：

- 未设置/其他值：走 `VERCEL_DEPLOY_HOOK_URL`（Vercel）或 `GITHUB_TOKEN` 等（GitHub Actions）远程触发。
- `local`：本文的本机模式。注意后台进程需要有前台目录的写权限；构建失败信息会记录在后台"构建"页。

## 2. 准备 PostgreSQL

方式 B（Docker）自带 PostgreSQL，跳过本节。方式 A 或本地开发：

~~~powershell
docker compose up -d postgres
pnpm install
pnpm db:push
pnpm db:seed
~~~

生产环境请使用托管 PostgreSQL 或带数据卷的容器（compose 已挂载 `hecy_blog_postgres` 卷），并设置每日备份与 7–30 天保留周期。数据库端口只绑定到 `127.0.0.1`，不要直接暴露 PostgreSQL。

## 3. 配置后台

将 `.env.example` 复制为 `apps/admin/.env.local`，将 `apps/site/.env.example` 复制为 `apps/site/.env.local`，并至少设置：

- DATABASE_URL
- DATABASE_SSL（托管 PostgreSQL 如 Neon/Supabase 设为 `true`；连接串含 `sslmode=require` 时也会自动启用）
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

## 4. GitHub Actions 构建（可选的远程模式）

VPS 单机（第 1 节）或 Vercel（第 0 节）都不需要本节；只有当后台与前台
分处两台机器、又不想在本机构建时才使用此模式——由 GitHub Actions 担任
免费构建机。在 GitHub Actions Secrets 中设置：

- CONTENT_API_URL：后台的只读公开接口地址（GitHub Actions 必须能够访问），例如 https://admin.example.com/api/public
- NEXT_PUBLIC_SITE_URL：前台最终域名
- ALLOW_SEED_FALLBACK：默认关闭；仅在本地/演示构建且明确接受种子快照时设为 `true`
- ADMIN_ORIGIN、BUILD_WEBHOOK_SECRET：用于让 GitHub Actions 将构建状态回传后台
- 可选 DEPLOY_HOST、DEPLOY_USER、DEPLOY_PATH、DEPLOY_SSH_KEY、DEPLOY_KNOWN_HOSTS：用于 SSH 上传 apps/site/out；其中 `DEPLOY_KNOWN_HOSTS` 应保存目标服务器的已确认 host key

后台触发 GitHub 构建时，`GITHUB_TOKEN` 需要具备目标仓库的 `Contents: Read and write` 权限，以调用 `repository_dispatch`。

推送到 `main`，或从后台点击“发布”，都会触发 `site.yml`。工作流始终先上传构建产物；只有同时配置 `DEPLOY_HOST`、`DEPLOY_USER`、`DEPLOY_PATH`、`DEPLOY_SSH_KEY` 和 `DEPLOY_KNOWN_HOSTS` 时才会继续通过 rsync 部署到服务器。不要在工作流中无验证地使用 `ssh-keyscan`。

## 5. 域名建议

域名尚未确定时可以先使用：

- 前台：未来的主域名
- 后台：admin.未来域名

代码中没有写死域名，均通过环境变量读取。
