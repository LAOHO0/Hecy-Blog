"use client";

import { parseMarkdown } from "@hecy/content/markdown";
import type {
  ContentRecord,
  ContentVersion,
  MediaAsset,
  ProductStatus,
} from "@hecy/content/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Icon } from "@/components/icon";
import { MarkdownView } from "@/components/markdown-view";
import { MediaPickerModal } from "@/components/media-picker";
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

/** 标题转 slug：小写字母数字与短横线；中文标题产不出合法结果时返回空串，交给用户手填。 */
function slugify(title: string) {
  return title
    .trim()
    .toLowerCase()
    .replace(/['’"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 160);
}

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
  // 新建时 slug 跟随标题自动生成；用户手动改过后就不再覆盖。
  const [slugEdited, setSlugEdited] = useState(Boolean(initial));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [bodyView, setBodyView] = useState<"write" | "split" | "preview">(
    "split",
  );
  const [mediaOpen, setMediaOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!fullscreen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFullscreen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [fullscreen]);

  function update<K extends keyof EditorData>(key: K, value: EditorData[K]) {
    setData((current) => ({ ...current, [key]: value }));
  }

  /** 基于当前选区改写正文，并在渲染后恢复焦点和选区。 */
  function applyBodyEdit(
    transform: (
      value: string,
      start: number,
      end: number,
    ) => { value: string; start: number; end: number },
  ) {
    const element = bodyRef.current;
    if (!element) return;
    const next = transform(
      element.value,
      element.selectionStart,
      element.selectionEnd,
    );
    update("body", next.value);
    requestAnimationFrame(() => {
      element.focus();
      element.setSelectionRange(next.start, next.end);
    });
  }

  function wrapSelection(before: string, after: string, placeholder: string) {
    applyBodyEdit((value, start, end) => {
      const selected = value.slice(start, end) || placeholder;
      return {
        value:
          value.slice(0, start) + before + selected + after + value.slice(end),
        start: start + before.length,
        end: start + before.length + selected.length,
      };
    });
  }

  function prefixLines(prefix: string) {
    applyBodyEdit((value, start, end) => {
      const lineStart = value.lastIndexOf("\n", start - 1) + 1;
      const found = value.indexOf("\n", end);
      const lineEnd = found === -1 ? value.length : found;
      const block = value.slice(lineStart, lineEnd);
      const prefixed = block
        .split("\n")
        .map((line) => (line.trim() ? prefix + line : line))
        .join("\n");
      return {
        value: value.slice(0, lineStart) + prefixed + value.slice(lineEnd),
        start: lineStart,
        end: lineStart + prefixed.length,
      };
    });
  }

  function insertSnippet(snippet: string) {
    applyBodyEdit((value, start, end) => ({
      value: value.slice(0, start) + snippet + value.slice(end),
      start: start + snippet.length,
      end: start + snippet.length,
    }));
  }

  function insertImage(asset: MediaAsset) {
    insertSnippet(
      `![${asset.alt || asset.key.split("/").at(-1) || "图片"}](${asset.url})\n`,
    );
    setMediaOpen(false);
  }

  function updateTitle(value: string) {
    setData((current) => ({
      ...current,
      title: value,
      slug: !record && !slugEdited ? slugify(value) : current.slug,
    }));
  }

  function validate(): boolean {
    const errors: Record<string, string> = {};
    if (!data.title.trim()) errors.title = "标题不能为空。";
    const slug = data.slug.trim();
    if (!slug) errors.slug = "Slug 不能为空。";
    else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      errors.slug = "Slug 只允许小写字母、数字和短横线。";
    }
    if (data.type === "project" && !data.projectTechStack.trim()) {
      errors.projectTechStack = "技术栈不能为空。";
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setNotice({ tone: "error", text: "请先修正表单中标红的必填项。" });
      return false;
    }
    return true;
  }

  async function save(): Promise<ContentRecord | null> {
    setNotice(null);
    if (!validate()) return null;
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
    setFieldErrors({});
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
            <p className="field-help full-span">
              带 <span className="required-mark">*</span>{" "}
              为必填项，其余留空会使用合理默认值。
            </p>
            <label className="field">
              <span className="field-label">
                内容类型 <span className="required-mark">*</span>
              </span>
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
              <span className="field-label">
                标题 <span className="required-mark">*</span>
              </span>
              <input
                className={`input input-large${fieldErrors.title ? " invalid" : ""}`}
                onChange={(event) => updateTitle(event.target.value)}
                placeholder="输入标题"
                value={data.title}
              />
              {fieldErrors.title ? (
                <span className="field-error">{fieldErrors.title}</span>
              ) : null}
            </label>
            <label className="field">
              <span className="field-label">
                Slug（只允许小写字母、数字和短横线）{" "}
                <span className="required-mark">*</span>
              </span>
              <input
                className={`input${fieldErrors.slug ? " invalid" : ""}`}
                onChange={(event) => {
                  setSlugEdited(true);
                  update("slug", event.target.value);
                }}
                placeholder="例如 my-first-post"
                value={data.slug}
              />
              <span className="field-help">
                英文标题会自动生成；中文标题请手动填写英文 Slug。
              </span>
              {fieldErrors.slug ? (
                <span className="field-error">{fieldErrors.slug}</span>
              ) : null}
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
                  <span className="field-label">
                    产品状态 <span className="required-mark">*</span>
                  </span>
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
                  <span className="field-label">
                    技术栈（逗号分隔） <span className="required-mark">*</span>
                  </span>
                  <input
                    className={`input${fieldErrors.projectTechStack ? " invalid" : ""}`}
                    onChange={(event) =>
                      update("projectTechStack", event.target.value)
                    }
                    value={data.projectTechStack}
                  />
                  {fieldErrors.projectTechStack ? (
                    <span className="field-error">
                      {fieldErrors.projectTechStack}
                    </span>
                  ) : null}
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
            <div
              className={`body-editor-shell${fullscreen ? " fullscreen" : ""}`}
            >
              <div className="md-toolbar">
                <button
                  className="md-tool"
                  onClick={() => prefixLines("## ")}
                  title="二级标题"
                  type="button"
                >
                  H2
                </button>
                <button
                  className="md-tool"
                  onClick={() => prefixLines("### ")}
                  title="三级标题"
                  type="button"
                >
                  H3
                </button>
                <span aria-hidden="true" className="md-tool-sep" />
                <button
                  className="md-tool"
                  onClick={() => wrapSelection("**", "**", "加粗文字")}
                  title="加粗"
                  type="button"
                >
                  <strong>B</strong>
                </button>
                <button
                  className="md-tool"
                  onClick={() => wrapSelection("*", "*", "斜体文字")}
                  title="斜体"
                  type="button"
                >
                  <em>I</em>
                </button>
                <button
                  className="md-tool"
                  onClick={() => wrapSelection("~~", "~~", "删除文字")}
                  title="删除线"
                  type="button"
                >
                  <del>S</del>
                </button>
                <button
                  className="md-tool"
                  onClick={() => wrapSelection("`", "`", "代码")}
                  title="行内代码"
                  type="button"
                >
                  {"</>"}
                </button>
                <span aria-hidden="true" className="md-tool-sep" />
                <button
                  className="md-tool"
                  onClick={() => prefixLines("> ")}
                  title="引用"
                  type="button"
                >
                  引用
                </button>
                <button
                  className="md-tool"
                  onClick={() => prefixLines("- ")}
                  title="无序列表"
                  type="button"
                >
                  列表
                </button>
                <button
                  className="md-tool"
                  onClick={() => insertSnippet("\n```js\n// 代码\n```\n")}
                  title="代码块"
                  type="button"
                >
                  代码块
                </button>
                <button
                  className="md-tool"
                  onClick={() => wrapSelection("[", "](https://)", "链接文字")}
                  title="链接"
                  type="button"
                >
                  链接
                </button>
                <button
                  className="md-tool"
                  onClick={() =>
                    insertSnippet(
                      "\n| 列一 | 列二 | 列三 |\n| --- | --- | --- |\n| 内容 | 内容 | 内容 |\n",
                    )
                  }
                  title="插入表格"
                  type="button"
                >
                  表格
                </button>
                <span aria-hidden="true" className="md-tool-sep" />
                <button
                  className="md-tool"
                  onClick={() => setMediaOpen(true)}
                  title="从媒体库插入图片"
                  type="button"
                >
                  <Icon name="image" />
                  图片
                </button>
                <span className="md-toolbar-spacer" />
                <div className="md-view-switch">
                  {(["write", "split", "preview"] as const).map((mode) => (
                    <button
                      aria-pressed={bodyView === mode}
                      className={`md-tool${bodyView === mode ? " active" : ""}`}
                      key={mode}
                      onClick={() => setBodyView(mode)}
                      type="button"
                    >
                      {mode === "write"
                        ? "编写"
                        : mode === "split"
                          ? "分屏"
                          : "预览"}
                    </button>
                  ))}
                </div>
                <button
                  className="md-tool"
                  onClick={() => setFullscreen(!fullscreen)}
                  title={fullscreen ? "退出全屏（Esc）" : "全屏编辑"}
                  type="button"
                >
                  {fullscreen ? "退出全屏" : "全屏"}
                </button>
              </div>
              <div className={`body-editor ${bodyView}`}>
                <textarea
                  className="textarea mdx-input"
                  onChange={(event) => update("body", event.target.value)}
                  ref={bodyRef}
                  value={data.body}
                />
                {bodyView !== "write" ? (
                  <div className="body-preview">
                    <MarkdownView source={data.body} />
                  </div>
                ) : null}
              </div>
            </div>
            <p className="field-help">
              支持标题、段落、列表、引用、代码块、表格、加粗、斜体、删除线、链接、图片和行尾两空格换行；工具栏可快速插入，右侧实时预览与前台一致。
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
            <MarkdownView source={data.body} />
          </article>
        </aside>
      </div>

      {mediaOpen ? (
        <MediaPickerModal
          onClose={() => setMediaOpen(false)}
          onSelect={insertImage}
          title="从媒体库插入图片"
        />
      ) : null}

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
