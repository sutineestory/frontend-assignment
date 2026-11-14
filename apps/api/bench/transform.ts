import assert from "node:assert/strict";

import { summarizeByDepartment } from "../src/users/transform.js";
import type { DepartmentSummaries, User } from "../src/users/types.js";
import { makeUsers } from "./fixtures.js";
import {
  measure,
  measureIsolated,
  printEnvironment,
  printTable,
} from "./report.js";

/**
 * The idiomatic alternative: group first, then derive each field with its
 * own array pass. Easier to read, but it walks every group several times and
 * allocates intermediate arrays.
 */
function summarizeMultiPass(users: readonly User[]): DepartmentSummaries {
  const groups = Object.groupBy(users, (user) => user.company.department);

  return Object.fromEntries(
    Object.entries(groups).map(([department, group = []]) => {
      const ages = group.map((user) => user.age);
      const summary = {
        male: group.filter((user) => user.gender === "male").length,
        female: group.filter((user) => user.gender === "female").length,
        ageRange: `${Math.min(...ages)}-${Math.max(...ages)}`,
        hair: group.reduce<Record<string, number>>((counts, user) => {
          counts[user.hair.color] = (counts[user.hair.color] ?? 0) + 1;
          return counts;
        }, {}),
        addressUser: Object.fromEntries(
          group.map((user) => [
            `${user.firstName}${user.lastName}`,
            user.address.postalCode,
          ]),
        ),
      };
      return [department, summary];
    }),
  );
}

const IMPLEMENTATIONS: Record<string, (users: User[]) => DepartmentSummaries> =
  {
    "single pass (src/users/transform.ts)": summarizeByDepartment,
    "multi pass (groupBy + filter/map/reduce)": summarizeMultiPass,
  };

// 208 is the real dummyjson size; the larger sets show how each approach scales.
const SIZES = [208, 10_000, 100_000];

const [sizeArg, taskArg] = process.argv.slice(2);

if (sizeArg && taskArg) {
  // Child process: measure one implementation at one size.
  const users = makeUsers(Number(sizeArg));
  const summarize = IMPLEMENTATIONS[taskArg];
  if (!summarize) throw new Error(`Unknown task: ${taskArg}`);
  await measure(() => {
    summarize(users);
  });
} else {
  printEnvironment("Transform: summarizeByDepartment");

  for (const size of SIZES) {
    // Both must produce the same result, or the comparison means nothing.
    const users = makeUsers(size);
    assert.deepEqual(summarizeMultiPass(users), summarizeByDepartment(users));

    const rows = [];
    for (const task of Object.keys(IMPLEMENTATIONS)) {
      const measurement = await measureIsolated(import.meta.filename, [
        String(size),
        task,
      ]);
      rows.push({ task, measurement });
    }
    printTable(`${size.toLocaleString("en-US")} users`, rows);
  }
}
