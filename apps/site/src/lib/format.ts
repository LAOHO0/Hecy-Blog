export function formatDisplayDate(value?: string) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "----.--.--";
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map((part, index) =>
      index === 0 ? String(part) : String(part).padStart(2, "0"),
    )
    .join(".");
}

export function sortByPublishedDate<
  T extends { publishedAt?: string; createdAt: string },
>(items: T[]) {
  return [...items].sort(
    (a, b) =>
      Date.parse(b.publishedAt || b.createdAt) -
      Date.parse(a.publishedAt || a.createdAt),
  );
}
