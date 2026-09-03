"use client";

import { useEffect, useState } from "react";

export function SiteThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const value = window.localStorage.getItem("hecy-site-theme") === "dark";
    setDark(value);
    document.documentElement.dataset.theme = value ? "dark" : "light";
  }, []);
  function toggle() {
    const value = !dark;
    setDark(value);
    document.documentElement.dataset.theme = value ? "dark" : "light";
    window.localStorage.setItem("hecy-site-theme", value ? "dark" : "light");
  }
  return (
    <button
      className="theme-button"
      onClick={toggle}
      aria-label={dark ? "切换浅色主题" : "切换深色主题"}
      type="button"
    >
      <svg
        aria-hidden="true"
        fill="none"
        height="16"
        viewBox="0 0 24 24"
        width="16"
        stroke="currentColor"
        strokeWidth="1.6"
      >
        {dark ? (
          <path d="M12 3v2M12 19v2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M3 12h2M19 12h2M5.6 18.4 7 17M17 7l1.4-1.4" />
        ) : (
          <path d="M20 15.3A8 8 0 0 1 8.7 4 8 8 0 1 0 20 15.3Z" />
        )}
        {dark ? <circle cx="12" cy="12" r="4" /> : null}
      </svg>
    </button>
  );
}
