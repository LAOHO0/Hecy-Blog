import "server-only";

import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

import { markBuild } from "./store";

/**
 * 本机构建模式（BUILD_MODE=local，静态导出部署）：
 * 前后台在同一台机器，后台点发布后直接以子进程在前台目录跑
 * `next build`，结束后把状态写回构建记录，无需 GitHub/Vercel 中转。
 *
 * Next 同一工作目录同时只允许一个生产构建，而发布、保存设置可能
 * 连续触发多次构建——这里用 Promise 链把构建串行化，后到的排队等待，
 * 避免出现 "Another next build process is already running" 直接失败。
 *
 * Docker 部署时设置 SITE_OUT_DIR 指向挂载卷（如 /app/apps/site/out-live）：
 * Next.js 导出会 rm 掉整个 out 目录，直接对 bind mount 执行会报 EBUSY，
 * 所以先构建到非挂载的 out/，成功后把产物内容同步进挂载点（只清空目录
 * 内容，不删除挂载根目录本身）。
 */

let buildQueue: Promise<void> = Promise.resolve();

/** 入队一次本机构建：串行执行，返回完整构建的 Promise（调用方可等待，也可忽略）。 */
export function runLocalSiteBuild(buildId: string): Promise<void> {
  const task = buildQueue.then(() => runBuild(buildId));
  // 单次失败不阻断后续排队任务
  buildQueue = task.catch(() => {});
  return task;
}

async function runBuild(buildId: string): Promise<void> {
  const siteDir = process.env.SITE_BUILD_DIR
    ? path.resolve(process.env.SITE_BUILD_DIR)
    : path.resolve(process.cwd(), "../site");
  const publishDir = process.env.SITE_OUT_DIR
    ? path.resolve(process.env.SITE_OUT_DIR)
    : undefined;

  try {
    await markBuild(buildId, "running", "本机构建进行中。");
    let output: string;
    try {
      output = await execNextBuild(siteDir);
    } catch (error) {
      // entrypoint 的初始构建可能与刚触发的发布构建撞车（同目录构建互斥），
      // 锁冲突时等待一次再重试，避免发布直接失败。
      if (
        !(error instanceof Error) ||
        !error.message.includes("already running")
      ) {
        throw error;
      }
      await markBuild(buildId, "running", "检测到其他构建正在执行，等待重试…");
      await new Promise((resolve) => setTimeout(resolve, 20_000));
      output = await execNextBuild(siteDir);
    }

    if (publishDir) {
      await publishExport(path.join(siteDir, "out"), publishDir);
    }
    await markBuild(buildId, "success");
  } catch (error) {
    const summary = error instanceof Error ? error.message : "本机构建失败。";
    await markBuild(buildId, "failed", summary);
  }
}

function execNextBuild(siteDir: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
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
      if (code === 0) resolve(output);
      else reject(new Error(output.slice(-2000) || `构建进程退出码 ${code}`));
    });
  });
}

/** 清空目标目录内容（保留挂载根目录本身），再复制新产物进去。 */
async function publishExport(outDir: string, publishDir: string) {
  await fs.mkdir(publishDir, { recursive: true });
  for (const entry of await fs.readdir(publishDir)) {
    await fs.rm(path.join(publishDir, entry), { recursive: true, force: true });
  }
  await fs.cp(outDir, publishDir, { recursive: true });
}
