import type { ContentRecord } from "@hecy/content/types";
import Link from "next/link";

const labels = { article: "文章", product: "产品", project: "项目" } as const;

export function ContentCard({ item }: { item: ContentRecord }) {
  const mark =
    item.type === "article" ? "A" : item.type === "product" ? "P" : "R";
  const href =
    item.type === "article"
      ? `/blog/${item.slug}`
      : item.type === "product"
        ? `/products/${item.slug}`
        : `/projects/${item.slug}`;
  return (
    <Link className="content-card" href={href}>
      {item.coverUrl ? (
        // biome-ignore lint/performance/noImgElement: content authors may host images on arbitrary approved HTTP(S) origins.
        <img alt="" className="card-cover" src={item.coverUrl} />
      ) : null}
      <div className="card-top">
        <span className="card-mark">{mark}</span>
        <span className="card-type">{labels[item.type]}</span>
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
  );
}
