import { unlink } from "node:fs/promises";
import nodePath from "node:path";
import { NextResponse } from "next/server";
import { errorResponse, requireApiSession } from "@/lib/api-utils";
import { getStorageDriver } from "@/lib/storage";
import { getMediaById, removeMedia } from "@/lib/store";

export const runtime = "nodejs";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const guard = await requireApiSession();
  if (guard.response) return guard.response;
  const { id } = await context.params;
  try {
    // 删除前先查出记录：local 模式需要同步清理磁盘文件
    const item = await getMediaById(id);
    const removed = await removeMedia(id);
    if (!removed) {
      return NextResponse.json({ error: "媒体不存在。" }, { status: 404 });
    }
    // local 模式清理落盘文件；key 形如 media/<日期>/<文件名>，
    // MEDIA_DIR 本身是媒体根目录，落盘时剥掉 media/ 前缀（与上传一致）。
    if (
      item &&
      getStorageDriver() === "local" &&
      item.key.startsWith("media/")
    ) {
      const root = nodePath.resolve(
        process.env.MEDIA_DIR || nodePath.join(process.cwd(), "data", "media"),
      );
      const filePath = nodePath.resolve(root, item.key.replace(/^media\//, ""));
      if (filePath.startsWith(`${root}${nodePath.sep}`)) {
        await unlink(filePath).catch(() => {});
      }
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
