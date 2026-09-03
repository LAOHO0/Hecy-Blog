"use client";

import type { BuildRecord } from "@hecy/content/types";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Icon } from "@/components/icon";
import { buildStatusLabels, formatDateTime } from "@/lib/presentation";

export function BuildList({ initial }: { initial: BuildRecord[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState("");
  const [items, setItems] = useState(initial);

  async function trigger(endpoint: string, method = "POST") {
    setNotice("");
    startTransition(async () => {
      const response = await fetch(endpoint, { method });
      const payload = (await response.json().catch(() => ({}))) as {
        message?: string;
        error?: string;
        build?: BuildRecord;
      };
      if (!response.ok) {
        setNotice(payload.error || "操作失败。");
        return;
      }
      setNotice(payload.message || "构建已加入队列。");
      if (payload.build)
        setItems((current) => [payload.build as BuildRecord, ...current]);
      router.refresh();
    });
  }

  return (
    <div>
      <div className="build-toolbar">
        <p className="page-subtitle">
          发布后会自动创建构建任务；也可以在这里手动重试。
        </p>
        <button
          className="button"
          disabled={pending}
          onClick={() => trigger("/api/builds")}
          type="button"
        >
          <Icon name="command" />
          {pending ? "处理中…" : "手动构建"}
        </button>
      </div>
      {notice ? <div className="notice">{notice}</div> : null}
      <section className="panel">
        <div className="panel-head">
          <span className="panel-title">构建队列</span>
          <span className="eyebrow">{items.length} 条记录</span>
        </div>
        <div className="build-list">
          {items.map((item) => (
            <div className="build-row" key={item.id}>
              <div
                className={`build-icon ${item.status === "failed" ? "failed" : item.status === "queued" || item.status === "running" ? "pending" : ""}`}
              >
                <Icon
                  name={
                    item.status === "failed"
                      ? "more"
                      : item.status === "success"
                        ? "check"
                        : "clock"
                  }
                />
              </div>
              <div className="build-row-main">
                <strong>{buildStatusLabels[item.status]}</strong>
                <span>
                  {item.errorSummary ||
                    (item.commitSha
                      ? `提交 ${item.commitSha.slice(0, 8)}`
                      : "等待 GitHub Actions 回传状态")}
                </span>
              </div>
              <time className="muted data-font">
                {formatDateTime(item.finishedAt || item.createdAt)}
              </time>
              {item.status === "failed" ? (
                <button
                  className="button secondary"
                  disabled={pending}
                  onClick={() => trigger(`/api/builds/${item.id}/retry`)}
                  type="button"
                >
                  重试
                </button>
              ) : null}
            </div>
          ))}
          {!items.length ? <div className="empty">暂无构建记录。</div> : null}
        </div>
      </section>
    </div>
  );
}
