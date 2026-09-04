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
