import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShowcaseDetail } from "@/components/showcase";
import { StaticRedirect } from "@/components/static-redirect";
import {
  getPublishedContent,
  getPublishedRedirects,
  getPublishedRoute,
} from "@/lib/content";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  // 服务端渲染（默认）模式不预渲染详情页：内容按请求实时生成；
  // 仅静态导出（STATIC_EXPORT=true）时预取 slug 列表。
  if (process.env.STATIC_EXPORT !== "true") return [];
  const [items, redirects] = await Promise.all([
    getPublishedContent("project"),
    getPublishedRedirects("project"),
  ]);
  return [
    ...items.map((item) => ({ slug: item.slug })),
    ...redirects.map((redirect) => ({ slug: redirect.fromSlug })),
  ];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const route = await getPublishedRoute(slug, "project");
  if (route.redirectTo) {
    return {
      alternates: { canonical: `/projects/${route.redirectTo}` },
      robots: { index: false, follow: false },
    };
  }
  const item = route.item;
  return item
    ? {
        title: item.seo.title || item.title,
        description: item.seo.description || item.excerpt,
        keywords: item.seo.keywords,
        alternates: item.seo.canonicalUrl
          ? { canonical: item.seo.canonicalUrl }
          : undefined,
        openGraph: {
          title: item.seo.title || item.title,
          description: item.seo.description || item.excerpt,
          images: item.seo.ogImageUrl ? [item.seo.ogImageUrl] : undefined,
        },
      }
    : {};
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const route = await getPublishedRoute(slug, "project");
  if (route.redirectTo) {
    return <StaticRedirect to={`/projects/${route.redirectTo}`} />;
  }
  const item = route.item;
  if (!item) notFound();
  return <ShowcaseDetail item={item} type="project" />;
}
