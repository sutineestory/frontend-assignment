import Fastify, { type FastifyServerOptions } from "fastify";

import type { DepartmentSummaries } from "../users/types.js";
import { departmentSummariesSchema } from "./schemas.js";

export type AppDependencies = {
  getDepartmentSummaries: () => Promise<DepartmentSummaries>;
};

export function buildApp(
  { getDepartmentSummaries }: AppDependencies,
  options: FastifyServerOptions = {},
) {
  const app = Fastify(options);

  app.get("/", async () => ({
    endpoints: ["/users/departments", "/health"],
  }));

  app.get("/health", async () => ({ status: "ok" }));

  app.get(
    "/users/departments",
    { schema: { response: { 200: departmentSummariesSchema } } },
    () => getDepartmentSummaries(),
  );

  return app;
}
