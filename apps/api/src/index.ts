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

// Not awaited, as in Vercel's Fastify docs: Vercel captures listen() while
// the module loads, and awaiting it there stalls the function's startup.
app.listen({ port }).catch((error: unknown) => {
  app.log.error(error);
  process.exit(1);
});
