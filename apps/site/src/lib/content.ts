import { defaultSettings, seedContent } from "@hecy/content/seed";
import { normalizeSiteSettings } from "@hecy/content/settings";
import type { ContentRecord, SiteSettings } from "@hecy/content/types";

const apiUrl = process.env.CONTENT_API_URL?.replace(/\/$/, "");
const allowSeedFallback =
  process.env.NODE_ENV !== "production" ||
  process.env.ALLOW_SEED_FALLBACK === "true";
// 静态导出在构建时读取一次并去重；开发模式实时拉取，后台改动刷新即可见。
const fetchCache: RequestCache =
  process.env.NODE_ENV === "development" ? "no-store" : "force-cache";
const contentTypes = ["article", "product", "project"] as const;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type PublishedRedirect = {
  type: ContentRecord["type"];
  fromSlug: string;
  toSlug: string;
};

function isPublishedRedirect(value: unknown): value is PublishedRedirect {
  if (!value || typeof value !== "object") return false;
  const item = value as {
    type?: unknown;
    fromSlug?: unknown;
    toSlug?: unknown;
  };
  return (
    typeof item.type === "string" &&
    contentTypes.includes(item.type as ContentRecord["type"]) &&
    typeof item.fromSlug === "string" &&
    item.fromSlug.length <= 160 &&
    slugPattern.test(item.fromSlug) &&
    typeof item.toSlug === "string" &&
    item.toSlug.length <= 160 &&
    slugPattern.test(item.toSlug)
  );
}

function publishedFallback(type?: ContentRecord["type"]) {
  return seedContent.filter(
    (item) => item.status === "published" && (!type || item.type === type),
  );
}

export async function getSiteSettings(): Promise<SiteSettings> {
  // Development/demo builds may use the checked-in snapshot. Production
  // builds must read settings from the CMS unless fallback is explicitly on.
  if (!apiUrl) {
    if (!allowSeedFallback) throw new Error("CONTENT_API_URL_REQUIRED");
    return defaultSettings;
  }
  try {
    const response = await fetch(`${apiUrl}/settings`, {
      cache: fetchCache,
    });
    if (response.ok) {
      const payload = (await response.json()) as { settings?: SiteSettings };
      // 旧版后台返回的设置可能没有 homepage 字段，读取时补默认值。
      if (payload.settings) return normalizeSiteSettings(payload.settings);
    }
    if (!allowSeedFallback) {
      throw new Error(`CONTENT_API_HTTP_${response.status}`);
    }
  } catch (error) {
    if (!allowSeedFallback) {
      throw new Error("CONTENT_API_UNAVAILABLE", { cause: error });
    }
  }
  if (!allowSeedFallback) throw new Error("CONTENT_API_UNAVAILABLE");
  return defaultSettings;
}

export async function getPublishedContent(
  type?: ContentRecord["type"],
): Promise<ContentRecord[]> {
  if (!apiUrl) {
    if (!allowSeedFallback) throw new Error("CONTENT_API_URL_REQUIRED");
    return publishedFallback(type);
  }
  try {
    const query = type ? `?type=${encodeURIComponent(type)}` : "";
    const response = await fetch(`${apiUrl}${query ? query : ""}`, {
      cache: fetchCache,
    });
    if (response.ok) {
      const payload = (await response.json()) as { items?: ContentRecord[] };
      if (payload.items) return payload.items;
    }
    if (!allowSeedFallback) {
      throw new Error(`CONTENT_API_HTTP_${response.status}`);
    }
  } catch (error) {
    if (!allowSeedFallback) {
      throw new Error("CONTENT_API_UNAVAILABLE", { cause: error });
    }
  }
  if (!allowSeedFallback) throw new Error("CONTENT_API_UNAVAILABLE");
  return publishedFallback(type);
}

export async function getPublishedRedirects(
  type?: ContentRecord["type"],
): Promise<PublishedRedirect[]> {
  if (!apiUrl) {
    if (!allowSeedFallback) throw new Error("CONTENT_API_URL_REQUIRED");
    return [];
  }
  try {
    const query = type ? `?type=${encodeURIComponent(type)}` : "";
    const response = await fetch(`${apiUrl}${query}`, {
      cache: fetchCache,
    });
    if (response.ok) {
      const payload = (await response.json()) as {
        redirects?: PublishedRedirect[];
      };
      const redirects = Array.isArray(payload.redirects)
        ? payload.redirects
        : [];
      return redirects.filter(
        (item) => isPublishedRedirect(item) && (!type || item.type === type),
      );
    }
    if (!allowSeedFallback) {
      throw new Error(`CONTENT_API_HTTP_${response.status}`);
    }
  } catch {
    if (!allowSeedFallback) {
      throw new Error("CONTENT_API_UNAVAILABLE");
    }
  }
  if (!allowSeedFallback) throw new Error("CONTENT_API_UNAVAILABLE");
  return [];
}

export async function getPublishedBySlug(
  slug: string,
  type?: ContentRecord["type"],
) {
  const records = await getPublishedContent(type);
  return records.find((item) => item.slug === slug);
}

export async function getPublishedRoute(
  slug: string,
  type: ContentRecord["type"],
) {
  const item = await getPublishedBySlug(slug, type);
  if (item) return { item, redirectTo: undefined };
  const redirect = (await getPublishedRedirects(type)).find(
    (entry) => entry.fromSlug === slug,
  );
  return { item: undefined, redirectTo: redirect?.toSlug };
}
