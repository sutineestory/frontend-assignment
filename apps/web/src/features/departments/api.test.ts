import { describe, expect, it, vi } from "vitest";

import { fetchDepartmentSummaries } from "./api";
import { SUMMARIES } from "./fixtures";

const respond = (body: unknown, status = 200) =>
  vi.fn(async () => new Response(JSON.stringify(body), { status }));

describe("fetchDepartmentSummaries", () => {
  it("loads /users/departments from the API", async () => {
    const fetchFn = respond(SUMMARIES);

    await expect(
      fetchDepartmentSummaries("http://api.test", fetchFn),
    ).resolves.toEqual(SUMMARIES);
    const [url] = fetchFn.mock.calls[0] as unknown as [URL];
    expect(String(url)).toBe("http://api.test/users/departments");
  });

  it("rejects when the API answers with an error status", async () => {
    await expect(
      fetchDepartmentSummaries("http://api.test", respond({}, 502)),
    ).rejects.toThrow("The API answered 502");
  });

  it("rejects data in an unexpected shape", async () => {
    const broken = { Sales: { ...SUMMARIES.Sales, male: "none" } };

    await expect(
      fetchDepartmentSummaries("http://api.test", respond(broken)),
    ).rejects.toThrow("unexpected shape");
  });
});
