import { triggerSiteBuild } from "./github";
import { createBuild, getBuild, markBuild } from "./store";

/**
 * Creates a build record and asks GitHub Actions to build the static site.
 * A failed or unconfigured trigger is recorded as failed instead of leaving
 * an item stuck in the queued state forever.
 */
export async function queueSiteBuild(reason: string) {
  const queued = await createBuild();
  let message = "GitHub Actions 构建已加入队列。";

  try {
    const trigger = await triggerSiteBuild(queued.id, reason);
    message = trigger.message;
    if (!trigger.triggered) {
      await markBuild(queued.id, "failed", trigger.message);
    }
  } catch {
    message = "无法触发 GitHub Actions 构建。";
    await markBuild(queued.id, "failed", message);
  }

  return {
    build: (await getBuild(queued.id)) ?? queued,
    message,
  };
}
