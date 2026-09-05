import type { HomepageSettings, SiteSettings } from "./types";

/** 首条动态可用该标记自动链接当前置顶产品。 */
export const LATEST_PRODUCT_LINK = "latest-product";

/** 技能图标分组（后台下拉按组展示）；图标名为 simple-icons 品牌名。 */
export const homepageIconGroups: { group: string; icons: string[] }[] = [
  {
    group: "前端",
    icons: [
      "Vue",
      "Vite",
      "React",
      "Next.js",
      "Astro",
      "Svelte",
      "Nuxt",
      "VitePress",
      "Deno",
      "Tailwind CSS",
      "TypeScript",
      "Bun",
      "Node.js",
      "Electron",
      "Tauri",
    ],
  },
  {
    group: "AI",
    icons: [
      "Claude",
      "Anthropic",
      "Cursor",
      "Google Gemini",
      "Perplexity",
      "Ollama",
      "Hugging Face",
      "LangChain",
      "PyTorch",
    ],
  },
  {
    group: "语言",
    icons: [
      "Rust",
      "Go",
      "Kotlin",
      "Swift",
      "Dart",
      "Flutter",
      "PHP",
      "Ruby",
      "C++",
      "Python",
    ],
  },
  {
    group: "数据与运维",
    icons: [
      "Git",
      "GitHub",
      "GitLab",
      "Docker",
      "Kubernetes",
      "Vercel",
      "Cloudflare",
      "Nginx",
      "Linux",
      "npm",
      "pnpm",
      "MySQL",
      "Redis",
      "MongoDB",
      "Supabase",
      "GraphQL",
    ],
  },
  {
    group: "工具与内容",
    icons: [
      "Figma",
      "Notion",
      "Obsidian",
      "Markdown",
      "Raycast",
      "Chrome",
      "Bilibili",
      "知乎",
      "微信",
      "TikTok",
    ],
  },
];

/** 校验用扁平图标名集合；空串表示通用图标。 */
export const homepageIconOptions: readonly string[] = [
  "",
  ...homepageIconGroups.flatMap((group) => group.icons),
];

/** 前台内置背景款式（后台一键切换；key 对应前台 CSS 的 bg-preset-* 类）。 */
export const backgroundPresets = [
  { key: "noise", name: "噪点纸感（默认）" },
  { key: "grid", name: "极简网格" },
  { key: "dots", name: "圆点阵" },
  { key: "diagonal", name: "斜纹线" },
  { key: "glow", name: "柔光渐变" },
  { key: "plain", name: "纯色无纹理" },
] as const;

export type BackgroundPresetKey = (typeof backgroundPresets)[number]["key"];

export const backgroundPresetKeys: readonly string[] = backgroundPresets.map(
  (preset) => preset.key,
);

export const defaultBackground = { preset: "noise" } as const;

export const homepageLimits = {
  greeting: 120,
  headline: 160,
  role: 60,
  location: 60,
  nowTitle: 60,
  skillName: 40,
  skills: 20,
  nowLabel: 20,
  nowContent: 200,
  nowLink: 500,
  nowItems: 10,
} as const;

export const defaultHomepage: HomepageSettings = {
  greeting: "你好，这里是 Hecy / Hecy Blog",
  headline: "只有你也想见我的时候，我们的相遇才有意义。",
  role: "前端工程师",
  location: "HangZhou",
  nowTitle: "最近在做什么",
  skills: [
    { name: "Vue", icon: "Vue" },
    { name: "Vite", icon: "Vite" },
    { name: "React", icon: "React" },
    { name: "Next.js", icon: "Next.js" },
    { name: "TypeScript", icon: "TypeScript" },
    { name: "Bun", icon: "Bun" },
    { name: "Node.js", icon: "Node.js" },
    { name: "Docker", icon: "Docker" },
    { name: "Python", icon: "Python" },
  ],
  nowItems: [
    {
      label: "Build",
      content: "构建一个和 AI 融合的",
      link: LATEST_PRODUCT_LINK,
    },
    { label: "Write", content: "持续整理个人产品与工程笔记。" },
    { label: "Study", content: "学习AI+产品设计+开发" },
    { label: "Train", content: "健身，练出硕大的肌肉💪，保持长期主义。" },
  ],
};

const text = (value: unknown, fallback: string) =>
  typeof value === "string" ? value : fallback;

function normalizeSkills(value: unknown): HomepageSettings["skills"] {
  if (!Array.isArray(value)) return defaultHomepage.skills;
  const skills: HomepageSettings["skills"] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    if (typeof record.name !== "string") continue;
    skills.push({
      name: record.name,
      icon: typeof record.icon === "string" ? record.icon : "",
    });
  }
  // 空数组视为有效数据（用户清空了技能），只有结构缺失才回退默认值。
  return skills;
}

function normalizeNowItems(value: unknown): HomepageSettings["nowItems"] {
  if (!Array.isArray(value)) return defaultHomepage.nowItems;
  const items: HomepageSettings["nowItems"] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    if (
      typeof record.label !== "string" ||
      typeof record.content !== "string"
    ) {
      continue;
    }
    items.push({
      label: record.label,
      content: record.content,
      link:
        typeof record.link === "string" && record.link
          ? record.link
          : undefined,
    });
  }
  return items;
}

/** 读取背景设置的兜底逻辑：缺字段/非法值回落默认噪点背景。 */
function normalizeBackground(
  settings: SiteSettings,
): SiteSettings["background"] {
  const raw = (
    settings as { background?: { preset?: unknown; imageUrl?: unknown } }
  ).background;
  const preset =
    typeof raw?.preset === "string" && backgroundPresetKeys.includes(raw.preset)
      ? raw.preset
      : defaultBackground.preset;
  const imageUrl =
    typeof raw?.imageUrl === "string" && raw.imageUrl
      ? raw.imageUrl
      : undefined;
  return { preset, imageUrl };
}

/**
 * 旧版本保存的设置没有 homepage / background 字段，读取时按字段补默认值，
 * 保证升级后前后台都不会因为缺字段而报错。
 */
export function normalizeSiteSettings(settings: SiteSettings): SiteSettings {
  const raw = (settings as { homepage?: Partial<HomepageSettings> }).homepage;
  return {
    ...settings,
    background: normalizeBackground(settings),
    homepage: {
      greeting: text(raw?.greeting, defaultHomepage.greeting),
      headline: text(raw?.headline, defaultHomepage.headline),
      role: text(raw?.role, defaultHomepage.role),
      location: text(raw?.location, defaultHomepage.location),
      nowTitle: text(raw?.nowTitle, defaultHomepage.nowTitle),
      skills: normalizeSkills(raw?.skills),
      nowItems: normalizeNowItems(raw?.nowItems),
    },
  };
}
