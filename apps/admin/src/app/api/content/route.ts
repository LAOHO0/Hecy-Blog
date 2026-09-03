import { contentInputSchema } from "@hecy/content/validation";
import { NextResponse } from "next/server";
import { errorResponse, requireApiSession } from "@/lib/api-utils";
import { createContent, listContent } from "@/lib/store";

export async function GET(request: Request) {
  const guard = await requireApiSession();
  if (guard.response) return guard.response;
  const url = new URL(request.url);
  const type = url.searchParams.get("type") as
    | "article"
    | "product"
    | "project"
    | null;
  const status = url.searchParams.get("status") as
    | "draft"
    | "published"
    | "archived"
    | null;
  const query = url.searchParams.get("q") || undefined;
  const records = await listContent({
    type:
      type && ["article", "product", "project"].includes(type)
        ? type
        : undefined,
    status:
      status && ["draft", "published", "archived"].includes(status)
        ? status
        : undefined,
    query,
  });
  return NextResponse.json(
    { items: records },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  const guard = await requireApiSession();
  if (guard.response) return guard.response;
  try {
    const input = contentInputSchema.parse(await request.json());
    const record = await createContent(input);
    return NextResponse.json({ item: record }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "请检查表单字段。", details: error.message },
        { status: 400 },
      );
    }
    return errorResponse(error);
  }
}
