import type { ReactNode } from "react";

import { SORT_OPTIONS, type SortKey } from "../stats";

export type View = "charts" | "table";

type ControlsProps = {
  sort: SortKey;
  onSort: (sort: SortKey) => void;
  departments: string[];
  selected: string | null;
  onSelect: (name: string | null) => void;
  view: View;
  onView: (view: View) => void;
};

const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500";

/**
 * A native <select> (keyboard, mobile pickers and screen readers for free)
 * with the browser's arrow replaced by our own, so it has room to breathe
 * and looks the same in every browser.
 */
function SelectField({
  label,
  value,
  onChange,
  children,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
      {label}
      <span className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`h-9 w-full appearance-none rounded-md border border-gray-300 bg-white pr-9 pl-3 text-sm text-gray-900 hover:border-gray-400 ${FOCUS_RING} ${className}`}
        >
          {children}
        </select>
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-gray-500"
        >
          <path
            d="M4 6l4 4 4-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </label>
  );
}

/** One row of controls above everything they affect. */
export function Controls({
  sort,
  onSort,
  departments,
  selected,
  onSelect,
  view,
  onView,
}: ControlsProps) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <SelectField
        label="Sort by"
        value={sort}
        onChange={(value) => onSort(value as SortKey)}
      >
        {SORT_OPTIONS.map(({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </SelectField>

      <SelectField
        label="Department"
        value={selected ?? ""}
        onChange={(value) => onSelect(value || null)}
        className="max-w-[16rem]"
      >
        <option value="">All departments</option>
        {departments.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </SelectField>

      <div
        role="group"
        aria-label="View"
        className="inline-flex h-9 items-center rounded-md border border-gray-300 bg-white p-0.5"
      >
        {(["charts", "table"] as const).map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={view === option}
            onClick={() => onView(option)}
            className={`h-full rounded px-3 text-sm text-gray-700 capitalize transition-colors hover:bg-gray-100 aria-pressed:bg-gray-900 aria-pressed:text-white ${FOCUS_RING}`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
