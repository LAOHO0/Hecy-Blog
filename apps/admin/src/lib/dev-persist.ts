import "server-only";

import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

/**
 * 本地开发的内存快照持久化：后台以内存模式运行（未配置 DATABASE_URL）时，
 * 定期把内存数据写入 data/dev-store.json，进程重启后自动恢复，
 * 避免本地写作内容因 dev 进程退出而丢失。生产 Postgres 模式不经过此模块。
 */

const STORE_PATH = join(process.cwd(), "data", "dev-store.json");

export function devStorePath(): string {
  return STORE_PATH;
}

/** 读取本地快照；不存在或 JSON 损坏时返回 null，由调用方回退种子数据。 */
export function loadDevStore<T>(path: string = STORE_PATH): T | null {
  try {
    return JSON.parse(readFileSync(path, "utf8")) as T;
  } catch {
    return null;
  }
}

/** 原子写快照：先写临时文件再改名，失败静默（不影响内存中的正常使用）。 */
export function saveDevStore<T>(state: T, path: string = STORE_PATH): void {
  const tmp = `${path}.tmp`;
  try {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(tmp, JSON.stringify(state), "utf8");
    renameSync(tmp, path);
  } catch {
    // 忽略写盘失败：快照是尽力而为的本地开发辅助。
  }
}
