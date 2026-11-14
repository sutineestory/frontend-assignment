import { createUserServiceClient, getDepartmentSummaries } from "./client.js";

// Calls a running gRPC server and prints the response:
// pnpm --filter api grpc:call [address]
const address =
  process.argv[2] ?? `localhost:${process.env.GRPC_PORT ?? 50051}`;
const client = createUserServiceClient(address);

try {
  console.log(JSON.stringify(await getDepartmentSummaries(client), null, 2));
} catch (error) {
  const reason = error instanceof Error ? error.message : String(error);
  console.error(`Could not call ${address}: ${reason}`);
  process.exitCode = 1;
} finally {
  client.close();
}
