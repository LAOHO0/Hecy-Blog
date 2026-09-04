"use client";

import type { ContentRecord } from "@hecy/content/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Icon } from "@/components/icon";
import {
  formatDate,
  statusClass,
  statusLabels,
  typeLabels,
} from "@/lib/presentation";

export function ContentTable({ records }: { records: ContentRecord[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [type, setType] = useState<"all" | ContentRecord["type"]>("all");
  const [status, setStatus] = useState<"all" | ContentRecord["status"]>("all");
  const [pending, startTransition] = useTransition();

  const counts = useMemo(() => {
    const map: Record<typeof type, number> = {
      all: records.length,
      article: 0,
      product: 0,
      project: 0,
    };
    for (const item of records) map[item.type] += 1;
    return map;
  }, [records]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return records.filter((item) => {
      if (type !== "all" && item.type !== type) return false;
      if (status !== "all" && item.status !== status) return false;
      if (!normalized) return true;
      return [item.title, item.slug, item.excerpt, ...item.tags]
        .join(" ")
        .toLowerCase()
        .includes(normalized);
    });
  }, [query, records, status, type]);

  function remove(item: ContentRecord) {
    if (!window.confirm(`确定删除“${item.title}”吗？此操作不可撤销。`)) return;
    startTransition(async () => {
      const response = await fetch(`/api/content/${item.id}`, {
        method: "DELETE",
      });
      if (response.ok) router.refresh();
      else window.alert("删除失败，请稍后再试。");
    });
  }

  return (
    <div>
      <div className="settings-tabs content-tabs">
        {(["all", "article", "product", "project"] as const).map((key) => (
          <button
            aria-pressed={type === key}
            className={`settings-tab${type === key ? " active" : ""}`}
            key={key}
            onClick={() => setType(key)}
            type="button"
          >
            <span className="tab-label">
              {key === "all" ? "全部" : typeLabels[key]}
            </span>
            <span className="tab-hint">{counts[key]} 条</span>
          </button>
        ))}
      </div>
      <div className="filter-bar">
        <label className="search filter-search">
          <Icon name="search" />
          <input
            aria-label="搜索内容"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索标题、Slug 或标签…"
            value={query}
          />
        </label>
        <select
          aria-label="按状态筛选"
          className="select compact"
          onChange={(event) => setStatus(event.target.value as typeof status)}
          value={status}
        >
          <option value="all">全部状态</option>
          <option value="draft">草稿</option>
          <option value="published">已发布</option>
          <option value="archived">已归档</option>
        </select>
      </div>
      <div className="table-scroll panel">
        <table className="content-table">
          <thead>
            <tr>
              <th>标题</th>
              <th>类型</th>
              <th>状态</th>
              <th>标签</th>
              <th>更新时间</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
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
                      <span className="content-subtitle">{item.slug}</span>
                    </span>
                  </Link>
                </td>
                <td className="muted">{typeLabels[item.type]}</td>
                <td>
                  <span className={`status ${statusClass[item.status]}`}>
                    {statusLabels[item.status]}
                  </span>
                </td>
                <td>
                  <div className="tag-list">
                    {item.tags.slice(0, 3).map((tag) => (
                      <span className="tag" key={tag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="muted data-font">
                  {formatDate(item.updatedAt)}
                </td>
                <td>
                  <div className="row-actions">
                    <Link
                      className="icon-button"
                      href={`/admin/content/${item.id}`}
                      aria-label={`编辑 ${item.title}`}
                    >
                      <Icon name="arrow" />
                    </Link>
                    <button
                      className="icon-button danger-button"
                      disabled={pending}
                      onClick={() => remove(item)}
                      aria-label={`删除 ${item.title}`}
                      type="button"
                    >
                      <Icon name="trash" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length ? (
          <div className="empty">没有匹配的内容。</div>
        ) : null}
      </div>
    </div>
  );
}
