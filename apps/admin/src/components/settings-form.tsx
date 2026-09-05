"use client";

import {
  backgroundPresets,
  homepageIconGroups,
  homepageIconOptions,
  LATEST_PRODUCT_LINK,
  homepageLimits as limits,
} from "@hecy/content/settings";
import type {
  HomepageNowItem,
  HomepageSettings,
  HomepageSkill,
  SiteSettings,
} from "@hecy/content/types";
import { useState, useTransition } from "react";
import { HomePreview } from "@/components/home-preview";
import { Icon } from "@/components/icon";
import { MediaPickerModal } from "@/components/media-picker";
import { createClientKey } from "@/lib/client-key";

type SettingsErrors = Record<string, string>;
type TabKey = "basic" | "about" | "now";

const TABS: { key: TabKey; label: string; hint: string }[] = [
  { key: "basic", label: "基础信息", hint: "站点名称 · 问候语" },
  { key: "about", label: "关于我", hint: "职业 · 技能" },
  { key: "now", label: "最近动态", hint: "动态条目" },
];

const ERROR_TAB: Record<string, TabKey> = {
  greeting: "basic",
  headline: "basic",
  role: "about",
  skills: "about",
  nowTitle: "now",
  nowItems: "now",
};

function errorTab(key: string): TabKey {
  if (key in ERROR_TAB) return ERROR_TAB[key];
  if (key.startsWith("skill-")) return "about";
  if (key.startsWith("now-")) return "now";
  return "basic";
}

