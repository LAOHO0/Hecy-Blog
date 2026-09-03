import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShowcaseDetail } from "@/components/showcase";
import { StaticRedirect } from "@/components/static-redirect";
import {
  getPublishedContent,
  getPublishedRedirects,
  getPublishedRoute,
} from "@/lib/content";

export async function generateStaticParams() {
  const [items, redirects] = await Promise.all([
    getPublishedContent("product"),
    getPublishedRedirects("product"),
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
  const route = await getPublishedRoute(slug, "product");
  if (route.redirectTo) {
    return {
      alternates: { canonical: `/products/${route.redirectTo}` },
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

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const route = await getPublishedRoute(slug, "product");
  if (route.redirectTo) {
    return <StaticRedirect to={`/products/${route.redirectTo}`} />;
  }
  const item = route.item;
  if (!item) notFound();
  return <ShowcaseDetail item={item} type="product" />;
}
