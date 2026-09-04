import { markdownBlockIdentity, parseMarkdown } from "@hecy/content/markdown";
import { InlineNodes } from "./markdown-inline";

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
          switch (block.type) {
            case "heading": {
              const Tag = `h${block.level}` as "h1" | "h2" | "h3";
              return (
                <Tag key={key}>
                  <InlineNodes tokens={block.inline} />
                </Tag>
              );
            }
            case "code":
              return (
                <pre key={key}>
                  <code>{block.text}</code>
                </pre>
              );
            case "quote":
              return (
                <blockquote key={key}>
                  <InlineNodes tokens={block.inline} />
                </blockquote>
              );
            case "list":
              return (
                <ul key={key}>
                  {block.items.map((item, index) => (
                    <li
                      // biome-ignore lint/suspicious/noArrayIndexKey: 静态渲染的派生内容，单元格内容可重复
                      key={`${key}-${index}`}
                    >
                      <InlineNodes tokens={item} />
                    </li>
                  ))}
                </ul>
              );
            case "table":
              return (
                <div className="markdown-table-wrap" key={key}>
                  <table>
                    <thead>
                      <tr>
                        {block.header.map((cell, index) => (
                          <th
                            // biome-ignore lint/suspicious/noArrayIndexKey: 静态渲染的派生内容，单元格内容可重复
                            key={`${key}-h-${index}`}
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
                          // biome-ignore lint/suspicious/noArrayIndexKey: 静态渲染的派生内容，单元格内容可重复
                          key={`${key}-r-${rowIndex}`}
                        >
                          {row.map((cell, cellIndex) => (
                            <td
                              // biome-ignore lint/suspicious/noArrayIndexKey: 静态渲染的派生内容，单元格内容可重复
                              key={`${key}-r-${rowIndex}-c-${cellIndex}`}
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
            default:
              return (
                <p key={key}>
                  <InlineNodes tokens={block.inline} />
                </p>
              );
          }
        });
      })()}
    </div>
  );
}
