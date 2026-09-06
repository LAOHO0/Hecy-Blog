import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, ArrowUpRightIcon } from "@/components/icons";
import { MarkdownContent } from "@/components/markdown-content";
import { SiteAvatar } from "@/components/site-avatar";
import { StaticRedirect } from "@/components/static-redirect";
import {
  getPublishedContent,
  getPublishedRedirects,
  getPublishedRoute,
} from "@/lib/content";
import { formatDisplayDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  // 服务端渲染（默认）模式不预渲染详情页：内容按请求实时生成；
  // 仅静态导出（STATIC_EXPORT=true）时预取 slug 列表。
  if (process.env.STATIC_EXPORT !== "true") return [];
  const [posts, redirects] = await Promise.all([
    getPublishedContent("article"),
    getPublishedRedirects("article"),
  ]);
  return [
    ...posts.map((post) => ({ slug: post.slug })),
    ...redirects.map((redirect) => ({ slug: redirect.fromSlug })),
  ];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const route = await getPublishedRoute(slug, "article");
  if (route.redirectTo) {
    return {
      alternates: { canonical: `/blog/${route.redirectTo}` },
      robots: { index: false, follow: false },
    };
  }
  const post = route.item;
  if (!post) return {};
  return {
    title: post.seo.title || post.title,
    description: post.seo.description || post.excerpt,
    keywords: post.seo.keywords,
    alternates: post.seo.canonicalUrl
      ? { canonical: post.seo.canonicalUrl }
      : undefined,
    openGraph: {
      title: post.seo.title || post.title,
      description: post.seo.description || post.excerpt,
      images: post.seo.ogImageUrl ? [post.seo.ogImageUrl] : undefined,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const route = await getPublishedRoute(slug, "article");
  if (route.redirectTo) {
    return <StaticRedirect to={`/blog/${route.redirectTo}`} />;
  }
  const post = route.item;
  if (!post) notFound();

  return (
    <article className="article-page">
      <Link className="article-back" href="/blog">
        <ArrowLeftIcon />
        返回博客
      </Link>
      <header className="article-header">
        <div className="article-kicker">文章 · {post.lang}</div>
        <h1 className="article-title">{post.title}</h1>
        <p className="article-excerpt">{post.excerpt}</p>
        <div className="article-meta">
          <div className="meta-badge">
            <SiteAvatar className="article-avatar" />
            Hecy
          </div>
          <time
            className="meta-badge"
            dateTime={post.publishedAt || post.createdAt}
          >
            {formatDisplayDate(post.publishedAt || post.createdAt)}
          </time>
          {post.tags.map((tag) => (
            <span className="meta-badge" key={tag}>
              {tag}
            </span>
          ))}
        </div>
      </header>
      {post.coverUrl ? (
        // biome-ignore lint/performance/noImgElement: content authors may host images on approved remote origins.
        <img alt="" className="article-cover" src={post.coverUrl} />
      ) : null}
      <MarkdownContent source={post.body} />
      <footer className="article-footer">
        <Link className="article-back article-back-next" href="/blog">
          <span> &gt; CD ../</span>
          <span>
            BLOG INDEX <ArrowUpRightIcon />
          </span>
        </Link>
      </footer>
    </article>
  );
}
