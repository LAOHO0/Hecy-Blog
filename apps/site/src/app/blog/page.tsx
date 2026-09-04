import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRightIcon } from "@/components/icons";
import { SiteAvatar } from "@/components/site-avatar";
import { getPublishedContent } from "@/lib/content";
import { formatDisplayDate, sortByPublishedDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "博客",
  description: "Hecy Blog 的文章与开发记录。",
};

export default async function BlogPage() {
  const posts = sortByPublishedDate(await getPublishedContent("article"));
  const grouped = new Map<string, typeof posts>();

  for (const post of posts) {
    const date = new Date(post.publishedAt || post.createdAt);
    const year = Number.isNaN(date.getTime())
      ? "----"
      : String(date.getFullYear());
    const group = grouped.get(year) || [];
    group.push(post);
    grouped.set(year, group);
  }

  return (
    <section className="archive-page">
      <header className="archive-hero">
        <div>
          <p className="archive-kicker">Blog Archive</p>
          <h1 className="archive-title">写点东西，记录当下，记录自己</h1>
          <p className="archive-subline">{posts.length} 篇文章 · 持续更新</p>
        </div>
        <SiteAvatar />
      </header>

      <div className="archive-list">
        {Array.from(grouped.entries()).map(([year, items], sectionIndex) => (
          <section
            className="archive-year-section"
            key={year}
            style={{ animationDelay: `${140 + sectionIndex * 80}ms` }}
          >
            <div>
              <h2 className="archive-year">{year}</h2>
              <span aria-hidden="true" className="archive-year-rule" />
            </div>
            <div className="archive-items">
              {items.map((post, postIndex) => (
                <Link
                  className="archive-card"
                  href={`/blog/${post.slug}`}
                  key={post.id}
                  style={{
                    animationDelay: `${180 + sectionIndex * 80 + postIndex * 45}ms`,
                  }}
                >
                  <h2>{post.title}</h2>
                  <p>{post.excerpt}</p>
                  <div className="archive-card-meta">
                    <time
                      className="meta-badge"
                      dateTime={post.publishedAt || post.createdAt}
                    >
                      {formatDisplayDate(post.publishedAt || post.createdAt)}
                    </time>
                    {post.tags.slice(0, 3).map((tag) => (
                      <span className="meta-badge" key={tag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                  <span aria-hidden="true" className="archive-card-arrow">
                    <ArrowUpRightIcon />
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ))}
        {!posts.length ? (
          <p className="timeline-copy">还没有发布文章，去后台写下第一篇吧。</p>
        ) : null}
      </div>
    </section>
  );
}
