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

### 0.4 内容实时生效（无需 Deploy Hook）

Vercel 上前台默认运行动态渲染（与 Docker 一致）：页面按请求实时读取后台
`CONTENT_API_URL`，**后台发布/改设置，前台刷新立即生效**——不需要 Deploy Hook、
不需要 `GITHUB_TOKEN`，也不存在构建排队。

Deploy Hook（`VERCEL_DEPLOY_HOOK_URL`）仅在你想让"推送代码"以外的场景强制
触发一次 Vercel 重建时才有用；`BUILD_WEBHOOK_SECRET`/`ADMIN_ORIGIN` 的构建
状态回传属于 GitHub Actions 静态模式，动态渲染下均不需要。

### 0.5 与 VPS 方案的关系

两种部署可共存且行为一致：后台在 VPS、前台在 Vercel 时，内容都实时生效，
区别只是前台进程跑在哪里。

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

compose 启动三个容器：PostgreSQL + 后台（3001）+ 前台动态渲染服务（3002）。
前台默认 `BUILD_MODE=isr`：按请求实时读取后台内容，**发布文章、更换主题即时生效，
无需任何构建**，也不存在并发构建锁问题。
最适合一台 VPS 跑多个项目、不想让本项目的 Node/PostgreSQL 污染全局环境的情况。

~~~bash
git clone https://github.com/LAOHO0/Hecy-Blog.git && cd Hecy-Blog
./scripts/docker-init.sh       # 交互生成 .env：输入管理员用户名和密码即可，
                               # 密码哈希与 AUTH_SECRET 自动生成（哈希已转义 $）
vi .env                        # 把 ADMIN_ORIGIN / NEXT_PUBLIC_SITE_URL 改成实际域名
docker compose up -d --build   # 一键启动；建表与空库种子由容器启动脚本自动完成
~~~

验证部署成功：`docker compose ps` 中 admin 与 site 均为 healthy，浏览器打开 `ADMIN_ORIGIN` 能看到后台登录页、打开前台域名能看到内容即正常。此后在后台点"发布"或修改设置，刷新前台立即生效。更新版本同样是 `git pull && docker compose up -d --build`（升级会自动同步数据库结构）。

几个值得知道的细节：

- **凭据安全**：`.env` 由 `docker-init.sh` 生成，密码哈希里的 `$` 已自动转义为 `$$`（compose 插值特性，不转义会导致"密码正确却登录不了"）；请勿手动把未转义的 bcrypt 哈希直接写进 `.env`。
- **PostgreSQL**：账密默认 `hecy/hecy`，可在 `.env` 用 `POSTGRES_USER / POSTGRES_PASSWORD / POSTGRES_DB` 覆盖；宿主机 5432 端口被占用时设置 `POSTGRES_HOST_PORT=15432`。
- **前台 Web 服务**：compose 不含 Nginx 容器——多项目 VPS 通常已有宿主机 Nginx，直接复用（见 1.3）；需要全容器化时自行加一个 `nginx:alpine` 服务反代 `site:3002` 即可。

Nginx 前台 server 块把请求反代到前台容器的 3002 端口（完整示例见 1.3）。后台（3001）也按 1.3 反代。端口只绑定在 `127.0.0.1`，务必由 Nginx/Caddy 反代并配置 HTTPS 后再对外。

### 1.3 Nginx 反代参考

前后台各一个 server 块：后台反代 3001，前台反代 3002（动态渲染，实时内容）。
仅静态导出模式（`BUILD_MODE=local` / GitHub Pages）才用 root 指向静态产物目录。

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

