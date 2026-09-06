#!/usr/bin/env node
/**
 * 端到端全链路自检（HTTP 层，无浏览器依赖）：
 *   登录 → 创建文章 → 发布 → 公开 API → 前台列表/详情/首页 → 清理
 * 用于部署后或本地联调时自动验证"后台-前台"整条链路，
 * 可自动发现详情页 500、内容不同步、会话失效这类问题。
 *
 * 用法：
 *   node scripts/e2e-check.mjs [后台地址] [前台地址]
 *   默认 http://localhost:3001 与 http://localhost:3002
 * 凭据取环境变量 ADMIN_USERNAME / ADMIN_PASSWORD（默认 hecy / smoke-test-2026）。
 * 任一步骤失败即以非零码退出，并打印 FAIL 详情。
 */

const admin = (process.argv[2] ?? "http://localhost:3001").replace(/\/$/, "");
const site = (process.argv[3] ?? "http://localhost:3002").replace(/\/$/, "");
const username = process.env.ADMIN_USERNAME ?? "hecy";
const password = process.env.ADMIN_PASSWORD ?? "smoke-test-2026";

let sessionCookie = "";
let failures = 0;

function step(name, ok, detail = "") {
  const mark = ok ? "PASS" : "FAIL";
  console.log(`[${mark}] ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures += 1;
}

async function main() {
  // 1. 后台可达
  const loginPage = await fetch(`${admin}/login`);
  step("后台登录页可达", loginPage.status === 200, `HTTP ${loginPage.status}`);

  // 2. 错误密码必须被拒绝
  const bad = await fetch(`${admin}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password: "definitely-wrong" }),
  });
  step("错误密码被拒绝(401)", bad.status === 401, `HTTP ${bad.status}`);

  // 3. 正确密码登录并保存会话 Cookie
  const login = await fetch(`${admin}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const setCookie = login.headers.get("set-cookie") ?? "";
  sessionCookie = /hecy_session=[^;]+/.exec(setCookie)?.[0] ?? "";
  step("登录成功(200+会话Cookie)", login.status === 200 && sessionCookie !== "",
    `HTTP ${login.status}${sessionCookie ? "" : "，未收到 hecy_session Cookie"}`);

  const authHeaders = {
    Cookie: sessionCookie,
    "Content-Type": "application/json",
  };

  // 4. 创建测试文章（唯一 slug，避免污染已有内容）
  const slug = `e2e-check-${Date.now().toString(36)}`;
  const create = await fetch(`${admin}/api/content`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      type: "article",
      lang: "zh-CN",
      slug,
      title: "E2E 全链路自检文章",
      excerpt: "端到端自检自动创建。",
      body: "## E2E 自检正文\n\n该内容由 e2e-check 脚本自动发布与清理。",
      tags: ["e2e"],
      seo: { keywords: [] },
    }),
  });
  const created = await create.json().catch(() => ({}));
  const id = created.id ?? created.item?.id;
  step("创建文章草稿", (create.status === 200 || create.status === 201) && Boolean(id),
    `HTTP ${create.status}${create.status !== 200 ? ` — ${JSON.stringify(created).slice(0, 200)}` : ""}`);

  if (id) {
    // 5. 发布
    const publish = await fetch(`${admin}/api/content/${id}/publish`, {
      method: "POST",
      headers: authHeaders,
    });
    step("发布文章", publish.status === 200, `HTTP ${publish.status}`);

    // 6. 公开 API 立即可见
    const publicApi = await fetch(`${admin}/api/public?type=article`);
    const publicBody = publicApi.ok ? JSON.stringify(await publicApi.json()) : "";
    step("公开 API 返回新文章", publicApi.status === 200 && publicBody.includes(slug),
      `HTTP ${publicApi.status}`);

    // 7. 前台列表页实时可见（动态渲染按请求读取）
    await new Promise((resolve) => setTimeout(resolve, 500));
    const blogList = await fetch(`${site}/blog/`);
    const blogHtml = await blogList.text();
    step("前台博客列表实时可见", blogList.status === 200 && blogHtml.includes("E2E 全链路自检文章"),
      `HTTP ${blogList.status}`);

    // 8. 前台详情页实时可达且渲染正文（可发现 DYNAMIC_SERVER_USAGE 500 类问题）
    const detail = await fetch(`${site}/blog/${slug}/`);
    const detailHtml = await detail.text();
    step("前台详情页 200 且渲染正文",
      detail.status === 200 && detailHtml.includes("E2E 自检正文"),
      `HTTP ${detail.status}`);

    // 9. 清理：删除测试文章
    const remove = await fetch(`${admin}/api/content/${id}`, {
      method: "DELETE",
      headers: authHeaders,
    });
    step("清理测试文章", remove.status === 200, `HTTP ${remove.status}`);
  }

  // 10. 前台首页可达
  const home = await fetch(`${site}/`);
  step("前台首页可达", home.status === 200, `HTTP ${home.status}`);

  console.log(failures === 0 ? "\n✅ E2E 全链路自检全部通过。" : `\n❌ ${failures} 项失败，请检查上方 FAIL 详情。`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error("[FAIL] 自检脚本异常：", error);
  process.exit(1);
});
