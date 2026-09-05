import "server-only";

import * as schema from "@hecy/content/schema";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

type AppDatabase = ReturnType<typeof drizzle<typeof schema>>;

const globalForDb = globalThis as unknown as {
  hecyPool?: Pool;
  hecyDb?: AppDatabase;
};

/**
 * serverless 平台（Vercel 等）会并发启动大量短生命周期实例，
 * 每个实例开自己的连接池很容易打满数据库的连接数上限。
 * DATABASE_POOL_MAX=1 配合空闲回收，可在免费套餐的 Neon/Supabase 上安全运行。
 */
export function getDatabase(): AppDatabase | null {
  const url = process.env.DATABASE_URL;
  if (!url) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("DATABASE_URL_MISSING");
    }
    return null;
  }

  const requiresSsl =
    process.env.DATABASE_SSL === "true" ||
    /^(?!.*localhost)(?!.*127\.0\.0\.1).*sslmode=require/.test(url);

  if (!globalForDb.hecyPool) {
    globalForDb.hecyPool = new Pool({
      connectionString: url,
      max: Number(process.env.DATABASE_POOL_MAX ?? 5),
      idleTimeoutMillis: 30_000,
      // 云端托管 Postgres（Neon/Supabase/RDS）普遍要求 TLS；本地库不受影响。
      ssl: requiresSsl ? { rejectUnauthorized: false } : undefined,
    });
  }

  if (!globalForDb.hecyDb) {
    globalForDb.hecyDb = drizzle(globalForDb.hecyPool, { schema });
  }

  return globalForDb.hecyDb;
}

export async function closeDatabase() {
  await globalForDb.hecyPool?.end();
  globalForDb.hecyPool = undefined;
  globalForDb.hecyDb = undefined;
}
