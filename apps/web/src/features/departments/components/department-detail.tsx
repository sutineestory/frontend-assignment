import { useId, useState } from "react";

import { percent, type DepartmentRow } from "../stats";

type DepartmentDetailProps = {
  row: DepartmentRow;
  onClose: () => void;
};

export function DepartmentDetail({ row, onClose }: DepartmentDetailProps) {
  const headingId = useId();
  const [query, setQuery] = useState("");
  const search = query.trim().toLowerCase();
  const members = row.members.filter(
    (member) =>
      member.name.toLowerCase().includes(search) ||
      member.postalCode.includes(search),
  );
  const mostHair = Math.max(1, ...row.hair.map((hair) => hair.count));

  const stats = [
    { label: "People", value: String(row.people) },
    { label: "Women", value: `${row.women} (${percent(row.womenShare)})` },
    { label: "Men", value: String(row.men) },
    { label: "Age range", value: `${row.youngest}–${row.oldest}` },
  ];

  return (
    <section
      aria-labelledby={headingId}
      className="rounded-lg border border-blue-200 bg-white p-4 ring-1 ring-blue-100"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">
            Selected department
          </p>
          <h2 id={headingId} className="text-lg font-semibold">
            {row.name}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-md px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500"
        >
          Clear selection
        </button>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map(({ label, value }) => (
          <div key={label}>
            <dt className="text-xs text-gray-500">{label}</dt>
            <dd className="font-semibold">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <div>
          <h3 className="text-sm font-semibold">Hair color</h3>
          <ul className="mt-2 space-y-1.5">
            {row.hair.map(({ color, count }) => (
              <li
                key={color}
                className="grid grid-cols-[5rem_minmax(0,1fr)_1.5rem] items-center gap-2 text-sm"
              >
                <span className="text-gray-700">{color}</span>
                <span aria-hidden="true" className="h-2.5">
                  <span
                    className="block h-full rounded-r bg-chart-blue"
                    style={{ width: `${(count / mostHair) * 100}%` }}
                  />
                </span>
                <span className="text-right text-gray-700 tabular-nums">
                  {count}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold">People and postal codes</h3>
          <label className="mt-2 block">
            <span className="sr-only">
              Search people by name or postal code
            </span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name or postal code"
              className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500"
            />
          </label>
          <p aria-live="polite" className="mt-2 text-xs text-gray-500">
            Showing {members.length} of {row.members.length}
          </p>
          <ul className="mt-1 grid gap-x-6 sm:grid-cols-2">
            {members.map(({ name, postalCode }) => (
              <li
                key={name}
                className="flex justify-between gap-2 border-b border-gray-100 py-1 text-sm"
              >
                <span className="truncate text-gray-800">{name}</span>
                <span className="text-gray-500 tabular-nums">{postalCode}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
