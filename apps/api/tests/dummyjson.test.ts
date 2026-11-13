import { describe, expect, it, vi } from "vitest";

import { UpstreamError, fetchUsers } from "../src/users/dummyjson.js";
import { USERS } from "./helpers.js";

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

describe("fetchUsers", () => {
  it("requests every user with only the fields it needs", async () => {
    const fetchFn = vi.fn(async () => jsonResponse({ users: USERS }));

    const users = await fetchUsers(fetchFn);

    expect(users).toEqual(USERS);
    const [url, init] = fetchFn.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    const { searchParams } = new URL(url);
    expect(searchParams.get("limit")).toBe("0");
    expect(searchParams.get("select")?.split(",").sort()).toEqual([
      "address",
      "age",
      "company",
      "firstName",
      "gender",
      "hair",
      "lastName",
    ]);
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it("wraps a non-2xx response in an UpstreamError with status 502", async () => {
    const fetchFn = vi.fn(async () => jsonResponse({}, 503));

    const error = await fetchUsers(fetchFn).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(UpstreamError);
    expect(error).toMatchObject({ statusCode: 502 });
  });

  it("wraps a network failure in an UpstreamError", async () => {
    const fetchFn = vi.fn(async () => {
      throw new TypeError("fetch failed");
    });

    await expect(fetchUsers(fetchFn)).rejects.toBeInstanceOf(UpstreamError);
  });

  it("wraps an unexpected response body in an UpstreamError", async () => {
    const fetchFn = vi.fn(async () => jsonResponse({ message: "nope" }));

    await expect(fetchUsers(fetchFn)).rejects.toBeInstanceOf(UpstreamError);
  });
});
