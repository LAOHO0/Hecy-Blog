"use client";

import { markdownBlockIdentity, parseMarkdown } from "@hecy/content/markdown";
import type {
  ContentRecord,
  ContentVersion,
  ProductStatus,
} from "@hecy/content/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Icon } from "@/components/icon";
import { statusClass, statusLabels, typeLabels } from "@/lib/presentation";

type EditorData = {
  type: ContentRecord["type"];
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  coverUrl: string;
  tags: string;
  lang: string;
  featured: boolean;
  sortOrder: number;
  productStatus: ProductStatus;
  productPrice: string;
  productUrl: string;
  productPlatform: string;
  projectRole: string;
  projectPeriod: string;
  projectTechStack: string;
  projectRepoUrl: string;
  projectUrl: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  canonicalUrl: string;
  ogImageUrl: string;
};

function fromRecord(
  record: ContentRecord | null,
  initialType: ContentRecord["type"],
): EditorData {
  return {
    type: record?.type || initialType,
    slug: record?.slug || "",
    title: record?.title || "",
    excerpt: record?.excerpt || "",
    body: record?.body || "# 新内容\n\n从这里开始写作。",
    coverUrl: record?.coverUrl || "",
    tags: record?.tags.join(", ") || "",
    lang: record?.lang || "zh-CN",
    featured: record?.featured || false,
    sortOrder: record?.sortOrder || 0,
    productStatus: record?.product?.status || "live",
    productPrice: record?.product?.price || "",
    productUrl: record?.product?.url || "",
    productPlatform: record?.product?.platform || "",
    projectRole: record?.project?.role || "",
    projectPeriod: record?.project?.period || "",
    projectTechStack: record?.project?.techStack.join(", ") || "",
    projectRepoUrl: record?.project?.repoUrl || "",
    projectUrl: record?.project?.url || "",
    seoTitle: record?.seo.title || "",
    seoDescription: record?.seo.description || "",
    seoKeywords: record?.seo.keywords.join(", ") || "",
    canonicalUrl: record?.seo.canonicalUrl || "",
    ogImageUrl: record?.seo.ogImageUrl || "",
  };
}

function toPayload(data: EditorData) {
  const tags = data.tags
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const payload = {
    type: data.type,
    slug: data.slug.trim(),
    title: data.title.trim(),
    excerpt: data.excerpt.trim(),
    body: data.body,
    coverUrl: data.coverUrl.trim(),
    tags,
    lang: data.lang.trim() || "zh-CN",
    featured: data.featured,
    sortOrder: Number(data.sortOrder) || 0,
    seo: {
      title: data.seoTitle.trim(),
      description: data.seoDescription.trim(),
      keywords: data.seoKeywords
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      canonicalUrl: data.canonicalUrl.trim(),
      ogImageUrl: data.ogImageUrl.trim(),
    },
    ...(data.type === "product"
      ? {
          product: {
            status: data.productStatus,
            price: data.productPrice.trim(),
            url: data.productUrl.trim(),
            platform: data.productPlatform.trim(),
          },
        }
      : {}),
    ...(data.type === "project"
      ? {
          project: {
            role: data.projectRole.trim(),
            period: data.projectPeriod.trim(),
            techStack: data.projectTechStack
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean),
            repoUrl: data.projectRepoUrl.trim(),
            url: data.projectUrl.trim(),
          },
        }
      : {}),
  };
  return payload;
}

