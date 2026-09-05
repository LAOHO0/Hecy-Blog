import type { Metadata } from "next";
import { JetBrains_Mono, Space_Grotesk, Space_Mono } from "next/font/google";
import { BackTop } from "@/components/back-top";
import { NoiseTexture } from "@/components/noise-texture";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { getSiteSettings } from "@/lib/content";
import "./globals.css";

const monoFont = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono-loaded",
});

const uiFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-ui-loaded",
});

const dataFont = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-data-loaded",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Hecy Blog",
    template: "%s · Hecy Blog",
  },
  description: "记录写作、产品与项目的 Hecy Blog。",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const settings = await getSiteSettings();
  const background = settings.background;

  return (
    <html
      lang="zh-CN"
      suppressHydrationWarning
      className={`${monoFont.variable} ${uiFont.variable} ${dataFont.variable}`}
    >
      <body>
        <div
          className={`site-shell bg-preset-${background.preset}${background.imageUrl ? " bg-custom-image" : ""}`}
          style={
            background.imageUrl
              ? { backgroundImage: `url("${background.imageUrl}")` }
              : undefined
          }
        >
          {background.preset === "noise" ? <NoiseTexture /> : null}
          <SiteHeader settings={settings} />
          <main className="site-main">{children}</main>
          <SiteFooter settings={settings} />
          <BackTop />
        </div>
      </body>
    </html>
  );
}
