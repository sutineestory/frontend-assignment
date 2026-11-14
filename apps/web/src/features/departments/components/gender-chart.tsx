import { useState } from "react";

import { genderInsight, percent, type DepartmentRow } from "../stats";
import {
  AxisLabels,
  ChartCard,
  ChartRows,
  Gridlines,
  LegendItem,
  makeTicks,
} from "./chart-parts";

type ChartProps = {
  rows: DepartmentRow[];
  selected: string | null;
  onSelect: (name: string) => void;
};

const ticks = makeTicks(0, 100, 25, (value) => `${value}%`);

/**
 * Diverging bars from an even split: left when a department has more men,
 * right when it has more women. Bar length is the distance from 50%.
 */
export function GenderChart({ rows, selected, onSelect }: ChartProps) {
  const [readout, setReadout] = useState<string | null>(null);

  return (
    <ChartCard
      title="Gender balance"
      insight={genderInsight(rows)}
      readout={readout}
      legend={
        <div className="flex flex-wrap gap-4">
          <LegendItem swatch="rounded-sm bg-chart-blue">More men</LegendItem>
          <LegendItem swatch="rounded-sm bg-chart-orange">
            More women
          </LegendItem>
          <LegendItem swatch="rounded-full bg-gray-500">Even</LegendItem>
        </div>
      }
    >
      <ChartRows
        label="Share of women by department"
        rows={rows}
        selected={selected}
        onSelect={onSelect}
        onReadout={setReadout}
        describe={(row) =>
          `${row.name}: ${row.women} women, ${row.men} men (${percent(row.womenShare)} women)`
        }
        background={<Gridlines ticks={ticks} baseline={50} />}
        renderMark={(row, emphasized) => {
          const share = row.womenShare;
          if (share === 0.5) {
            // A bar of length zero would look like missing data.
            return (
              <span
                className={`absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white ${emphasized ? "bg-gray-500" : "bg-chart-muted"}`}
              />
            );
          }
          const moreWomen = share > 0.5;
          const color = !emphasized
            ? "bg-chart-muted"
            : moreWomen
              ? "bg-chart-orange"
              : "bg-chart-blue";
          return (
            <span
              className={`absolute inset-y-0 ${moreWomen ? "rounded-r" : "rounded-l"} ${color}`}
              style={{
                left: `${Math.min(share, 0.5) * 100}%`,
                width: `${Math.abs(share - 0.5) * 100}%`,
              }}
            />
          );
        }}
      />
      <AxisLabels ticks={ticks} title="Women" />
    </ChartCard>
  );
}
