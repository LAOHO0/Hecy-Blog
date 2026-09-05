/**
 * 空库时才执行种子写入：内容表已有数据则直接跳过，
 * 避免每次启动都用种子覆盖用户修改过的文章/设置。
 */
import { content } from "@hecy/content/schema";
import { config } from "dotenv";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

config({ path: ".env.local" });
config();

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("缺少 DATABASE_URL。");
  process.exit(1);
}

const pool = new Pool({ connectionString: url });
const db = drizzle(pool);

try {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(content);
  if ((row?.count ?? 0) > 0) {
    console.log(`数据库已有 ${row?.count} 条内容，跳过种子写入。`);
  } else {
    await import("./seed.js");
    console.log("空库，已写入种子内容。");
  }
} finally {
  await pool.end();
}
