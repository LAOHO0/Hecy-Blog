import { contentInputSchema } from "@hecy/content/validation";
import { beforeEach, describe, expect, it, vi } from "vitest";

// The store is a server-only module in Next.js. Vitest runs outside the
// React Server Components boundary, so replace the marker package in tests.
vi.mock("server-only", () => ({}));

const store = await import("./store");

beforeEach(() => {
  delete process.env.DATABASE_URL;
});

function articleInput(slug: string) {
  return contentInputSchema.parse({
    type: "article",
    slug,
    title: "存储测试",
    excerpt: "测试摘要",
    body: "# 测试",
    tags: ["测试"],
    lang: "zh-CN",
    seo: { keywords: [] },
  });
}

describe("内存内容存储", () => {
  it("支持改名重定向、版本和发布撤回流程", async () => {
    const suffix = crypto.randomUUID().slice(0, 8);
    const originalSlug = `store-smoke-${suffix}`;
    const renamedSlug = `${originalSlug}-renamed`;
    const created = await store.createContent(articleInput(originalSlug));

    const updated = await store.updateContent(
      created.id,
      articleInput(renamedSlug),
    );
    expect(updated?.slug).toBe(renamedSlug);
    expect(await store.getRedirect("article", originalSlug)).toBe(renamedSlug);

    const published = await store.publishContent(created.id);
    expect(published?.status).toBe("published");
    expect(
      (await store.listVersions(created.id)).length,
    ).toBeGreaterThanOrEqual(2);

    const revoked = await store.revokeContent(created.id);
    expect(revoked?.status).toBe("draft");
    expect(await store.deleteContent(created.id)).toBe(true);
    expect(await store.getRedirect("article", originalSlug)).toBeUndefined();
    expect(await store.deleteContent(created.id)).toBe(false);
  });

  it("拒绝重复 slug", async () => {
    const slug = `duplicate-${crypto.randomUUID().slice(0, 8)}`;
    const first = await store.createContent(articleInput(slug));
    await expect(store.createContent(articleInput(slug))).rejects.toThrow(
      "SLUG_EXISTS",
    );
    await store.deleteContent(first.id);
  });

  it("允许不同内容类型使用同一个 slug", async () => {
    const slug = `shared-${crypto.randomUUID().slice(0, 8)}`;
    const article = await store.createContent(articleInput(slug));
    const product = await store.createContent(
      contentInputSchema.parse({
        type: "product",
        slug,
        title: "同 Slug 产品",
        product: { status: "live" },
        seo: { keywords: [] },
      }),
    );
    expect(product.slug).toBe(slug);
    await store.deleteContent(article.id);
    await store.deleteContent(product.id);
  });

  it("保持内容类型不变，并让新内容重新占用释放的 slug", async () => {
    const suffix = crypto.randomUUID().slice(0, 8);
    const originalSlug = `released-${suffix}`;
    const renamedSlug = `${originalSlug}-next`;
    const created = await store.createContent(articleInput(originalSlug));

    await expect(
      store.updateContent(
        created.id,
        contentInputSchema.parse({
          ...articleInput(renamedSlug),
          type: "product",
          product: { status: "live" },
        }),
      ),
    ).rejects.toThrow("CONTENT_TYPE_IMMUTABLE");

    await store.updateContent(created.id, articleInput(renamedSlug));
    const replacement = await store.createContent(articleInput(originalSlug));
    expect(await store.getContentBySlug(originalSlug, "article")).toMatchObject(
      { id: replacement.id },
    );
    expect(await store.getRedirect("article", originalSlug)).toBeUndefined();

    await store.deleteContent(created.id);
    await store.deleteContent(replacement.id);
  });

  it("重复改名回到旧 slug 时不会创建重定向循环", async () => {
    const suffix = crypto.randomUUID().slice(0, 8);
    const slugA = `cycle-a-${suffix}`;
    const slugB = `cycle-b-${suffix}`;
    const slugC = `cycle-c-${suffix}`;
    const created = await store.createContent(articleInput(slugA));

    await store.updateContent(created.id, articleInput(slugB));
    await store.updateContent(created.id, articleInput(slugC));
    await store.updateContent(created.id, articleInput(slugA));

    expect(await store.getRedirect("article", slugA)).toBeUndefined();
    expect(await store.getRedirect("article", slugB)).toBe(slugA);
    expect(await store.getRedirect("article", slugC)).toBe(slugA);

    await store.deleteContent(created.id);
  });
});
