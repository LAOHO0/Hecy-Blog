import { NextResponse } from "next/server";
import { getSettings } from "@/lib/store";

export async function GET() {
  return NextResponse.json(
    { settings: await getSettings() },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    },
  );
}
