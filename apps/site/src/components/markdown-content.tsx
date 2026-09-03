import { markdownBlockIdentity, parseMarkdown } from "@hecy/content/markdown";

export function MarkdownContent({ source }: { source: string }) {
  return (
    <div className="markdown-content">
      {(() => {
        const occurrences = new Map<string, number>();
        return parseMarkdown(source).map((block) => {
          const identity = markdownBlockIdentity(block);
          const occurrence = occurrences.get(identity) ?? 0;
          occurrences.set(identity, occurrence + 1);
          const key = `${identity}:${occurrence}`;
          if (block.type === "heading") {
            const Tag = `h${block.level}` as "h1" | "h2" | "h3";
            return <Tag key={key}>{block.text}</Tag>;
          }
          if (block.type === "code")
            return (
              <pre key={key}>
                <code>{block.text}</code>
              </pre>
            );
          if (block.type === "quote")
            return <blockquote key={key}>{block.text}</blockquote>;
          if (block.type === "list")
            return (
              <ul key={key}>
                {block.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            );
          return <p key={key}>{block.text}</p>;
        });
      })()}
    </div>
  );
}
