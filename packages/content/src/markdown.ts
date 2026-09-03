export type MarkdownBlock =
  | { type: "heading"; level: 1 | 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "code"; language: string; text: string }
  | { type: "quote"; text: string }
  | { type: "list"; items: string[] };

/**
 * Returns a deterministic identity for a rendered Markdown block.
 * Consumers can append an occurrence count when the same block appears more
 * than once in a document.
 */
export function markdownBlockIdentity(block: MarkdownBlock): string {
  switch (block.type) {
    case "heading":
      return `heading:${block.level}:${block.text}`;
    case "paragraph":
      return `paragraph:${block.text}`;
    case "code":
      return `code:${block.language}:${block.text}`;
    case "quote":
      return `quote:${block.text}`;
    case "list":
      return `list:${block.items.join("\u001f")}`;
  }
}

export function parseMarkdown(source: string): MarkdownBlock[] {
  const lines = source.replaceAll("\r\n", "\n").split("\n");
  const blocks: MarkdownBlock[] = [];
  let paragraph: string[] = [];
  let code: string[] | null = null;
  let language = "";
  let fence: "~~~" | "```" | null = null;

  const flushParagraph = () => {
    const text = paragraph.join(" ").trim();
    if (text) blocks.push({ type: "paragraph", text });
    paragraph = [];
  };

  for (const line of lines) {
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
    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading) {
      flushParagraph();
      blocks.push({
        type: "heading",
        level: heading[1].length as 1 | 2 | 3,
        text: heading[2].trim(),
      });
      continue;
    }
    if (line.startsWith(">")) {
      flushParagraph();
      blocks.push({ type: "quote", text: line.replace(/^>\s?/, "").trim() });
      continue;
    }
    if (/^[-*]\s+/.test(line)) {
      flushParagraph();
      const last = blocks.at(-1);
      const item = line.replace(/^[-*]\s+/, "").trim();
      if (last?.type === "list") last.items.push(item);
      else blocks.push({ type: "list", items: [item] });
      continue;
    }
    if (!line.trim()) {
      flushParagraph();
      continue;
    }
    paragraph.push(line.trim());
  }

  flushParagraph();
  if (code) blocks.push({ type: "code", language, text: code.join("\n") });
  return blocks;
}
