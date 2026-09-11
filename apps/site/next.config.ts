import type { NextConfig } from "next";

// STATIC_EXPORT=true：纯静态导出（GitHub Pages 等托管，构建期内容快照）。
// 默认不导出：服务端渲染模式，页面按请求实时读取后台内容。
const nextConfig: NextConfig = {
  ...(process.env.STATIC_EXPORT === "true"
    ? { output: "export" as const }
    : {}),
  trailingSlash: true,
  images: { unoptimized: true },
  transpilePackages: ["@hecy/content"],
};

// 正文里的媒体走后台相对地址（/media/...），而媒体文件由后台服务存储；
// 站点与后台不同源时（本地 3001/3002、生产前后台分域名）直接访问会 404，
// 这里把 /media 透明转发到后台。纯静态导出模式不支持 rewrites，
// 需要改用后台 MEDIA_PUBLIC_URL 生成媒体绝对地址。
const contentApi = process.env.CONTENT_API_URL?.replace(/\/$/, "");
if (contentApi && process.env.STATIC_EXPORT !== "true") {
  const adminOrigin = new URL(contentApi).origin;
  nextConfig.rewrites = async () => [
    { source: "/media/:path*", destination: `${adminOrigin}/media/:path*` },
  ];
}

export default nextConfig;
