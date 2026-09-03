import Link from "next/link";
import { Icon } from "@/components/icon";
import {
  buildStatusLabels,
  formatDate,
  formatToday,
  relativeTime,
  statusClass,
  statusLabels,
  typeLabels,
} from "@/lib/presentation";
import { listBuilds, listContent } from "@/lib/store";

export default async function DashboardPage() {
  const [records, builds] = await Promise.all([listContent(), listBuilds()]);
  const published = records.filter(
    (item) => item.status === "published",
  ).length;
  const drafts = records.filter((item) => item.status === "draft").length;
  const products = records.filter((item) => item.type === "product").length;
  const projects = records.filter((item) => item.type === "project").length;
  const latestBuild = builds[0];
  const recent = records
    .slice()
    .sort(
      (left, right) =>
        new Date(right.updatedAt).getTime() -
        new Date(left.updatedAt).getTime(),
    )
    .slice(0, 6);
  const queued = builds.filter(
    (item) => item.status === "queued" || item.status === "running",
  ).length;

  return (
    <div className="page-content">
      <section className="page-intro">
        <div>
          <div className="eyebrow">{formatToday()}</div>
          <h1>早上好，Hecy。</h1>
          <p>把想法整理成内容，把内容发布到世界。这里是你的创作控制台。</p>
        </div>
        <div className="intro-side">
          <span className="eyebrow">下一次发布</span>
          <strong>{queued ? "构建队列处理中" : "准备发布"}</strong>
          <span className="muted">
            {drafts} 个草稿 · {queued ? `${queued} 个任务排队` : "构建空闲"}
          </span>
        </div>
      </section>

      <section className="metrics" aria-label="内容统计">
        <Metric
          label="已发布"
          value={published}
          note="内容已上线"
          tone="good"
        />
        <Metric
          label="草稿"
          value={String(drafts).padStart(2, "0")}
          note="等待继续编辑"
        />
        <Metric
          label="产品 / 项目"
          value={String(products + projects).padStart(2, "0")}
          note={`${products} 个产品 · ${projects} 个项目`}
        />
        <Metric
          label="最近构建"
          value={
            latestBuild?.status === "success"
              ? "通过"
              : latestBuild
                ? buildStatusLabels[latestBuild.status]
                : "—"
          }
          note={
            latestBuild
              ? relativeTime(latestBuild.finishedAt || latestBuild.createdAt)
              : "尚无记录"
          }
          tone={latestBuild?.status === "success" ? "good" : undefined}
        />
      </section>

      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-head">
            <span className="panel-title">最近内容</span>
            <Link className="panel-link" href="/admin/content">
              查看全部 →
            </Link>
          </div>
          <div className="table-scroll">
            <table className="content-table">
              <thead>
                <tr>
                  <th>标题</th>
                  <th>类型</th>
                  <th>状态</th>
                  <th>更新时间</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {recent.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <Link
                        className="content-name"
                        href={`/admin/content/${item.id}`}
                      >
                        <span className="type-mark">
                          {item.type === "article"
                            ? "A"
                            : item.type === "product"
                              ? "P"
                              : "R"}
                        </span>
                        <span>
                          <span className="content-title">{item.title}</span>
                          <span className="content-subtitle">
                            {item.excerpt}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="muted">{typeLabels[item.type]}</td>
                    <td>
                      <span className={`status ${statusClass[item.status]}`}>
                        {statusLabels[item.status]}
                      </span>
                    </td>
                    <td className="muted data-font">
                      {formatDate(item.updatedAt)}
                    </td>
                    <td>
                      <Link
                        className="icon-button"
                        href={`/admin/content/${item.id}`}
                        aria-label={`编辑 ${item.title}`}
                      >
                        <Icon name="arrow" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <span className="panel-title">构建活动</span>
            <Link className="panel-link" href="/admin/builds">
              历史记录 →
            </Link>
          </div>
          <div className="build-list">
            {builds.slice(0, 4).map((build) => (
              <div className="build-item" key={build.id}>
                <span
                  className={`build-icon ${build.status === "failed" ? "failed" : build.status === "queued" || build.status === "running" ? "pending" : ""}`}
                >
                  <Icon
                    name={
                      build.status === "queued" || build.status === "running"
                        ? "clock"
                        : build.status === "failed"
                          ? "more"
                          : "check"
                    }
                  />
                </span>
                <span>
                  <span className="build-title">
                    {buildStatusLabels[build.status]} · 静态站点
                  </span>
                  <span className="build-meta">
                    {build.errorSummary ||
                      (build.commitSha
                        ? `提交 ${build.commitSha.slice(0, 8)}`
                        : "等待 GitHub Actions")}
                  </span>
                </span>
                <span className="build-time">
                  {relativeTime(build.finishedAt || build.createdAt)}
                </span>
              </div>
            ))}
            {!builds.length ? (
              <div className="empty">还没有构建记录。</div>
            ) : null}
          </div>
        </section>
      </div>

      <div className="quick-row">
        <Link className="quick-card" href="/admin/content/new?type=article">
          <span>
            <strong>写一篇文章</strong>
            <Icon name="arrow" />
          </span>
          <span>Markdown / MDX 编辑器 · 实时预览</span>
        </Link>
        <Link className="quick-card" href="/admin/content/new?type=product">
          <span>
            <strong>添加产品</strong>
            <Icon name="arrow" />
          </span>
          <span>结构化展示字段</span>
        </Link>
        <Link className="quick-card" href="/admin/media">
          <span>
            <strong>打开媒体库</strong>
            <Icon name="arrow" />
          </span>
          <span>上传 · 整理 · 复用</span>
        </Link>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: string | number;
  note: string;
  tone?: "good";
}) {
  return (
    <div className="metric">
      <span className="eyebrow">{label}</span>
      <strong className="metric-value">{value}</strong>
      <span className={`metric-note ${tone || ""}`}>
        {tone ? <Icon name="check" /> : <Icon name="clock" />}
        {note}
      </span>
    </div>
  );
}
