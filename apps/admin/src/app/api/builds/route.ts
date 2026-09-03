import { NextResponse } from "next/server";
import { errorResponse, requireApiSession } from "@/lib/api-utils";
import { queueSiteBuild } from "@/lib/build-queue";
import { listBuilds } from "@/lib/store";

export async function GET() {
  const guard = await requireApiSession();
  if (guard.response) return guard.response;
  return NextResponse.json(
    { items: await listBuilds() },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(_request: Request) {
  const guard = await requireApiSession();
  if (guard.response) return guard.response;
  try {
    return NextResponse.json(await queueSiteBuild("手动触发"), {
      status: 201,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
