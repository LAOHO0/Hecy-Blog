import type { BuildRecord, ContentRecord } from "@hecy/content/types";

export const typeLabels: Record<ContentRecord["type"], string> = {
  article: "文章",
  product: "产品",
  project: "项目",
};

export const statusLabels: Record<ContentRecord["status"], string> = {
  draft: "草稿",
  published: "已发布",
  archived: "已归档",
};

export const statusClass: Record<ContentRecord["status"], string> = {
  draft: "draft",
  published: "published",
  archived: "archived",
};

export const buildStatusLabels: Record<BuildRecord["status"], string> = {
  queued: "排队中",
  running: "构建中",
  success: "成功",
  failed: "失败",
};

export function formatDate(value: string | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(new Date(value))
    .replaceAll("/", ".");
}

export function formatToday(value = new Date()) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "long",
  })
    .format(value)
    .replaceAll("/", ".");
}

export function formatDateTime(value: string | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
    .format(new Date(value))
    .replaceAll("/", ".");
}

export function relativeTime(value: string | undefined) {
  if (!value) return "—";
  const delta = Date.now() - new Date(value).getTime();
  const minutes = Math.floor(delta / 60_000);
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  return `${days} 天前`;
}
