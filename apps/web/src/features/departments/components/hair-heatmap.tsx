import { useState } from "react";

import { hairInsight, type DepartmentRow, type HairCount } from "../stats";
import { ChartCard } from "./chart-parts";
import { useRovingFocus } from "./use-roving-focus";

// Sequential blue, light to dark. Full class names so Tailwind generates them.
const RAMP = [
  "bg-chart-ramp-1",
  "bg-chart-ramp-2",
  "bg-chart-ramp-3",
  "bg-chart-ramp-4",
  "bg-chart-ramp-5",
] as const;

type HairHeatmapProps = {
  rows: DepartmentRow[];
  /** Columns, most common color first. */
  colors: HairCount[];
  selected: string | null;
  onSelect: (name: string) => void;
};

const countOf = (row: DepartmentRow, color: string) =>
  row.hair.find((hair) => hair.color === color)?.count ?? 0;

/** Departments by hair color; darker cells mean more people. */
export function HairHeatmap({
  rows,
  colors,
  selected,
  onSelect,
}: HairHeatmapProps) {
  const [readout, setReadout] = useState<string | null>(null);
  const rovingProps = useRovingFocus(rows.length);
  const max = Math.max(
    1,
    ...rows.flatMap((row) => row.hair.map((hair) => hair.count)),
  );
  const level = (count: number) =>
    RAMP[Math.max(0, Math.ceil((count / max) * RAMP.length) - 1)];

  const describe = (row: DepartmentRow) =>
    `${row.name}: ${row.hair.map((hair) => `${hair.color} ${hair.count}`).join(", ")}`;

  return (
    <ChartCard
      title="Hair color"
      insight={hairInsight(colors)}
      readout={readout}
      legend={
        <div
          aria-hidden="true"
          className="flex items-center gap-1.5 text-xs text-gray-600"
        >
          <span>1</span>
          {RAMP.map((step) => (
            <span key={step} className={`h-2.5 w-5 rounded-sm ${step}`} />
          ))}
          <span>{max} people</span>
          <span className="ml-3 inline-flex items-center gap-1.5">
            <span className="h-2.5 w-5 rounded-sm bg-chart-empty" />
            none
          </span>
        </div>
      }
    >
      {/* Nine columns don't fit a narrow card: scroll inside it, never the page. */}
      <p className="mb-2 text-[11px] text-gray-500 lg:hidden">
        Scroll sideways to see every color.
      </p>
      <div className="overflow-x-auto">
        <div
          className="grid min-w-fit gap-0.5 [--label-col:6.5rem] sm:[--label-col:10rem]"
          style={{
            gridTemplateColumns: `var(--label-col) repeat(${colors.length}, minmax(2.25rem, 1fr))`,
          }}
        >
          <span />
          {colors.map(({ color }) => (
            <span
              key={color}
              aria-hidden="true"
              className="pb-1 text-center text-[11px] text-gray-500"
            >
              {color}
            </span>
          ))}

          <div
            role="group"
            aria-label="Hair color by department"
            className="col-span-full grid grid-cols-subgrid gap-y-0.5"
            onPointerLeave={() => setReadout(null)}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget))
                setReadout(null);
            }}
          >
            {rows.map((row, index) => {
              const { onFocus, ...roving } = rovingProps(index);
              const isSelected = selected === row.name;
              const emphasized = selected === null || isSelected;
              const description = describe(row);

              return (
                <button
                  key={row.name}
                  type="button"
                  {...roving}
                  aria-pressed={isSelected}
                  aria-label={description}
                  onClick={() => onSelect(row.name)}
                  onPointerEnter={() => setReadout(description)}
                  onFocus={() => {
                    onFocus();
                    setReadout(description);
                  }}
                  className="group col-span-full grid grid-cols-subgrid items-center rounded-md py-0.5 text-left transition-colors hover:bg-gray-50/60 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500 aria-pressed:bg-blue-50/60"
                >
                  <span className="pr-3 pl-2 text-xs leading-tight text-gray-700 group-aria-pressed:font-semibold group-aria-pressed:text-gray-900 sm:text-sm">
                    {row.name}
                  </span>
                  {colors.map(({ color }) => {
                    const count = countOf(row, color);
                    return (
                      <span
                        key={color}
                        onPointerEnter={() =>
                          setReadout(
                            `${row.name}, ${color}: ${count} ${count === 1 ? "person" : "people"}`,
                          )
                        }
                        className={`h-6 rounded-sm ${count === 0 ? "bg-chart-empty" : level(count)} ${emphasized ? "" : "opacity-25"}`}
                      />
                    );
                  })}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </ChartCard>
  );
}
