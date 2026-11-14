import Fastify, { type FastifyServerOptions } from "fastify";

import { memoizeLast } from "../lib/memoize-last.js";
import type { DepartmentSummaries } from "../users/types.js";

export type AppDependencies = {
  getDepartmentSummaries: () => Promise<DepartmentSummaries>;
};

const JSON_CONTENT_TYPE = "application/json; charset=utf-8";

export function buildApp(
  { getDepartmentSummaries }: AppDependencies,
  options: FastifyServerOptions = {},
) {
  const app = Fastify(options);

  // The cache returns the same summaries object until it refills, so encode it
  // to JSON bytes once and send those as-is. About 3x the throughput of
  // serializing on every request (see bench/http.ts).
  const encodeSummaries = memoizeLast((summaries: DepartmentSummaries) =>
    Buffer.from(JSON.stringify(summaries)),
  );

  app.get("/", async () => ({
    endpoints: ["/users/departments", "/health"],
  }));

  app.get("/health", async () => ({ status: "ok" }));

  app.get("/users/departments", async (_request, reply) => {
    const body = encodeSummaries(await getDepartmentSummaries());
    return reply.type(JSON_CONTENT_TYPE).send(body);
  });

  return app;
}
