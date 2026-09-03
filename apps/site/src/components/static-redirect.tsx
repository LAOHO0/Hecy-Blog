"use client";

import { useEffect } from "react";

export function StaticRedirect({ to }: { to: string }) {
  useEffect(() => {
    window.location.replace(to);
  }, [to]);

  return (
    <main className="not-found">
      <div className="eyebrow">页面已迁移</div>
      <h1>正在前往新地址</h1>
      <p>
        如果页面没有自动跳转，请 <a href={to}>点击这里继续</a>。
      </p>
    </main>
  );
}