function isSafeLink(value: string) {
  if (value.startsWith("/") || value.startsWith("#")) {
    return !value.startsWith("//");
  }
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

const LINK_LIMITS = { label: 60, url: 500, count: 20 } as const;

const CUSTOM_ICON = "__custom";

function isImageIcon(icon: string) {
  if (/^https?:\/\//.test(icon)) return true;
  if (icon.startsWith("/")) return !icon.startsWith("//");
  try {
    return ["http:", "https:"].includes(new URL(icon).protocol);
  } catch {
    return false;
  }
}

function validateSettings(settings: SiteSettings): SettingsErrors {
  const errors: SettingsErrors = {};
  const home = settings.homepage;

  if (!settings.title.trim()) errors.title = "站点标题不能为空。";
  else if (settings.title.trim().length > 120)
    errors.title = "站点标题不能超过 120 字。";
  if (settings.tagline.trim().length > 240)
    errors.tagline = "简介不能超过 240 字。";
  if (settings.bio.trim().length > 1000)
    errors.bio = "简介内容不能超过 1000 字。";
  const avatar = settings.avatarUrl?.trim();
  if (avatar && !isSafeLink(avatar))
    errors.avatarUrl = "头像 URL 必须是 http(s) 链接。";
  if (home.greeting.trim().length > limits.greeting)
    errors.greeting = `问候语不能超过 ${limits.greeting} 字。`;
  if (home.headline.trim().length > limits.headline)
    errors.headline = `首页主标题不能超过 ${limits.headline} 字。`;
  if (!home.role.trim()) errors.role = "职业不能为空。";
  else if (home.role.trim().length > limits.role)
    errors.role = `职业不能超过 ${limits.role} 字。`;
  if (!home.location.trim()) errors.location = "所在地不能为空。";
  else if (home.location.trim().length > limits.location)
    errors.location = `所在地不能超过 ${limits.location} 字。`;
  if (!home.nowTitle.trim()) errors.nowTitle = "动态标题不能为空。";
  else if (home.nowTitle.trim().length > limits.nowTitle)
    errors.nowTitle = `动态标题不能超过 ${limits.nowTitle} 字。`;

  if (home.skills.length > limits.skills)
    errors.skills = `技能数量不能超过 ${limits.skills} 个。`;
  home.skills.forEach((skill, index) => {
    if (!skill.name.trim())
      errors[`skill-${index}-name`] = "技能名称不能为空。";
    else if (skill.name.trim().length > limits.skillName)
      errors[`skill-${index}-name`] =
        `技能名称不能超过 ${limits.skillName} 字。`;
    const icon = skill.icon.trim();
    if (icon && !homepageIconOptions.includes(icon) && !isImageIcon(icon))
      errors[`skill-${index}-icon`] = "图标需为预置图标或图片链接。";
  });

  const bgImage = settings.background.imageUrl?.trim();
  if (bgImage && !isSafeLink(bgImage))
    errors.backgroundImage = "背景图片必须是 http(s) 链接。";

  if (home.nowItems.length > limits.nowItems)
    errors.nowItems = `动态条目不能超过 ${limits.nowItems} 个。`;
  home.nowItems.forEach((item, index) => {
    if (!item.label.trim()) errors[`now-${index}-label`] = "动态标签不能为空。";
    else if (item.label.trim().length > limits.nowLabel)
      errors[`now-${index}-label`] = `动态标签不能超过 ${limits.nowLabel} 字。`;
    if (!item.content.trim())
      errors[`now-${index}-content`] = "动态内容不能为空。";
    else if (item.content.trim().length > limits.nowContent)
      errors[`now-${index}-content`] =
        `动态内容不能超过 ${limits.nowContent} 字。`;
    const link = item.link?.trim();
    if (link && link !== LATEST_PRODUCT_LINK && !isSafeLink(link))
      errors[`now-${index}-link`] =
        "链接需为 http(s)、站内路径或 latest-product。";
  });

  settings.socialLinks.forEach((item, index) => {
    if (!item.label.trim()) errors[`social-${index}-label`] = "名称不能为空。";
    else if (item.label.trim().length > LINK_LIMITS.label)
      errors[`social-${index}-label`] =
        `名称不能超过 ${LINK_LIMITS.label} 字。`;
    const url = item.url.trim();
    if (!url) errors[`social-${index}-url`] = "链接不能为空。";
    else if (url.length > LINK_LIMITS.url)
      errors[`social-${index}-url`] = `链接不能超过 ${LINK_LIMITS.url} 字。`;
    else if (!isSafeLink(url))
      errors[`social-${index}-url`] = "社交链接需为 http(s) 地址。";
  });
  settings.navigation.forEach((item, index) => {
    if (!item.label.trim())
      errors[`navigation-${index}-label`] = "名称不能为空。";
    else if (item.label.trim().length > LINK_LIMITS.label)
      errors[`navigation-${index}-label`] =
        `名称不能超过 ${LINK_LIMITS.label} 字。`;
    const href = item.href.trim();
    if (!href) errors[`navigation-${index}-href`] = "路径不能为空。";
    else if (href.length > LINK_LIMITS.url)
      errors[`navigation-${index}-href`] =
        `路径不能超过 ${LINK_LIMITS.url} 字。`;
    else if (!isSafeLink(href))
      errors[`navigation-${index}-href`] =
        "路径需为 http(s)、/ 或 # 开头，例如 /blog 或 https://…";
  });
  return errors;
}

function CharCount({ value, max }: { value: string; max: number }) {
  const over = value.trim().length > max;
  return (
    <span className={`char-count${over ? " over" : ""}`}>
      {value.trim().length}/{max}
    </span>
  );
}

function RowActions({
  index,
  count,
  onMove,
  onRemove,
  label,
}: {
  index: number;
  count: number;
  onMove: (from: number, to: number) => void;
  onRemove: () => void;
  label: string;
}) {
  return (
    <span className="row-actions">
      <button
        className="icon-button"
        disabled={index === 0}
        onClick={() => onMove(index, index - 1)}
        title={`上移${label}`}
        type="button"
      >
        ↑
      </button>
      <button
        className="icon-button"
        disabled={index === count - 1}
        onClick={() => onMove(index, index + 1)}
        title={`下移${label}`}
        type="button"
      >
        ↓
      </button>
      <button
        className="icon-button danger"
        onClick={onRemove}
        title={`删除${label}`}
        type="button"
      >
        <Icon name="trash" />
      </button>
    </span>
  );
}

export function SettingsForm({ initial }: { initial: SiteSettings }) {
  const [settings, setSettings] = useState(initial);
  const [activeTab, setActiveTab] = useState<TabKey>("basic");
  const [errors, setErrors] = useState<SettingsErrors>({});
  const [notice, setNotice] = useState("");
  const [pending, startTransition] = useTransition();
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);
  // 编辑行会增删和排序，用稳定 key 避免受控输入跟随索引错位。
  const [skillKeys, setSkillKeys] = useState(() =>
    initial.homepage.skills.map(() => createClientKey()),
  );
  const [nowKeys, setNowKeys] = useState(() =>
    initial.homepage.nowItems.map(() => createClientKey()),
  );
  const [socialKeys, setSocialKeys] = useState(() =>
    initial.socialLinks.map(() => createClientKey()),
  );
  const [navKeys, setNavKeys] = useState(() =>
    initial.navigation.map(() => createClientKey()),
  );

  const home = settings.homepage;

  function update<K extends keyof SiteSettings>(
    key: K,
    value: SiteSettings[K],
  ) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  function updateHome<K extends keyof HomepageSettings>(
    key: K,
    value: HomepageSettings[K],
  ) {
    setSettings((current) => ({
      ...current,
      homepage: { ...current.homepage, [key]: value },
    }));
  }

  function updateSkill(index: number, patch: Partial<HomepageSkill>) {
    setSettings((current) => ({
      ...current,
      homepage: {
        ...current.homepage,
        skills: current.homepage.skills.map((skill, i) =>
          i === index ? { ...skill, ...patch } : skill,
        ),
      },
    }));
  }

  function moveItem<T>(items: T[], from: number, to: number): T[] {
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    return next;
  }

  function moveSkill(from: number, to: number) {
    setSettings((current) => ({
      ...current,
      homepage: {
        ...current.homepage,
        skills: moveItem(current.homepage.skills, from, to),
      },
    }));
    setSkillKeys((keys) => moveItem(keys, from, to));
  }

  function removeSkill(index: number) {
    updateHome(
      "skills",
      home.skills.filter((_, i) => i !== index),
    );
    setSkillKeys((keys) => keys.filter((_, i) => i !== index));
  }

  function moveNow(from: number, to: number) {
    setSettings((current) => ({
      ...current,
      homepage: {
        ...current.homepage,
        nowItems: moveItem(current.homepage.nowItems, from, to),
      },
    }));
    setNowKeys((keys) => moveItem(keys, from, to));
  }

  function removeNow(index: number) {
    updateHome(
      "nowItems",
      home.nowItems.filter((_, i) => i !== index),
    );
    setNowKeys((keys) => keys.filter((_, i) => i !== index));
  }

  function addSkill() {
    if (home.skills.length >= limits.skills) return;
    updateHome("skills", [...home.skills, { name: "", icon: "" }]);
    setSkillKeys((keys) => [...keys, createClientKey()]);
  }

  function addNow() {
    if (home.nowItems.length >= limits.nowItems) return;
    updateHome("nowItems", [
      ...home.nowItems,
      { label: "", content: "" } satisfies HomepageNowItem,
    ]);
    setNowKeys((keys) => [...keys, createClientKey()]);
  }

  function updateSocial(
    index: number,
    patch: Partial<{ label: string; url: string }>,
  ) {
    update(
      "socialLinks",
      settings.socialLinks.map((item, i) =>
        i === index ? { ...item, ...patch } : item,
      ),
    );
  }

  function addSocial() {
    if (settings.socialLinks.length >= LINK_LIMITS.count) return;
    update("socialLinks", [...settings.socialLinks, { label: "", url: "" }]);
    setSocialKeys((keys) => [...keys, createClientKey()]);
  }

  function removeSocial(index: number) {
    update(
      "socialLinks",
      settings.socialLinks.filter((_, i) => i !== index),
    );
    setSocialKeys((keys) => keys.filter((_, i) => i !== index));
  }

  function moveSocial(from: number, to: number) {
    update("socialLinks", moveItem(settings.socialLinks, from, to));
    setSocialKeys((keys) => moveItem(keys, from, to));
  }

  function updateNav(
    index: number,
    patch: Partial<{ label: string; href: string }>,
  ) {
    update(
      "navigation",
      settings.navigation.map((item, i) =>
        i === index ? { ...item, ...patch } : item,
      ),
    );
  }

  function addNav() {
    if (settings.navigation.length >= LINK_LIMITS.count) return;
    update("navigation", [...settings.navigation, { label: "", href: "" }]);
    setNavKeys((keys) => [...keys, createClientKey()]);
  }

  function removeNav(index: number) {
    update(
      "navigation",
      settings.navigation.filter((_, i) => i !== index),
    );
    setNavKeys((keys) => keys.filter((_, i) => i !== index));
  }

  function moveNav(from: number, to: number) {
    update("navigation", moveItem(settings.navigation, from, to));
    setNavKeys((keys) => moveItem(keys, from, to));
  }

  function save() {
    const nextErrors = validateSettings(settings);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      const firstKey = Object.keys(nextErrors)[0];
      setActiveTab(errorTab(firstKey));
      setNotice("请先修正表单中标红的错误。");
      return;
    }
    startTransition(async () => {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...settings,
          socialLinks: settings.socialLinks.map((item) => ({
            label: item.label.trim(),
            url: item.url.trim(),
          })),
          navigation: settings.navigation.map((item) => ({
            label: item.label.trim(),
            href: item.href.trim(),
          })),
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        settings?: SiteSettings;
        error?: string;
        message?: string;
      };
      if (response.ok) {
        setNotice(
          payload.message
            ? `站点设置已保存。${payload.message}`
            : "站点设置已保存。构建完成后前台首页会同步更新。",
        );
        if (payload.settings) setSettings(payload.settings);
      } else {
        setNotice(payload.error || "保存失败。");
      }
    });
  }

  return (
    <div className="settings-layout">
      <section className="panel settings-panel">
        <div className="settings-tabs">
          {TABS.map((tab) => (
            <button
              aria-pressed={activeTab === tab.key}
              className={`settings-tab${activeTab === tab.key ? " active" : ""}`}
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              type="button"
            >
              <span className="tab-label">{tab.label}</span>
              <span className="tab-hint">{tab.hint}</span>
            </button>
          ))}
        </div>

        {activeTab === "basic" ? (
          <div className="form-grid settings-fields">
            <label className="field full">
              <span className="field-label">站点标题</span>
              <input
                className={`input input-large${errors.title ? " invalid" : ""}`}
                onChange={(event) => update("title", event.target.value)}
                value={settings.title}
              />
              {errors.title ? (
                <span className="field-error">{errors.title}</span>
              ) : null}
            </label>
            <label className="field full">
              <span className="field-label">一句话简介</span>
              <input
                className="input"
                onChange={(event) => update("tagline", event.target.value)}
                value={settings.tagline}
              />
            </label>
            <label className="field full">
              <span className="field-label">关于我 / 站点简介</span>
              <textarea
                className="textarea"
                onChange={(event) => update("bio", event.target.value)}
                value={settings.bio}
              />
            </label>
            <div className="field">
              <span className="field-label">头像 URL</span>
              <span className="avatar-row">
                <input
                  className={`input${errors.avatarUrl ? " invalid" : ""}`}
                  onChange={(event) => update("avatarUrl", event.target.value)}
                  placeholder="https://…"
                  value={settings.avatarUrl || ""}
                />
                <button
                  className="button secondary"
                  onClick={() => setAvatarPickerOpen(true)}
                  type="button"
                >
                  上传
                </button>
              </span>
              {errors.avatarUrl ? (
                <span className="field-error">{errors.avatarUrl}</span>
              ) : null}
            </div>
            <label className="field">
              <span className="field-label">页脚文字</span>
              <input
                className="input"
                onChange={(event) => update("footerText", event.target.value)}
                value={settings.footerText}
              />
            </label>
            <label className="field full">
              <span className="field-label-with-count">
                首页问候语
                <CharCount max={limits.greeting} value={home.greeting} />
              </span>
              <input
                className={`input${errors.greeting ? " invalid" : ""}`}
                onChange={(event) => updateHome("greeting", event.target.value)}
                placeholder="你好，这里是 …"
                value={home.greeting}
              />
              {errors.greeting ? (
                <span className="field-error">{errors.greeting}</span>
              ) : null}
            </label>
            <label className="field full">
              <span className="field-label-with-count">
                首页主标题
                <CharCount max={limits.headline} value={home.headline} />
              </span>
              <input
                className={`input${errors.headline ? " invalid" : ""}`}
                onChange={(event) => updateHome("headline", event.target.value)}
                value={home.headline}
              />
              {errors.headline ? (
                <span className="field-error">{errors.headline}</span>
              ) : null}
            </label>
            <div className="field full">
              <span className="field-label-with-count">
                社交链接（{settings.socialLinks.length}/{LINK_LIMITS.count}）
              </span>
              <div className="skill-editor">
                {settings.socialLinks.map((item, index) => (
                  <div className="editor-row" key={socialKeys[index]}>
                    <input
                      aria-label={`社交链接 ${index + 1} 名称`}
                      className={`input${errors[`social-${index}-label`] ? " invalid" : ""}`}
                      onChange={(event) =>
                        updateSocial(index, { label: event.target.value })
                      }
                      placeholder="名称，如 GitHub"
                      value={item.label}
                    />
                    <input
                      aria-label={`社交链接 ${index + 1} 地址`}
                      className={`input${errors[`social-${index}-url`] ? " invalid" : ""}`}
                      onChange={(event) =>
                        updateSocial(index, { url: event.target.value })
                      }
                      placeholder="https://github.com/…"
                      value={item.url}
                    />
                    <RowActions
                      count={settings.socialLinks.length}
                      index={index}
                      label="社交链接"
                      onMove={moveSocial}
                      onRemove={() => removeSocial(index)}
                    />
                    {errors[`social-${index}-label`] ? (
                      <span className="field-error row-error">
                        {errors[`social-${index}-label`]}
                      </span>
                    ) : null}
                    {errors[`social-${index}-url`] ? (
                      <span className="field-error row-error">
                        {errors[`social-${index}-url`]}
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>
              <span className="row-actions">
                <button
                  className="button secondary"
                  disabled={settings.socialLinks.length >= LINK_LIMITS.count}
                  onClick={addSocial}
                  type="button"
                >
                  <Icon name="plus" />
                  添加社交链接
                </button>
              </span>
            </div>
            <div className="field full">
              <span className="field-label-with-count">
                导航（{settings.navigation.length}/{LINK_LIMITS.count}
                ，支持站内路径和外部链接）
              </span>
              <div className="skill-editor">
                {settings.navigation.map((item, index) => (
                  <div className="editor-row" key={navKeys[index]}>
                    <input
                      aria-label={`导航 ${index + 1} 名称`}
                      className={`input${errors[`navigation-${index}-label`] ? " invalid" : ""}`}
                      onChange={(event) =>
                        updateNav(index, { label: event.target.value })
                      }
                      placeholder="名称，如 友情链接"
                      value={item.label}
                    />
                    <input
                      aria-label={`导航 ${index + 1} 路径`}
                      className={`input${errors[`navigation-${index}-href`] ? " invalid" : ""}`}
                      onChange={(event) =>
                        updateNav(index, { href: event.target.value })
                      }
                      placeholder="/blog 或 https://…"
                      value={item.href}
                    />
                    <RowActions
                      count={settings.navigation.length}
                      index={index}
                      label="导航"
                      onMove={moveNav}
                      onRemove={() => removeNav(index)}
                    />
                    {errors[`navigation-${index}-label`] ? (
                      <span className="field-error row-error">
                        {errors[`navigation-${index}-label`]}
                      </span>
                    ) : null}
                    {errors[`navigation-${index}-href`] ? (
                      <span className="field-error row-error">
                        {errors[`navigation-${index}-href`]}
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>
              <span className="row-actions">
                <button
                  className="button secondary"
                  disabled={settings.navigation.length >= LINK_LIMITS.count}
                  onClick={addNav}
                  type="button"
                >
                  <Icon name="plus" />
                  添加导航
                </button>
              </span>
            </div>
            <div className="field full">
              <span className="field-label">前台背景</span>
              <div className="bg-preset-grid-editor">
                {backgroundPresets.map((preset) => (
                  <button
                    aria-pressed={settings.background.preset === preset.key}
                    className={`bg-preset-card${settings.background.preset === preset.key ? " active" : ""}`}
                    key={preset.key}
                    onClick={() =>
                      update("background", {
                        ...settings.background,
                        preset: preset.key,
                      })
                    }
                    type="button"
                  >
                    <span
                      aria-hidden="true"
                      className={`bg-preset-preview preview-${preset.key}`}
                    />
                    <span className="bg-preset-name">{preset.name}</span>
                  </button>
                ))}
              </div>
              {settings.background.preset === "custom" ||
              settings.background.imageUrl ? (
                <span className="custom-icon-row">
                  <input
                    aria-label="背景图片地址"
                    className={`input${errors.backgroundImage ? " invalid" : ""}`}
                    onChange={(event) =>
                      update("background", {
                        ...settings.background,
                        preset: "custom",
                        imageUrl: event.target.value,
                      })
                    }
                    placeholder="粘贴背景图片地址 https://…（留空则使用当前预设）"
                    value={settings.background.imageUrl ?? ""}
                  />
                  <button
                    className="button ghost"
                    onClick={() =>
                      update("background", {
                        ...settings.background,
                        preset:
                          settings.background.preset === "custom"
                            ? "noise"
                            : settings.background.preset,
                        imageUrl: undefined,
                      })
                    }
                    type="button"
                  >
                    清除
                  </button>
                </span>
              ) : null}
              {errors.backgroundImage ? (
                <span className="field-error">{errors.backgroundImage}</span>
              ) : null}
              <span className="link-hint">
                预设一键切换；也可以粘贴图片地址使用自定义背景图。
              </span>
            </div>
          </div>
        ) : null}

        {activeTab === "about" ? (
          <div className="form-grid settings-fields">
            <label className="field">
              <span className="field-label-with-count">
                职业
                <CharCount max={limits.role} value={home.role} />
              </span>
              <input
                className={`input${errors.role ? " invalid" : ""}`}
                onChange={(event) => updateHome("role", event.target.value)}
                placeholder="前端工程师"
                value={home.role}
              />
              {errors.role ? (
                <span className="field-error">{errors.role}</span>
              ) : null}
            </label>
            <label className="field">
              <span className="field-label-with-count">
                所在地
                <CharCount max={limits.location} value={home.location} />
              </span>
              <input
                className={`input${errors.location ? " invalid" : ""}`}
                onChange={(event) => updateHome("location", event.target.value)}
                placeholder="HangZhou"
                value={home.location}
              />
              {errors.location ? (
                <span className="field-error">{errors.location}</span>
              ) : null}
            </label>

            <div className="field full">
              <span className="field-label-with-count">
                技能列表（{home.skills.length}/{limits.skills}）
                {errors.skills ? (
                  <span className="field-error">{errors.skills}</span>
                ) : null}
              </span>
              <div className="skill-editor">
                {home.skills.map((skill, index) => (
                  <div className="editor-row" key={skillKeys[index]}>
                    <select
                      aria-label={`技能 ${index + 1} 图标`}
                      className="select"
                      onChange={(event) => {
                        const value = event.target.value;
                        updateSkill(index, {
                          icon: value === CUSTOM_ICON ? "https://" : value,
                        });
                      }}
                      value={isImageIcon(skill.icon) ? CUSTOM_ICON : skill.icon}
                    >
                      <option value="">通用图标</option>
                      {homepageIconGroups.map((group) => (
                        <optgroup key={group.group} label={group.group}>
                          {group.icons.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                      <option value={CUSTOM_ICON}>自定义图片…</option>
                    </select>
                    <input
                      className={`input${errors[`skill-${index}-name`] ? " invalid" : ""}`}
                      onChange={(event) =>
                        updateSkill(index, { name: event.target.value })
                      }
                      placeholder="技能名称，如 Vue"
                      value={skill.name}
                    />
                    <RowActions
                      count={home.skills.length}
                      index={index}
                      label="技能"
                      onMove={moveSkill}
                      onRemove={() => removeSkill(index)}
                    />
                    {isImageIcon(skill.icon) ? (
                      <span className="custom-icon-row">
                        <input
                          aria-label={`技能 ${index + 1} 自定义图片地址`}
                          className={`input${errors[`skill-${index}-icon`] ? " invalid" : ""}`}
                          onChange={(event) =>
                            updateSkill(index, { icon: event.target.value })
                          }
                          placeholder="粘贴图片地址 https://…"
                          value={skill.icon}
                        />
                        <button
                          className="button ghost"
                          onClick={() => updateSkill(index, { icon: "" })}
                          type="button"
                        >
                          清除
                        </button>
                      </span>
                    ) : null}
                    {errors[`skill-${index}-name`] ? (
                      <span className="field-error row-error">
                        {errors[`skill-${index}-name`]}
                      </span>
                    ) : null}
                    {errors[`skill-${index}-icon`] ? (
                      <span className="field-error row-error">
                        {errors[`skill-${index}-icon`]}
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>
              <span className="row-actions">
                <button
                  className="button secondary"
                  disabled={home.skills.length >= limits.skills}
                  onClick={addSkill}
                  type="button"
                >
                  <Icon name="plus" />
                  添加技能
                </button>
              </span>
            </div>
          </div>
        ) : null}

        {activeTab === "now" ? (
          <div className="form-grid settings-fields">
            <label className="field full">
              <span className="field-label-with-count">
                动态标题
                <CharCount max={limits.nowTitle} value={home.nowTitle} />
              </span>
              <input
                className={`input${errors.nowTitle ? " invalid" : ""}`}
                onChange={(event) => updateHome("nowTitle", event.target.value)}
                placeholder="最近在做什么"
                value={home.nowTitle}
              />
              {errors.nowTitle ? (
                <span className="field-error">{errors.nowTitle}</span>
              ) : null}
            </label>

            <div className="field full">
              <span className="field-label-with-count">
                动态条目（{home.nowItems.length}/{limits.nowItems}
                ，序号自动生成）
                {errors.nowItems ? (
                  <span className="field-error">{errors.nowItems}</span>
                ) : null}
              </span>
              <div className="now-editor">
                {home.nowItems.map((item, index) => (
                  <div className="now-item-editor" key={nowKeys[index]}>
                    <div className="now-item-head">
                      <span className="now-item-index">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <input
                        className={`input${errors[`now-${index}-label`] ? " invalid" : ""}`}
                        onChange={(event) =>
                          updateHome(
                            "nowItems",
                            home.nowItems.map((entry, i) =>
                              i === index
                                ? { ...entry, label: event.target.value }
                                : entry,
                            ),
                          )
                        }
                        placeholder="标签，如 Build"
                        value={item.label}
                      />
                      <RowActions
                        count={home.nowItems.length}
                        index={index}
                        label="动态"
                        onMove={moveNow}
                        onRemove={() => removeNow(index)}
                      />
                    </div>
                    <textarea
                      className={`textarea short${errors[`now-${index}-content`] ? " invalid" : ""}`}
                      onChange={(event) =>
                        updateHome(
                          "nowItems",
                          home.nowItems.map((entry, i) =>
                            i === index
                              ? { ...entry, content: event.target.value }
                              : entry,
                          ),
                        )
                      }
                      placeholder="动态内容"
                      value={item.content}
                    />
                    <div className="now-item-meta">
                      <input
                        className={`input${errors[`now-${index}-link`] ? " invalid" : ""}`}
                        onChange={(event) =>
                          updateHome(
                            "nowItems",
                            home.nowItems.map((entry, i) =>
                              i === index
                                ? { ...entry, link: event.target.value }
                                : entry,
                            ),
                          )
                        }
                        placeholder="链接（可选）"
                        value={item.link ?? ""}
                      />
                      <CharCount max={limits.nowContent} value={item.content} />
                    </div>
                    <span className="link-hint">
                      留空为纯文本；填 <code>{LATEST_PRODUCT_LINK}</code>{" "}
                      自动链接最新置顶产品；也可填 http(s) 或 / 开头的站内路径。
                    </span>
                    {errors[`now-${index}-label`] ? (
                      <span className="field-error">
                        {errors[`now-${index}-label`]}
                      </span>
                    ) : null}
                    {errors[`now-${index}-content`] ? (
                      <span className="field-error">
                        {errors[`now-${index}-content`]}
                      </span>
                    ) : null}
                    {errors[`now-${index}-link`] ? (
                      <span className="field-error">
                        {errors[`now-${index}-link`]}
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>
              <span className="row-actions">
                <button
                  className="button secondary"
                  disabled={home.nowItems.length >= limits.nowItems}
                  onClick={addNow}
                  type="button"
                >
                  <Icon name="plus" />
                  添加动态
                </button>
              </span>
            </div>
          </div>
        ) : null}

        <div className="settings-actions">
          {notice ? <span className="muted">{notice}</span> : null}
          <button
            className="button"
            disabled={pending}
            onClick={save}
            type="button"
          >
            <Icon name="save" />
            {pending ? "保存中…" : "保存设置"}
          </button>
        </div>
      </section>

      <HomePreview home={home} />
      {avatarPickerOpen ? (
        <MediaPickerModal
          onClose={() => setAvatarPickerOpen(false)}
          onSelect={(asset) => {
            update("avatarUrl", asset.url);
            setAvatarPickerOpen(false);
          }}
          title="上传或选择头像"
        />
      ) : null}
    </div>
  );
}
