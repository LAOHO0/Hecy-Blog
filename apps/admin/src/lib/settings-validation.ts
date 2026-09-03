import type { SiteSettings } from "@hecy/content/types";

type LinkInput = { label: string; url: string };
type NavigationInput = { label: string; href: string };

function isSafeUrl(value: string, allowRelative = false) {
  if (allowRelative && (value.startsWith("/") || value.startsWith("#"))) {
    return !value.startsWith("//");
  }
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function parseLinks(
  value: unknown,
  field: "socialLinks" | "navigation",
): LinkInput[] | NavigationInput[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 20) throw new Error("INVALID");

  return value.map((item) => {
    if (!item || typeof item !== "object") throw new Error("INVALID");
    const record = item as Record<string, unknown>;
    const label = typeof record.label === "string" ? record.label.trim() : "";
    const rawUrl = field === "navigation" ? record.href : record.url;
    const url = typeof rawUrl === "string" ? rawUrl.trim() : "";
    if (!label || label.length > 60 || !url || url.length > 500) {
      throw new Error("INVALID");
    }
    if (!isSafeUrl(url, field === "navigation")) throw new Error("INVALID");
    return field === "navigation" ? { label, href: url } : { label, url };
  }) as LinkInput[] | NavigationInput[];
}

export function parseSettings(value: unknown): SiteSettings {
  if (!value || typeof value !== "object") throw new Error("INVALID");
  const input = value as Record<string, unknown>;
  const title = typeof input.title === "string" ? input.title.trim() : "";
  const tagline = typeof input.tagline === "string" ? input.tagline.trim() : "";
  const bio = typeof input.bio === "string" ? input.bio.trim() : "";
  const footerText =
    typeof input.footerText === "string" ? input.footerText.trim() : "";
  const avatarRaw =
    typeof input.avatarUrl === "string" ? input.avatarUrl.trim() : "";

  if (
    !title ||
    title.length > 120 ||
    tagline.length > 240 ||
    bio.length > 1000 ||
    footerText.length > 240 ||
    avatarRaw.length > 500 ||
    (avatarRaw && !isSafeUrl(avatarRaw))
  ) {
    throw new Error("INVALID");
  }

  const socialLinks = parseLinks(
    input.socialLinks,
    "socialLinks",
  ) as LinkInput[];
  const navigation = parseLinks(
    input.navigation,
    "navigation",
  ) as NavigationInput[];

  return {
    title,
    tagline,
    bio,
    avatarUrl: avatarRaw || undefined,
    footerText,
    socialLinks,
    navigation,
  };
}
