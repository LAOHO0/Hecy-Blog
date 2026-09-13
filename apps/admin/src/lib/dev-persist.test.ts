import { mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

// dev-persist 依赖 server-only，vitest 在 Node 环境运行时需屏蔽该守卫。
vi.mock("server-only", () => ({}));

import { loadDevStore, saveDevStore } from "./dev-persist";

describe("dev store snapshot", () => {
  it("round-trips state through a json file", () => {
    const dir = join(tmpdir(), `hecy-devstore-${Date.now()}-a`);
    mkdirSync(dir, { recursive: true });
    const path = join(dir, "dev-store.json");
    expect(loadDevStore(path)).toBeNull();
    saveDevStore({ content: [{ id: "1" }], settings: { title: "t" } }, path);
    expect(loadDevStore(path)).toEqual({
      content: [{ id: "1" }],
      settings: { title: "t" },
    });
  });

  it("returns null for corrupt or missing files", () => {
    const dir = join(tmpdir(), `hecy-devstore-${Date.now()}-a`);
    mkdirSync(dir, { recursive: true });
    const path = join(dir, "dev-store.json");
    writeFileSync(path, "{corrupt", "utf8");
    expect(loadDevStore(path)).toBeNull();
    expect(loadDevStore(join(dir, "missing.json"))).toBeNull();
  });
});
