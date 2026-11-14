import { describe, expect, it, vi } from "vitest";

import { memoizeLast } from "../src/lib/memoize-last.js";

describe("memoizeLast", () => {
  it("computes once while the same object is passed", () => {
    const compute = vi.fn((value: { n: number }) => value.n * 2);
    const double = memoizeLast(compute);
    const value = { n: 21 };

    expect(double(value)).toBe(42);
    expect(double(value)).toBe(42);
    expect(compute).toHaveBeenCalledTimes(1);
  });

  it("recomputes when a different object is passed, even with equal contents", () => {
    const compute = vi.fn((value: { n: number }) => value.n * 2);
    const double = memoizeLast(compute);

    expect(double({ n: 1 })).toBe(2);
    expect(double({ n: 1 })).toBe(2);
    expect(double({ n: 5 })).toBe(10);
    expect(compute).toHaveBeenCalledTimes(3);
  });
});
