import type { MarkdownInline } from "@hecy/content/markdown";
import Link from "next/link";

/** 把内联 token 渲染为 React 元素；外链新窗口打开。 */
export function InlineNodes({ tokens }: { tokens: MarkdownInline[] }) {
  return (
    <>
      {tokens.map((token, index) => {
        const key = `${token.kind}-${index}`;
        switch (token.kind) {
          case "code":
            return <code key={key}>{token.value}</code>;
          case "strong":
            return <strong key={key}>{token.value}</strong>;
          case "emphasis":
            return <em key={key}>{token.value}</em>;
          case "strike":
            return <del key={key}>{token.value}</del>;
          case "break":
            return <br key={key} />;
          case "link":
            return token.href.startsWith("http") ? (
              <a
                key={key}
                href={token.href}
                rel="noreferrer noopener"
                target="_blank"
              >
                {token.value}
              </a>
            ) : (
              <Link key={key} href={token.href}>
                {token.value}
              </Link>
            );
          case "image":
            return (
              <img key={key} alt={token.alt} loading="lazy" src={token.url} />
            );
          default:
            return <span key={key}>{token.value}</span>;
        }
      })}
    </>
  );
}
