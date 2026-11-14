import * as grpc from "@grpc/grpc-js";

import { memoizeLast } from "../lib/memoize-last.js";
import { UpstreamError } from "../users/dummyjson.js";
import type { DepartmentSummaries } from "../users/types.js";
import {
  UserService,
  type GetDepartmentSummariesRequest,
  type GetDepartmentSummariesResponse,
} from "./proto.js";

export type GrpcDependencies = {
  getDepartmentSummaries: () => Promise<DepartmentSummaries>;
  onError?: (error: unknown) => void;
};

export function buildGrpcServer({
  getDepartmentSummaries,
  onError,
}: GrpcDependencies): grpc.Server {
  // Same idea as the HTTP route: the summaries only change when the cache
  // refills, so reuse one response object per summaries object and encode
  // that to protobuf once. About 1.5x the calls/s (see bench/grpc.ts).
  const toResponse = memoizeLast(
    (departments: DepartmentSummaries): GetDepartmentSummariesResponse => ({
      departments,
    }),
  );
  const method = UserService.service.GetDepartmentSummaries!;
  const service: grpc.ServiceDefinition = {
    ...UserService.service,
    GetDepartmentSummaries: {
      ...method,
      // grpc-js copies these bytes into each frame, so sharing them is safe.
      responseSerialize: memoizeLast(method.responseSerialize),
    },
  };

  const getDepartmentSummariesHandler: grpc.handleUnaryCall<
    GetDepartmentSummariesRequest,
    GetDepartmentSummariesResponse
  > = (_call, callback) => {
    getDepartmentSummaries().then(
      (departments) => callback(null, toResponse(departments)),
      (error: unknown) => {
        onError?.(error);
        callback(toStatus(error));
      },
    );
  };

  const server = new grpc.Server();
  server.addService(service, {
    GetDepartmentSummaries: getDepartmentSummariesHandler,
  });
  return server;
}

/**
 * Mirrors the HTTP API: dummyjson failures are UNAVAILABLE (the gRPC code for
 * HTTP 502), anything else is INTERNAL without leaking the message.
 */
function toStatus(error: unknown): Partial<grpc.StatusObject> {
  if (error instanceof UpstreamError) {
    return { code: grpc.status.UNAVAILABLE, details: error.message };
  }
  return { code: grpc.status.INTERNAL, details: "Internal server error" };
}

/** Binds without TLS (local use only) and resolves with the bound port. */
export function listen(server: grpc.Server, address: string): Promise<number> {
  return new Promise((resolve, reject) => {
    server.bindAsync(
      address,
      grpc.ServerCredentials.createInsecure(),
      (error, port) => (error ? reject(error) : resolve(port)),
    );
  });
}
