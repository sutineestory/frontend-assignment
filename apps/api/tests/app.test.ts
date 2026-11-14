import { afterEach, describe, expect, it, vi } from "vitest";

import { buildApp, type AppDependencies } from "../src/http/build-app.js";
import { UpstreamError } from "../src/users/dummyjson.js";
import { summarizeByDepartment } from "../src/users/transform.js";
import { USERS } from "./helpers.js";

describe("HTTP API", () => {
  let app: ReturnType<typeof buildApp> | undefined;

  const start = (deps: Partial<AppDependencies> = {}) => {
    app = buildApp({
      getDepartmentSummaries: async () => summarizeByDepartment(USERS),
      ...deps,
    });
    return app;
  };

  afterEach(async () => {
    await app?.close();
  });

  it("GET /health responds with ok", async () => {
    const response = await start().inject({ method: "GET", url: "/health" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "ok" });
  });

  it("GET / lists the available endpoints", async () => {
    const response = await start().inject({ method: "GET", url: "/" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      endpoints: expect.arrayContaining(["/users/departments"]),
    });
  });

  it("GET /users/departments returns users grouped by department", async () => {
    const response = await start().inject({
      method: "GET",
      url: "/users/departments",
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toBe(
      "application/json; charset=utf-8",
    );
    expect(response.json()).toEqual(summarizeByDepartment(USERS));
  });

  it("GET /users/departments serves new data after the cache refills", async () => {
    const [first, second] = [USERS.slice(0, 1), USERS.slice(1)].map(
      summarizeByDepartment,
    );
    const getDepartmentSummaries = vi
      .fn<AppDependencies["getDepartmentSummaries"]>()
      .mockResolvedValueOnce(first!)
      .mockResolvedValueOnce(first!)
      .mockResolvedValueOnce(second!);
    const server = start({ getDepartmentSummaries });
    const get = () =>
      server.inject({ method: "GET", url: "/users/departments" });

    expect((await get()).json()).toEqual(first);
    expect((await get()).json()).toEqual(first);
    expect((await get()).json()).toEqual(second);
  });

  it("GET /users/departments responds 502 when dummyjson fails", async () => {
    const response = await start({
      getDepartmentSummaries: async () => {
        throw new UpstreamError("Failed to load users from dummyjson");
      },
    }).inject({ method: "GET", url: "/users/departments" });

    expect(response.statusCode).toBe(502);
    expect(response.json()).toMatchObject({
      error: "Bad Gateway",
      message: "Failed to load users from dummyjson",
    });
  });

  it("GET /users/departments responds 500 on unexpected errors", async () => {
    const response = await start({
      getDepartmentSummaries: async () => {
        throw new Error("bug");
      },
    }).inject({ method: "GET", url: "/users/departments" });

    expect(response.statusCode).toBe(500);
  });
});
