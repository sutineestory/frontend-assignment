import { useState } from "react";

import { headcountInsight, type DepartmentRow } from "../stats";
import {
  AxisLabels,
  ChartCard,
  ChartRows,
  Gridlines,
  makeTicks,
} from "./chart-parts";

type ChartProps = {
  rows: DepartmentRow[];
  selected: string | null;
  onSelect: (name: string) => void;
};

/** Ranked bars: how many people work in each department. */
export function HeadcountChart({ rows, selected, onSelect }: ChartProps) {
  const [readout, setReadout] = useState<string | null>(null);
  const max = Math.max(
    5,
    Math.ceil(Math.max(...rows.map((row) => row.people)) / 5) * 5,
  );
  const ticks = makeTicks(0, max, 5);

  return (
    <ChartCard
      title="Headcount"
      insight={headcountInsight(rows)}
      readout={readout}
    >
      <ChartRows
        label="Headcount by department"
        rows={rows}
        selected={selected}
        onSelect={onSelect}
        onReadout={setReadout}
        describe={(row) => `${row.name}: ${row.people} people`}
        background={<Gridlines ticks={ticks} baseline={0} />}
        renderMark={(row, emphasized) => (
          <span
            className={`absolute inset-y-0 left-0 rounded-r ${emphasized ? "bg-chart-blue" : "bg-chart-muted"}`}
            style={{ width: `${(row.people / max) * 100}%` }}
          />
        )}
      />
      <AxisLabels ticks={ticks} title="People" />
    </ChartCard>
  );
}
