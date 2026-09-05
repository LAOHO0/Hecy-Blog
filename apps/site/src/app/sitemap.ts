import type { MetadataRoute } from "next";

// sitemap 是路由处理器，output: export 要求段配置为字面量 force-static，
// 因此这里不走 content.ts 的实时读取（其 no-store/动态信号与导出模式冲突）：
// - 静态导出（STATIC_EXPORT=true）：构建期用 CONTENT_API_URL 生成完整 sitemap；
// - 动态渲染：构建期生成基础版本，运行时每小时 ISR 再验证自动补全内容页。
export const dynamic = "force-static";
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const apiUrl = process.env.CONTENT_API_URL?.replace(/\/$/, "");
  const urls: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/blog`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/products`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/projects`, changeFrequency: "monthly", priority: 0.7 },
  ];

  if (apiUrl) {
    try {
      const response = await fetch(apiUrl, { cache: "force-cache" });
      if (response.ok) {
        const payload = (await response.json()) as {
          items?: { type: string; slug: string; updatedAt: string }[];
        };
        for (const item of payload.items ?? []) {
          const prefix =
            item.type === "article"
              ? "blog"
              : item.type === "product"
                ? "products"
                : "projects";
          urls.push({
            url: `${base}/${prefix}/${item.slug}`,
            lastModified: item.updatedAt,
            priority: 0.6,
          });
        }
      }
    } catch {
      // 内容 API 不可用（如离线镜像构建）：仅返回基础地址，运行时再验证补全。
    }
  }

  return urls;
}
