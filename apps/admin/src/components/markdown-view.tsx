import type { MarkdownBlock } from "@hecy/content/markdown";
import { markdownBlockIdentity, parseMarkdown } from "@hecy/content/markdown";

export function MarkdownView({ source }: { source: string }) {
  const occurrences = new Map<string, number>();
  return (
    <div className="markdown-view">
      {parseMarkdown(source).map((block) => {
        const identity = markdownBlockIdentity(block);
        const occurrence = occurrences.get(identity) ?? 0;
        occurrences.set(identity, occurrence + 1);
        return <Block key={`${identity}:${occurrence}`} block={block} />;
      })}
    </div>
  );
}

function Block({ block }: { block: MarkdownBlock }) {
  if (block.type === "heading") {
    const Tag = `h${block.level}` as "h1" | "h2" | "h3";
    return <Tag>{block.text}</Tag>;
  }
  if (block.type === "code") {
    return (
      <pre>
        <code>{block.text}</code>
      </pre>
    );
  }
  if (block.type === "quote") return <blockquote>{block.text}</blockquote>;
  if (block.type === "list") {
    return (
      <ul>
        {block.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    );
  }
  return <p>{block.text}</p>;
}
