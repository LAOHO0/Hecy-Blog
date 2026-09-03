import { NextResponse } from "next/server";
import { getSession } from "./auth";

export async function requireApiSession() {
  const session = await getSession();
  if (!session) {
    return {
      session: null,
      response: NextResponse.json({ error: "未登录。" }, { status: 401 }),
    } as const;
  }
  return { session, response: null } as const;
}

export function errorResponse(error: unknown) {
  if (error instanceof Error && error.message === "SLUG_EXISTS") {
    return NextResponse.json(
      { error: "Slug 已存在，请换一个。" },
      { status: 409 },
    );
  }
  if (error instanceof Error && error.message === "CONTENT_TYPE_IMMUTABLE") {
    return NextResponse.json(
      { error: "内容类型创建后不可更改，请新建对应类型的内容。" },
      { status: 409 },
    );
  }
  if (
    error instanceof Error &&
    ["AUTH_SECRET_MISSING", "AUTH_SECRET_WEAK"].includes(error.message)
  ) {
    return NextResponse.json(
      { error: "服务端认证密钥配置不安全，请联系管理员。" },
      { status: 500 },
    );
  }
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code?: unknown }).code === "23505"
  ) {
    return NextResponse.json(
      { error: "该内容已经存在，请检查唯一字段。" },
      { status: 409 },
    );
  }
  if (error instanceof Error && error.message === "FILE_TOO_LARGE") {
    return NextResponse.json(
      { error: "文件不能超过 15 MB。" },
      { status: 413 },
    );
  }
  if (error instanceof Error && error.message === "UNSUPPORTED_FILE_TYPE") {
    return NextResponse.json(
      { error: "仅支持常见图片格式。" },
      { status: 415 },
    );
  }
  return NextResponse.json({ error: "服务器处理失败。" }, { status: 500 });
}
