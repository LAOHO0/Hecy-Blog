import { NextResponse } from "next/server";
import { markBuild } from "@/lib/store";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const secret = process.env.BUILD_WEBHOOK_SECRET;
  if (!secret || request.headers.get("x-build-secret") !== secret) {
    return NextResponse.json({ error: "未授权。" }, { status: 401 });
  }
  const { id } = await context.params;
  const payload = (await request.json().catch(() => ({}))) as {
    status?: "queued" | "running" | "success" | "failed";
    errorSummary?: string;
    commitSha?: string;
  };
  const statuses = ["queued", "running", "success", "failed"] as const;
  if (!payload.status || !statuses.includes(payload.status))
    return NextResponse.json({ error: "缺少构建状态。" }, { status: 400 });
  const build = await markBuild(
    id,
    payload.status,
    payload.errorSummary?.slice(0, 500),
    payload.commitSha?.slice(0, 80),
  );
  if (!build)
    return NextResponse.json({ error: "构建记录不存在。" }, { status: 404 });
  return NextResponse.json({ build });
}
