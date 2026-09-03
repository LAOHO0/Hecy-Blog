import { NextResponse } from "next/server";
import { errorResponse, requireApiSession } from "@/lib/api-utils";
import { addMedia, listMedia } from "@/lib/store";

function isSafeMediaUrl(value: string) {
  if (
    value.startsWith("media/") ||
    (value.startsWith("/") && !value.startsWith("//"))
  )
    return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export async function GET() {
  const guard = await requireApiSession();
  if (guard.response) return guard.response;
  return NextResponse.json({ items: await listMedia() });
}

export async function POST(request: Request) {
  const guard = await requireApiSession();
  if (guard.response) return guard.response;
  try {
    const input = (await request.json()) as {
      key?: string;
      url?: string;
      mimeType?: string;
      size?: number;
      alt?: string;
    };
    if (
      !input.key ||
      input.key.length > 500 ||
      !input.url ||
      input.url.length > 1000 ||
      !isSafeMediaUrl(input.url) ||
      !input.mimeType ||
      !/^image\/(png|jpe?g|gif|webp|svg\+xml)$/.test(input.mimeType) ||
      !Number.isFinite(input.size) ||
      Number(input.size) < 1 ||
      Number(input.size) > 15 * 1024 * 1024
    ) {
      return NextResponse.json({ error: "媒体信息不完整。" }, { status: 400 });
    }
    const item = await addMedia({
      key: input.key,
      url: input.url,
      mimeType: input.mimeType,
      size: Number(input.size),
      alt: input.alt?.slice(0, 200),
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
