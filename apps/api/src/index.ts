import { buildApp } from "./http/build-app.js";
import { cacheAsync } from "./lib/cache-async.js";
import { fetchUsers } from "./users/dummyjson.js";
import { summarizeByDepartment } from "./users/transform.js";

const CACHE_TTL_MS = 60_000;

const getDepartmentSummaries = cacheAsync(
  async () => summarizeByDepartment(await fetchUsers()),
  CACHE_TTL_MS,
);

const app = buildApp({ getDepartmentSummaries }, { logger: true });
const port = Number(process.env.PORT ?? 3000);

try {
  await app.listen({ port });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
