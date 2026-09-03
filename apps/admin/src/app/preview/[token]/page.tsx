import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MarkdownView } from "@/components/markdown-view";
import { getPreviewByToken } from "@/lib/store";

export const metadata: Metadata = {
  title: "私有预览",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const item = await getPreviewByToken(token);
  if (!item) notFound();

  return (
    <main className="preview-public">
      <div className="preview-public-bar">
        <span>Hecy Blog · 私有预览</span>
        <span>
          此链接将在{" "}
          {item.previewExpiresAt
            ? new Date(item.previewExpiresAt).toLocaleString("zh-CN")
            : "稍后"}{" "}
          失效
        </span>
      </div>
      <article className="preview-public-card">
        <div className="eyebrow">
          {item.type === "article"
            ? "文章"
            : item.type === "product"
              ? "产品"
              : "项目"}{" "}
          · {item.lang}
        </div>
        <h1>{item.title}</h1>
        <p className="preview-public-excerpt">{item.excerpt}</p>
        {item.coverUrl ? (
          // biome-ignore lint/performance/noImgElement: preview content may use an approved external image host.
          <img alt="" className="preview-public-cover" src={item.coverUrl} />
        ) : null}
        {item.type === "product" && item.product ? (
          <div className="preview-public-facts">
            <span>
              <small>状态</small>
              {item.product.status === "live"
                ? "在线"
                : item.product.status === "beta"
                  ? "测试中"
                  : "暂停"}
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
              <a href={item.product.url} target="_blank" rel="noreferrer">
                <small>链接</small>打开产品 ↗
              </a>
            ) : null}
          </div>
        ) : null}
        {item.type === "project" && item.project ? (
          <div className="preview-public-facts">
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
              <a href={item.project.repoUrl} target="_blank" rel="noreferrer">
                <small>仓库</small>查看代码 ↗
              </a>
            ) : null}
            {item.project.url ? (
              <a href={item.project.url} target="_blank" rel="noreferrer">
                <small>项目链接</small>打开项目 ↗
              </a>
            ) : null}
          </div>
        ) : null}
        <MarkdownView source={item.body} />
      </article>
    </main>
  );
}
