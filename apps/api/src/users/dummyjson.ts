import type { User } from "./types.js";

const USER_FIELDS = [
  "firstName",
  "lastName",
  "gender",
  "age",
  "hair",
  "address",
  "company",
] as const;

// `limit=0` returns all users; without it dummyjson only returns the first 30.
export const USERS_URL = `https://dummyjson.com/users?limit=0&select=${USER_FIELDS.join(",")}`;

const REQUEST_TIMEOUT_MS = 5000;

/** dummyjson failed or returned something unexpected. Fastify maps `statusCode` to the response. */
export class UpstreamError extends Error {
  readonly statusCode = 502;
}

export async function fetchUsers(
  fetchFn: typeof fetch = fetch,
): Promise<User[]> {
  try {
    const response = await fetchFn(USERS_URL, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const body = (await response.json()) as { users?: unknown };
    if (!Array.isArray(body.users)) {
      throw new Error("Response has no users array");
    }
    return body.users as User[];
  } catch (error) {
    throw new UpstreamError("Failed to load users from dummyjson", {
      cause: error,
    });
  }
}
