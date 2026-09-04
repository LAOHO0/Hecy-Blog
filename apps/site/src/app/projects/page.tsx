import type { Metadata } from "next";
import { ShowcaseIndex } from "@/components/showcase";
import { getPublishedContent } from "@/lib/content";

export const metadata: Metadata = {
  title: "项目",
  description: "Hecy Blog 的项目记录。",
};

export default async function ProjectsPage() {
  const items = (await getPublishedContent("project")).sort(
    (a, b) =>
      a.sortOrder - b.sortOrder ||
      Date.parse(b.publishedAt || b.createdAt) -
        Date.parse(a.publishedAt || a.createdAt),
  );

  return (
    <ShowcaseIndex
      intro="记录从想法、协作到上线的完整过程"
      items={items}
      title="项目"
      type="project"
    />
  );
}
