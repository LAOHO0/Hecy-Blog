import type { MetadataRoute } from "next";
import { getPublishedContent } from "@/lib/content";

export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const records = await getPublishedContent();
  const urls: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/blog`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/products`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/projects`, changeFrequency: "monthly", priority: 0.7 },
  ];
  for (const item of records) {
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
  return urls;
}
