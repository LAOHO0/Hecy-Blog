"use client";

import { useEffect, useState } from "react";
import { ArrowUpIcon } from "./icons";

export function BackTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const update = () => setVisible(window.scrollY >= window.innerHeight);
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <button
      aria-label="返回顶部"
      className="back-top"
      data-visible={visible}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      tabIndex={visible ? 0 : -1}
      title="返回顶部"
      type="button"
    >
      <ArrowUpIcon />
    </button>
  );
}
