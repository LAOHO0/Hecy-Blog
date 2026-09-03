import { NextResponse } from "next/server";
import { errorResponse, requireApiSession } from "@/lib/api-utils";
import { queueSiteBuild } from "@/lib/build-queue";
import { getContent, listVersions, restoreVersion } from "@/lib/store";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const guard = await requireApiSession();
  if (guard.response) return guard.response;
  const { id } = await context.params;
  return NextResponse.json({ items: await listVersions(id) });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const guard = await requireApiSession();
  if (guard.response) return guard.response;
  const { id } = await context.params;
  try {
    const payload = (await request.json()) as { versionId?: string };
    if (!payload.versionId)
      return NextResponse.json({ error: "缺少版本编号。" }, { status: 400 });
    const current = await getContent(id);
    if (!current)
      return NextResponse.json({ error: "内容不存在。" }, { status: 404 });
    const item = await restoreVersion(id, payload.versionId);
    if (!item)
      return NextResponse.json({ error: "版本不存在。" }, { status: 404 });
    const build =
      current.status === "published" || item.status === "published"
        ? await queueSiteBuild(`恢复版本：${item.title}`)
        : undefined;
    return NextResponse.json({ item, ...(build || {}) });
  } catch (error) {
    return errorResponse(error);
  }
}
