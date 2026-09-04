import type { ContentRecord, SiteSettings } from "@hecy/content/types";
import Link from "next/link";
import {
  ArrowUpRightIcon,
  BoxIcon,
  BrandIcon,
  ProductIconForSlug,
} from "./icons";
import { SiteAvatar } from "./site-avatar";
import { WordRotate } from "./word-rotate";

type HomeSectionsProps = {
  settings: SiteSettings;
  articles: ContentRecord[];
  products: ContentRecord[];
};

const SKILLS = [
  ["Vue", "vue"],
  ["Vite", "vite"],
  ["React", "react"],
  ["Next.js", "next"],
  ["TypeScript", "ts"],
  ["Bun", "bun"],
  ["Node.js", "node"],
  ["Docker", "docker"],
  ["Python", "python"],
] as const;

function formatDate(value?: string) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "----.--.--";
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map((part, index) =>
      index === 0 ? String(part) : String(part).padStart(2, "0"),
    )
    .join(".");
}

function ProductMark({ item }: { item: ContentRecord }) {
  return (
    <span aria-hidden="true" className={`product-icon ${item.slug}`}>
      <ProductIconForSlug slug={item.slug} />
    </span>
  );
}

function HomeProductCard({ item }: { item: ContentRecord }) {
  const status =
    item.product?.status === "beta"
      ? "测试中"
      : item.product?.status === "paused"
        ? "已暂停"
        : "已上线";
  return (
    <Link className="product-card" href={`/products/${item.slug}`}>
      <div className="product-card-header">
        <div>
          <ProductMark item={item} />
          <h3 className="product-name">{item.title}</h3>
        </div>
        <span
          className={`product-status${item.product?.status === "beta" ? " beta" : ""}`}
        >
          {status}
        </span>
      </div>
      <p className="product-tagline">{item.excerpt}</p>
      <span aria-hidden="true" className="arrow-link">
        <ArrowUpRightIcon />
      </span>
    </Link>
  );
}

export function HomeSections({
  settings,
  articles,
  products,
}: HomeSectionsProps) {
  const firstProduct = products[0];

  return (
    <div className="home-page">
      <section className="home-hero" aria-labelledby="home-title">
        <p className="home-greeting">
          你好，这里是 <strong>Hecy</strong> / <strong>Hecy Blog</strong>
        </p>
        <SiteAvatar src={settings.avatarUrl || "/imgs/avatar.webp"} />
        <h1 className="home-title" id="home-title">
          <span className="home-title-reveal">
            只有你也想见我的时候，我们的相遇才有意义。
          </span>
        </h1>
        <div className="home-actions">
          <Link className="button button-primary" href="/blog">
            阅读博客
            <ArrowUpRightIcon />
          </Link>
          <Link className="button button-outline" href="/products">
            查看产品
            <BoxIcon />
          </Link>
        </div>
      </section>

      <section
        className="about-section"
        id="about"
        aria-labelledby="about-title"
      >
        <div className="about-left">
          <p className="section-kicker">关于我</p>
          <div className="about-profile">
            <span className="about-profile-role">前端工程师</span>
            <span className="about-profile-place">HangZhou</span>
          </div>
          <div className="skill-heading">
            <span>Skills</span>
          </div>
          <div className="skill-list">
            {SKILLS.map(([name, tone]) => (
              <span className="skill-badge" key={name}>
                <span aria-hidden="true" className={`skill-icon ${tone}`}>
                  <BrandIcon name={name} />
                </span>
                <span>{name}</span>
              </span>
            ))}
          </div>
        </div>

        <div className="about-right">
          <div className="now-heading">
            <div>
              <p className="section-kicker">Now</p>
              <h2 className="now-title" id="about-title">
                最近在做什么
              </h2>
            </div>
          </div>
          <div className="timeline">
            <div className="timeline-item">
              <span className="timeline-label">01 / Build</span>
              <p className="timeline-copy">
                构建一个和 AI 融合的
                {firstProduct ? (
                  <Link
                    className="inline-link"
                    href={`/products/${firstProduct.slug}`}
                  >
                    {firstProduct.title} <ArrowUpRightIcon />
                  </Link>
                ) : (
                  "内容系统"
                )}
              </p>
            </div>
            <div className="timeline-item">
              <span className="timeline-label">02 / Write</span>
              <p className="timeline-copy">持续整理个人产品与工程笔记。</p>
            </div>
            <div className="timeline-item">
              <span className="timeline-label">03 / Study</span>
              <p className="timeline-copy">学习AI+产品设计+开发</p>
            </div>
            <div className="timeline-item">
              <span className="timeline-label">04 / Train</span>
              <p className="timeline-copy">
                健身，练出硕大的肌肉💪，保持长期主义。
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="home-blog-section" aria-labelledby="blog-heading">
        <div>
          <p className="section-kicker">博客</p>
          <h2 className="home-section-title" id="blog-heading">
            写点东西，记录
            <WordRotate words={["当下", "自己"]} />
          </h2>
        </div>
        <div className="home-blog-list">
          {articles.length ? (
            articles.slice(0, 2).map((article) => (
              <Link
                className="home-blog-card"
                href={`/blog/${article.slug}`}
                key={article.id}
              >
                <span className="home-blog-date">
                  {formatDate(article.publishedAt || article.createdAt)}
                </span>
                <span className="home-blog-copy">
                  <h3>{article.title}</h3>
                  <p>{article.excerpt}</p>
                </span>
                <span aria-hidden="true" className="arrow-link">
                  <ArrowUpRightIcon />
                </span>
              </Link>
            ))
          ) : (
            <p className="timeline-copy">还没有发布文章。</p>
          )}
          <Link className="button button-link home-more" href="/blog">
            查看更多 <ArrowUpRightIcon />
          </Link>
        </div>
      </section>

      <section
        className="home-product-section"
        aria-labelledby="product-heading"
      >
        <div className="home-product-header">
          <div>
            <p className="section-kicker">产品</p>
            <h2 className="home-section-title" id="product-heading">
              正在构建的东西
            </h2>
          </div>
          <div className="home-product-links">
            <Link className="button button-link" href="/products">
              全部 <ArrowUpRightIcon />
            </Link>
          </div>
        </div>
        <div className="home-product-grid">
          {products.length ? (
            products
              .slice(0, 3)
              .map((item) => <HomeProductCard item={item} key={item.id} />)
          ) : (
            <p className="timeline-copy">还没有发布产品。</p>
          )}
        </div>
      </section>
    </div>
  );
}
