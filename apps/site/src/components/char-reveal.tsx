import type { CSSProperties } from "react";

/**
 * 逐字点亮的标题动画：底层是浅色的“幽灵”完整句子，
 * 上层每个字带错峰延迟，从模糊下沉淡入点亮（纯 CSS，无 JS 依赖）。
 */
export function CharReveal({
  text,
  delay = 0,
  step = 55,
}: {
  text: string;
  /** 动画整体起始延迟（毫秒） */
  delay?: number;
  /** 相邻两个字之间的间隔（毫秒） */
  step?: number;
}) {
  const chars = Array.from(text);
  return (
    <span className="char-reveal">
      <span aria-hidden="true" className="char-reveal-ghost">
        {text}
      </span>
      <span aria-hidden="true" className="char-reveal-live">
        {chars.map((char, index) => (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: 静态文本按字符拆分，顺序固定
            key={`${index}-${char}`}
            className="char-reveal-char"
            style={
              { animationDelay: `${delay + index * step}ms` } as CSSProperties
            }
          >
            {char}
          </span>
        ))}
      </span>
    </span>
  );
}
