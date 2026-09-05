#!/usr/bin/env bash
# Hecy Blog 一键部署脚本（在 VPS 上执行）
# 用法：
#   ./scripts/deploy.sh            # 拉取最新代码并重建重启后台
#   ./scripts/deploy.sh --init     # 首次部署：装依赖、建表、生成 systemd 服务
# 环境变量（首次部署前必须先填好 apps/admin/.env.local）：
#   需要 DATABASE_URL / ADMIN_USERNAME / ADMIN_PASSWORD_HASH / AUTH_SECRET / ADMIN_ORIGIN
set -euo pipefail

REPO_URL="https://github.com/LAOHO0/blog-test.git"
APP_DIR="${APP_DIR:-/opt/hecy-blog}"
SERVICE_NAME="hecy-admin"
NODE_MAJOR=22

log() { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || { echo "缺少命令: $1（请先安装）"; exit 1; }
}

ensure_node() {
  if command -v node >/dev/null 2>&1 && [ "$(node -p 'process.versions.node.split(".")[0]')" -ge "$NODE_MAJOR" ]; then
    return
  fi
  log "安装 Node.js ${NODE_MAJOR}.x"
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
  apt-get install -y nodejs
}

ensure_corepack() {
  need_cmd curl
  ensure_node
  corepack enable >/dev/null 2>&1 || true
  corepack prepare pnpm@11.19.0 --activate
}

clone_or_update() {
  if [ -d "$APP_DIR/.git" ]; then
    log "更新代码 $APP_DIR"
    git -C "$APP_DIR" fetch --depth 1 origin main
    git -C "$APP_DIR" reset --hard origin/main
  else
    log "克隆仓库到 $APP_DIR"
    git clone --depth 1 "$REPO_URL" "$APP_DIR"
  fi
}

do_init() {
  log "首次部署：安装依赖"
  ensure_corepack
  clone_or_update
  cd "$APP_DIR"
  pnpm install --frozen-lockfile

  if [ ! -f apps/admin/.env.local ]; then
    cp .env.example apps/admin/.env.local
    echo "!! 已生成 apps/admin/.env.local 模板 —— 请填好 DATABASE_URL / ADMIN_PASSWORD_HASH / AUTH_SECRET / ADMIN_ORIGIN 后重新执行本脚本。"
    echo "!! 密码哈希生成：pnpm --filter @hecy/admin exec tsx -e \"import bcrypt from 'bcryptjs'; bcrypt.hash(process.argv[1], 12).then(console.log)\" '你的强密码'"
    exit 1
  fi

  log "初始化数据库表结构"
  pnpm db:push

  log "写入 systemd 服务 $SERVICE_NAME（开机自启，仅监听 127.0.0.1:3001）"
  pnpm --filter @hecy/admin build
  cat <<UNIT | sudo tee "/etc/systemd/system/${SERVICE_NAME}.service" >/dev/null
[Unit]
Description=Hecy Blog admin (Next.js)
After=network.target postgresql.service

[Service]
Type=simple
WorkingDirectory=${APP_DIR}/apps/admin
ExecStart=$(which pnpm) --filter @hecy/admin start
Restart=always
RestartSec=3
Environment=NODE_ENV=production
# 生产环境必须设置以下两个变量之一，否则服务启动即报错
EnvironmentFile=${APP_DIR}/apps/admin/.env.local

[Install]
WantedBy=multi-user.target
UNIT
  sudo systemctl daemon-reload
  sudo systemctl enable --now "$SERVICE_NAME"
  log "完成。后台运行于 http://127.0.0.1:3001，请配置 Nginx 反代后访问。"
  echo "  提示：APP_DIR=${APP_DIR}（可用环境变量覆盖）"
}

do_update() {
  [ -d "$APP_DIR/.git" ] || { echo "未找到 $APP_DIR —— 首次部署请执行: $0 --init"; exit 1; }
  ensure_corepack
  clone_or_update
  cd "$APP_DIR"
  log "安装依赖并重建后台"
  pnpm install --frozen-lockfile
  pnpm --filter @hecy/admin build
  sudo systemctl restart "$SERVICE_NAME"
  log "重启完成：$(sudo systemctl is-active "$SERVICE_NAME")"
}

case "${1:-}" in
  --init) do_init ;;
  "") do_update ;;
  *) echo "用法: $0 [--init]"; exit 1 ;;
esac
