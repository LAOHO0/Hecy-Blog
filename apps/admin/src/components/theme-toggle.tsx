"use client";

import { useEffect, useState } from "react";
import { Icon } from "./icon";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("hecy-theme");
    const next = saved === "dark";
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    window.localStorage.setItem("hecy-theme", next ? "dark" : "light");
  }

  return (
    <button
      aria-label={dark ? "切换到浅色主题" : "切换到深色主题"}
      className="icon-button"
      onClick={toggle}
      type="button"
    >
      <Icon name={dark ? "sun" : "moon"} />
    </button>
  );
}
