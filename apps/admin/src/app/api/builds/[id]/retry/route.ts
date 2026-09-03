import { NextResponse } from "next/server";
import { errorResponse, requireApiSession } from "@/lib/api-utils";
import { queueSiteBuild } from "@/lib/build-queue";
import { getBuild } from "@/lib/store";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const guard = await requireApiSession();
  if (guard.response) return guard.response;
  try {
    const { id: previousId } = await context.params;
    const previous = await getBuild(previousId);
    if (!previous) {
      return NextResponse.json({ error: "构建记录不存在。" }, { status: 404 });
    }
    if (previous.status !== "failed") {
      return NextResponse.json(
        { error: "只有失败的构建可以重试。" },
        { status: 409 },
      );
    }
    const build = await queueSiteBuild(`重试构建 ${previousId}`);
    return NextResponse.json(build, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
