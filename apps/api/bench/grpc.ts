import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";

import * as grpc from "@grpc/grpc-js";

import {
  createUserServiceClient,
  getDepartmentSummaries as callGetDepartmentSummaries,
} from "../src/grpc/client.js";
import { UserService } from "../src/grpc/proto.js";
import { buildGrpcServer, listen } from "../src/grpc/server.js";
import { summarizeByDepartment } from "../src/users/transform.js";
import { makeUsers } from "./fixtures.js";
import { printEnvironment } from "./report.js";

/*
 * gRPC calls/s with a warm cache. The server runs in its own process and
 * serves in-memory summaries; this process keeps CONCURRENCY calls in flight.
 */

const CONCURRENCY = 100;
const DURATION_MS = 5000;
const ROUNDS = 3;

// 208 users, the real dummyjson size.
const summaries = summarizeByDepartment(makeUsers(208));
const getDepartmentSummaries = async () => summaries;

const STRATEGIES: Record<string, () => grpc.Server> = {
  "encode per call": () => {
    const server = new grpc.Server();
    server.addService(UserService.service, {
      GetDepartmentSummaries: (
        _call: unknown,
        callback: grpc.sendUnaryData<unknown>,
      ) => {
        void getDepartmentSummaries().then((departments) =>
          callback(null, { departments }),
        );
      },
    });
    return server;
  },
  "encode once (src/grpc/server.ts)": () =>
    buildGrpcServer({ getDepartmentSummaries }),
};

const [mode, strategyArg] = process.argv.slice(2);

if (mode === "serve") {
  // Child process: serve one strategy and report the port.
  const build = STRATEGIES[strategyArg ?? ""];
  if (!build) throw new Error(`Unknown strategy: ${strategyArg}`);
  process.stdout.write(`${await listen(build(), "127.0.0.1:0")}\n`);
} else {
  printEnvironment(
    `gRPC: ${CONCURRENCY} concurrent calls, ${DURATION_MS / 1000}s per run, median of ${ROUNDS} rounds`,
  );

  const results = new Map<string, number[]>();

  for (let round = 1; round <= ROUNDS; round += 1) {
    for (const name of Object.keys(STRATEGIES)) {
      const server = spawn(
        process.execPath,
        [...process.execArgv, import.meta.filename, "serve", name],
        { stdio: ["ignore", "pipe", "inherit"] },
      );
      const [chunk] = (await once(server.stdout, "data")) as [Buffer];
      const client = createUserServiceClient(
        `127.0.0.1:${chunk.toString().trim()}`,
      );

      try {
        // Every strategy must send the same data, or the comparison means nothing.
        assert.deepEqual(await callGetDepartmentSummaries(client), summaries);

        const callUntil = async (deadline: number) => {
          let calls = 0;
          while (Date.now() < deadline) {
            await callGetDepartmentSummaries(client);
            calls += 1;
          }
          return calls;
        };
        const workers = (deadline: number) =>
          Promise.all(
            Array.from({ length: CONCURRENCY }, () => callUntil(deadline)),
          );

        await workers(Date.now() + 1000); // warm-up
        const start = Date.now();
        const calls = (await workers(start + DURATION_MS)).reduce(
          (sum, n) => sum + n,
        );
        const callsPerSecond = calls / ((Date.now() - start) / 1000);

        results.set(name, [...(results.get(name) ?? []), callsPerSecond]);
        console.log(
          `round ${round}: ${name} ${Math.round(callsPerSecond)} calls/s`,
        );
      } finally {
        client.close();
        server.kill();
      }
    }
  }

  const median = (values: number[]) =>
    values.toSorted((a, b) => a - b)[Math.floor(values.length / 2)]!;
  const baseline = median(results.get("encode per call")!);

  console.table(
    [...results].map(([name, runs]) => ({
      strategy: name,
      "calls/s": Math.round(median(runs)).toLocaleString("en-US"),
      "vs per call": `${(median(runs) / baseline).toFixed(2)}x`,
    })),
  );
}
