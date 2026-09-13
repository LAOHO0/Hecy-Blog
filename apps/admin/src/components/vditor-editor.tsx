"use client";

import "vditor/dist/index.css";

import { useEffect, useRef, useState } from "react";
import type VditorType from "vditor";

export type VditorApi = {
  insertValue: (value: string) => void;
};

type VditorEditorProps = {
  value: string;
  onChange: (value: string) => void;
  onReady?: (api: VditorApi) => void;
  minHeight?: number;
};

/**
 * Vditor 所见即所得编辑器：粘贴 / 拖拽 / 工具栏上传的图片
 * 按存储驱动分流：local 直传后台，s3 走预签名直传对象存储。
 * 上传成功后以标准 Markdown 图片语法插入正文。
 */
export function VditorEditor({
  value,
  onChange,
  onReady,
  minHeight = 460,
}: VditorEditorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const vditorRef = useRef<VditorType | null>(null);
  const onChangeRef = useRef(onChange);
  const onReadyRef = useRef(onReady);
  const minHeightRef = useRef(minHeight);
  // 仅作初始内容；之后编辑器内部状态驱动，避免受控循环重建。
  const initialValueRef = useRef(value);
  const themeObserverRef = useRef<MutationObserver | null>(null);
  const [uploading, setUploading] = useState(false);
  const [initError, setInitError] = useState("");
  onChangeRef.current = onChange;
  onReadyRef.current = onReady;

  // 编辑器只初始化一次；后续 value 变化由编辑器内部状态驱动，
  // minHeight / onReady 经 ref 读取最新值。
  useEffect(() => {
    const minHeight = minHeightRef.current;
    let destroyed = false;
    let instance: VditorType | null = null;

    /**
     * 上传成功返回 URL，失败返回错误信息。
     * 先探测预签名接口的存储驱动：local 直传后台；s3 走预签名
     * PUT（需在对象存储上配置 CORS，与媒体库页面要求一致）。
     */
    async function uploadImage(
      file: File,
    ): Promise<{ url?: string; error?: string }> {
      const presignResponse = await fetch("/api/media/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.type,
          size: file.size,
        }),
      });
      const presign = (await presignResponse.json().catch(() => ({}))) as {
        driver?: "local" | "s3";
        configured?: boolean;
        uploadUrl?: string;
        key?: string;
        publicUrl?: string;
        message?: string;
        error?: string;
      };

      if (presignResponse.ok && presign.driver === "s3") {
        if (
          !presign.configured ||
          !presign.uploadUrl ||
          !presign.key ||
          !presign.publicUrl
        ) {
          return { error: presign.message || "尚未配置对象存储。" };
        }
        const put = await fetch(presign.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });
        if (!put.ok) {
          return { error: "对象存储上传失败，请检查 CORS 配置。" };
        }
        const save = await fetch("/api/media", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            key: presign.key,
            url: presign.publicUrl,
            mimeType: file.type,
            size: file.size,
            alt: file.name,
          }),
        });
        const saved = (await save.json().catch(() => ({}))) as {
          item?: { url: string };
          error?: string;
        };
        if (!save.ok || !saved.item) {
          return { error: saved.error || "媒体记录保存失败。" };
        }
        return { url: saved.item.url };
      }

      const form = new FormData();
      form.append("file", file);
      const response = await fetch("/api/media/upload", {
        method: "POST",
        body: form,
      });
      const payload = (await response.json().catch(() => ({}))) as {
        item?: { url: string };
        error?: string;
      };
      if (!response.ok || !payload.item) {
        return { error: payload.error || "图片上传失败。" };
      }
      return { url: payload.item.url };
    }

    /** 依次上传并插入正文；返回错误信息或 null。 */
    async function runUpload(files: File[]): Promise<string | null> {
      setUploading(true);
      for (const file of files) {
        const result = await uploadImage(file);
        if (result.error) {
          setUploading(false);
          return result.error;
        }
        // handler 自定义上传不会自动插入正文，这里手动插入。
        instance?.insertValue(
          `![${file.name.replace(/\.[a-z0-9]+$/i, "")}](${result.url})`,
        );
      }
      setUploading(false);
      return null;
    }

    async function init() {
      try {
        const { default: VditorCtor } = await import("vditor");

        if (destroyed || !containerRef.current) return;

        instance = new VditorCtor(containerRef.current, {
          mode: "wysiwyg",
          value: initialValueRef.current,
          lang: "zh_CN",
          theme: "classic",
          cdn: "/vditor",
          height: minHeight,
          cache: { enable: false },
          undoDelay: 400,
          toolbar: [
            "headings",
            "bold",
            "italic",
            "strike",
            "|",
            "list",
            "ordered-list",
            "quote",
            "line",
            "|",
            "link",
            "upload",
            "table",
            "code",
            "inline-code",
            "|",
            "undo",
            "redo",
            "|",
            "edit-mode",
            "fullscreen",
          ],
          upload: {
            accept: "image/png,image/jpeg,image/gif,image/webp,image/svg+xml",
            max: 15 * 1024 * 1024,
            multiple: false,
            handler(files: File[]) {
              return runUpload(files).then(
                (error) => error ?? null,
              ) as Promise<null>;
            },
          },
          input: (markdown) => {
            onChangeRef.current(markdown);
          },
          after: () => {
            if (destroyed) return;
            vditorRef.current = instance;
            // 跟随后台明暗主题切换
            const applyTheme = () => {
              instance?.setTheme(
                document.documentElement.dataset.theme === "dark"
                  ? "dark"
                  : "classic",
              );
            };
            applyTheme();
            themeObserverRef.current = new MutationObserver(applyTheme);
            themeObserverRef.current.observe(document.documentElement, {
              attributeFilter: ["data-theme"],
            });
            onReadyRef.current?.({
              insertValue: (inserted) => {
                instance?.insertValue(inserted);
                onChangeRef.current(instance?.getValue() ?? "");
              },
            });
          },
        });
      } catch (error) {
        setInitError(String(error));
      }
    }

    init();
    return () => {
      destroyed = true;
      themeObserverRef.current?.disconnect();
      themeObserverRef.current = null;
      instance?.destroy();
      vditorRef.current = null;
    };
    // 仅初始化一次；value 的后续变化由编辑器内部状态驱动。
  }, []);

  return (
    <div className="vditor-shell">
      {uploading ? (
        <div className="vditor-uploading-tip">图片上传中…</div>
      ) : null}
      {initError ? <pre className="vditor-init-error">{initError}</pre> : null}
      <div ref={containerRef} />
    </div>
  );
}
