import { NextResponse } from "next/server";
import { errorResponse, requireApiSession } from "@/lib/api-utils";
import { queueSiteBuild } from "@/lib/build-queue";
import { publishContent } from "@/lib/store";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const guard = await requireApiSession();
  if (guard.response) return guard.response;
  const { id } = await context.params;
  try {
    const item = await publishContent(id);
    if (!item)
      return NextResponse.json({ error: "内容不存在。" }, { status: 404 });
    const build = await queueSiteBuild(`发布：${item.title}`);
    return NextResponse.json({ item, ...build });
  } catch (error) {
    return errorResponse(error);
  }
}
