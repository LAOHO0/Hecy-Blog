import Link from "next/link";
import { ContentCard } from "@/components/content-card";
import { getPublishedContent, getSiteSettings } from "@/lib/content";

export default async function HomePage() {
  const [settings, records] = await Promise.all([
    getSiteSettings(),
    getPublishedContent(),
  ]);
  const articles = records
    .filter((item) => item.type === "article")
    .slice(0, 3);
  const showcase = records
    .filter((item) => item.type !== "article" && item.featured)
    .slice(0, 6);
  return (
    <>
      <section className="hero">
        <div>
          <div className="eyebrow">Hecy Blog / 个人内容站</div>
          <h1>把想法做成值得发布的内容。</h1>
          <p>{settings.bio}</p>
          <Link className="hero-link" href="/blog">
            浏览文章 <span>→</span>
          </Link>
        </div>
        <div className="hero-aside">
          <div className="eyebrow">现在正在做</div>
          <strong>{settings.tagline}</strong>
          <span className="eyebrow" style={{ display: "block", marginTop: 20 }}>
            内容系统已上线
          </span>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2 className="section-title">最近文章</h2>
          <Link className="section-link" href="/blog">
            查看全部 →
          </Link>
        </div>
        <div className="card-grid">
          {articles.map((item) => (
            <ContentCard item={item} key={item.id} />
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2 className="section-title">产品与项目</h2>
          <span className="section-links">
            <Link className="section-link" href="/products">
              产品 →
            </Link>
            <Link className="section-link" href="/projects">
              项目 →
            </Link>
          </span>
        </div>
        <div className="card-grid">
          {showcase.map((item) => (
            <ContentCard item={item} key={item.id} />
          ))}
        </div>
      </section>

      <section className="section">
        <div className="about-grid">
          <div>
            <div className="eyebrow">关于 Hecy Blog</div>
            <h2 className="section-title" style={{ marginTop: 14 }}>
              写作、产品与项目。
            </h2>
          </div>
          <p>{settings.bio} 这里的每一条内容都可以被持续编辑、预览和发布。</p>
        </div>
      </section>
    </>
  );
}