# 前台（动态渲染，实时内容）
server {
    listen 443 ssl http2;
    server_name www.example.com;
    location / {
        proxy_pass http://127.0.0.1:3002;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
~~~

### 1.4 环境变量与构建模式

方式 A（宿主机直跑）的 `apps/admin/.env.local` 必填项：

- DATABASE_URL（本机 PostgreSQL 形如 `postgresql://hecy:密码@127.0.0.1:5432/hecy`）
- ADMIN_USERNAME、ADMIN_PASSWORD_HASH、AUTH_SECRET
- ADMIN_ORIGIN（后台对外的完整地址，如 https://admin.example.com）
- BUILD_MODE=isr（动态渲染实时生效，推荐）或 local（本机静态导出构建）
- SITE_BUILD_DIR（仅 local 模式；前台代码目录，默认 `<安装目录>/apps/site`）

方式 B（Docker）无需手工设置这些：compose 默认 `BUILD_MODE=isr`（动态渲染），
前台容器所需的 `CONTENT_API_URL` 等已内置，你只需要运行
`./scripts/docker-init.sh` 生成 `.env`（管理员凭据、`ADMIN_ORIGIN`、
`NEXT_PUBLIC_SITE_URL`），建表与空库种子也会在容器启动时自动完成。

宿主机方式还需要前台目录有 `apps/site/.env.local`，至少包含：

- CONTENT_API_URL=http://127.0.0.1:3001/api/public（本机后台只读接口）
- NEXT_PUBLIC_SITE_URL=https://www.example.com（前台最终域名）

工作方式：

- `BUILD_MODE=isr`（Docker 默认，推荐）：页面按请求实时读取数据库内容，
  发布/改设置刷新即生效——没有构建环节，后台"构建"页的记录仅作操作留痕。
- `BUILD_MODE=local`（静态导出）：后台点"发布"→ 数据库状态更新 → 后台以子进程
  在前台目录执行 `pnpm exec next build`（连续发布自动串行排队）→ 构建从
  `CONTENT_API_URL` 读取已发布内容生成 `apps/site/out`（Docker 方式经挂载落到
  仓库根目录 `site-out/`）→ 成功/失败状态直接写回后台"构建"页（无需回调 Secret）。
  注意后台进程需要有前台目录的写权限；构建失败信息会记录在后台"构建"页。
- 未设置/其他值：走 `VERCEL_DEPLOY_HOOK_URL`（Vercel）或 `GITHUB_TOKEN` 等
  （GitHub Actions）远程触发。

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

## 6. 常见问题排查

### 后台页面提示"页面加载失败"或"设置读取失败"

这是数据库读取失败，最常见原因是**数据库未初始化**（表不存在）。处理顺序：

1. 看页面上红条/错误摘要里的具体信息（新版后台会直接显示原因，不再整页白屏）。
2. Docker 部署：确认容器日志里有没有 `[entrypoint] 同步数据库结构` 的输出：
   ~~~bash
   docker compose logs admin --tail 50
   ~~~
   新版镜像启动时会自动执行 `db:push`（建表）+ 空库种子；如果容器反复重启，
   日志里会有具体报错（多数是 `.env` 凭据缺失或数据库连不上）。
3. 宿主机部署：手动执行一次 `pnpm db:push`（在仓库根目录，需 DATABASE_URL）。
4. 修复后页面无需重启即可恢复；`docker compose restart admin` 可强制重跑初始化。

### 通过 HTTP + 公网 IP 访问后台时页面白屏/设置页崩溃

浏览器的 `crypto.randomUUID()` 只在安全上下文（HTTPS 或 localhost）可用，
用 `http://<服务器IP>` 访问后台时该 API 不存在，曾导致设置页客户端崩溃。
当前版本已在源码层修复（`apps/admin/src/lib/client-key.ts` 按能力降级），
拉取最新代码重新 `docker compose up -d --build` 即可。

生产环境仍建议为后台绑定域名并启用 HTTPS（安全性和兼容性最好）：

1. 域名 A 记录解析到 VPS IP；
2. Nginx 反代 `127.0.0.1:3001`（见 1.3）；
3. `certbot --nginx -d admin.example.com` 签发 Let's Encrypt 证书；
4. `.env` 中 `ADMIN_ORIGIN=https://admin.example.com` 后 `docker compose up -d`。

临时管理也可以用 SSH 隧道绕过：本地执行
`ssh -L 3001:127.0.0.1:3001 root@<服务器IP>` 后访问 `http://localhost:3001`。

### 首次部署后前台一片空白

Docker 动态渲染模式下前台由 site 容器（3002）按请求实时渲染，不存在空产物期：

1. `docker compose ps` 确认 site 容器为 healthy；未起来看
   `docker compose logs site --tail 50`；
2. 确认 Nginx 前台 server 块是 `proxy_pass http://127.0.0.1:3002;`（反代），
   而不是指向静态目录；
3. 若使用静态导出模式（`BUILD_MODE=local`），产物目录 `site-out/` 初始为空，
   容器首次启动会自动执行一次初始构建（约 1 分钟）；仍空白时看
   `docker compose logs admin | grep entrypoint`，并确认 Nginx root 指向
   **实际克隆目录**下的 `site-out/`。

### 后台点发布后前台没更新

动态渲染模式（`BUILD_MODE=isr`，Docker 默认）下内容**实时生效**，无需构建；
若没生效，刷新页面并确认前台域名确实反代到了 3002 端口的 site 容器。

静态构建模式的排查：

1. 打开后台"构建"页看该条构建记录的状态与失败摘要：
   - 本机模式（`BUILD_MODE=local`）：失败原因（含构建日志末尾）直接写在记录里，
     常见为 `CONTENT_API_URL` 不可达或前台目录缺 `.env.local`；连续发布会自动
     排队串行执行，"已加入队列"不代表已完成。
   - Vercel 模式：Deploy Hook 无状态回传，去 Vercel 控制台看部署结果。
   - GitHub Actions 模式：去 Actions 页看工作流日志。
2. 静态模式确认宿主机 Nginx 的 root 指向的是 `site-out/`（不是 `apps/site/out`）。

### 后台登录后提示密码错误

检查 `.env` 里的 `ADMIN_PASSWORD_HASH` 是否被改过。bcrypt 哈希中的 `$`
必须转义为 `$$`（`scripts/docker-init.sh` 生成时会自动处理）；手动编辑
`.env` 后需要 `docker compose up -d` 重建容器生效。
