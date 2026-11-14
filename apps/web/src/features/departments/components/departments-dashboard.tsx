import { connection } from "next/server";

import { fetchDepartmentSummaries } from "../api";
import { Dashboard } from "./dashboard";
import { LoadError } from "./load-error";

// Part 2's HTTP API. On Vercel, set API_URL to the deployed API's URL.
const API_URL = process.env.API_URL ?? "http://localhost:4000";

/** Loads the data on the server, so the browser never calls the API itself. */
export async function DepartmentsDashboard() {
  // Fetch per request, not during `next build`: the API may not be reachable
  // from the build, and it already caches its answer for a minute.
  await connection();

  const data = await fetchDepartmentSummaries(API_URL).then(
    (summaries) => ({ summaries, fetchedAt: new Date().toISOString() }),
    (error: unknown) => {
      console.error("Could not load department summaries", error);
      return null;
    },
  );

  if (!data) return <LoadError />;
  return <Dashboard summaries={data.summaries} fetchedAt={data.fetchedAt} />;
}
