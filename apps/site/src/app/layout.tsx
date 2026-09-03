import type { Metadata } from "next";
import "./globals.css";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { getSiteSettings } from "@/lib/content";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Hecy Blog",
    template: "%s · Hecy Blog",
  },
  description: "写作、产品与项目。",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const settings = await getSiteSettings();
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <div className="site-wrap">
          <SiteHeader settings={settings} />
          <main>{children}</main>
          <SiteFooter settings={settings} />
        </div>
      </body>
    </html>
  );
}
