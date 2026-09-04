export const contentTypes = ["article", "product", "project"] as const;
export type ContentType = (typeof contentTypes)[number];

export const contentStatuses = ["draft", "published", "archived"] as const;
export type ContentStatus = (typeof contentStatuses)[number];

export type ProductStatus = "live" | "beta" | "paused";

export type ProductFields = {
  status: ProductStatus;
  price?: string;
  url?: string;
  platform?: string;
};

export type ProjectFields = {
  role?: string;
  period?: string;
  techStack: string[];
  repoUrl?: string;
  url?: string;
};

export type SeoFields = {
  title?: string;
  description?: string;
  keywords: string[];
  canonicalUrl?: string;
  ogImageUrl?: string;
};

export type ContentRecord = {
  id: string;
  type: ContentType;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  coverUrl?: string;
  tags: string[];
  lang: string;
  status: ContentStatus;
  featured: boolean;
  sortOrder: number;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  product?: ProductFields;
  project?: ProjectFields;
  seo: SeoFields;
  previewToken?: string;
  previewExpiresAt?: string;
};

export type ContentVersion = {
  id: string;
  contentId: string;
  version: number;
  snapshot: ContentRecord;
  createdAt: string;
  createdBy: string;
};

export type BuildStatus = "queued" | "running" | "success" | "failed";

export type BuildRecord = {
  id: string;
  status: BuildStatus;
  commitSha?: string;
  startedAt?: string;
  finishedAt?: string;
  errorSummary?: string;
  createdAt: string;
};

export type MediaAsset = {
  id: string;
  key: string;
  url: string;
  mimeType: string;
  size: number;
  alt?: string;
  createdAt: string;
};

export type HomepageSkill = {
  name: string;
  icon: string;
};

export type HomepageNowItem = {
  label: string;
  content: string;
  link?: string;
};

export type HomepageSettings = {
  greeting: string;
  headline: string;
  role: string;
  location: string;
  nowTitle: string;
  skills: HomepageSkill[];
  nowItems: HomepageNowItem[];
};

export type SiteSettings = {
  title: string;
  tagline: string;
  bio: string;
  avatarUrl?: string;
  socialLinks: { label: string; url: string }[];
  navigation: { label: string; href: string }[];
  footerText: string;
  homepage: HomepageSettings;
};
