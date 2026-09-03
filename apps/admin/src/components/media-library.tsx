"use client";

import type { MediaAsset } from "@hecy/content/types";
import { useState, useTransition } from "react";
import { Icon } from "@/components/icon";
import { formatDateTime } from "@/lib/presentation";

export function MediaLibrary({ initial }: { initial: MediaAsset[] }) {
  const [items, setItems] = useState(initial);
  const [notice, setNotice] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function copyUrl(item: MediaAsset) {
    try {
      await navigator.clipboard.writeText(item.url);
      setCopiedId(item.id);
      setNotice("媒体 URL 已复制。");
      window.setTimeout(() => setCopiedId(null), 1600);
    } catch {
      setNotice("复制失败，请手动选择 URL。");
    }
  }

  function upload(file: File) {
    setNotice("");
    startTransition(async () => {
      const response = await fetch("/api/media/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.type,
          size: file.size,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        configured?: boolean;
        message?: string;
        uploadUrl?: string;
        key?: string;
        publicUrl?: string;
      };
      if (
        !response.ok ||
        !payload.configured ||
        !payload.uploadUrl ||
        !payload.key ||
        !payload.publicUrl
      ) {
        setNotice(payload.message || "无法创建上传地址。");
        return;
      }
      const uploadResponse = await fetch(payload.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!uploadResponse.ok) {
        setNotice("文件上传失败，请检查对象存储 CORS 配置。");
        return;
      }
      const saved = await fetch("/api/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: payload.key,
          url: payload.publicUrl,
          mimeType: file.type,
          size: file.size,
          alt: file.name,
        }),
      });
      const savedPayload = (await saved.json().catch(() => ({}))) as {
        item?: MediaAsset;
        error?: string;
      };
      if (!saved.ok || !savedPayload.item) {
        setNotice(savedPayload.error || "媒体记录保存失败。");
        return;
      }
      setItems((current) => [savedPayload.item as MediaAsset, ...current]);
      setNotice("媒体上传成功。");
    });
  }

  return (
    <div>
      <div className="media-toolbar">
        <div>
          <p className="page-subtitle">
            选择图片上传；正式环境通过 S3 兼容对象存储生成预签名地址。
          </p>
          {notice ? <div className="notice">{notice}</div> : null}
        </div>
        <label className="button">
          <Icon name="upload" />
          {pending ? "上传中…" : "上传图片"}
          <input
            accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) upload(file);
              event.currentTarget.value = "";
            }}
            type="file"
          />
        </label>
      </div>
      <section className="media-grid">
        {items.map((item) => (
          <article className="media-card" key={item.id}>
            <div className="media-thumb">
              {item.url && !item.url.startsWith("media/") ? (
                // biome-ignore lint/performance/noImgElement: S3 hosts are configured per deployment and cannot be allow-listed at build time.
                <img alt={item.alt || ""} src={item.url} />
              ) : (
                <Icon name="image" size={28} />
              )}
            </div>
            <div className="media-info">
              <strong>{item.alt || item.key}</strong>
              <span>
                {item.mimeType} · {Math.ceil(item.size / 1024)} KB
              </span>
              <small>{formatDateTime(item.createdAt)}</small>
              <button
                className="media-copy"
                onClick={() => void copyUrl(item)}
                type="button"
              >
                <Icon name="external" size={12} />
                {copiedId === item.id ? "已复制" : "复制 URL"}
              </button>
            </div>
          </article>
        ))}
        {!items.length ? (
          <div className="empty media-empty">
            还没有媒体，上传第一张图片吧。
          </div>
        ) : null}
      </section>
    </div>
  );
}
