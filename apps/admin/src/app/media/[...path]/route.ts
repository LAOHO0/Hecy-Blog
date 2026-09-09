import { readFile } from "node:fs/promises";
import nodePath from "node:path";
import { NextResponse } from "next/server";

const contentTypes: Record<string, string> = {
  ".gif": "image/gif",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await context.params;
  const relative = segments.join("/");
  const root = nodePath.resolve(
    process.env.MEDIA_DIR || nodePath.join(process.cwd(), "data", "media"),
  );
  const filePath = nodePath.resolve(root, relative);
  if (!filePath.startsWith(`${root}${nodePath.sep}`))
    return new NextResponse(null, { status: 404 });
  try {
    const body = await readFile(filePath);
    const type =
      contentTypes[nodePath.extname(filePath).toLowerCase()] ||
      "application/octet-stream";
    return new NextResponse(body, {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Type": type,
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
