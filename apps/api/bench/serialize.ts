import assert from "node:assert/strict";

import fastJson from "fast-json-stringify";

import { summarizeByDepartment } from "../src/users/transform.js";
import type { DepartmentSummaries } from "../src/users/types.js";
import { makeUsers } from "./fixtures.js";
import { departmentSummariesSchema } from "./legacy-schema.js";
import {
  measure,
  measureIsolated,
  printEnvironment,
  printTable,
} from "./report.js";

// Fastify compiles a route's response schema with fast-json-stringify.
const stringifyWithSchema = fastJson(departmentSummariesSchema);

const SERIALIZERS: Record<string, (summaries: DepartmentSummaries) => string> =
  {
    "fast-json-stringify (response schema)": stringifyWithSchema,
    "JSON.stringify": (summaries) => JSON.stringify(summaries),
  };

// 208 is the real dummyjson size.
const SIZES = [208, 10_000];

const [sizeArg, taskArg] = process.argv.slice(2);

if (sizeArg && taskArg) {
  // Child process: measure one serializer at one size.
  const summaries = summarizeByDepartment(makeUsers(Number(sizeArg)));
  const serialize = SERIALIZERS[taskArg];
  if (!serialize) throw new Error(`Unknown task: ${taskArg}`);
  await measure(() => {
    serialize(summaries);
  });
} else {
  printEnvironment("Serialize: GET /users/departments response body");

  for (const size of SIZES) {
    const summaries = summarizeByDepartment(makeUsers(size));
    assert.deepEqual(JSON.parse(stringifyWithSchema(summaries)), summaries);
    const kb = Buffer.byteLength(JSON.stringify(summaries)) / 1024;

    const rows = [];
    for (const task of Object.keys(SERIALIZERS)) {
      const measurement = await measureIsolated(import.meta.filename, [
        String(size),
        task,
      ]);
      rows.push({ task, measurement });
    }
    printTable(
      `${size.toLocaleString("en-US")} users (${kb.toFixed(1)} KB)`,
      rows,
    );
  }
}
