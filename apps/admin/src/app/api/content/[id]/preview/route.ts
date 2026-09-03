import { NextResponse } from "next/server";
import { errorResponse, requireApiSession } from "@/lib/api-utils";
import { createPreview } from "@/lib/store";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const guard = await requireApiSession();
  if (guard.response) return guard.response;
  const { id } = await context.params;
  try {
    const payload = (await request.json().catch(() => ({}))) as {
      minutes?: number;
    };
    const minutes = Math.min(
      Math.max(Number(payload.minutes) || 60, 5),
      24 * 7,
    );
    const result = await createPreview(id, minutes);
    if (!result)
      return NextResponse.json({ error: "内容不存在。" }, { status: 404 });
    const origin = process.env.ADMIN_ORIGIN || new URL(request.url).origin;
    return NextResponse.json({
      url: `${origin}/preview/${result.token}`,
      expiresAt: result.expiresAt,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
