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

export default nextConfig;
