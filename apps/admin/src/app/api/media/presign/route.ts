import { NextResponse } from "next/server";
import { errorResponse, requireApiSession } from "@/lib/api-utils";
import { createUploadUrl } from "@/lib/storage";

export async function POST(request: Request) {
  const guard = await requireApiSession();
  if (guard.response) return guard.response;
  try {
    const input = (await request.json()) as {
      fileName?: string;
      mimeType?: string;
      size?: number;
    };
    if (
      !input.fileName ||
      input.fileName.length > 180 ||
      !input.mimeType ||
      !Number.isFinite(input.size) ||
      Number(input.size) < 1 ||
      Number(input.size) > 15 * 1024 * 1024
    ) {
      return NextResponse.json({ error: "文件信息不完整。" }, { status: 400 });
    }
    return NextResponse.json(
      await createUploadUrl({
        fileName: input.fileName.slice(0, 180),
        mimeType: input.mimeType,
        size: Number(input.size),
      }),
    );
  } catch (error) {
    return errorResponse(error);
  }
}
