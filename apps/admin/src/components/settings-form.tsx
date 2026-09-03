"use client";

import type { SiteSettings } from "@hecy/content/types";
import { useState, useTransition } from "react";
import { Icon } from "@/components/icon";

function linksToText(items: { label: string; url: string }[]) {
  return items.map((item) => `${item.label} | ${item.url}`).join("\n");
}

function textToLinks(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, ...rest] = line.split("|");
      return { label: label.trim(), url: rest.join("|").trim() };
    })
    .filter((item) => item.label && item.url);
}

export function SettingsForm({ initial }: { initial: SiteSettings }) {
  const [settings, setSettings] = useState(initial);
  const [socialText, setSocialText] = useState(
    linksToText(initial.socialLinks),
  );
  const [navigationText, setNavigationText] = useState(
    linksToText(
      initial.navigation.map((item) => ({ label: item.label, url: item.href })),
    ),
  );
  const [notice, setNotice] = useState("");
  const [pending, startTransition] = useTransition();

  function update<K extends keyof SiteSettings>(
    key: K,
    value: SiteSettings[K],
  ) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  function save() {
    startTransition(async () => {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...settings,
          socialLinks: textToLinks(socialText),
          navigation: textToLinks(navigationText).map((item) => ({
            label: item.label,
            href: item.url,
          })),
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        settings?: SiteSettings;
        error?: string;
        message?: string;
      };
      setNotice(
        response.ok
          ? payload.message
            ? `站点设置已保存。${payload.message}`
            : "站点设置已保存。"
          : payload.error || "保存失败。",
      );
      if (payload.settings) setSettings(payload.settings);
    });
  }

  return (
    <section className="panel settings-panel">
      <div className="panel-head">
        <span className="panel-title">站点信息</span>
        <span className="eyebrow">全局设置</span>
      </div>
      <div className="form-grid settings-fields">
        <label className="field full">
          <span className="field-label">站点标题</span>
          <input
            className="input input-large"
            onChange={(event) => update("title", event.target.value)}
            value={settings.title}
          />
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
        <label className="field">
          <span className="field-label">头像 URL</span>
          <input
            className="input"
            onChange={(event) => update("avatarUrl", event.target.value)}
            value={settings.avatarUrl || ""}
            placeholder="https://…"
          />
        </label>
        <label className="field">
          <span className="field-label">页脚文字</span>
          <input
            className="input"
            onChange={(event) => update("footerText", event.target.value)}
            value={settings.footerText}
          />
        </label>
        <label className="field full">
          <span className="field-label">社交链接（每行：名称 | URL）</span>
          <textarea
            className="textarea short"
            onChange={(event) => setSocialText(event.target.value)}
            value={socialText}
          />
        </label>
        <label className="field full">
          <span className="field-label">导航（每行：名称 | 路径）</span>
          <textarea
            className="textarea short"
            onChange={(event) => setNavigationText(event.target.value)}
            value={navigationText}
          />
        </label>
      </div>
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
  );
}
