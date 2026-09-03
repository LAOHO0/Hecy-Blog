import "server-only";

import bcrypt from "bcryptjs";
import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const SESSION_COOKIE = "hecy_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
const attempts = new Map<string, { count: number; resetAt: number }>();

function secretKey() {
  const value = process.env.AUTH_SECRET;
  if (value) {
    if (process.env.NODE_ENV === "production" && value.length < 32) {
      throw new Error("AUTH_SECRET_WEAK");
    }
    return new TextEncoder().encode(value);
  }
  if (process.env.NODE_ENV !== "production") {
    return new TextEncoder().encode(
      "hecy-blog-local-development-secret-change-me",
    );
  }
  throw new Error("AUTH_SECRET_MISSING");
}

export function getAdminUsername() {
  return process.env.ADMIN_USERNAME || "hecy";
}

export async function verifyCredentials(username: string, password: string) {
  if (username !== getAdminUsername()) return false;
  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (hash) return bcrypt.compare(password, hash);

  if (process.env.NODE_ENV === "production") return false;
  const fallback = process.env.ADMIN_PASSWORD;
  return Boolean(fallback && password === fallback);
}

export function checkLoginRateLimit(ip: string) {
  const now = Date.now();
  const current = attempts.get(ip);
  if (!current || current.resetAt < now) {
    attempts.set(ip, { count: 1, resetAt: now + 15 * 60_000 });
    return { allowed: true, retryAfter: 0 };
  }
  if (current.count >= 8) {
    return {
      allowed: false,
      retryAfter: Math.ceil((current.resetAt - now) / 1000),
    };
  }
  current.count += 1;
  return { allowed: true, retryAfter: 0 };
}

export async function createSession(username: string) {
  return new SignJWT({ role: "admin", username })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(username)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS)
    .sign(secretKey());
}

export async function readSession(token: string | undefined) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (payload.role !== "admin" || typeof payload.sub !== "string")
      return null;
    return { username: payload.sub };
  } catch {
    return null;
  }
}

export async function getSession() {
  const cookieStore = await cookies();
  return readSession(cookieStore.get(SESSION_COOKIE)?.value);
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function hasAdminSession() {
  return Boolean(await getSession());
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_TTL_SECONDS,
    path: "/",
  };
}
