import type { SiteSettings } from "@hecy/content/types";
import Link from "next/link";
import { GithubIcon } from "./icons";
import { SiteThemeToggle } from "./site-theme-toggle";

export function SiteHeader({
  settings,
  active,
}: {
  settings: SiteSettings;
  active?: string;
}) {
  const navigation = settings.navigation.length
    ? settings.navigation
    : [
        { label: "首页", href: "/" },
        { label: "博客", href: "/blog" },
        { label: "产品", href: "/products" },
        { label: "关于", href: "/#about" },
      ];

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link className="site-brand" href="/" aria-label={settings.title}>
          <span className="site-brand-label">{settings.title}</span>
        </Link>
        <nav aria-label="主导航" className="site-nav">
          {navigation.map((item) => (
            <Link
              aria-current={active === item.href ? "page" : undefined}
              href={item.href}
              key={item.href}
            >
              {item.href === "/blog" ? "博客" : item.label}
            </Link>
          ))}
          <SiteThemeToggle />
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter({ settings }: { settings: SiteSettings }) {
  const github = settings.socialLinks.find((item) =>
    item.url.toLowerCase().includes("github.com"),
  );

  return (
    <footer className="site-footer">
      <span>{settings.footerText}</span>
      <span className="site-footer-right">
        {github ? (
          <a
            aria-label={`${github.label} 链接`}
            className="site-social-icon"
            href={github.url}
            rel="noreferrer"
            target="_blank"
            title={github.label}
          >
            <GithubIcon />
          </a>
        ) : settings.socialLinks.length ? (
          <span className="site-social-links">
            {settings.socialLinks.map((item) => (
              <a
                href={item.url}
                key={item.url}
                rel="noreferrer"
                target="_blank"
              >
                {item.label} <span aria-hidden="true">↗</span>
              </a>
            ))}
          </span>
        ) : null}
      </span>
    </footer>
  );
}
