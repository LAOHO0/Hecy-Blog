import { parseMarkdown } from "@hecy/content/markdown";
import { seedContent } from "@hecy/content/seed";
import { contentInputSchema } from "@hecy/content/validation";
import { describe, expect, it } from "vitest";

describe("Markdown 内容解析", () => {
  it("支持标题、段落、列表、引用和代码块", () => {
    const blocks = parseMarkdown(
      "# 标题\r\n\r\n正文第一行\r\n正文第二行\r\n\r\n- 一\r\n- 二\r\n\r\n> 提示\r\n\r\n~~~ts\r\nconst answer = 42;\r\n~~~",
    );

    expect(blocks).toEqual([
      { type: "heading", level: 1, text: "标题" },
      { type: "paragraph", text: "正文第一行 正文第二行" },
      { type: "list", items: ["一", "二"] },
      { type: "quote", text: "提示" },
      { type: "code", language: "ts", text: "const answer = 42;" },
    ]);
  });

  it("也支持常见的反引号代码围栏", () => {
    expect(parseMarkdown("```js\nconst ok = true;\n```")).toEqual([
      { type: "code", language: "js", text: "const ok = true;" },
    ]);
  });
});

describe("内容输入校验", () => {
  it("会清理 slug 和重复标签", () => {
    const value = contentInputSchema.parse({
      type: "article",
      slug: "  hello-world  ",
      title: "  一篇文章  ",
      tags: ["工程化", " 工程化 "],
      seo: { keywords: [] },
    });

    expect(value.slug).toBe("hello-world");
    expect(value.title).toBe("一篇文章");
    expect(value.tags).toEqual(["工程化"]);
  });

  it("要求产品和项目提供类型专属字段", () => {
    expect(() =>
      contentInputSchema.parse({
        type: "product",
        slug: "missing-fields",
        title: "缺少字段",
      }),
    ).toThrow();
    expect(() =>
      contentInputSchema.parse({
        type: "project",
        slug: "missing-fields",
        title: "缺少字段",
      }),
    ).toThrow();
  });
});

describe("迁移种子", () => {
  it("使用可写入 PostgreSQL uuid 字段的稳定 ID", () => {
    expect(seedContent).toHaveLength(16);
    expect(
      seedContent.every((item) =>
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          item.id,
        ),
      ),
    ).toBe(true);
  });

  it("在每个内容类型内保持 slug 唯一", () => {
    const keys = seedContent.map((item) => `${item.type}:${item.slug}`);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
