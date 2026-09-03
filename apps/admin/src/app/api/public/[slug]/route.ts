import type { ContentRecord } from "@hecy/content/types";
import { NextResponse } from "next/server";
import { getContentBySlug, getRedirect } from "@/lib/store";

const contentTypes = ["article", "product", "project"] as const;

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const url = new URL(_request.url);
  const requestedType = url.searchParams.get("type");
  const types = contentTypes.filter(
    (type) => !requestedType || type === requestedType,
  );

  for (const type of types) {
    const item = await getContentBySlug(slug, type);
    if (item?.status !== "published") continue;
    const {
      previewToken: _previewToken,
      previewExpiresAt: _previewExpiresAt,
      ...safe
    } = item as ContentRecord;
    return NextResponse.json(
      { item: safe, redirectFrom: null },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      },
    );
  }

  for (const type of types) {
    const redirectSlug = await getRedirect(type, slug);
    if (!redirectSlug) continue;
    const item = await getContentBySlug(redirectSlug, type);
    if (item?.status !== "published") continue;
    const {
      previewToken: _previewToken,
      previewExpiresAt: _previewExpiresAt,
      ...safe
    } = item as ContentRecord;
    return NextResponse.json(
      { item: safe, redirectFrom: slug },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      },
    );
  }

  return NextResponse.json({ error: "内容不存在。" }, { status: 404 });
}
