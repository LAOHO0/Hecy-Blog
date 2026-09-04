import {
  defaultHomepage,
  homepageIconOptions,
  homepageLimits,
  LATEST_PRODUCT_LINK,
} from "@hecy/content/settings";
import type {
  HomepageNowItem,
  HomepageSettings,
  HomepageSkill,
  SiteSettings,
} from "@hecy/content/types";

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

function requiredText(
  value: unknown,
  max: number,
  emptyMessage: string,
  tooLongMessage: string,
) {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) throw new Error(emptyMessage);
  if (text.length > max) throw new Error(tooLongMessage);
  return text;
}

function optionalText(value: unknown, max: number, tooLongMessage: string) {
  const text = typeof value === "string" ? value.trim() : "";
  if (text.length > max) throw new Error(tooLongMessage);
  return text;
}

function parseSkills(value: unknown): HomepageSkill[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > homepageLimits.skills) {
    throw new Error(`技能数量不能超过 ${homepageLimits.skills} 个。`);
  }
  return value.map((item) => {
    if (!item || typeof item !== "object") throw new Error("INVALID");
    const record = item as Record<string, unknown>;
    const name = requiredText(
      record.name,
      homepageLimits.skillName,
      "技能名称不能为空。",
      `技能名称不能超过 ${homepageLimits.skillName} 字。`,
    );
    const icon = typeof record.icon === "string" ? record.icon.trim() : "";
    if (icon && !homepageIconOptions.includes(icon) && !isSafeUrl(icon, true)) {
      throw new Error("技能图标需为预置图标或图片链接。");
    }
    return { name, icon };
  });
}

function parseNowLink(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") throw new Error("动态链接不合法。");
  const link = value.trim();
  if (!link) return undefined;
  if (link.length > homepageLimits.nowLink) {
    throw new Error(`动态链接不能超过 ${homepageLimits.nowLink} 字。`);
  }
  if (link !== LATEST_PRODUCT_LINK && !isSafeUrl(link, true)) {
    throw new Error("动态链接必须是 http(s) 或站内路径。");
  }
  return link;
}

function parseNowItems(value: unknown): HomepageNowItem[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > homepageLimits.nowItems) {
    throw new Error(`动态条目不能超过 ${homepageLimits.nowItems} 个。`);
  }
  return value.map((item) => {
    if (!item || typeof item !== "object") throw new Error("INVALID");
    const record = item as Record<string, unknown>;
    return {
      label: requiredText(
        record.label,
        homepageLimits.nowLabel,
        "动态标签不能为空。",
        `动态标签不能超过 ${homepageLimits.nowLabel} 字。`,
      ),
      content: requiredText(
        record.content,
        homepageLimits.nowContent,
        "动态内容不能为空。",
        `动态内容不能超过 ${homepageLimits.nowContent} 字。`,
      ),
      link: parseNowLink(record.link),
    };
  });
}

function parseHomepage(value: unknown): HomepageSettings {
  const limits = homepageLimits;
  const raw = (value && typeof value === "object" ? value : {}) as Record<
    string,
    unknown
  >;
  return {
    greeting: optionalText(
      raw.greeting,
      limits.greeting,
      `问候语不能超过 ${limits.greeting} 字。`,
    ),
    headline: optionalText(
      raw.headline,
      limits.headline,
      `首页主标题不能超过 ${limits.headline} 字。`,
    ),
    role: requiredText(
      raw.role,
      limits.role,
      "职业不能为空。",
      `职业不能超过 ${limits.role} 字。`,
    ),
    location: requiredText(
      raw.location,
      limits.location,
      "所在地不能为空。",
      `所在地不能超过 ${limits.location} 字。`,
    ),
    nowTitle: requiredText(
      raw.nowTitle,
      limits.nowTitle,
      "动态标题不能为空。",
      `动态标题不能超过 ${limits.nowTitle} 字。`,
    ),
    skills: parseSkills(raw.skills),
    nowItems: parseNowItems(raw.nowItems),
  };
}

export function parseSettings(value: unknown): SiteSettings {
  if (!value || typeof value !== "object") throw new Error("INVALID");
  const input = value as Record<string, unknown>;
  const title = requiredText(
    input.title,
    120,
    "站点标题不能为空。",
    "站点标题不能超过 120 字。",
  );
  const tagline = optionalText(input.tagline, 240, "简介不能超过 240 字。");
  const bio = optionalText(input.bio, 1000, "简介内容不能超过 1000 字。");
  const footerText = optionalText(
    input.footerText,
    240,
    "页脚文字不能超过 240 字。",
  );
  const avatarRaw = optionalText(input.avatarUrl, 500, "头像 URL 过长。");
  if (avatarRaw && !isSafeUrl(avatarRaw)) {
    throw new Error("头像 URL 必须是 http(s) 链接。");
  }

  const socialLinks = parseLinks(
    input.socialLinks,
    "socialLinks",
  ) as LinkInput[];
  const navigation = parseLinks(
    input.navigation,
    "navigation",
  ) as NavigationInput[];

  // 旧客户端没有 homepage 字段时回退默认值，保存后即落库完整结构。
  const homepage =
    input.homepage === undefined
      ? defaultHomepage
      : parseHomepage(input.homepage);

  return {
    title,
    tagline,
    bio,
    avatarUrl: avatarRaw || undefined,
    footerText,
    socialLinks,
    navigation,
    homepage,
  };
}
