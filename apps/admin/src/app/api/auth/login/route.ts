import { NextResponse } from "next/server";
import {
  checkLoginRateLimit,
  createSession,
  getAdminUsername,
  sessionCookieOptions,
  verifyCredentials,
} from "@/lib/auth";

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "direct";
  const limit = checkLoginRateLimit(ip);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "尝试次数过多，请稍后再试。" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  let payload: { username?: unknown; password?: unknown };
  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    return NextResponse.json({ error: "请求格式不正确。" }, { status: 400 });
  }

  const username = typeof payload.username === "string" ? payload.username : "";
  const password = typeof payload.password === "string" ? payload.password : "";
  if (
    username.length < 1 ||
    username.length > 80 ||
    password.length < 1 ||
    password.length > 256
  ) {
    return NextResponse.json(
      { error: "请输入用户名和密码。" },
      { status: 400 },
    );
  }

  // The forwarding header can be spoofed when no trusted proxy is present, so
  // keep a second bucket for the single configured administrator account.
  if (username === getAdminUsername()) {
    const accountLimit = checkLoginRateLimit(`account:${username}`);
    if (!accountLimit.allowed) {
      return NextResponse.json(
        { error: "尝试次数过多，请稍后再试。" },
        {
          status: 429,
          headers: { "Retry-After": String(accountLimit.retryAfter) },
        },
      );
    }
  }

  if (!(await verifyCredentials(username, password))) {
    return NextResponse.json({ error: "用户名或密码错误。" }, { status: 401 });
  }

  const token = await createSession(getAdminUsername());
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, token, sessionCookieOptions());
  return response;
}

const SESSION_COOKIE_NAME = "hecy_session";
