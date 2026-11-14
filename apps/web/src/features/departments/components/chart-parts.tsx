import { useId, type ReactNode } from "react";

import type { DepartmentRow } from "../stats";
import { useRovingFocus } from "./use-roving-focus";

/** Label column + plot column, shared by rows, gridlines and axis labels. */
export const ROW_GRID =
  "grid grid-cols-[6.5rem_minmax(0,1fr)] items-center gap-x-3 px-2 sm:grid-cols-[10rem_minmax(0,1fr)]";

const DEFAULT_READOUT = "Hover over or focus a department to see its numbers.";

type ChartCardProps = {
  title: string;
  insight: string;
  /** What the hovered or focused department shows, or null for the hint. */
  readout: string | null;
  legend?: ReactNode;
  children: ReactNode;
};

export function ChartCard({
  title,
  insight,
  readout,
  legend,
  children,
}: ChartCardProps) {
  const headingId = useId();

  return (
    <section
      aria-labelledby={headingId}
      className="min-w-0 rounded-lg border border-gray-200 bg-white p-4"
    >
      <h2 id={headingId} className="font-semibold">
        {title}
      </h2>
      <p className="mt-1 text-sm text-gray-600">{insight}</p>
      {legend && <div className="mt-3">{legend}</div>}
      {/* Visual only: each row's accessible name already says the same. */}
      <p aria-hidden="true" className="mt-3 min-h-8 text-xs text-gray-500">
        {readout ?? DEFAULT_READOUT}
      </p>
      <div className="mt-1">{children}</div>
    </section>
  );
}

/** Positions are percentages of the plot width. */
export type Tick = { position: number; label: string };

/** Hairline gridlines behind the rows, in the plot column only. */
export function Gridlines({
  ticks,
  baseline,
}: {
  ticks: Tick[];
  /** A tick drawn darker, e.g. the 50% line of a diverging chart. */
  baseline?: number;
}) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 ${ROW_GRID} items-stretch`}
    >
      <span />
      <span className="relative">
        {ticks.map(({ position }) => (
          <span
            key={position}
            className={`absolute inset-y-0 w-px ${position === baseline ? "bg-chart-muted" : "bg-chart-grid"}`}
            style={{ left: `${position}%` }}
          />
        ))}
      </span>
    </div>
  );
}

export function AxisLabels({ ticks, title }: { ticks: Tick[]; title: string }) {
  return (
    <div aria-hidden="true" className={`${ROW_GRID} mt-1`}>
      <span className="text-right text-[11px] text-gray-500">{title}</span>
      <span className="relative h-4">
        {ticks.map(({ position, label }, index) => (
          <span
            key={position}
            className={`absolute text-[11px] text-gray-500 tabular-nums ${
              index === 0
                ? ""
                : index === ticks.length - 1
                  ? "-translate-x-full"
                  : "-translate-x-1/2"
            }`}
            style={{ left: `${position}%` }}
          >
            {label}
          </span>
        ))}
      </span>
    </div>
  );
}

export function LegendItem({
  swatch,
  children,
}: {
  swatch: string;
  children: ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-gray-600">
      <span aria-hidden="true" className={`size-2.5 ${swatch}`} />
      {children}
    </span>
  );
}

type ChartRowsProps = {
  /** Names the group of rows for screen readers. */
  label: string;
  rows: DepartmentRow[];
  selected: string | null;
  onSelect: (name: string) => void;
  onReadout: (text: string | null) => void;
  /** The row's accessible name and readout, e.g. "Sales: 11 people". */
  describe: (row: DepartmentRow) => string;
  /** The mark inside the plot column; muted when another row is selected. */
  renderMark: (row: DepartmentRow, emphasized: boolean) => ReactNode;
  /** Gridlines drawn behind the rows. */
  background?: ReactNode;
};

/**
 * One button per department. Clicking selects it across every chart; hover
 * and focus show its numbers in the card's readout.
 */
export function ChartRows({
  label,
  rows,
  selected,
  onSelect,
  onReadout,
  describe,
  renderMark,
  background,
}: ChartRowsProps) {
  const rovingProps = useRovingFocus(rows.length);

  return (
    <div
      role="group"
      aria-label={label}
      className="relative"
      onPointerLeave={() => onReadout(null)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) onReadout(null);
      }}
    >
      {background}
      {rows.map((row, index) => {
        const { onFocus, ...roving } = rovingProps(index);
        const isSelected = selected === row.name;
        const description = describe(row);

        return (
          <button
            key={row.name}
            type="button"
            {...roving}
            aria-pressed={isSelected}
            aria-label={description}
            onClick={() => onSelect(row.name)}
            onPointerEnter={() => onReadout(description)}
            onFocus={() => {
              onFocus();
              onReadout(description);
            }}
            className={`group relative ${ROW_GRID} w-full rounded-md py-1.5 text-left transition-colors hover:bg-gray-50/60 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500 aria-pressed:bg-blue-50/60`}
          >
            <span className="text-xs leading-tight text-gray-700 group-aria-pressed:font-semibold group-aria-pressed:text-gray-900 sm:text-sm">
              {row.name}
            </span>
            <span className="relative h-4">
              {renderMark(row, selected === null || isSelected)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Evenly spaced ticks from `from` to `to`, as positions on a 0-100 scale. */
export function makeTicks(
  from: number,
  to: number,
  step: number,
  format: (value: number) => string = String,
): Tick[] {
  const ticks: Tick[] = [];
  for (let value = from; value <= to; value += step) {
    ticks.push({
      position: ((value - from) / (to - from)) * 100,
      label: format(value),
    });
  }
  return ticks;
}
