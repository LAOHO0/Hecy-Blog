import { triggerSiteBuild } from "./github";
import { runLocalSiteBuild } from "./local-build";
import { createBuild, getBuild, markBuild } from "./store";

/**
 * Creates a build record and dispatches the static site build.
 * Build mode is chosen by environment variables, in this order:
 * 1. BUILD_MODE=local — run `next build` in-process on this machine (VPS).
 * 2. VERCEL_DEPLOY_HOOK_URL — trigger a Vercel deployment (plan B).
 * 3. GITHUB_TOKEN + GITHUB_OWNER + GITHUB_REPO — GitHub Actions dispatch.
 * A failed or unconfigured trigger is recorded as failed instead of leaving
 * an item stuck in the queued state forever.
 */
export async function queueSiteBuild(reason: string) {
  const queued = await createBuild();
  let message = "构建已加入队列。";

  try {
    if (process.env.BUILD_MODE === "local") {
      runLocalSiteBuild(queued.id);
      message = "本机构建已启动。";
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
