"use client";

import { useEffect, useState } from "react";
import { MoonIcon, SunIcon } from "./icons";

export function SiteThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("hecy-site-theme");
    const value =
      stored === "dark" ||
      (stored !== "light" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
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
      aria-label={dark ? "切换浅色主题" : "切换深色主题"}
      aria-pressed={dark}
      className="theme-button"
      onClick={toggle}
      type="button"
    >
      {dark ? <MoonIcon /> : <SunIcon />}
    </button>
  );
}
