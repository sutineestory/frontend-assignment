import * as grpc from "@grpc/grpc-js";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createUserServiceClient,
  getDepartmentSummaries,
} from "../src/grpc/client.js";
import { UserService, type UserServiceClient } from "../src/grpc/proto.js";
import {
  buildGrpcServer,
  listen,
  type GrpcDependencies,
} from "../src/grpc/server.js";
import { UpstreamError } from "../src/users/dummyjson.js";
import { summarizeByDepartment } from "../src/users/transform.js";
import { USERS } from "./helpers.js";

describe("gRPC UserService", () => {
  let server: grpc.Server | undefined;
  let client: UserServiceClient | undefined;

  const start = async (deps: Partial<GrpcDependencies> = {}) => {
    server = buildGrpcServer({
      getDepartmentSummaries: async () => summarizeByDepartment(USERS),
      ...deps,
    });
    const port = await listen(server, "127.0.0.1:0");
    client = createUserServiceClient(`127.0.0.1:${port}`);
    return client;
  };

  afterEach(() => {
    client?.close();
    server?.forceShutdown();
  });

  it("GetDepartmentSummaries returns the same data as the HTTP API", async () => {
    const departments = await getDepartmentSummaries(await start());

    expect(departments).toEqual(summarizeByDepartment(USERS));
  });

  it("GetDepartmentSummaries serves new data after the cache refills", async () => {
    const [first, second] = [USERS.slice(0, 1), USERS.slice(1)].map(
      summarizeByDepartment,
    );
    const client = await start({
      getDepartmentSummaries: vi
        .fn<GrpcDependencies["getDepartmentSummaries"]>()
        .mockResolvedValueOnce(first!)
        .mockResolvedValueOnce(first!)
        .mockResolvedValueOnce(second!),
    });

    expect(await getDepartmentSummaries(client)).toEqual(first);
    expect(await getDepartmentSummaries(client)).toEqual(first);
    expect(await getDepartmentSummaries(client)).toEqual(second);
  });

  it("decodes fields a proto3 server leaves out as zero values", () => {
    const method = UserService.service.GetDepartmentSummaries!;
    // As another proto3 implementation may send it: no `male`, no maps.
    const bytes = method.responseSerialize({
      departments: { Support: { female: 1, ageRange: "31-31" } },
    });

    expect(method.responseDeserialize(bytes)).toEqual({
      departments: {
        Support: {
          male: 0,
          female: 1,
          ageRange: "31-31",
          hair: {},
          addressUser: {},
        },
      },
    });
  });

  it("responds UNAVAILABLE when dummyjson fails", async () => {
    const client = await start({
      getDepartmentSummaries: async () => {
        throw new UpstreamError("Failed to load users from dummyjson");
      },
    });

    await expect(getDepartmentSummaries(client)).rejects.toMatchObject({
      code: grpc.status.UNAVAILABLE,
      details: "Failed to load users from dummyjson",
    });
  });

  it("responds INTERNAL on unexpected errors without leaking the message", async () => {
    const errors: unknown[] = [];
    const client = await start({
      getDepartmentSummaries: async () => {
        throw new Error("secret bug detail");
      },
      onError: (error) => errors.push(error),
    });

    await expect(getDepartmentSummaries(client)).rejects.toMatchObject({
      code: grpc.status.INTERNAL,
      details: "Internal server error",
    });
    expect(errors).toHaveLength(1);
  });
});
