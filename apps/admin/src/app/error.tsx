"use client";

// 捕获 admin 段（含布局）的服务端渲染错误：生产环境默认整页白屏报错，
// 这里把错误摘要展示出来，方便定位（服务端具体原因看容器日志）。
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main style={{ fontFamily: "var(--font-ui)", padding: "80px 24px" }}>
      <h1 style={{ fontSize: 22, margin: "0 0 12px" }}>页面加载失败</h1>
      <p style={{ color: "#666", margin: "0 0 8px" }}>
        {error.message || "发生未知错误。"}
      </p>
      {error.digest ? (
        <p style={{ color: "#999", fontSize: 12, margin: "0 0 16px" }}>
          错误标识：{error.digest}
        </p>
      ) : null}
      <button
        onClick={reset}
        style={{
          background: "#171715",
          border: 0,
          borderRadius: 6,
          color: "#fff",
          cursor: "pointer",
          padding: "9px 18px",
        }}
        type="button"
      >
        重试
      </button>
    </main>
  );
}
