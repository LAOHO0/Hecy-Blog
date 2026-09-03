import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MarkdownContent } from "@/components/markdown-content";
import { StaticRedirect } from "@/components/static-redirect";
import {
  getPublishedContent,
  getPublishedRedirects,
  getPublishedRoute,
} from "@/lib/content";

export async function generateStaticParams() {
  const posts = await getPublishedContent("article");
  const redirects = await getPublishedRedirects("article");
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
      <div className="eyebrow">文章 · {post.lang}</div>
      <h1>{post.title}</h1>
      <p className="article-excerpt">{post.excerpt}</p>
      {post.coverUrl ? (
        // biome-ignore lint/performance/noImgElement: content authors may host images on arbitrary approved HTTP(S) origins.
        <img alt="" className="article-cover" src={post.coverUrl} />
      ) : null}
      <div className="article-meta">
        <span>
          {new Date(post.publishedAt || post.createdAt).toLocaleDateString(
            "zh-CN",
          )}
        </span>
        {post.tags.map((tag) => (
          <span className="tag" key={tag}>
            {tag}
          </span>
        ))}
      </div>
      <MarkdownContent source={post.body} />
    </article>
  );
}
