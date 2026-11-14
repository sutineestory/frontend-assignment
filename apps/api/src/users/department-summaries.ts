import { cacheAsync } from "../lib/cache-async.js";
import { fetchUsers } from "./dummyjson.js";
import { summarizeByDepartment } from "./transform.js";
import type { DepartmentSummaries } from "./types.js";

export const CACHE_TTL_MS = 60_000;

/**
 * Department summaries built from dummyjson and cached for a minute.
 * The HTTP and gRPC servers both read through this.
 */
export function createDepartmentSummariesSource(
  fetchFn: typeof fetch = fetch,
): () => Promise<DepartmentSummaries> {
  return cacheAsync(
    async () => summarizeByDepartment(await fetchUsers(fetchFn)),
    CACHE_TTL_MS,
  );
}
