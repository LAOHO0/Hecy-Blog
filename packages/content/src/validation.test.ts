import { describe, expect, it } from "vitest";
import { contentInputSchema } from "./validation";

const baseArticle = {
  type: "article" as const,
  slug: "safe-slug",
  title: "安全链接测试",
  excerpt: "",
  body: "正文",
  tags: [],
  lang: "zh-CN",
  featured: false,
  sortOrder: 0,
  seo: { keywords: [] },
};

describe("content URL validation", () => {
  it("only accepts http and https URLs", () => {
    expect(
      contentInputSchema.parse({
        ...baseArticle,
        coverUrl: "https://example.com/cover.png",
        seo: {
          keywords: [],
          canonicalUrl: "http://example.com/article",
          ogImageUrl: "https://example.com/og.png",
        },
      }).coverUrl,
    ).toBe("https://example.com/cover.png");

    for (const value of [
      "javascript:alert(1)",
      "data:text/html,<script>alert(1)</script>",
      "mailto:hello@example.com",
    ]) {
      expect(() =>
        contentInputSchema.parse({ ...baseArticle, coverUrl: value }),
      ).toThrow();
    }
  });

  it("applies the same protocol guard to product and project links", () => {
    expect(() =>
      contentInputSchema.parse({
        ...baseArticle,
        type: "product",
        product: { status: "live", url: "javascript:alert(1)" },
      }),
    ).toThrow();
    expect(() =>
      contentInputSchema.parse({
        ...baseArticle,
        type: "project",
        project: { techStack: [], repoUrl: "data:text/plain,owned" },
      }),
    ).toThrow();
  });
});
