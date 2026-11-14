"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";

import {
  getOverview,
  hairTotals,
  sortRows,
  toRows,
  type SortKey,
} from "../stats";
import type { DepartmentSummaries } from "../types";
import { AgeChart } from "./age-chart";
import { Controls, type View } from "./controls";
import { DataTable } from "./data-table";
import { DepartmentDetail } from "./department-detail";
import { FetchedAt } from "./fetched-at";
import { GenderChart } from "./gender-chart";
import { HairHeatmap } from "./hair-heatmap";
import { HeadcountChart } from "./headcount-chart";
import { KpiRow } from "./kpi-row";

type DashboardProps = {
  summaries: DepartmentSummaries;
  /** When the server fetched `summaries` from the API (ISO 8601). */
  fetchedAt: string;
};

export function Dashboard({ summaries, fetchedAt }: DashboardProps) {
  const router = useRouter();
  const [isRefreshing, startRefresh] = useTransition();
  const [sort, setSort] = useState<SortKey>("people");
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [view, setView] = useState<View>("charts");
  const detailRef = useRef<HTMLDivElement>(null);

  const rows = useMemo(() => toRows(summaries), [summaries]);
  const sorted = useMemo(() => sortRows(rows, sort), [rows, sort]);
  const departments = useMemo(
    () => sortRows(rows, "name").map((row) => row.name),
    [rows],
  );
  // A refresh may drop the selected department; then nothing is selected.
  const selectedRow = rows.find((row) => row.name === selectedName) ?? null;
  const selected = selectedRow?.name ?? null;

  // Bring the detail panel into view when a selection is made further down
  // the page (on a phone the charts are below it). No-op if it's visible.
  useEffect(() => {
    if (!selected) return;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    detailRef.current?.scrollIntoView({
      block: "nearest",
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }, [selected]);

  if (rows.length === 0) {
    return <p className="text-gray-600">The API returned no departments.</p>;
  }

  const toggle = (name: string) =>
    setSelectedName((current) => (current === name ? null : name));
  const chartProps = { rows: sorted, selected, onSelect: toggle };

  return (
    <div
      aria-busy={isRefreshing}
      className={`space-y-6 transition-opacity ${isRefreshing ? "opacity-60" : ""}`}
    >
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600">
        <span>
          Live from{" "}
          <code className="text-gray-800">GET /users/departments</code>, fetched
          at <FetchedAt iso={fetchedAt} />.
        </span>
        <button
          type="button"
          disabled={isRefreshing}
          onClick={() => startRefresh(() => router.refresh())}
          className="rounded-md border border-gray-300 bg-white px-2 py-0.5 text-sm text-gray-700 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500 disabled:opacity-60"
        >
          {isRefreshing ? "Refreshing…" : "Refresh"}
        </button>
      </p>

      <KpiRow overview={getOverview(rows)} />

      <Controls
        sort={sort}
        onSort={setSort}
        departments={departments}
        selected={selected}
        onSelect={setSelectedName}
        view={view}
        onView={setView}
      />

      <div ref={detailRef} className="scroll-mt-4">
        {selectedRow && (
          <DepartmentDetail
            key={selectedRow.name}
            row={selectedRow}
            onClose={() => setSelectedName(null)}
          />
        )}
      </div>

      {view === "charts" ? (
        // The two simple bar charts sit side by side on wide screens; the age
        // ranges and the nine-column heatmap need the full width.
        <div className="grid gap-4 xl:grid-cols-2">
          <HeadcountChart {...chartProps} />
          <GenderChart {...chartProps} />
          <div className="min-w-0 xl:col-span-2">
            <AgeChart {...chartProps} />
          </div>
          <div className="min-w-0 xl:col-span-2">
            <HairHeatmap {...chartProps} colors={hairTotals(rows)} />
          </div>
        </div>
      ) : (
        <DataTable rows={sorted} />
      )}
    </div>
  );
}
