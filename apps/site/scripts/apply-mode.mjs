// 构建前按渲染模式适配详情页段配置：
// - 动态渲染（默认，STATIC_EXPORT 非 true）：详情页必须 force-dynamic，
//   否则 [slug] 路由被归类为 SSG，请求时触发 DYNAMIC_SERVER_USAGE 500。
// - 纯静态导出（STATIC_EXPORT=true）：output: export 与 force-dynamic 互斥，
//   构建前剥离该行，由 generateStaticParams 预渲染全部详情页。
// 脚本幂等：按当前模式把三个详情页修正到正确状态。
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pages = [
  "src/app/blog/[slug]/page.tsx",
  "src/app/products/[slug]/page.tsx",
  "src/app/projects/[slug]/page.tsx",
];
const marker = 'export const dynamic = "force-dynamic";';
const isExport = process.env.STATIC_EXPORT === "true";

for (const rel of pages) {
  const file = join(root, rel);
  let source = readFileSync(file, "utf8");
  const has = source.includes(marker);
  if (isExport && has) {
    source = source.replace(`\n${marker}\n`, "\n");
    writeFileSync(file, source);
    console.log(`[apply-mode] STATIC_EXPORT：已移除 ${rel} 的 force-dynamic`);
  } else if (!isExport && !has) {
    source = source.replace(
      "export async function generateStaticParams()",
      `${marker}\n\nexport async function generateStaticParams()`,
    );
    writeFileSync(file, source);
    console.log(`[apply-mode] 动态渲染：已为 ${rel} 添加 force-dynamic`);
  }
}
