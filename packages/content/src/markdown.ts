export type MarkdownInline =
  | { kind: "text"; value: string }
  | { kind: "code"; value: string }
  | { kind: "strong"; value: string }
  | { kind: "emphasis"; value: string }
  | { kind: "strike"; value: string }
  | { kind: "link"; value: string; href: string }
  | { kind: "image"; alt: string; url: string }
  | { kind: "break" };

export type TableAlign = "left" | "center" | "right";

export type MarkdownBlock =
  | { type: "heading"; level: 1 | 2 | 3; inline: MarkdownInline[] }
  | { type: "paragraph"; inline: MarkdownInline[] }
  | { type: "code"; language: string; text: string }
  | { type: "quote"; inline: MarkdownInline[] }
  | { type: "list"; items: MarkdownInline[][] }
  | {
      type: "table";
      align: TableAlign[];
      header: MarkdownInline[][];
      rows: MarkdownInline[][][];
    };

/**
 * 链接和图片地址只允许 http(s)、站内路径和锚点；不合法时返回 undefined，
 * 调用方应把整段语法按普通文本渲染，避免注入 javascript: 等协议。
 */
export function safeMarkdownUrl(url: string): string | undefined {
  if (url.startsWith("/") || url.startsWith("#")) {
    return url.startsWith("//") ? undefined : url;
  }
  try {
    return ["http:", "https:"].includes(new URL(url).protocol)
      ? url
      : undefined;
  } catch {
    return undefined;
  }
}

const INLINE_PATTERN =
  /(`[^`]+`)|(!\[[^\]]*\]\([^)\s]*\))|(\[[^\]]+\]\([^)\s]*\))|(\*\*[^*]+\*\*)|(\*[^*\s][^*]*\*)|(~~[^~]+~~)/g;

/** 行内语法解析：代码、图片、链接、加粗、斜体、删除线；不支持的写法按普通文本输出。 */
export function parseInline(source: string): MarkdownInline[] {
  const tokens: MarkdownInline[] = [];
  let last = 0;
  for (const match of source.matchAll(INLINE_PATTERN)) {
    const index = match.index ?? 0;
    const raw = match[0];
    if (index > last) {
      tokens.push({ kind: "text", value: source.slice(last, index) });
    }
    if (raw.startsWith("`")) {
      tokens.push({ kind: "code", value: raw.slice(1, -1) });
    } else if (raw.startsWith("![") || raw.startsWith("[")) {
      const isImage = raw.startsWith("![");
      const label = raw.slice(isImage ? 2 : 1, raw.indexOf("]"));
      const url = safeMarkdownUrl(raw.slice(raw.indexOf("](") + 2, -1));
      if (!url) {
        tokens.push({ kind: "text", value: raw });
      } else if (isImage) {
        tokens.push({ kind: "image", alt: label, url });
      } else {
        tokens.push({ kind: "link", value: label, href: url });
      }
    } else if (raw.startsWith("**")) {
      tokens.push({ kind: "strong", value: raw.slice(2, -2) });
    } else if (raw.startsWith("~~")) {
      tokens.push({ kind: "strike", value: raw.slice(2, -2) });
    } else {
      tokens.push({ kind: "emphasis", value: raw.slice(1, -1) });
    }
    last = index + raw.length;
  }
  if (last < source.length) {
    tokens.push({ kind: "text", value: source.slice(last) });
  }
  return tokens;
}

/**
 * Returns a deterministic identity for a rendered Markdown block.
 * Consumers can append an occurrence count when the same block appears more
 * than once in a document.
 */
export function markdownBlockIdentity(block: MarkdownBlock): string {
  return JSON.stringify(block);
}

function splitTableRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function isTableSeparator(line: string): boolean {
  return /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(line);
}

function parseAligns(separator: string): TableAlign[] {
  return splitTableRow(separator).map((cell) => {
    const left = cell.startsWith(":");
    const right = cell.endsWith(":");
    if (left && right) return "center";
    if (right) return "right";
    return "left";
  });
}

type ParagraphLine = { text: string; hardBreak: boolean };

function paragraphInline(lines: ParagraphLine[]): MarkdownInline[] {
  const tokens: MarkdownInline[] = [];
  lines.forEach((line, index) => {
    if (index > 0) {
      // 上一行行尾两个以上空格表示强制换行，否则软换行折叠为一个空格。
      tokens.push(
        lines[index - 1].hardBreak
          ? { kind: "break" }
          : { kind: "text", value: " " },
      );
    }
    tokens.push(...parseInline(line.text));
  });
  return tokens;
}

export function parseMarkdown(source: string): MarkdownBlock[] {
  const lines = source.replaceAll("\r\n", "\n").split("\n");
  const blocks: MarkdownBlock[] = [];
  let paragraph: ParagraphLine[] = [];
  let code: string[] | null = null;
  let language = "";
  let fence: "~~~" | "```" | null = null;

  const flushParagraph = () => {
    if (!paragraph.length) return;
    const tokens = paragraphInline(paragraph);
    if (tokens.length) blocks.push({ type: "paragraph", inline: tokens });
    paragraph = [];
  };

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const lineFence = line.startsWith("~~~")
      ? "~~~"
      : line.startsWith("```")
        ? "```"
        : null;
    if (lineFence && (!code || lineFence === fence)) {
      if (code) {
        blocks.push({ type: "code", language, text: code.join("\n") });
        code = null;
        language = "";
        fence = null;
      } else {
        flushParagraph();
        code = [];
        fence = lineFence;
        language = line.slice(3).trim();
      }
      continue;
    }
    if (code) {
      code.push(line);
      continue;
    }
    if (
      line.includes("|") &&
      i + 1 < lines.length &&
      isTableSeparator(lines[i + 1])
    ) {
      flushParagraph();
      const header = splitTableRow(line);
      const aligns = parseAligns(lines[i + 1]);
      const rows: MarkdownInline[][][] = [];
      let cursor = i + 2;
      while (cursor < lines.length && lines[cursor].includes("|")) {
        const cells = splitTableRow(lines[cursor]);
        rows.push(cells.map((cell) => parseInline(cell)));
        cursor += 1;
      }
      blocks.push({
        type: "table",
        align: aligns,
        header: header.map((cell) => parseInline(cell)),
        rows,
      });
      i = cursor - 1;
      continue;
    }
    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading) {
      flushParagraph();
      blocks.push({
        type: "heading",
        level: heading[1].length as 1 | 2 | 3,
        inline: parseInline(heading[2].trim()),
      });
      continue;
    }
    if (line.startsWith(">")) {
      flushParagraph();
      blocks.push({
        type: "quote",
        inline: parseInline(line.replace(/^>\s?/, "").trim()),
      });
      continue;
    }
    if (/^[-*]\s+/.test(line)) {
      flushParagraph();
      const item = line.replace(/^[-*]\s+/, "").trim();
      const lastBlock = blocks.at(-1);
      if (lastBlock?.type === "list") lastBlock.items.push(parseInline(item));
      else blocks.push({ type: "list", items: [parseInline(item)] });
      continue;
    }
    if (!line.trim()) {
      flushParagraph();
      continue;
    }
    paragraph.push({ text: line.trim(), hardBreak: /\s{2,}$/.test(line) });
  }

  flushParagraph();
  if (code) blocks.push({ type: "code", language, text: code.join("\n") });
  return blocks;
}
