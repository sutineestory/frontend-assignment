import { createDepartmentSummariesSource } from "../users/department-summaries.js";
import { buildGrpcServer, listen } from "./server.js";

// Local only: Vercel Functions can't host a long-running HTTP/2 server.
const port = Number(process.env.GRPC_PORT ?? 50051);

const server = buildGrpcServer({
  getDepartmentSummaries: createDepartmentSummariesSource(),
  onError: (error) => console.error(error),
});

try {
  await listen(server, `localhost:${port}`);
  console.log(`gRPC UserService listening on localhost:${port}`);
} catch (error) {
  console.error(error);
  process.exit(1);
}

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => server.tryShutdown(() => process.exit(0)));
}
