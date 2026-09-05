import "server-only";

type TriggerResult = {
  configured: boolean;
  triggered: boolean;
  message: string;
};

/**
 * 发布触发支持两种互斥模式，按环境变量自动选择：
 * - VERCEL_DEPLOY_HOOK_URL：直接唤起 Vercel 的前台部署（方案 B，全 Vercel）。
 * - GITHUB_TOKEN + GITHUB_OWNER + GITHUB_REPO：走 GitHub repository_dispatch，
 *   由 Actions 构建静态产物（VPS / GitHub Pages 部署共用此模式）。
 * 两者都未配置时返回未配置，由调用方把构建记录标记为失败。
 */
export async function triggerSiteBuild(
  buildId: string,
  reason: string,
): Promise<TriggerResult> {
  const deployHook = process.env.VERCEL_DEPLOY_HOOK_URL?.trim();
  if (deployHook) {
    return triggerVercelDeployHook(deployHook, reason);
  }

  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  if (!token || !owner || !repo) {
    return {
      configured: false,
      triggered: false,
      message:
        "未配置构建触发凭据（VERCEL_DEPLOY_HOOK_URL 或 GITHUB_TOKEN 等），请配置后重试。",
    };
  }

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/dispatches`,
    {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event_type: "hecy-publish",
        client_payload: { buildId, reason },
      }),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    return {
      configured: true,
      triggered: false,
      message: `GitHub 构建触发失败（${response.status}）。`,
    };
  }

  return {
    configured: true,
    triggered: true,
    message: "GitHub Actions 构建已加入队列。",
  };
}

async function triggerVercelDeployHook(
  hookUrl: string,
  reason: string,
): Promise<TriggerResult> {
  const response = await fetch(hookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
    cache: "no-store",
  });

  if (!response.ok) {
    return {
      configured: true,
      triggered: false,
      message: `Vercel 部署触发失败（${response.status}）。`,
    };
  }

  return {
    configured: true,
    triggered: true,
    message: "Vercel 前台部署已加入队列。",
  };
}
