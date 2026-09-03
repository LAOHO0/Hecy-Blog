import type { ContentRecord } from "@hecy/content/types";
import Link from "next/link";
import { MarkdownContent } from "./markdown-content";

export function ShowcaseIndex({
  items,
  title,
  intro,
  type,
}: {
  items: ContentRecord[];
  title: string;
  intro: string;
  type: "product" | "project";
}) {
  return (
    <section className="archive">
      <div className="eyebrow">Hecy Blog / {title}</div>
      <h1>{title}</h1>
      <p>{intro}</p>
      <div className="card-grid">
        {items.map((item) => (
          <Link
            className="content-card"
            href={`/${type === "product" ? "products" : "projects"}/${item.slug}`}
            key={item.id}
          >
            <div className="card-top">
              <span className="card-mark">
                {type === "product" ? "P" : "R"}
              </span>
              <span className="card-type">
                {type === "product" ? "产品" : "项目"}
              </span>
            </div>
            <h3>{item.title}</h3>
            <p>{item.excerpt}</p>
            <div className="card-bottom">
              <span className="tag-row">
                {item.tags.slice(0, 2).map((tag) => (
                  <span className="tag" key={tag}>
                    {tag}
                  </span>
                ))}
              </span>
              <span>→</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function ShowcaseDetail({
  item,
  type,
}: {
  item: ContentRecord;
  type: "product" | "project";
}) {
  return (
    <article className="article-page">
      <div className="eyebrow">
        {type === "product" ? "产品" : "项目"} · {item.lang}
      </div>
      <h1>{item.title}</h1>
      <p className="article-excerpt">{item.excerpt}</p>
      {item.coverUrl ? (
        // biome-ignore lint/performance/noImgElement: content authors may host images on arbitrary approved HTTP(S) origins.
        <img alt="" className="article-cover" src={item.coverUrl} />
      ) : null}
      <div className="showcase-facts">
        {type === "product" && item.product ? (
          <>
            <span>
              <small>状态</small>
              {item.product.status === "live"
                ? "在线"
                : item.product.status === "beta"
                  ? "测试中"
                  : "暂停"}
            </span>
            <span>
              <small>平台</small>
              {item.product.platform || "—"}
            </span>
            {item.product.price ? (
              <span>
                <small>价格</small>
                {item.product.price}
              </span>
            ) : null}
            {item.product.url ? (
              <a href={item.product.url} target="_blank" rel="noreferrer">
                <small>链接</small>打开产品 ↗
              </a>
            ) : null}
          </>
        ) : null}
        {type === "project" && item.project ? (
          <>
            <span>
              <small>角色</small>
              {item.project.role || "—"}
            </span>
            <span>
              <small>周期</small>
              {item.project.period || "—"}
            </span>
            <span>
              <small>技术栈</small>
              {item.project.techStack.join(" · ") || "—"}
            </span>
            {item.project.repoUrl ? (
              <a href={item.project.repoUrl} target="_blank" rel="noreferrer">
                <small>仓库</small>查看代码 ↗
              </a>
            ) : null}
            {item.project.url ? (
              <a href={item.project.url} target="_blank" rel="noreferrer">
                <small>项目链接</small>打开项目 ↗
              </a>
            ) : null}
          </>
        ) : null}
      </div>
      <MarkdownContent source={item.body} />
    </article>
  );
}
