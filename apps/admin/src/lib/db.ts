import "server-only";

import * as schema from "@hecy/content/schema";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

type AppDatabase = ReturnType<typeof drizzle<typeof schema>>;

const globalForDb = globalThis as unknown as {
  hecyPool?: Pool;
  hecyDb?: AppDatabase;
};

export function getDatabase(): AppDatabase | null {
  const url = process.env.DATABASE_URL;
  if (!url) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("DATABASE_URL_MISSING");
    }
    return null;
  }

  if (!globalForDb.hecyPool) {
    globalForDb.hecyPool = new Pool({
      connectionString: url,
      max: Number(process.env.DATABASE_POOL_MAX ?? 5),
      idleTimeoutMillis: 30_000,
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
