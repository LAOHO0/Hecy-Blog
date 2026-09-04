import { defaultHomepage } from "@hecy/content/settings";
import { describe, expect, it } from "vitest";
import { parseSettings } from "./settings-validation";

const validSettings = {
  title: " Hecy Blog ",
  tagline: "写作、产品与项目。",
  bio: "记录设计与工程。",
  avatarUrl: "https://cdn.example.com/avatar.png",
  footerText: "© 2026 Hecy Blog",
  socialLinks: [{ label: "GitHub", url: "https://github.com/LAOHO0" }],
  navigation: [
    { label: "首页", href: "/" },
    { label: "文章", href: "/blog" },
  ],
  homepage: {
    greeting: "你好，这里是 Hecy",
    headline: "只有你也想见我的时候，我们的相遇才有意义。",
    role: " 前端工程师 ",
    location: "HangZhou",
    nowTitle: "最近在做什么",
    skills: [
      { name: "Vue", icon: "Vue" },
      { name: " Rust ", icon: "" },
    ],
    nowItems: [
      {
        label: "Build",
        content: "构建一个和 AI 融合的",
        link: "latest-product",
      },
      { label: "Write", content: "整理笔记。", link: "/blog" },
    ],
  },
};

describe("parseSettings", () => {
  it("trims values and preserves the avatar URL", () => {
    expect(parseSettings(validSettings)).toEqual({
      ...validSettings,
      title: "Hecy Blog",
      homepage: {
        ...validSettings.homepage,
        role: "前端工程师",
        skills: [
          { name: "Vue", icon: "Vue" },
          { name: "Rust", icon: "" },
        ],
        nowItems: [
          {
            label: "Build",
            content: "构建一个和 AI 融合的",
            link: "latest-product",
          },
          { label: "Write", content: "整理笔记。", link: "/blog" },
        ],
      },
    });
  });

  it("fills homepage defaults for legacy data without the field", () => {
    const { homepage, ...legacy } = validSettings;
    expect(parseSettings(legacy).homepage).toEqual(defaultHomepage);
  });

  it("rejects empty required homepage fields", () => {
    expect(() =>
      parseSettings({
        ...validSettings,
        homepage: { ...validSettings.homepage, role: "  " },
      }),
    ).toThrow("职业不能为空。");
    expect(() =>
      parseSettings({
        ...validSettings,
        homepage: { ...validSettings.homepage, nowTitle: "" },
      }),
    ).toThrow("动态标题不能为空。");
    expect(() =>
      parseSettings({
        ...validSettings,
        homepage: {
          ...validSettings.homepage,
          skills: [{ name: "", icon: "Vue" }],
        },
      }),
    ).toThrow("技能名称不能为空。");
    expect(() =>
      parseSettings({
        ...validSettings,
        homepage: {
          ...validSettings.homepage,
          nowItems: [{ label: "Build", content: "" }],
        },
      }),
    ).toThrow("动态内容不能为空。");
  });

  it("rejects unsupported skill icons and unsafe now links", () => {
    expect(() =>
      parseSettings({
        ...validSettings,
        homepage: {
          ...validSettings.homepage,
          skills: [{ name: "Vue", icon: "Photoshop" }],
        },
      }),
    ).toThrow("技能图标需为预置图标或图片链接。");
    expect(() =>
      parseSettings({
        ...validSettings,
        homepage: {
          ...validSettings.homepage,
          skills: [{ name: "Vue", icon: "javascript:alert(1)" }],
        },
      }),
    ).toThrow("技能图标需为预置图标或图片链接。");
    expect(() =>
      parseSettings({
        ...validSettings,
        homepage: {
          ...validSettings.homepage,
          nowItems: [
            { label: "Build", content: "内容", link: "javascript:alert(1)" },
          ],
        },
      }),
    ).toThrow("动态链接必须是 http(s) 或站内路径。");
  });

  it("rejects unsafe URLs in settings", () => {
    expect(() =>
      parseSettings({
        ...validSettings,
        socialLinks: [{ label: "恶意链接", url: "javascript:alert(1)" }],
      }),
    ).toThrow("INVALID");
    expect(() =>
      parseSettings({
        ...validSettings,
        navigation: [{ label: "外链", href: "//evil.example" }],
      }),
    ).toThrow("INVALID");
  });
});
