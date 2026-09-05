import type { ContentRecord } from "@hecy/content/types";
import Link from "next/link";
import {
  ArrowLeftIcon,
  ArrowUpRightIcon,
  ExternalLinkIcon,
  GithubIcon,
  ProductIconForSlug,
  TechBadgeIcon,
} from "./icons";
import { MarkdownContent } from "./markdown-content";

type ShowcaseType = "product" | "project";

function statusLabel(item: ContentRecord) {
  if (item.product?.status === "beta") return "测试中";
  if (item.product?.status === "paused") return "已暂停";
  return "已上线";
}

function ShowcaseIcon({
  item,
  type,
}: {
  item: ContentRecord;
  type: ShowcaseType;
}) {
  const icon = type === "product" ? item.product?.icon?.trim() : undefined;
  return (
    <span
      aria-hidden="true"
      className={`product-icon ${item.slug || "default"}`}
    >
      {icon ? (
        <img alt="" className="product-img" src={icon} />
      ) : (
        <ProductIconForSlug slug={type === "project" ? "project" : item.slug} />
      )}
    </span>
  );
}

function ShowcaseActions({
  item,
  type,
}: {
  item: ContentRecord;
  type: ShowcaseType;
}) {
  const links =
    type === "product"
      ? [
          {
            href: item.product?.url,
            label: `${item.title} 产品链接`,
            icon: <ExternalLinkIcon />,
          },
        ]
      : [
          {
            href: item.project?.repoUrl,
            label: `${item.title} GitHub`,
            icon: <GithubIcon />,
          },
          {
            href: item.project?.url,
            label: `${item.title} 项目链接`,
            icon: <ExternalLinkIcon />,
          },
        ];
  return (
    <nav aria-label={`${item.title} 链接`} className="showcase-actions">
      {links.map((link) =>
        link.href ? (
          <a
            aria-label={link.label}
            className="icon-action"
            href={link.href}
            key={link.label}
            rel="noreferrer"
            target="_blank"
            title={link.label}
          >
            {link.icon}
          </a>
        ) : null,
      )}
    </nav>
  );
}

function ShowcaseCard({
  item,
  type,
  index,
}: {
  item: ContentRecord;
  type: ShowcaseType;
  index: number;
}) {
  return (
    <article className="showcase-card" id={item.slug}>
      <div className="showcase-card-header">
        <Link
          className="showcase-card-main"
          href={`/${type === "product" ? "products" : "projects"}/${item.slug}`}
        >
          <ShowcaseIcon item={item} type={type} />
          <div className="showcase-card-copy">
            <div className="showcase-title-line">
              <span className="showcase-number">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h2 className="showcase-title">{item.title}</h2>
              {type === "product" ? (
                <span
                  className={`product-status${item.product?.status === "beta" ? " beta" : ""}`}
                >
                  <span aria-hidden="true" className="product-status-dot" />
                  {statusLabel(item)}
                </span>
              ) : null}
            </div>
            <p className="showcase-description">{item.excerpt}</p>
          </div>
        </Link>
        <ShowcaseActions item={item} type={type} />
      </div>
      <div className="showcase-tags">
        {item.tags.map((tag) => (
          <span className="tech-badge" key={tag}>
            <TechBadgeIcon name={tag} />
            {tag}
          </span>
        ))}
      </div>
    </article>
  );
}

export function ShowcaseIndex({
  items,
  title,
  intro,
  type,
}: {
  items: ContentRecord[];
  title: string;
  intro: string;
  type: ShowcaseType;
}) {
  const label = type === "product" ? "Product Archive" : "Project Archive";
  return (
    <section className="archive-page">
      <header className="archive-hero">
        <div>
          <p className="archive-kicker">{label}</p>
          <h1 className="archive-title">{title}</h1>
          <p className="archive-subline">{intro}</p>
        </div>
        <aside className="archive-count">
          <p className="archive-count-label">Total</p>
          <p className="archive-count-value">
            {String(items.length).padStart(2, "0")}
          </p>
          <p className="archive-count-foot">
            {type === "product" ? "products" : "projects"}
          </p>
        </aside>
      </header>
      <div className="showcase-list">
        {items.map((item, index) => (
          <ShowcaseCard item={item} index={index} key={item.id} type={type} />
        ))}
        {!items.length ? (
          <p className="timeline-copy">还没有发布内容。</p>
        ) : null}
      </div>
    </section>
  );
}

export function ShowcaseDetail({
  item,
  type,
}: {
  item: ContentRecord;
  type: ShowcaseType;
}) {
  const title = type === "product" ? "产品" : "项目";
  return (
    <article className="article-page">
      <Link
        className="article-back"
        href={type === "product" ? "/products" : "/projects"}
      >
        <ArrowLeftIcon />
        返回{title}列表
      </Link>
      <header className="article-header">
        <div className="article-kicker">
          {title} · {item.lang}
        </div>
        <h1 className="article-title">{item.title}</h1>
        <p className="article-excerpt">{item.excerpt}</p>
        <div className="article-meta">
          <span className="meta-badge">
            {type === "product" ? statusLabel(item) : "进行中"}
          </span>
          {item.tags.map((tag) => (
            <span className="meta-badge" key={tag}>
              {tag}
            </span>
          ))}
        </div>
      </header>
      {item.coverUrl ? (
        // biome-ignore lint/performance/noImgElement: content authors may host images on approved remote origins.
        <img alt="" className="article-cover" src={item.coverUrl} />
      ) : null}
      <div className="showcase-facts">
        {type === "product" && item.product ? (
          <>
            <span>
              <small>状态</small>
              {statusLabel(item)}
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
              <a href={item.product.url} rel="noreferrer" target="_blank">
                <small>链接</small>打开产品 <ArrowUpRightIcon />
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
              <a href={item.project.repoUrl} rel="noreferrer" target="_blank">
                <small>仓库</small>查看代码 <GithubIcon />
              </a>
            ) : null}
            {item.project.url ? (
              <a href={item.project.url} rel="noreferrer" target="_blank">
                <small>项目链接</small>打开项目 <ArrowUpRightIcon />
              </a>
            ) : null}
          </>
        ) : null}
      </div>
      <MarkdownContent source={item.body} />
      <footer className="article-footer">
        <Link
          className="article-back article-back-next"
          href={type === "product" ? "/products" : "/projects"}
        >
          <span>
            <ArrowLeftIcon /> 返回列表
          </span>
          <span>
            {type === "product" ? "PRODUCTS" : "PROJECTS"} INDEX{" "}
            <ArrowUpRightIcon />
          </span>
        </Link>
      </footer>
    </article>
  );
}
