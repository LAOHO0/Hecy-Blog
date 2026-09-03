import type { SiteSettings } from "@hecy/content/types";
import Link from "next/link";
import { SiteThemeToggle } from "./site-theme-toggle";

export function SiteHeader({
  settings,
  active,
}: {
  settings: SiteSettings;
  active?: string;
}) {
  return (
    <header className="site-header">
      <Link className="site-brand" href="/">
        {settings.avatarUrl ? (
          // biome-ignore lint/performance/noImgElement: the avatar URL is user-configured and may be hosted outside the Next image allow-list.
          <img
            alt=""
            className="site-brand-avatar"
            height={32}
            src={settings.avatarUrl}
            width={32}
          />
        ) : (
          <span className="site-brand-mark">H</span>
        )}
        <span>
          <span className="site-brand-name">{settings.title}</span>
          <span className="site-brand-meta">个人内容站</span>
        </span>
      </Link>
      <nav aria-label="主导航" className="site-nav">
        {settings.navigation.map((item) => (
          <Link
            className={active === item.href ? "active" : ""}
            href={item.href}
            key={item.href}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="site-header-actions">
        <SiteThemeToggle />
      </div>
    </header>
  );
}

export function SiteFooter({ settings }: { settings: SiteSettings }) {
  return (
    <footer className="site-footer">
      <span>{settings.footerText}</span>
      <span className="site-footer-right">
        <span>{settings.bio}</span>
        {settings.socialLinks.length ? (
          <span className="site-social-links">
            {settings.socialLinks.map((item) => (
              <a
                href={item.url}
                key={item.url}
                rel="noreferrer"
                target="_blank"
              >
                {item.label} ↗
              </a>
            ))}
          </span>
        ) : null}
      </span>
    </footer>
  );
}
