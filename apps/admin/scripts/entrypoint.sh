#!/bin/sh
# 容器启动入口：同步数据库结构、空库写入种子内容，再启动后台。
# drizzle push 是声明式同步，重复执行安全；种子只在库为空时写入，
# 避免覆盖用户已发布/修改过的内容。
set -eu

required_env() {
  for var in ADMIN_USERNAME ADMIN_PASSWORD_HASH AUTH_SECRET ADMIN_ORIGIN; do
    eval "value=\${$var:-}"
    if [ -z "$value" ]; then
      echo "启动失败：缺少环境变量 $var。请先运行 scripts/docker-init.sh 生成 .env 后再 docker compose up -d --build。" >&2
      exit 1
    fi
  done
}

required_env

echo "[entrypoint] 同步数据库结构（drizzle-kit push）…"
pnpm db:push

echo "[entrypoint] 检查种子数据…"
pnpm exec tsx scripts/seed-if-empty.ts

# 首次部署时 site-out 是空的，前台会一直空白到第一次发布成功。
# 等后台就绪后在后台线程补一次初始构建，让部署完前端立即可用。
# 只有产物目录为空才构建（取不到内容或构建失败不影响后台运行）。
(
  for i in $(seq 1 30); do
    wget -qO- http://127.0.0.1:3001/login >/dev/null 2>&1 && break
    sleep 1
  done
  if [ -z "$(ls -A /app/apps/site/out-live 2>/dev/null)" ]; then
    echo "[entrypoint] 前台产物为空，执行初始构建…"
    cd /app || exit 0
    if pnpm --filter @hecy/site build; then
      find /app/apps/site/out-live -mindepth 1 -maxdepth 1 -exec rm -rf {} + 2>/dev/null
      cp -a /app/apps/site/out/. /app/apps/site/out-live/
      echo "[entrypoint] 初始构建完成，产物已同步到 site-out。"
    else
      echo "[entrypoint] 初始构建失败：请检查 CONTENT_API_URL 配置；之后发布内容会再次触发构建。"
    fi
  fi
) &

echo "[entrypoint] 启动后台…"
exec pnpm start
