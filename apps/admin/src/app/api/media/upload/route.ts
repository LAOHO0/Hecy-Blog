import { NextResponse } from "next/server";
import { errorResponse, requireApiSession } from "@/lib/api-utils";
import { getStorageDriver, saveLocalMedia } from "@/lib/storage";
import { addMedia } from "@/lib/store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const guard = await requireApiSession();
  if (guard.response) return guard.response;
  if (getStorageDriver() !== "local") {
    return NextResponse.json(
      { error: "当前使用 S3 存储，请调用预签名上传接口。" },
      { status: 409 },
    );
  }
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "请选择图片文件。" }, { status: 400 });
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    const saved = await saveLocalMedia({
      fileName: file.name,
      mimeType: file.type,
      size: file.size,
      bytes,
    });
    const item = await addMedia({
      key: saved.key,
      url: saved.url,
      mimeType: file.type,
      size: file.size,
      alt: file.name.slice(0, 200),
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
