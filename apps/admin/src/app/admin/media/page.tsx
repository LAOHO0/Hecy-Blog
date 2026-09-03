import type { Metadata } from "next";
import { MediaLibrary } from "@/components/media-library";
import { listMedia } from "@/lib/store";

export const metadata: Metadata = {
  title: "媒体库",
};

export default async function MediaPage() {
  return (
    <div className="page-content">
      <section className="page-intro">
        <div>
          <div className="eyebrow">资源管理</div>
          <h1 className="page-title">媒体库</h1>
          <p className="page-subtitle">
            集中管理封面、截图和正文图片，上传后可以在内容编辑器中复用。
          </p>
        </div>
      </section>
      <MediaLibrary initial={await listMedia()} />
    </div>
  );
}