export function ContentEditor({
  initial,
  initialType = "article",
}: {
  initial: ContentRecord | null;
  initialType?: ContentRecord["type"];
}) {
  const router = useRouter();
  const [data, setData] = useState(() => fromRecord(initial, initialType));
  const [record, setRecord] = useState<ContentRecord | null>(initial);
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [notice, setNotice] = useState<{
    tone: "ok" | "error";
    text: string;
  } | null>(null);
  const [pending, startTransition] = useTransition();
  const [versions, setVersions] = useState<ContentVersion[]>([]);
  const [showVersions, setShowVersions] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");

  const blocks = useMemo(() => parseMarkdown(data.body), [data.body]);

  function update<K extends keyof EditorData>(key: K, value: EditorData[K]) {
    setData((current) => ({ ...current, [key]: value }));
  }

  async function save(): Promise<ContentRecord | null> {
    setNotice(null);
    const endpoint = record ? `/api/content/${record.id}` : "/api/content";
    const response = await fetch(endpoint, {
      method: record ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toPayload(data)),
    });
    const payload = (await response.json().catch(() => ({}))) as {
      item?: ContentRecord;
      error?: string;
      message?: string;
    };
    if (!response.ok || !payload.item) {
      setNotice({
        tone: "error",
        text: payload.error || "保存失败，请检查字段。",
      });
      return null;
    }
    setRecord(payload.item);
    setData(fromRecord(payload.item, payload.item.type));
    setNotice({
      tone: "ok",
      text:
        payload.message ||
        (record?.status === "published"
          ? "已保存，等待静态站构建。"
          : "草稿已保存。"),
    });
    if (!record) router.replace(`/admin/content/${payload.item.id}`);
    return payload.item;
  }

  function handleSave() {
    startTransition(() => {
      void save();
    });
  }

  async function publish() {
    const saved = await save();
    if (!saved) return;
    const current = saved;
    startTransition(async () => {
      const response = await fetch(`/api/content/${current.id}/publish`, {
        method: "POST",
      });
      const payload = (await response.json().catch(() => ({}))) as {
        item?: ContentRecord;
        message?: string;
        error?: string;
      };
      if (!response.ok) {
        setNotice({ tone: "error", text: payload.error || "发布失败。" });
        return;
      }
      setRecord(payload.item || current);
      setNotice({
        tone: "ok",
        text: payload.message || "内容已发布，构建已排队。",
      });
      router.refresh();
    });
  }

  async function revoke() {
    if (!record) return;
    startTransition(async () => {
      const response = await fetch(`/api/content/${record.id}/revoke`, {
        method: "POST",
      });
      const payload = (await response.json().catch(() => ({}))) as {
        item?: ContentRecord;
        error?: string;
        message?: string;
      };
      if (!response.ok) {
        setNotice({ tone: "error", text: payload.error || "撤回失败。" });
        return;
      }
      setRecord(payload.item || record);
      setNotice({
        tone: "ok",
        text: payload.message
          ? `内容已撤回为草稿。${payload.message}`
          : "内容已撤回为草稿。",
      });
      router.refresh();
    });
  }

  async function createPreview() {
    const saved = await save();
    if (!saved) return;
    startTransition(async () => {
      const response = await fetch(`/api/content/${saved.id}/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ minutes: 60 }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
      };
      if (!response.ok || !payload.url) {
        setNotice({
          tone: "error",
          text: payload.error || "预览链接创建失败。",
        });
        return;
      }
      setPreviewUrl(payload.url);
      window.open(payload.url, "_blank", "noopener,noreferrer");
      setNotice({ tone: "ok", text: "私有预览链接已创建，有效期 60 分钟。" });
    });
  }

  async function loadVersions() {
    if (!record) return;
    const response = await fetch(`/api/content/${record.id}/versions`);
    const payload = (await response.json()) as { items?: ContentVersion[] };
    setVersions(payload.items || []);
    setShowVersions(true);
  }

  function restore(version: ContentVersion) {
    if (!record) return;
    if (
      !window.confirm(`恢复版本 ${version.version}？当前内容会先保存为新版本。`)
    )
      return;
    startTransition(async () => {
      const response = await fetch(`/api/content/${record.id}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionId: version.id }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        item?: ContentRecord;
        error?: string;
        message?: string;
      };
      if (!response.ok || !payload.item) {
        setNotice({ tone: "error", text: payload.error || "恢复失败。" });
        return;
      }
      setRecord(payload.item);
      setData(fromRecord(payload.item, payload.item.type));
      setShowVersions(false);
      setNotice({
        tone: "ok",
        text: payload.message
          ? `已恢复到版本 ${version.version}。${payload.message}`
          : `已恢复到版本 ${version.version}。`,
      });
    });
  }

  return (
    <div className="editor-screen">
      <div className="editor-screen-head">
        <div>
          <div className="eyebrow">
            {record ? "编辑内容" : "新建内容"} · {typeLabels[data.type]}
          </div>
          <h1 className="page-title">{record?.title || "未命名内容"}</h1>
        </div>
        <div className="form-actions">
          <Link className="button secondary" href="/admin/content">
            返回列表
          </Link>
          <button
            className="button secondary"
            disabled={pending}
            onClick={() => setTab(tab === "edit" ? "preview" : "edit")}
            type="button"
          >
            <Icon name="eye" />
            {tab === "edit" ? "实时预览" : "返回编辑"}
          </button>
          <button
            className="button"
            disabled={pending}
            onClick={handleSave}
            type="button"
          >
            <Icon name="save" />
            {record?.status === "published" ? "保存更新" : "保存草稿"}
          </button>
          {record?.status === "published" ? (
            <button
              className="button secondary"
              disabled={pending}
              onClick={revoke}
              type="button"
            >
              撤回
            </button>
          ) : (
            <button
              className="button"
              disabled={pending}
              onClick={publish}
              type="button"
            >
              发布
            </button>
          )}
        </div>
      </div>

      {notice ? (
        <div className={`notice ${notice.tone === "error" ? "error" : ""}`}>
          {notice.text}
        </div>
      ) : null}
      {previewUrl ? (
        <div className="preview-link">
          <span>私有预览：</span>
          <a href={previewUrl} target="_blank" rel="noreferrer">
            {previewUrl}
          </a>
        </div>
      ) : null}

      <div
        className={`editor-workspace ${tab === "preview" ? "preview-mode" : ""}`}
      >
        <section className="editor-form panel">
          <div className="panel-head">
            <span className="panel-title">基础信息</span>
            <span
              className={`status ${statusClass[record?.status || "draft"]}`}
            >
              {statusLabels[record?.status || "draft"]}
            </span>
          </div>
          <div className="form-grid editor-fields">
            <label className="field">
              <span className="field-label">内容类型</span>
              <select
                className="select"
                disabled={Boolean(record)}
                onChange={(event) =>
                  update("type", event.target.value as EditorData["type"])
                }
                value={data.type}
              >
                <option value="article">文章</option>
                <option value="product">产品</option>
                <option value="project">项目</option>
              </select>
              {record ? (
                <span className="field-help">保存后不能修改内容类型。</span>
              ) : null}
            </label>
            <label className="field">
              <span className="field-label">语言</span>
              <input
                className="input"
                onChange={(event) => update("lang", event.target.value)}
                value={data.lang}
              />
            </label>
            <label className="field full">
              <span className="field-label">标题</span>
              <input
                className="input input-large"
                onChange={(event) => update("title", event.target.value)}
                placeholder="输入标题"
                value={data.title}
              />
            </label>
            <label className="field">
              <span className="field-label">
                Slug（只允许小写字母、数字和短横线）
              </span>
              <input
                className="input"
                onChange={(event) => update("slug", event.target.value)}
                placeholder="例如 my-first-post"
                value={data.slug}
              />
            </label>
            <label className="field">
              <span className="field-label">排序权重</span>
              <input
                className="input"
                min="0"
                onChange={(event) =>
                  update("sortOrder", Number(event.target.value))
                }
                type="number"
                value={data.sortOrder}
              />
            </label>
            <label className="field full">
              <span className="field-label">摘要</span>
              <textarea
                className="textarea short"
                onChange={(event) => update("excerpt", event.target.value)}
                placeholder="用于列表、SEO 和分享卡片"
                value={data.excerpt}
              />
            </label>
            <label className="field full">
              <span className="field-label">标签（使用逗号分隔）</span>
              <input
                className="input"
                onChange={(event) => update("tags", event.target.value)}
                placeholder="设计, 工程化, AI"
                value={data.tags}
              />
            </label>
            <label className="field full">
              <span className="field-label">封面图 URL（可选）</span>
              <input
                className="input"
                onChange={(event) => update("coverUrl", event.target.value)}
                placeholder="https://…"
                value={data.coverUrl}
              />
            </label>
            <label className="check-row field full">
              <input
                checked={data.featured}
                onChange={(event) => update("featured", event.target.checked)}
                type="checkbox"
              />
              <span>在首页精选区域显示</span>
            </label>
          </div>

          {data.type === "product" ? (
            <FieldGroup title="产品字段">
              <div className="form-grid">
                <label className="field">
                  <span className="field-label">产品状态</span>
                  <select
                    className="select"
                    onChange={(event) =>
                      update(
                        "productStatus",
                        event.target.value as ProductStatus,
                      )
                    }
                    value={data.productStatus}
                  >
                    <option value="live">在线</option>
                    <option value="beta">测试中</option>
                    <option value="paused">暂停</option>
                  </select>
                </label>
                <label className="field">
                  <span className="field-label">平台</span>
                  <input
                    className="input"
                    onChange={(event) =>
                      update("productPlatform", event.target.value)
                    }
                    value={data.productPlatform}
                  />
                </label>
                <label className="field">
                  <span className="field-label">价格说明</span>
                  <input
                    className="input"
                    onChange={(event) =>
                      update("productPrice", event.target.value)
                    }
                    placeholder="免费 / ¥19 / 订阅制"
                    value={data.productPrice}
                  />
                </label>
                <label className="field">
                  <span className="field-label">产品链接</span>
                  <input
                    className="input"
                    onChange={(event) =>
                      update("productUrl", event.target.value)
                    }
                    placeholder="https://…"
                    value={data.productUrl}
                  />
                </label>
              </div>
            </FieldGroup>
          ) : null}

          {data.type === "project" ? (
            <FieldGroup title="项目字段">
              <div className="form-grid">
                <label className="field">
                  <span className="field-label">我的角色</span>
                  <input
                    className="input"
                    onChange={(event) =>
                      update("projectRole", event.target.value)
                    }
                    value={data.projectRole}
                  />
                </label>
                <label className="field">
                  <span className="field-label">项目周期</span>
                  <input
                    className="input"
                    onChange={(event) =>
                      update("projectPeriod", event.target.value)
                    }
                    placeholder="2026.09 — 至今"
                    value={data.projectPeriod}
                  />
                </label>
                <label className="field full">
                  <span className="field-label">技术栈（逗号分隔）</span>
                  <input
                    className="input"
                    onChange={(event) =>
                      update("projectTechStack", event.target.value)
                    }
                    value={data.projectTechStack}
                  />
                </label>
                <label className="field">
                  <span className="field-label">代码仓库</span>
                  <input
                    className="input"
                    onChange={(event) =>
                      update("projectRepoUrl", event.target.value)
                    }
                    placeholder="https://github.com/…"
                    value={data.projectRepoUrl}
                  />
                </label>
                <label className="field">
                  <span className="field-label">项目链接</span>
                  <input
                    className="input"
                    onChange={(event) =>
                      update("projectUrl", event.target.value)
                    }
                    placeholder="https://…"
                    value={data.projectUrl}
                  />
                </label>
              </div>
            </FieldGroup>
          ) : null}

          <FieldGroup title="Markdown / MDX 正文（安全子集）">
            <textarea
              className="textarea mdx-input"
              onChange={(event) => update("body", event.target.value)}
              value={data.body}
            />
            <p className="field-help">
              支持标题、段落、列表、引用和代码块；产品和项目与文章使用同一编辑器。
            </p>
          </FieldGroup>

          <FieldGroup title="SEO 设置">
            <div className="form-grid">
              <label className="field full">
                <span className="field-label">SEO 标题</span>
                <input
                  className="input"
                  onChange={(event) => update("seoTitle", event.target.value)}
                  placeholder="留空则使用正文标题"
                  value={data.seoTitle}
                />
              </label>
              <label className="field full">
                <span className="field-label">SEO 描述</span>
                <textarea
                  className="textarea short"
                  onChange={(event) =>
                    update("seoDescription", event.target.value)
                  }
                  placeholder="留空则使用摘要"
                  value={data.seoDescription}
                />
              </label>
              <label className="field full">
                <span className="field-label">关键词（逗号分隔）</span>
                <input
                  className="input"
                  onChange={(event) =>
                    update("seoKeywords", event.target.value)
                  }
                  value={data.seoKeywords}
                />
              </label>
              <label className="field">
                <span className="field-label">Canonical URL</span>
                <input
                  className="input"
                  onChange={(event) =>
                    update("canonicalUrl", event.target.value)
                  }
                  placeholder="https://…"
                  value={data.canonicalUrl}
                />
              </label>
              <label className="field">
                <span className="field-label">OG 图片 URL</span>
                <input
                  className="input"
                  onChange={(event) => update("ogImageUrl", event.target.value)}
                  placeholder="https://…"
                  value={data.ogImageUrl}
                />
              </label>
            </div>
          </FieldGroup>

          <div className="form-actions editor-bottom-actions">
            <button
              className="button ghost"
              disabled={!record || pending}
              onClick={createPreview}
              type="button"
            >
              <Icon name="eye" />
              生成私有预览
            </button>
            <button
              className="button ghost"
              disabled={!record || pending}
              onClick={loadVersions}
              type="button"
            >
              <Icon name="restore" />
              版本历史
            </button>
          </div>
        </section>

        <aside className="editor-live panel">
          <div className="panel-head">
            <span className="panel-title">前台预览</span>
            <span className="eyebrow">{typeLabels[data.type]}</span>
          </div>
          <article className="live-card">
            <div className="eyebrow">
              {typeLabels[data.type]} · {data.lang}
            </div>
            <h2>{data.title || "未命名内容"}</h2>
            <p className="live-excerpt">{data.excerpt || "还没有摘要。"}</p>
            <div className="preview-rule" />
            <LiveBlocks blocks={blocks} />
          </article>
        </aside>
      </div>

      {showVersions ? (
        <div
          aria-labelledby="version-history-title"
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
        >
          <section className="modal">
            <div className="panel-head">
              <span className="panel-title" id="version-history-title">
                版本历史
              </span>
              <button
                className="icon-button"
                onClick={() => setShowVersions(false)}
                type="button"
              >
                ×
              </button>
            </div>
            <div className="version-list">
              {versions.length ? (
                versions.map((version) => (
                  <div className="version-row" key={version.id}>
                    <div>
                      <strong>版本 {version.version}</strong>
                      <span className="muted">
                        {new Date(version.createdAt).toLocaleString("zh-CN")} ·{" "}
                        {version.createdBy}
                      </span>
                    </div>
                    <button
                      className="button secondary"
                      onClick={() => restore(version)}
                      type="button"
                    >
                      恢复
                    </button>
                  </div>
                ))
              ) : (
                <div className="empty">暂无历史版本。</div>
              )}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function FieldGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="field-group">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function LiveBlocks({ blocks }: { blocks: ReturnType<typeof parseMarkdown> }) {
  const occurrences = new Map<string, number>();
  return (
    <div className="markdown-view">
      {blocks.map((block) => {
        const identity = markdownBlockIdentity(block);
        const occurrence = occurrences.get(identity) ?? 0;
        occurrences.set(identity, occurrence + 1);
        const key = `${identity}:${occurrence}`;
        if (block.type === "heading") {
          const Tag = `h${block.level}` as "h1" | "h2" | "h3";
          return <Tag key={key}>{block.text}</Tag>;
        }
        if (block.type === "code")
          return (
            <pre key={key}>
              <code>{block.text}</code>
            </pre>
          );
        if (block.type === "quote")
          return <blockquote key={key}>{block.text}</blockquote>;
        if (block.type === "list")
          return (
            <ul key={key}>
              {block.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          );
        return <p key={key}>{block.text}</p>;
      })}
    </div>
  );
}
