"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

/** 进入视口时以“模糊 + 上浮”渐显；首屏元素挂载后立即触发，形成开场入场。 */
export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  /** 过渡延迟（毫秒），用于同屏多个元素的错峰 */
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -36px 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={`reveal${visible ? " is-visible" : ""}${className ? ` ${className}` : ""}`}
      ref={ref}
      style={
        delay ? ({ transitionDelay: `${delay}ms` } as CSSProperties) : undefined
      }
    >
      {children}
    </div>
  );
}
