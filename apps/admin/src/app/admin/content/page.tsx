import Link from "next/link";
import { ContentTable } from "@/components/content-table";
import { listContent } from "@/lib/store";

export default async function ContentPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const records = await listContent({ query: params.q });
  return (
    <div className="page-content">
      <section className="page-intro">
        <div>
          <div className="eyebrow">内容工作区</div>
          <h1 className="page-title">内容</h1>
          <p className="page-subtitle">
            统一管理文章、产品和项目，先保存草稿，再预览和发布。
          </p>
        </div>
        <Link className="button" href="/admin/content/new">
          ＋ 新建内容
        </Link>
      </section>
      <ContentTable records={records} />
    </div>
  );
}
