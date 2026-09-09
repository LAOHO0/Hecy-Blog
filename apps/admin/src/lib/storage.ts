import "server-only";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

let client: S3Client | undefined;
export const MAX_MEDIA_SIZE = 15 * 1024 * 1024;
export const SUPPORTED_MEDIA_TYPES = /^(image\/(png|jpe?g|gif|webp|svg\+xml))$/;

export function getStorageDriver(): "local" | "s3" {
  return process.env.STORAGE_DRIVER?.toLowerCase() === "s3" ? "s3" : "local";
}

export function validateMediaUpload(input: { mimeType: string; size: number }) {
  if (
    !Number.isFinite(input.size) ||
    input.size < 1 ||
    input.size > MAX_MEDIA_SIZE
  ) {
    return { ok: false as const, error: "FILE_TOO_LARGE" };
  }
  if (!SUPPORTED_MEDIA_TYPES.test(input.mimeType)) {
    return { ok: false as const, error: "UNSUPPORTED_FILE_TYPE" };
  }
  return { ok: true as const };
}

function safeFileName(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, "-")
      .slice(0, 120) || "image"
  );
}

function localMediaDir() {
  return path.resolve(
    process.env.MEDIA_DIR || path.join(process.cwd(), "data", "media"),
  );
}

export async function saveLocalMedia(input: {
  fileName: string;
  mimeType: string;
  size: number;
  bytes: Uint8Array;
}) {
  const validation = validateMediaUpload(input);
  if (!validation.ok) throw new Error(validation.error);
  const key = `media/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${safeFileName(input.fileName)}`;
  // key 带 media/ 前缀（与 media_assets 表和 S3 布局一致），落盘时剥掉：
  // MEDIA_DIR 本身已指向媒体根目录，否则会出现 data/media/media/ 双层目录。
  const relativeKey = key.replace(/^media\//, "");
  const filePath = path.join(localMediaDir(), relativeKey);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, input.bytes, { flag: "wx" });
  const publicBase = process.env.MEDIA_PUBLIC_URL?.replace(/\/$/, "");
  const relativeUrl = key.replace(/^media\//, "");
  return {
    key,
    url: publicBase ? `${publicBase}/${relativeUrl}` : `/media/${relativeUrl}`,
    size: input.size,
  };
}

function getClient() {
  if (client) return client;
  const endpoint = process.env.S3_ENDPOINT;
  const region = process.env.S3_REGION || "auto";
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  if (!endpoint || !accessKeyId || !secretAccessKey || !process.env.S3_BUCKET) {
    return null;
  }
  client = new S3Client({
    region,
    endpoint,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
    credentials: { accessKeyId, secretAccessKey },
  });
  return client;
}

export async function createUploadUrl(input: {
  fileName: string;
  mimeType: string;
  size: number;
}) {
  const validation = validateMediaUpload(input);
  if (!validation.ok) throw new Error(validation.error);

  if (getStorageDriver() === "local") {
    return { configured: false, driver: "local" as const };
  }

  const bucket = process.env.S3_BUCKET;
  const s3 = getClient();
  if (!bucket || !s3) {
    return {
      configured: false,
      message: "尚未配置 S3 兼容对象存储，请先填写 S3 环境变量。",
    } as const;
  }

  const safeName = input.fileName.toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
  const key = `media/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${safeName}`;
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: input.mimeType,
    ContentLength: input.size,
  });
  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 600 });
  const publicBase = process.env.S3_PUBLIC_URL?.replace(/\/$/, "");
  const publicUrl = publicBase ? `${publicBase}/${key}` : key;
  return {
    configured: true,
    key,
    uploadUrl,
    publicUrl,
    expiresIn: 600,
  } as const;
}
