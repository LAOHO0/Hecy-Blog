import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedContent } from "@/lib/content";

export const metadata: Metadata = {
  title: "文章",
  description: "Hecy Blog 的文章与开发记录。",
};

export default async function BlogPage() {
  const posts = await getPublishedContent("article");
  const grouped = new Map<string, typeof posts>();
  for (const post of posts) {
    const year = new Date(post.publishedAt || post.createdAt)
      .getFullYear()
      .toString();
    grouped.set(year, [...(grouped.get(year) || []), post]);
  }
  return (
    <section className="archive">
      <div className="eyebrow">Hecy Blog / 文章</div>
      <h1>文章</h1>
      <p>记录设计、工程和把想法变成作品的过程。</p>
      <div className="archive-list">
        {Array.from(grouped.entries())
          .sort((a, b) => b[0].localeCompare(a[0]))
          .map(([year, items]) => (
            <div key={year}>
              <div className="archive-year">{year}</div>
              {items.map((item) => (
                <Link
                  className="archive-item"
                  href={`/blog/${item.slug}`}
                  key={item.id}
                >
                  <span className="data-font">
                    {new Date(item.publishedAt || item.createdAt)
                      .toISOString()
                      .slice(5, 10)
                      .replace("-", ".")}
                  </span>
                  <span>
                    <h2>{item.title}</h2>
                    <p>{item.excerpt}</p>
                  </span>
                  <span className="archive-arrow">→</span>
                </Link>
              ))}
            </div>
          ))}
      </div>
    </section>
  );
}
