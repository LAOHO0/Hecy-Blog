import { LATEST_PRODUCT_LINK } from "@hecy/content/settings";
import type {
  ContentRecord,
  HomepageNowItem,
  SiteSettings,
} from "@hecy/content/types";
import Link from "next/link";
import { CharReveal } from "./char-reveal";
import {
  ArrowUpRightIcon,
  BoxIcon,
  BrandIcon,
  ProductIconForSlug,
} from "./icons";
import { Reveal } from "./reveal";
import { SiteAvatar } from "./site-avatar";
import { WordRotate } from "./word-rotate";

type HomeSectionsProps = {
  settings: SiteSettings;
  articles: ContentRecord[];
  products: ContentRecord[];
};

// 图标名 → 配色 class，前台 globals.css 中定义对应颜色。
const SKILL_TONES: Record<string, string> = {
  Vue: "vue",
  Vite: "vite",
  React: "react",
  "Next.js": "next",
  TypeScript: "ts",
  Bun: "bun",
  "Node.js": "node",
  Docker: "docker",
  Python: "python",
  Raycast: "raycast",
  Chrome: "chrome",
  TikTok: "tiktok",
};

function formatDate(value?: string) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "----.--.--";
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map((part, index) =>
      index === 0 ? String(part) : String(part).padStart(2, "0"),
    )
    .join(".");
}

function safeNowLink(link: string | undefined) {
  if (!link) return undefined;
  if (link === LATEST_PRODUCT_LINK) return link;
  if (link.startsWith("/") || link.startsWith("#")) {
    return link.startsWith("//") ? undefined : link;
  }
  try {
    return ["http:", "https:"].includes(new URL(link).protocol)
      ? link
      : undefined;
  } catch {
    return undefined;
  }
}

/** 图标值为 http(s) 或站内路径时按自定义图片渲染。 */
function isImageIcon(icon: string) {
  if (/^https?:\/\//.test(icon)) return true;
  if (icon.startsWith("/")) return !icon.startsWith("//");
  try {
    return ["http:", "https:"].includes(new URL(icon).protocol);
  } catch {
    return false;
  }
}

function NowItemCopy({
  item,
  product,
}: {
  item: HomepageNowItem;
  product?: ContentRecord;
}) {
  const link = safeNowLink(item.link);
  if (link === LATEST_PRODUCT_LINK) {
    return (
      <p className="timeline-copy">
        {item.content}
        {product ? (
          <Link className="inline-link" href={`/products/${product.slug}`}>
            {product.title} <ArrowUpRightIcon />
          </Link>
        ) : (
          "内容系统"
        )}
      </p>
    );
  }
  if (link) {
    const external = link.startsWith("http");
    return (
      <p className="timeline-copy">
        <a
          className="inline-link"
          href={link}
          rel={external ? "noreferrer noopener" : undefined}
          target={external ? "_blank" : undefined}
        >
          {item.content} <ArrowUpRightIcon />
        </a>
      </p>
    );
  }
  return <p className="timeline-copy">{item.content}</p>;
}

function ProductMark({ item }: { item: ContentRecord }) {
  const icon = item.product?.icon?.trim();
  return (
    <span aria-hidden="true" className={`product-icon ${item.slug}`}>
      {icon ? (
        <img alt="" className="product-img" src={icon} />
      ) : (
        <ProductIconForSlug slug={item.slug} />
      )}
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
  const home = settings.homepage;

  return (
    <div className="home-page">
      <section className="home-hero" aria-labelledby="home-title">
        {home.greeting ? (
          <Reveal delay={0}>
            <p className="home-greeting">{home.greeting}</p>
          </Reveal>
        ) : null}
        <Reveal delay={120}>
          <SiteAvatar src={settings.avatarUrl || "/imgs/avatar.webp"} />
        </Reveal>
        <h1 className="home-title" id="home-title">
          <CharReveal delay={320} text={home.headline || settings.title} />
        </h1>
        <Reveal delay={480}>
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
        </Reveal>
      </section>

      <Reveal>
        <section
          className="about-section"
          id="about"
          aria-labelledby="about-title"
        >
          <div className="about-left">
            <p className="section-kicker">关于我</p>
            {home.role || home.location ? (
              <div className="about-profile">
                {home.role ? (
                  <span className="about-profile-role">{home.role}</span>
                ) : null}
                {home.location ? (
                  <span className="about-profile-place">{home.location}</span>
                ) : null}
              </div>
            ) : null}
            {home.skills.length ? (
              <>
                <div className="skill-heading">
                  <span>Skills</span>
                </div>
                <div className="skill-list">
                  {home.skills.map((skill) => (
                    <span className="skill-badge" key={skill.name}>
                      <span
                        aria-hidden="true"
                        className={`skill-icon ${SKILL_TONES[skill.icon] ?? "generic"}`}
                      >
                        {isImageIcon(skill.icon) ? (
                          <img alt="" className="skill-img" src={skill.icon} />
                        ) : (
                          <BrandIcon name={skill.icon} />
                        )}
                      </span>
                      <span>{skill.name}</span>
                    </span>
                  ))}
                </div>
              </>
            ) : null}
          </div>

          <div className="about-right">
            <div className="now-heading">
              <div>
                <p className="section-kicker">Now</p>
                <h2 className="now-title" id="about-title">
                  {home.nowTitle}
                </h2>
              </div>
            </div>
            {home.nowItems.length ? (
              <div className="timeline">
                {home.nowItems.map((item, index) => (
                  <div
                    className="timeline-item"
                    // biome-ignore lint/suspicious/noArrayIndexKey: 静态渲染的一次性列表，条目可重复
                    key={`${item.label}-${index}`}
                  >
                    <span className="timeline-label">
                      <span className="timeline-num">
                        {String(index + 1).padStart(2, "0")} /
                      </span>
                      <span className="timeline-word">{item.label}</span>
                    </span>
                    <NowItemCopy item={item} product={firstProduct} />
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </section>
      </Reveal>

      <Reveal delay={80}>
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
      </Reveal>

      <Reveal delay={120}>
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
      </Reveal>
    </div>
  );
}
