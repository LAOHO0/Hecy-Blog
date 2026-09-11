import { describe, expect, it } from "vitest";
import {
  markdownBlockIdentity,
  parseInline,
  parseMarkdown,
  safeMarkdownUrl,
} from "./markdown";

describe("parseInline", () => {
  it("parses emphasis, strike, code, links and images", () => {
    const tokens = parseInline(
      "**加粗** 和 *斜体* 与 ~~删除~~ 以及 `code` 与 [链接](https://example.com) ![图](https://cdn.example.com/a.png)",
    );
    expect(tokens).toEqual([
      { kind: "strong", value: "加粗" },
      { kind: "text", value: " 和 " },
      { kind: "emphasis", value: "斜体" },
      { kind: "text", value: " 与 " },
      { kind: "strike", value: "删除" },
      { kind: "text", value: " 以及 " },
      { kind: "code", value: "code" },
      { kind: "text", value: " 与 " },
      { kind: "link", value: "链接", href: "https://example.com" },
      { kind: "text", value: " " },
      { kind: "image", alt: "图", url: "https://cdn.example.com/a.png" },
    ]);
  });

  it("renders unsafe link protocols as plain text", () => {
    const source = "[点我](javascript:alert(1))";
    const tokens = parseInline(source);
    expect(tokens.some((token) => token.kind === "link")).toBe(false);
    expect(
      tokens.map((token) => ("value" in token ? token.value : "")).join(""),
    ).toBe(source);
  });

  it("keeps unmatched syntax as plain text", () => {
    expect(parseInline("这是 ** 没有成对的星号")).toEqual([
      { kind: "text", value: "这是 ** 没有成对的星号" },
    ]);
  });
});

describe("safeMarkdownUrl", () => {
  it("allows http(s), relative paths and anchors", () => {
    expect(safeMarkdownUrl("https://example.com")).toBe("https://example.com");
    expect(safeMarkdownUrl("/blog/hello")).toBe("/blog/hello");
    expect(safeMarkdownUrl("#section")).toBe("#section");
    expect(safeMarkdownUrl("javascript:alert(1)")).toBeUndefined();
    expect(safeMarkdownUrl("//evil.example")).toBeUndefined();
  });
});

describe("parseMarkdown tables", () => {
  it("parses a table with alignment", () => {
    const blocks = parseMarkdown(
      "| 左 | 中 | 右 |\n| --- | :---: | ---: |\n| a | **b** | c |",
    );
    expect(blocks).toHaveLength(1);
    const table = blocks[0];
    if (table.type !== "table") throw new Error("expected table");
    expect(table.align).toEqual(["left", "center", "right"]);
    expect(table.header.map((cell) => cell[0])).toMatchObject([
      { kind: "text", value: "左" },
      { kind: "text", value: "中" },
      { kind: "text", value: "右" },
    ]);
    expect(table.rows[0][1]).toMatchObject([{ kind: "strong", value: "b" }]);
  });

  it("does not treat separator-looking rows without a header as tables", () => {
    const blocks = parseMarkdown("| --- | --- |");
    expect(blocks[0]).toMatchObject({ type: "paragraph" });
  });
});

describe("parseMarkdown hard breaks", () => {
  it("keeps two-space line endings as breaks and folds soft wraps", () => {
    const blocks = parseMarkdown("第一行  \n第二行\n继续");
    if (blocks[0].type !== "paragraph") throw new Error("expected paragraph");
    expect(blocks[0].inline).toEqual([
      { kind: "text", value: "第一行" },
      { kind: "break" },
      { kind: "text", value: "第二行" },
      { kind: "text", value: " " },
      { kind: "text", value: "继续" },
    ]);
  });
});

describe("markdownBlockIdentity", () => {
  it("distinguishes blocks with different inline tokens", () => {
    const [a] = parseMarkdown("**加粗**");
    const [b] = parseMarkdown("加粗");
    expect(markdownBlockIdentity(a)).not.toBe(markdownBlockIdentity(b));
    const [c] = parseMarkdown("加粗");
    expect(markdownBlockIdentity(b)).toBe(markdownBlockIdentity(c));
  });
});

describe("image size suffix", () => {
  it("parses =宽x高 and =宽 size suffixes", () => {
    const [both] = parseInline("![图](https://a.com/x.png =480x300)");
    expect(both).toEqual({
      kind: "image",
      alt: "图",
      url: "https://a.com/x.png",
      width: 480,
      height: 300,
    });
    const [widthOnly] = parseInline("![图](https://a.com/x.png =480x)");
    expect(widthOnly).toMatchObject({ width: 480, height: undefined });
    const [none] = parseInline("![图](https://a.com/x.png)");
    expect(none).toMatchObject({ width: undefined, height: undefined });
  });

  it("never renders an image token for unsafe urls with size suffix", () => {
    const tokens = parseInline("![图](javascript:alert(1) =480x)");
    expect(tokens.some((t) => t.kind === "image")).toBe(false);
  });
});

describe("align containers", () => {
  it("parses ::: center block into centered paragraph", () => {
    const blocks = parseMarkdown("::: center\n**居中的文字**\n:::");
    expect(blocks).toEqual([
      {
        type: "paragraph",
        inline: [{ kind: "strong", value: "居中的文字" }],
        align: "center",
      },
    ]);
  });

  it("parses ::: right block", () => {
    const blocks = parseMarkdown("::: right\n右对齐\n:::");
    expect(blocks[0]).toMatchObject({ type: "paragraph", align: "right" });
  });

  it("drops stray ::: closer", () => {
    const blocks = parseMarkdown("普通段落\n:::");
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toMatchObject({ type: "paragraph" });
  });
});

describe("ordered list and hr", () => {
  it("parses 1. 1、 1) as ordered list items", () => {
    const blocks = parseMarkdown("1. 第一\n2、第二\n3) 第三");
    expect(blocks).toEqual([
      {
        type: "list",
        items: [
          [{ kind: "text", value: "第一" }],
          [{ kind: "text", value: "第二" }],
          [{ kind: "text", value: "第三" }],
        ],
        ordered: true,
      },
    ]);
  });

  it("keeps unordered list without ordered flag", () => {
    const blocks = parseMarkdown("- 甲\n- 乙");
    expect(blocks[0]).not.toHaveProperty("ordered");
  });

  it("parses standalone --- as hr", () => {
    expect(parseMarkdown("上\n\n---\n\n下")).toEqual([
      { type: "paragraph", inline: [{ kind: "text", value: "上" }] },
      { type: "hr" },
      { type: "paragraph", inline: [{ kind: "text", value: "下" }] },
    ]);
  });
});
