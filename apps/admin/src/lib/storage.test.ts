import { describe, expect, it, vi } from "vitest";

// storage 是 server-only 模块，vitest 在 Node 环境运行时需屏蔽该守卫。
vi.mock("server-only", () => ({}));

import { getStorageDriver, validateMediaUpload } from "./storage";

describe("media storage configuration", () => {
  it("uses local storage by default", () => {
    const previous = process.env.STORAGE_DRIVER;
    delete process.env.STORAGE_DRIVER;
    expect(getStorageDriver()).toBe("local");
    if (previous === undefined) delete process.env.STORAGE_DRIVER;
    else process.env.STORAGE_DRIVER = previous;
  });

  it("accepts supported images and rejects oversized files", () => {
    expect(validateMediaUpload({ mimeType: "image/png", size: 1024 })).toEqual({
      ok: true,
    });
    expect(
      validateMediaUpload({
        mimeType: "image/png",
        size: 16 * 1024 * 1024 + 1,
      }),
    ).toEqual({ ok: false, error: "FILE_TOO_LARGE" });
    expect(validateMediaUpload({ mimeType: "text/plain", size: 10 })).toEqual({
      ok: false,
      error: "UNSUPPORTED_FILE_TYPE",
    });
  });
});
