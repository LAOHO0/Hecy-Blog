import type { MarkdownBlock } from "@hecy/content/markdown";
import { markdownBlockIdentity, parseMarkdown } from "@hecy/content/markdown";
import { InlineNodes } from "./markdown-inline";

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
    return (
      <Tag>
        <InlineNodes tokens={block.inline} />
      </Tag>
    );
  }
  if (block.type === "code") {
    return (
      <pre>
        <code>{block.text}</code>
      </pre>
    );
  }
  if (block.type === "quote") {
    return (
      <blockquote>
        <InlineNodes tokens={block.inline} />
      </blockquote>
    );
  }
  if (block.type === "list") {
    return (
      <ul>
        {block.items.map((item, index) => (
          <li
            // biome-ignore lint/suspicious/noArrayIndexKey: 预览的派生内容，单元格内容可重复
            key={index}
          >
            <InlineNodes tokens={item} />
          </li>
        ))}
      </ul>
    );
  }
  if (block.type === "table") {
    return (
      <div className="markdown-table-wrap">
        <table>
          <thead>
            <tr>
              {block.header.map((cell, index) => (
                <th
                  // biome-ignore lint/suspicious/noArrayIndexKey: 预览的派生内容，单元格内容可重复
                  key={index}
                  style={{ textAlign: block.align[index] }}
                >
                  <InlineNodes tokens={cell} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, rowIndex) => (
              <tr
                // biome-ignore lint/suspicious/noArrayIndexKey: 预览的派生内容，单元格内容可重复
                key={rowIndex}
              >
                {row.map((cell, cellIndex) => (
                  <td
                    // biome-ignore lint/suspicious/noArrayIndexKey: 预览的派生内容，单元格内容可重复
                    key={cellIndex}
                    style={{ textAlign: block.align[cellIndex] }}
                  >
                    <InlineNodes tokens={cell} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  return (
    <p>
      <InlineNodes tokens={block.inline} />
    </p>
  );
}
