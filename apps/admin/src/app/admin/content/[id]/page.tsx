import { notFound } from "next/navigation";
import { ContentEditor } from "@/components/content-editor";
import { getContent } from "@/lib/store";

export default async function EditContentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getContent(id);
  if (!item) notFound();
  return <ContentEditor initial={item} initialType={item.type} />;
}
