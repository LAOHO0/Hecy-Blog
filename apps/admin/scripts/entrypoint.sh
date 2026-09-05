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

echo "[entrypoint] 启动后台…"
exec pnpm start
