import "server-only";

type TriggerResult = {
  configured: boolean;
  triggered: boolean;
  message: string;
};

export async function triggerSiteBuild(
  buildId: string,
  reason: string,
): Promise<TriggerResult> {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  if (!token || !owner || !repo) {
    return {
      configured: false,
      triggered: false,
      message: "未配置 GitHub 构建凭据，未触发静态构建，请配置后重试。",
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
