import { triggerSiteBuild } from "./github";
import { runLocalSiteBuild } from "./local-build";
import { createBuild, getBuild, markBuild } from "./store";

/**
 * Creates a build record and dispatches the frontend update.
 * Dispatch mode is chosen by BUILD_MODE:
 * - "isr"   — 动态渲染模式：前台按请求实时读取内容，无需构建，记录立即成功。
 * - "local" — 本机 next build（静态导出，VPS 单机部署）；构建经串行队列执行。
 * - 其他    — 远程触发：VERCEL_DEPLOY_HOOK_URL 或 GITHUB_TOKEN 等（GitHub Actions）。
 * A failed or unconfigured trigger is recorded as failed instead of leaving
 * an item stuck in the queued state forever.
 */
export async function queueSiteBuild(reason: string) {
  const queued = await createBuild();
  let message = "构建已加入队列。";

  try {
    if (process.env.NODE_ENV !== "production") {
      // 开发模式：前台 dev server 本身就是实时渲染，无需任何构建/触发。
      await markBuild(
        queued.id,
        "success",
        "开发模式：内容改动即时可见，无需构建。",
      );
      message = "开发模式：内容改动即时可见。";
      return {
        build: (await getBuild(queued.id)) ?? queued,
        message,
      };
    }

    if (process.env.BUILD_MODE === "isr") {
      // 动态渲染：内容按请求实时读取，发布即生效，无需任何构建。
      await markBuild(
        queued.id,
        "success",
        "动态渲染模式：内容实时生效，无需构建。",
      );
      message = "内容已实时生效（动态渲染无需构建）。";
      return {
        build: (await getBuild(queued.id)) ?? queued,
        message,
      };
    }

    if (process.env.BUILD_MODE === "local") {
      // 串行队列：连续发布/保存设置不会并发触发 next build；
      // 不在 HTTP 请求里等待构建结束，结果看后台“构建”页。
      void runLocalSiteBuild(queued.id).catch(() => {});
      message = "本机构建已加入队列。";
      return {
        build: (await getBuild(queued.id)) ?? queued,
        message,
      };
    }

    const trigger = await triggerSiteBuild(queued.id, reason);
    message = trigger.message;
    if (!trigger.triggered) {
      await markBuild(queued.id, "failed", trigger.message);
    }
  } catch {
    message = "无法触发构建，请检查构建配置。";
    await markBuild(queued.id, "failed", message);
  }

  return {
    build: (await getBuild(queued.id)) ?? queued,
    message,
  };
}
