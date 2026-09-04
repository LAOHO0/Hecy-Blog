import { LATEST_PRODUCT_LINK } from "@hecy/content/settings";
import type { HomepageSettings } from "@hecy/content/types";

const ICON_COLORS: Record<string, string> = {
  Vue: "#42b883",
  Vite: "#8a42ff",
  React: "#28a9df",
  "Next.js": "#9c9a92",
  TypeScript: "#3178c6",
  Bun: "#d7a54c",
  "Node.js": "#4caf50",
  Docker: "#2496ed",
  Python: "#3776ab",
  Raycast: "#ff6363",
  Chrome: "#4285f4",
  TikTok: "#69c9d0",
};

function linkHint(link: string | undefined) {
  if (!link) return undefined;
  if (link === LATEST_PRODUCT_LINK) return "→ 最新产品";
  try {
    if (link.startsWith("http"))
      return `→ ${new URL(link).host}${new URL(link).pathname}`;
  } catch {
    // 非 http 链接（站内路径）原样展示。
  }
  return `→ ${link}`;
}

function pad(index: number) {
  return String(index + 1).padStart(2, "0");
}

/** 首页“关于我 / Skills / Now”版块的实时预览，随表单输入即时更新。 */
export function HomePreview({ home }: { home: HomepageSettings }) {
  return (
    <aside aria-hidden="true" className="home-preview">
      <span className="home-preview-badge">首页预览</span>
      <div>
        <p className="hp-greeting">
          {home.greeting || "（问候语为空，前台将隐藏此行）"}
        </p>
        <p className="hp-headline">
          {home.headline || "（主标题为空，前台将显示站点名称）"}
        </p>
      </div>
      <div className="hp-columns">
        <div className="hp-about">
          <p className="hp-kicker">关于我</p>
          <div className="hp-profile">
            <span>{home.role || "—"}</span>
            <span>{home.location || "—"}</span>
          </div>
          {home.skills.length ? (
            <>
              <p className="hp-kicker hp-skills-kicker">Skills</p>
              <div className="hp-skills">
                {home.skills.map((skill, index) => (
                  <span
                    className="hp-skill"
                    // biome-ignore lint/suspicious/noArrayIndexKey: 预览为只读展示，允许重复条目按顺序渲染
                    key={`${skill.name}-${index}`}
                  >
                    <span
                      className="hp-dot"
                      style={{
                        background: ICON_COLORS[skill.icon] ?? "var(--faint)",
                      }}
                    />
                    {skill.name}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <p className="hp-empty">未添加技能，前台将隐藏该版块。</p>
          )}
        </div>
        <div className="hp-now">
          <p className="hp-kicker">Now</p>
          <p className="hp-now-title">{home.nowTitle || "—"}</p>
          {home.nowItems.length ? (
            <ol className="hp-now-list">
              {home.nowItems.map((item, index) => {
                const hint = linkHint(item.link);
                return (
                  <li
                    className="hp-now-item"
                    // biome-ignore lint/suspicious/noArrayIndexKey: 预览为只读展示，允许重复条目按顺序渲染
                    key={`${item.label}-${index}`}
                  >
                    <span className="hp-now-idx">
                      {pad(index)} / {item.label}
                    </span>
                    <span className="hp-now-copy">
                      {item.content}
                      {hint ? (
                        <span className="hp-link-chip">{hint}</span>
                      ) : null}
                    </span>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="hp-empty">未添加动态，前台将隐藏该版块。</p>
          )}
        </div>
      </div>
    </aside>
  );
}
