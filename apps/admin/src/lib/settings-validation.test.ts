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
};

describe("parseSettings", () => {
  it("trims values and preserves the avatar URL", () => {
    expect(parseSettings(validSettings)).toEqual({
      ...validSettings,
      title: "Hecy Blog",
    });
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
