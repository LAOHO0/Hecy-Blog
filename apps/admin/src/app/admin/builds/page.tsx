import type { Metadata } from "next";
import { BuildList } from "@/components/build-list";
import { listBuilds } from "@/lib/store";

export const metadata: Metadata = {
  title: "构建",
};

export default async function BuildsPage() {
  return (
    <div className="page-content">
      <section className="page-intro">
        <div>
          <div className="eyebrow">发布系统</div>
          <h1 className="page-title">构建</h1>
          <p className="page-subtitle">
            查看静态站点构建队列、结果和错误摘要。
          </p>
        </div>
      </section>
      <BuildList initial={await listBuilds()} />
    </div>
  );
}
