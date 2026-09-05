import "server-only";

import { spawn } from "node:child_process";
import path from "node:path";

import { markBuild } from "./store";

/**
 * 本机构建模式（BUILD_MODE=local，VPS 单机部署）：
 * 前后台在同一台机器，后台点发布后直接以子进程在前台目录跑
 * `next build`，结束后把状态写回构建记录，无需 GitHub/Vercel 中转。
 *
 * 前台构建通过 CONTENT_API_URL 读取本机后台 API，因此要先等发布
 * 事务完成——这里刻意用 fire-and-forget，让接口立刻返回。
 */
export function runLocalSiteBuild(buildId: string) {
  const siteDir = process.env.SITE_BUILD_DIR
    ? path.resolve(process.env.SITE_BUILD_DIR)
    : path.resolve(process.cwd(), "../site");

  const run = async () => {
    try {
      await markBuild(buildId, "running", "本机构建进行中。");
      await new Promise<void>((resolve, reject) => {
        const child = spawn("pnpm", ["exec", "next", "build"], {
          cwd: siteDir,
          env: process.env,
          shell: process.platform === "win32",
          stdio: ["ignore", "pipe", "pipe"],
        });
        let output = "";
        child.stdout?.on("data", (chunk: Buffer) => {
          output += chunk.toString();
          if (output.length > 40_000) output = output.slice(-20_000);
        });
        child.stderr?.on("data", (chunk: Buffer) => {
          output += chunk.toString();
          if (output.length > 40_000) output = output.slice(-20_000);
        });
        child.on("error", reject);
        child.on("close", (code) => {
          if (code === 0) resolve();
          else
            reject(new Error(output.slice(-2000) || `构建进程退出码 ${code}`));
        });
      });
      await markBuild(buildId, "success");
    } catch (error) {
      const summary = error instanceof Error ? error.message : "本机构建失败。";
      await markBuild(buildId, "failed", summary);
    }
  };

  void run();
}
