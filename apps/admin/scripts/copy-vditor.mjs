// Vditor 的部分子模块（代码高亮、图表等）按 cdn 路径懒加载，
// 构建时把包内 dist 复制到 public/vditor，编辑器 cdn 选项指向 /vditor，
// 保证生产容器无需访问外网 CDN。
import { cpSync, existsSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const adminRoot = resolve(here, "..");
// Vditor 内部按 `${cdn}/dist/...` 拼子模块地址，因此 dist 目录
// 必须落在 public/vditor/dist，保持与官方 CDN 目录结构一致。
const target = join(adminRoot, "public", "vditor", "dist");
const source = join(adminRoot, "node_modules", "vditor", "dist");

if (!existsSync(source)) {
  console.error("[copy-vditor] 未找到 vditor/dist，请先安装依赖。");
  process.exit(1);
}

rmSync(target, { recursive: true, force: true });
cpSync(source, target, { recursive: true });
console.log("[copy-vditor] 已复制到", target);
