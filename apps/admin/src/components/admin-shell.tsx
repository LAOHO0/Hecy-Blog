"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";
import { Icon } from "./icon";
import { ThemeToggle } from "./theme-toggle";

type Props = {
  children: ReactNode;
  username: string;
  contentCount: number;
  buildCount: number;
};

const navItems = [
  { href: "/admin", label: "总览", icon: "grid" as const },
  { href: "/admin/content", label: "内容", icon: "file" as const },
  { href: "/admin/media", label: "媒体库", icon: "image" as const },
  { href: "/admin/builds", label: "构建", icon: "command" as const },
  { href: "/admin/settings", label: "设置", icon: "settings" as const },
];

function breadcrumb(pathname: string) {
  if (pathname.startsWith("/admin/content")) return "内容";
  if (pathname.startsWith("/admin/media")) return "媒体库";
  if (pathname.startsWith("/admin/builds")) return "构建";
  if (pathname.startsWith("/admin/settings")) return "设置";
  return "总览";
}

export function AdminShell({
  children,
  username,
  contentCount,
  buildCount,
}: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  async function logout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = query.trim();
    router.push(
      value
        ? `/admin/content?q=${encodeURIComponent(value)}`
        : "/admin/content",
    );
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar${mobileNavOpen ? " mobile-open" : ""}`}>
        <div className="brand">
          <span className="brand-mark">H</span>
          <span>
            <span className="brand-name">Hecy Blog</span>
            <span className="brand-meta">内容管理系统</span>
          </span>
        </div>
        <div className="workspace">
          <span className="workspace-label">
            <i className="workspace-dot" />
            <strong>个人工作区</strong>
          </span>
          <Icon name="more" />
        </div>
        <nav className="nav" aria-label="主导航">
          <div className="nav-label">工作区</div>
          {navItems.slice(0, 3).map((item) => {
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <Link
                className={`nav-item${active ? " active" : ""}`}
                href={item.href}
                key={item.href}
                onClick={() => setMobileNavOpen(false)}
              >
                <Icon name={item.icon} />
                <span>{item.label}</span>
                {item.href === "/admin/content" ? (
                  <span className="nav-count">{contentCount}</span>
                ) : null}
              </Link>
            );
          })}
          <div className="nav-label">系统</div>
          {navItems.slice(3).map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                className={`nav-item${active ? " active" : ""}`}
                href={item.href}
                key={item.href}
                onClick={() => setMobileNavOpen(false)}
              >
                <Icon name={item.icon} />
                <span>{item.label}</span>
                {item.href === "/admin/builds" ? (
                  <span className="nav-count">{buildCount}</span>
                ) : null}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <span className="avatar">{username.slice(0, 2).toUpperCase()}</span>
          <span className="account">
            <span className="account-name">{username}</span>
            <span className="account-role">管理员</span>
          </span>
          <button
            aria-label="退出登录"
            className="icon-button"
            disabled={loggingOut}
            onClick={logout}
            type="button"
          >
            <Icon name="logout" />
          </button>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <button
            aria-expanded={mobileNavOpen}
            aria-label={mobileNavOpen ? "关闭导航" : "打开导航"}
            className="mobile-nav-toggle"
            onClick={() => setMobileNavOpen((open) => !open)}
            type="button"
          >
            <span aria-hidden="true">☰</span>
          </button>
          <div className="crumbs">
            <span>Hecy Blog</span>
            <span>/</span>
            <span className="crumb-current">{breadcrumb(pathname)}</span>
          </div>
          <div className="top-actions">
            <form className="search" onSubmit={submitSearch}>
              <Icon name="search" />
              <input
                aria-label="搜索内容"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索内容…"
                value={query}
              />
            </form>
            <ThemeToggle />
            <Link className="button" href="/admin/content/new">
              <Icon name="plus" />
              新建内容
            </Link>
          </div>
        </header>
        <main>{children}</main>
      </div>
      {mobileNavOpen ? (
        <button
          aria-label="关闭导航"
          className="mobile-nav-backdrop"
          onClick={() => setMobileNavOpen(false)}
          type="button"
        />
      ) : null}
    </div>
  );
}
