import * as grpc from "@grpc/grpc-js";

import type { DepartmentSummaries } from "../users/types.js";
import { UserService, type UserServiceClient } from "./proto.js";

export function createUserServiceClient(address: string): UserServiceClient {
  return new UserService(
    address,
    grpc.credentials.createInsecure(),
  ) as unknown as UserServiceClient;
}

export function getDepartmentSummaries(
  client: UserServiceClient,
): Promise<DepartmentSummaries> {
  return new Promise((resolve, reject) => {
    client.GetDepartmentSummaries({}, (error, response) => {
      if (error) reject(error);
      else resolve(response?.departments ?? {});
    });
  });
}
