import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cacheAsync } from "../src/lib/cache-async.js";

const TTL_MS = 60_000;

describe("cacheAsync", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shares one in-flight load between concurrent callers", async () => {
    const load = vi.fn(async () => "value");
    const get = cacheAsync(load, TTL_MS);

    const results = await Promise.all([get(), get(), get()]);

    expect(results).toEqual(["value", "value", "value"]);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("serves the cached value until the TTL expires, then reloads", async () => {
    let calls = 0;
    const load = vi.fn(async () => `value ${++calls}`);
    const get = cacheAsync(load, TTL_MS);

    expect(await get()).toBe("value 1");

    vi.advanceTimersByTime(TTL_MS - 1);
    expect(await get()).toBe("value 1");

    vi.advanceTimersByTime(1);
    expect(await get()).toBe("value 2");
    expect(load).toHaveBeenCalledTimes(2);
  });

  it("does not cache failures", async () => {
    const load = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce("value");
    const get = cacheAsync(load, TTL_MS);

    await expect(get()).rejects.toThrow("boom");
    expect(await get()).toBe("value");
  });

  it("rejects every concurrent caller when the shared load fails", async () => {
    const load = vi.fn(async () => {
      throw new Error("boom");
    });
    const get = cacheAsync(load, TTL_MS);

    const results = await Promise.allSettled([get(), get()]);

    expect(results.map((result) => result.status)).toEqual([
      "rejected",
      "rejected",
    ]);
    expect(load).toHaveBeenCalledTimes(1);
  });
});
