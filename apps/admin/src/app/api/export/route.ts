import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api-utils";
import { getSettings, listContent, listMedia } from "@/lib/store";

export async function GET() {
  const guard = await requireApiSession();
  if (guard.response) return guard.response;
  const [content, settings, media] = await Promise.all([
    listContent(),
    getSettings(),
    listMedia(),
  ]);
  const exportableContent = content.map(
    ({
      previewToken: _previewToken,
      previewExpiresAt: _previewExpiresAt,
      ...item
    }) => item,
  );
  return NextResponse.json(
    {
      exportedAt: new Date().toISOString(),
      settings,
      content: exportableContent,
      media,
    },
    {
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": `attachment; filename="hecy-blog-export.json"`,
      },
    },
  );
}
