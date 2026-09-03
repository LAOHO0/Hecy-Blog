import type { Metadata } from "next";
import { ShowcaseIndex } from "@/components/showcase";
import { getPublishedContent } from "@/lib/content";

export const metadata: Metadata = {
  title: "项目",
  description: "Hecy Blog 的项目记录。",
};

export default async function ProjectsPage() {
  return (
    <ShowcaseIndex
      items={await getPublishedContent("project")}
      title="项目"
      intro="记录从想法、协作到上线的完整过程。"
      type="project"
    />
  );
}
