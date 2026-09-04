import { HomeSections } from "@/components/home-sections";
import { getPublishedContent, getSiteSettings } from "@/lib/content";

export default async function HomePage() {
  const [settings, records] = await Promise.all([
    getSiteSettings(),
    getPublishedContent(),
  ]);

  const articles = records
    .filter((item) => item.type === "article")
    .sort(
      (a, b) =>
        Date.parse(b.publishedAt || b.createdAt) -
        Date.parse(a.publishedAt || a.createdAt),
    );
  const products = records
    .filter((item) => item.type === "product" && item.featured)
    .sort(
      (a, b) =>
        a.sortOrder - b.sortOrder ||
        Date.parse(b.publishedAt || b.createdAt) -
          Date.parse(a.publishedAt || a.createdAt),
    );

  return (
    <HomeSections articles={articles} products={products} settings={settings} />
  );
}
