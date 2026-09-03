"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/icon";
import { ThemeToggle } from "@/components/theme-toggle";

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error || "登录失败，请检查用户名和密码。");
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError("网络连接失败，请稍后再试。");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="login-screen">
      <section className="login-card">
        <div className="login-card-top">
          <div className="brand">
            <span className="brand-mark">H</span>
            <span>
              <span className="brand-name">Hecy Blog</span>
              <span className="brand-meta">内容管理系统</span>
            </span>
          </div>
          <ThemeToggle />
        </div>
        <h1>欢迎回来</h1>
        <p>登录后台，继续整理文章、产品和项目。</p>
        <form onSubmit={submit}>
          <label className="field">
            <span className="field-label">用户名</span>
            <input
              autoComplete="username"
              className="input"
              onChange={(event) => setUsername(event.target.value)}
              required
              value={username}
            />
          </label>
          <label className="field">
            <span className="field-label">密码</span>
            <input
              autoComplete="current-password"
              className="input"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>
          {error ? <div className="notice error">{error}</div> : null}
          <button className="button" disabled={pending} type="submit">
            <Icon name="arrow" />
            {pending ? "验证中…" : "登录后台"}
          </button>
        </form>
      </section>
    </main>
  );
}
