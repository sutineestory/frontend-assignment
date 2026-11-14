import { fileURLToPath } from "node:url";

import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";

import type { DepartmentSummaries } from "../users/types.js";

// The same relative path works from src/grpc and dist/grpc.
const PROTO_PATH = fileURLToPath(
  new URL("../../proto/users.proto", import.meta.url),
);

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  // Decode missing fields as zero values (`male: 0`, `hair: {}`). protobufjs
  // writes the zeros it is given, but other proto3 servers may leave them out.
  // Field names become camelCase (age_range -> ageRange), matching DepartmentSummary.
  defaults: true,
});

type UsersPackage = {
  users: { v1: { UserService: grpc.ServiceClientConstructor } };
};

export const UserService = (
  grpc.loadPackageDefinition(packageDefinition) as unknown as UsersPackage
).users.v1.UserService;

// Message types as @grpc/proto-loader decodes them. tests/grpc.test.ts sends
// real data through the real .proto, so it fails if these drift from it.
export type GetDepartmentSummariesRequest = Record<string, never>;
export type GetDepartmentSummariesResponse = {
  departments: DepartmentSummaries;
};

export type UserServiceClient = grpc.Client & {
  GetDepartmentSummaries(
    request: GetDepartmentSummariesRequest,
    callback: grpc.requestCallback<GetDepartmentSummariesResponse>,
  ): grpc.ClientUnaryCall;
};
