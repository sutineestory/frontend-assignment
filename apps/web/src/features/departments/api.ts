import type { DepartmentSummaries, DepartmentSummary } from "./types";

const REQUEST_TIMEOUT_MS = 10_000;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isCount = (value: unknown) =>
  Number.isInteger(value) && (value as number) >= 0;

function isDepartmentSummary(value: unknown): value is DepartmentSummary {
  return (
    isObject(value) &&
    isCount(value.male) &&
    isCount(value.female) &&
    typeof value.ageRange === "string" &&
    /^\d+-\d+$/.test(value.ageRange) &&
    isObject(value.hair) &&
    Object.values(value.hair).every(isCount) &&
    isObject(value.addressUser) &&
    Object.values(value.addressUser).every((code) => typeof code === "string")
  );
}

/** Loads GET /users/departments from the Part 2 API and checks its shape. */
export async function fetchDepartmentSummaries(
  apiUrl: string,
  fetchFn: typeof fetch = fetch,
): Promise<DepartmentSummaries> {
  const response = await fetchFn(new URL("/users/departments", apiUrl), {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`The API answered ${response.status}`);
  }

  const body: unknown = await response.json();
  if (!isObject(body) || !Object.values(body).every(isDepartmentSummary)) {
    throw new Error("The API sent data in an unexpected shape");
  }
  return body as DepartmentSummaries;
}
