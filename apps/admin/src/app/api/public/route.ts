import type { ContentRecord } from "@hecy/content/types";
import { NextResponse } from "next/server";
import { listPublishedContent, listRedirects } from "@/lib/store";

function publicItem(item: ContentRecord) {
  const {
    previewToken: _previewToken,
    previewExpiresAt: _previewExpiresAt,
    ...safe
  } = item;
  return safe;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const type = url.searchParams.get("type") as ContentRecord["type"] | null;
  const records = await listPublishedContent(
    type && ["article", "product", "project"].includes(type) ? type : undefined,
  );
  const redirects = await listRedirects(
    type && ["article", "product", "project"].includes(type) ? type : undefined,
  );
  return NextResponse.json(
    {
      items: records.map(publicItem),
      redirects,
      generatedAt: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        "Access-Control-Allow-Origin": process.env.SITE_ORIGIN || "*",
      },
    },
  );
}
