import type { Metadata } from "next";
import { ShowcaseIndex } from "@/components/showcase";
import { getPublishedContent } from "@/lib/content";

export const metadata: Metadata = {
  title: "产品",
  description: "Hecy Blog 的产品作品。",
};

export default async function ProductsPage() {
  const items = (await getPublishedContent("product")).sort(
    (a, b) =>
      a.sortOrder - b.sortOrder ||
      Date.parse(b.publishedAt || b.createdAt) -
        Date.parse(a.publishedAt || a.createdAt),
  );

  return (
    <ShowcaseIndex
      intro="正在做的东西，和一些已经能用的东西"
      items={items}
      title="产品"
      type="product"
    />
  );
}
