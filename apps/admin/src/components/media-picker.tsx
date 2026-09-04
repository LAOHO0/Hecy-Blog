"use client";

import type { MediaAsset } from "@hecy/content/types";
import { useCallback, useEffect, useRef, useState } from "react";

async function fetchMedia(): Promise<MediaAsset[]> {
  const response = await fetch("/api/media");
  const payload = (await response.json().catch(() => ({}))) as {
    items?: MediaAsset[];
  };
  return payload.items ?? [];
}

async function uploadMedia(file: File): Promise<MediaAsset> {
  const presignResponse = await fetch("/api/media/presign", {
    headers: { "Content-Type": "application/json" },
    method: "POST",
    body: JSON.stringify({
      fileName: file.name,
      mimeType: file.type,
      size: file.size,
    }),
  });
  const presign = (await presignResponse.json().catch(() => ({}))) as {
    configured?: boolean;
    message?: string;
    error?: string;
    key?: string;
    uploadUrl?: string;
    publicUrl?: string;
  };
  if (!presignResponse.ok) {
    throw new Error(presign.error || "获取上传地址失败。");
  }
  if (presign.configured === false) {
    throw new Error(presign.message || "未配置对象存储。");
  }
  if (!presign.uploadUrl || !presign.key || !presign.publicUrl) {
    throw new Error("上传地址无效。");
  }
  const put = await fetch(presign.uploadUrl, {
    body: file,
    headers: { "Content-Type": file.type },
    method: "PUT",
  });
  if (!put.ok) throw new Error("文件上传失败，请稍后再试。");
  const registerResponse = await fetch("/api/media", {
    headers: { "Content-Type": "application/json" },
    method: "POST",
    body: JSON.stringify({
      key: presign.key,
      url: presign.publicUrl,
      mimeType: file.type,
      size: file.size,
      alt: file.name,
    }),
  });
  const registered = (await registerResponse.json().catch(() => ({}))) as {
    item?: MediaAsset;
    error?: string;
  };
  if (!registerResponse.ok || !registered.item) {
    throw new Error(registered.error || "媒体登记失败。");
  }
  return registered.item;
}

/** 媒体库选择弹窗：可选已有图片，也可直接上传（依赖 S3 配置）。 */
export function MediaPickerModal({
  onClose,
  onSelect,
  title,
}: {
  onClose: () => void;
  onSelect: (asset: MediaAsset) => void;
  title: string;
}) {
  const [items, setItems] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchMedia().then((list) => {
      if (!cancelled) {
        setItems(list);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleUpload = useCallback(
    async (file: File | undefined) => {
      if (!file) return;
      setUploading(true);
      setMessage("");
      try {
        const asset = await uploadMedia(file);
        setItems((current) => [asset, ...current]);
        onSelect(asset);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "上传失败。");
      } finally {
        setUploading(false);
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [onSelect],
  );

  return (
    <div
      aria-labelledby="media-picker-title"
      aria-modal="true"
      className="modal-backdrop"
      role="dialog"
    >
      <section className="modal media-modal">
        <div className="panel-head">
          <span className="panel-title" id="media-picker-title">
            {title}
          </span>
          <button className="icon-button" onClick={onClose} type="button">
            ×
          </button>
        </div>
        <div className="media-upload-row">
          <input
            accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
            onChange={(event) => void handleUpload(event.target.files?.[0])}
            ref={inputRef}
            type="file"
          />
          {uploading ? <span className="muted">上传中…</span> : null}
        </div>
        {message ? <div className="notice error">{message}</div> : null}
        {loading ? (
          <div className="empty">加载中…</div>
        ) : items.length ? (
          <div className="media-picker-grid">
            {items.map((asset) => (
              <button
                className="media-thumb"
                key={asset.id}
                onClick={() => onSelect(asset)}
                title={asset.alt || asset.key}
                type="button"
              >
                <img alt="" src={asset.url} />
                <span className="media-thumb-name">
                  {asset.alt || asset.key.split("/").at(-1)}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="empty">
            媒体库还是空的。上传图片后会保存在对象存储（需要配置 S3 环境变量）。
          </div>
        )}
      </section>
    </div>
  );
}
