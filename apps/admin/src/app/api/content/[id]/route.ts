import { contentInputSchema } from "@hecy/content/validation";
import { NextResponse } from "next/server";
import { errorResponse, requireApiSession } from "@/lib/api-utils";
import { queueSiteBuild } from "@/lib/build-queue";
import { deleteContent, getContent, updateContent } from "@/lib/store";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  const guard = await requireApiSession();
  if (guard.response) return guard.response;
  const { id } = await context.params;
  const item = await getContent(id);
  if (!item)
    return NextResponse.json({ error: "内容不存在。" }, { status: 404 });
  return NextResponse.json(
    { item },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function PATCH(request: Request, context: Context) {
  const guard = await requireApiSession();
  if (guard.response) return guard.response;
  const { id } = await context.params;
  try {
    const current = await getContent(id);
    if (!current)
      return NextResponse.json({ error: "内容不存在。" }, { status: 404 });
    const input = contentInputSchema.parse(await request.json());
    const item = await updateContent(id, input);
    if (!item)
      return NextResponse.json({ error: "内容不存在。" }, { status: 404 });
    const build =
      current.status === "published" || item.status === "published"
        ? await queueSiteBuild(`更新：${item.title}`)
        : undefined;
    return NextResponse.json({ item, ...(build || {}) });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "请检查表单字段。", details: error.message },
        { status: 400 },
      );
    }
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, context: Context) {
  const guard = await requireApiSession();
  if (guard.response) return guard.response;
  const { id } = await context.params;
  const current = await getContent(id);
  if (!current)
    return NextResponse.json({ error: "内容不存在。" }, { status: 404 });
  const removed = await deleteContent(id);
  if (!removed)
    return NextResponse.json({ error: "内容不存在。" }, { status: 404 });
  const build =
    current.status === "published"
      ? await queueSiteBuild(`删除：${current.title}`)
      : undefined;
  return NextResponse.json({ ok: true, ...(build || {}) });
}
