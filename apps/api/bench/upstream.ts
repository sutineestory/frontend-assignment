import assert from "node:assert/strict";

import { buildApp } from "../src/http/build-app.js";
import { cacheAsync } from "../src/lib/cache-async.js";
import { fetchUsers, USERS_URL } from "../src/users/dummyjson.js";
import { summarizeByDepartment } from "../src/users/transform.js";
import type { DepartmentSummaries } from "../src/users/types.js";
import { printEnvironment } from "./report.js";

/*
 * The parts that depend on dummyjson. This makes about 7 upstream requests in
 * total, so run it by hand, not in CI or in a loop.
 */

const FULL_URL = "https://dummyjson.com/users?limit=0";
const DOWNLOADS = 3;
const CONCURRENT_REQUESTS = 100;
const WARM_REQUESTS = 20;

const median = (values: number[]) =>
  values.toSorted((a, b) => a - b)[Math.floor(values.length / 2)]!;

async function timed<T>(run: () => Promise<T>) {
  const start = performance.now();
  const value = await run();
  return { value, ms: performance.now() - start };
}

printEnvironment("Upstream: dummyjson (needs network)");

// 1. What `select=` saves on the one upstream request.
const downloads = { full: [] as number[], selected: [] as number[] };
const sizes = { full: 0, selected: 0 };
for (let i = 0; i < DOWNLOADS; i += 1) {
  for (const [key, url] of [
    ["full", FULL_URL],
    ["selected", USERS_URL],
  ] as const) {
    const { value: bytes, ms } = await timed(async () => {
      const response = await fetch(url);
      return (await response.arrayBuffer()).byteLength;
    });
    downloads[key].push(ms);
    sizes[key] = bytes;
  }
}

console.log(`## dummyjson /users?limit=0 (median of ${DOWNLOADS})`);
console.table([
  {
    request: "all fields",
    "body (KB)": (sizes.full / 1024).toFixed(1),
    "time (ms)": Math.round(median(downloads.full)),
  },
  {
    request: "select= the 7 fields we use",
    "body (KB)": (sizes.selected / 1024).toFixed(1),
    "time (ms)": Math.round(median(downloads.selected)),
  },
]);

// 2. Cold vs warm cache through the real HTTP app.
let upstreamCalls = 0;
const countingFetch: typeof fetch = (input, init) => {
  upstreamCalls += 1;
  return fetch(input, init);
};
const app = buildApp({
  getDepartmentSummaries: cacheAsync(
    async () => summarizeByDepartment(await fetchUsers(countingFetch)),
    60_000,
  ),
});
const url = `${await app.listen({ port: 0, host: "127.0.0.1" })}/users/departments`;

const getJson = async () => {
  const response = await fetch(url);
  assert.equal(response.status, 200);
  return (await response.json()) as DepartmentSummaries;
};

const cold = await timed(() =>
  Promise.all(Array.from({ length: CONCURRENT_REQUESTS }, getJson)),
);
const coldCalls = upstreamCalls;

const warmTimes: number[] = [];
for (let i = 0; i < WARM_REQUESTS; i += 1) {
  warmTimes.push((await timed(getJson)).ms);
}
const warmCalls = upstreamCalls - coldCalls;
await app.close();

const departments = cold.value[0]!;
const users = Object.values(departments).reduce(
  (total, { male, female }) => total + male + female,
  0,
);

console.log(
  `## GET /users/departments (${Object.keys(departments).length} departments, ${users} users)`,
);
console.table([
  {
    scenario: `${CONCURRENT_REQUESTS} concurrent requests, cold cache`,
    "time (ms)": Math.round(cold.ms),
    "dummyjson calls": coldCalls,
  },
  {
    scenario: `1 request, warm cache (median of ${WARM_REQUESTS})`,
    "time (ms)": median(warmTimes).toFixed(2),
    "dummyjson calls": warmCalls,
  },
]);
