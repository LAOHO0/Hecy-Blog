#!/bin/sh
# Docker 部署初始化：交互式生成 .env（compose 自动读取）。
# - AUTH_SECRET 随机生成
# - bcrypt 密码哈希在后台镜像内计算，并自动把 $ 转义为 $$，
#   避免 compose 插值把哈希截断（表现为"密码正确却登录不了"）
# 已存在 .env 时跳过，避免覆盖线上凭据。
set -eu
cd "$(dirname "$0")/.."

if [ -f .env ]; then
  echo ".env 已存在，跳过生成。如需重置请先备份并删除 .env。"
  exit 0
fi

printf '管理员用户名 [hecy]: '
read -r username
username=${username:-hecy}

printf '管理员密码（输入不会回显字符，回车确认）: '
stty -echo 2>/dev/null || true
read -r password
stty echo 2>/dev/null || true
echo ''

if [ -z "$password" ]; then
  echo "密码不能为空。"
  exit 1
fi

echo '==> 构建后台镜像（首次约几分钟）…'
docker compose build admin >/dev/null

echo '==> 生成密码哈希…'
hash=$(docker compose run --rm --no-deps admin \
  pnpm exec tsx -e "import bcrypt from 'bcryptjs'; process.stdout.write(bcrypt.hashSync(process.argv[1], 12))" \
  "$password")
# compose 插值会把 $VAR 视为变量引用，写入 .env 前把 $ 转义为 $$
escaped=$(printf '%s' "$hash" | sed 's/\$/\$\$/g')

echo '==> 生成 AUTH_SECRET…'
secret=$(docker compose run --rm --no-deps admin \
  node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))")

cat > .env <<EOF
# Hecy Blog Docker 部署配置（compose 自动读取本文件）
# 生成时间：$(date '+%Y-%m-%d %H:%M %Z')

# 后台管理员
ADMIN_USERNAME=$username
ADMIN_PASSWORD_HASH=$escaped
AUTH_SECRET=$secret

# 对外地址（上线前改成实际域名，如 https://admin.example.com）
ADMIN_ORIGIN=http://localhost:3001
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SITE_ORIGIN=

# PostgreSQL（容器内自动组网，一般无需修改；5432 被占时改 POSTGRES_HOST_PORT）
POSTGRES_USER=hecy
POSTGRES_PASSWORD=hecy
POSTGRES_DB=hecy_blog
POSTGRES_HOST_PORT=5432

# 可选：S3 兼容媒体存储
S3_ENDPOINT=
S3_REGION=auto
S3_BUCKET=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_PUBLIC_URL=
S3_FORCE_PATH_STYLE=false
EOF

echo ''
echo '.env 已生成。接下来：'
echo '  1) 编辑 .env，把 ADMIN_ORIGIN 和 NEXT_PUBLIC_SITE_URL 改成实际域名'
echo '  2) docker compose up -d --build'
echo '  3) 浏览器打开 ADMIN_ORIGIN 登录后台（建表与种子已自动完成）'
