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
  override readonly name = "UpstreamError";
  readonly statusCode = 502;
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isString = (value: unknown): value is string => typeof value === "string";

/** Checks every field the transform reads, so bad data is a 502, not a crash. */
function isUser(value: unknown): value is User {
  return (
    isObject(value) &&
    isString(value.firstName) &&
    isString(value.lastName) &&
    isString(value.gender) &&
    typeof value.age === "number" &&
    isObject(value.hair) &&
    isString(value.hair.color) &&
    isObject(value.address) &&
    isString(value.address.postalCode) &&
    isObject(value.company) &&
    isString(value.company.department)
  );
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
    const invalid = body.users.findIndex((user) => !isUser(user));
    if (invalid !== -1) {
      throw new Error(`User at index ${invalid} is missing fields`);
    }
    return body.users as User[];
  } catch (error) {
    throw new UpstreamError("Failed to load users from dummyjson", {
      cause: error,
    });
  }
}
