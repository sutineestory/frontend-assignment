import { execFile } from "node:child_process";
import os from "node:os";
import { promisify } from "node:util";

import { Bench } from "tinybench";

const execFileAsync = promisify(execFile);

export type Measurement = { meanMs: number; opsPerSec: number; rme: number };

/** Prints the machine and runtime so results can be compared fairly. */
export function printEnvironment(title: string): void {
  const cpu = os.cpus()[0]?.model ?? "unknown CPU";
  console.log(`\n# ${title}`);
  console.log(`${cpu} · ${os.cpus().length} cores · Node ${process.version}\n`);
}

/**
 * Benchmarks one task and writes its stats to stdout as JSON.
 * Called in the child process started by `measureIsolated`.
 */
export async function measure(task: () => void): Promise<void> {
  const bench = new Bench({ time: 1000 });
  bench.add("task", task);
  await bench.run();

  const result = bench.tasks[0]?.result;
  if (result?.state !== "completed") {
    throw new Error(`Benchmark did not complete: ${result?.state}`);
  }
  const measurement: Measurement = {
    meanMs: result.latency.mean,
    opsPerSec: result.throughput.mean,
    rme: result.latency.rme,
  };
  process.stdout.write(JSON.stringify(measurement));
}

/**
 * Runs `script` with `args` in a fresh Node process. Tasks that share a process
 * also share JIT and GC state, which skewed some results by up to 2x.
 */
export async function measureIsolated(
  script: string,
  args: string[],
): Promise<Measurement> {
  // `execArgv` carries the tsx loader flags into the child.
  const { stdout } = await execFileAsync(process.execPath, [
    ...process.execArgv,
    script,
    ...args,
  ]);
  return JSON.parse(stdout) as Measurement;
}

/** One row per task: mean latency, ops/s, and speed relative to the fastest. */
export function printTable(
  title: string,
  rows: { task: string; measurement: Measurement }[],
): void {
  const fastest = Math.min(...rows.map((row) => row.measurement.meanMs));

  console.log(`## ${title}`);
  console.table(
    rows.map(({ task, measurement: { meanMs, opsPerSec, rme } }) => ({
      task,
      "mean (ms)": meanMs < 1 ? meanMs.toFixed(4) : meanMs.toFixed(2),
      "ops/s": Math.round(opsPerSec).toLocaleString("en-US"),
      "± %": rme.toFixed(2),
      relative:
        meanMs === fastest
          ? "fastest"
          : `${(meanMs / fastest).toFixed(2)}x slower`,
    })),
  );
}
