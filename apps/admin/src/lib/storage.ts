import "server-only";

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

let client: S3Client | undefined;

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
  if (
    !Number.isFinite(input.size) ||
    input.size < 1 ||
    input.size > 15 * 1024 * 1024
  ) {
    throw new Error("FILE_TOO_LARGE");
  }
  if (!/^image\/(png|jpe?g|gif|webp|svg\+xml)$/.test(input.mimeType)) {
    throw new Error("UNSUPPORTED_FILE_TYPE");
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
