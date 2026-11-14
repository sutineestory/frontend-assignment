import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";

import autocannon from "autocannon";
import Fastify from "fastify";

import { buildApp } from "../src/http/build-app.js";
import { summarizeByDepartment } from "../src/users/transform.js";
import { makeUsers } from "./fixtures.js";
import { departmentSummariesSchema } from "./legacy-schema.js";
import { printEnvironment } from "./report.js";

/*
 * HTTP throughput with a warm cache, for each way of producing the response.
 * Every server runs in its own process and serves the same in-memory
 * summaries, so this measures our code and Fastify, not dummyjson.
 */

const DURATION_S = 5;
const CONNECTIONS = 100;
const ROUNDS = 3;

// 208 users, the real dummyjson size.
const summaries = summarizeByDepartment(makeUsers(208));
const getDepartmentSummaries = async () => summaries;

type Strategy = { path: string; build: () => ReturnType<typeof Fastify> };

const STRATEGIES: Record<string, Strategy> = {
  "GET /health (Fastify ceiling)": {
    path: "/health",
    build: () => buildApp({ getDepartmentSummaries }),
  },
  "response schema (fast-json-stringify)": {
    path: "/users/departments",
    build: () => {
      const app = Fastify();
      app.get(
        "/users/departments",
        { schema: { response: { 200: departmentSummariesSchema } } },
        () => getDepartmentSummaries(),
      );
      return app;
    },
  },
  "JSON.stringify per request": {
    path: "/users/departments",
    build: () => {
      const app = Fastify();
      app.get("/users/departments", () => getDepartmentSummaries());
      return app;
    },
  },
  "encode once (src/http/build-app.ts)": {
    path: "/users/departments",
    build: () => buildApp({ getDepartmentSummaries }),
  },
};

const [mode, strategyArg] = process.argv.slice(2);

if (mode === "serve") {
  // Child process: serve one strategy and report the address.
  const strategy = STRATEGIES[strategyArg ?? ""];
  if (!strategy) throw new Error(`Unknown strategy: ${strategyArg}`);
  const address = await strategy.build().listen({ port: 0, host: "127.0.0.1" });
  process.stdout.write(`${address}\n`);
} else {
  printEnvironment(
    `HTTP: ${CONNECTIONS} connections, ${DURATION_S}s per run, median of ${ROUNDS} rounds`,
  );

  const results = new Map<
    string,
    { rps: number; p50: number; p99: number }[]
  >();

  for (let round = 1; round <= ROUNDS; round += 1) {
    // Interleave strategies so background noise hits all of them equally.
    for (const [name, { path }] of Object.entries(STRATEGIES)) {
      const server = spawn(
        process.execPath,
        [...process.execArgv, import.meta.filename, "serve", name],
        { stdio: ["ignore", "pipe", "inherit"] },
      );
      try {
        const [chunk] = (await once(server.stdout, "data")) as [Buffer];
        const url = `${chunk.toString().trim()}${path}`;

        if (path === "/users/departments") {
          // Every strategy must send the same data, or the comparison means nothing.
          const response = await fetch(url);
          assert.equal(
            response.headers.get("content-type"),
            "application/json; charset=utf-8",
          );
          assert.deepEqual(await response.json(), summaries);
        }

        await autocannon({ url, connections: CONNECTIONS, duration: 1 }); // warm-up
        const result = await autocannon({
          url,
          connections: CONNECTIONS,
          duration: DURATION_S,
        });
        assert.equal(result.errors + result.non2xx, 0, `${name} had failures`);

        const runs = results.get(name) ?? [];
        runs.push({
          rps: result.requests.average,
          p50: result.latency.p50,
          p99: result.latency.p99,
        });
        results.set(name, runs);
        console.log(
          `round ${round}: ${name} ${Math.round(result.requests.average)} req/s`,
        );
      } finally {
        server.kill();
      }
    }
  }

  const median = (values: number[]) =>
    values.toSorted((a, b) => a - b)[Math.floor(values.length / 2)]!;
  const baseline = median(
    results.get("JSON.stringify per request")!.map((run) => run.rps),
  );

  console.table(
    [...results].map(([name, runs]) => {
      const rps = median(runs.map((run) => run.rps));
      return {
        strategy: name,
        "req/s": Math.round(rps).toLocaleString("en-US"),
        "p50 (ms)": median(runs.map((run) => run.p50)),
        "p99 (ms)": median(runs.map((run) => run.p99)),
        "vs JSON.stringify": `${(rps / baseline).toFixed(2)}x`,
      };
    }),
  );
}
