import { useState } from "react";

import { ageInsight, type DepartmentRow } from "../stats";
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

/** Range bars: the youngest and oldest person in each department. */
export function AgeChart({ rows, selected, onSelect }: ChartProps) {
  const [readout, setReadout] = useState<string | null>(null);
  const from =
    Math.floor(Math.min(...rows.map((row) => row.youngest)) / 10) * 10;
  const to = Math.max(
    from + 10,
    Math.ceil(Math.max(...rows.map((row) => row.oldest)) / 10) * 10,
  );
  const ticks = makeTicks(from, to, to - from > 20 ? 10 : 5);
  const position = (age: number) => ((age - from) / (to - from)) * 100;

  return (
    <ChartCard title="Age range" insight={ageInsight(rows)} readout={readout}>
      <ChartRows
        label="Age range by department"
        rows={rows}
        selected={selected}
        onSelect={onSelect}
        onReadout={setReadout}
        describe={(row) =>
          `${row.name}: ages ${row.youngest} to ${row.oldest} (${row.oldest - row.youngest} years)`
        }
        background={<Gridlines ticks={ticks} />}
        renderMark={(row, emphasized) => {
          const color = emphasized ? "bg-chart-blue" : "bg-chart-muted";
          const dot = `absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white ${color}`;
          return (
            <>
              <span
                className={`absolute top-1/2 h-0.5 -translate-y-1/2 ${color}`}
                style={{
                  left: `${position(row.youngest)}%`,
                  width: `${position(row.oldest) - position(row.youngest)}%`,
                }}
              />
              <span
                className={dot}
                style={{ left: `${position(row.youngest)}%` }}
              />
              <span
                className={dot}
                style={{ left: `${position(row.oldest)}%` }}
              />
            </>
          );
        }}
      />
      <AxisLabels ticks={ticks} title="Age" />
    </ChartCard>
  );
}
