import type { Metadata } from "next";
import { ShowcaseIndex } from "@/components/showcase";
import { getPublishedContent } from "@/lib/content";

export const metadata: Metadata = {
  title: "产品",
  description: "Hecy Blog 的产品作品。",
};

export default async function ProductsPage() {
  return (
    <ShowcaseIndex
      items={await getPublishedContent("product")}
      title="产品"
      intro="把问题做成可以被使用、验证和持续迭代的产品。"
      type="product"
    />
  );
}
