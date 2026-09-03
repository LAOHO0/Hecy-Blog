import type { Metadata } from "next";
import { ContentEditor } from "@/components/content-editor";

export const metadata: Metadata = {
  title: "新建内容",
};

export default async function NewContentPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const params = await searchParams;
  const type =
    params.type === "product" || params.type === "project"
      ? params.type
      : "article";
  return <ContentEditor initial={null} initialType={type} />;
}
