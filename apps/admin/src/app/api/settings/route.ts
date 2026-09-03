import type { SiteSettings } from "@hecy/content/types";
import { NextResponse } from "next/server";
import { errorResponse, requireApiSession } from "@/lib/api-utils";
import { queueSiteBuild } from "@/lib/build-queue";
import { parseSettings } from "@/lib/settings-validation";
import { getSettings, updateSettings } from "@/lib/store";

export async function GET() {
  const guard = await requireApiSession();
  if (guard.response) return guard.response;
  return NextResponse.json({ settings: await getSettings() });
}

export async function PATCH(request: Request) {
  const guard = await requireApiSession();
  if (guard.response) return guard.response;
  let settings: SiteSettings;
  try {
    settings = parseSettings(await request.json());
  } catch {
    return NextResponse.json({ error: "设置格式不正确。" }, { status: 400 });
  }
  try {
    const saved = await updateSettings(settings);
    const build = await queueSiteBuild("更新站点设置");
    return NextResponse.json({ settings: saved, ...build });
  } catch (error) {
    return errorResponse(error);
  }
}
