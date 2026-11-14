import { buildApp } from "./http/build-app.js";
import { createDepartmentSummariesSource } from "./users/department-summaries.js";

const app = buildApp(
  { getDepartmentSummaries: createDepartmentSummariesSource() },
  { logger: true },
);
const port = Number(process.env.PORT ?? 3000);

try {
  await app.listen({ port });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
