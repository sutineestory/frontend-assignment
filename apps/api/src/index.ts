import Fastify from "fastify";

import { registerRoutes } from "./http/build-app.js";
import { createDepartmentSummariesSource } from "./users/department-summaries.js";

// Vercel's zero-config Fastify support looks for this file and needs it to
// create the Fastify instance, register the routes, and call listen().
const app = Fastify({ logger: true });
registerRoutes(app, {
  getDepartmentSummaries: createDepartmentSummariesSource(),
});

const port = Number(process.env.PORT ?? 3000);

try {
  await app.listen({ port });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
