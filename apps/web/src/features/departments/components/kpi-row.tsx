import { percent, type Overview } from "../stats";

export function KpiRow({ overview }: { overview: Overview }) {
  const tiles = [
    {
      label: "People",
      value: overview.people.toLocaleString("en-US"),
      note: "from dummyjson",
    },
    {
      label: "Departments",
      value: String(overview.departments),
      note: "by company.department",
    },
    {
      label: "Women",
      value: percent(overview.womenShare),
      note: `${overview.women} of ${overview.people}`,
    },
    {
      label: "Age range",
      value: `${overview.youngest}–${overview.oldest}`,
      note: "youngest to oldest",
    },
  ];

  return (
    <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {tiles.map(({ label, value, note }) => (
        <div
          key={label}
          className="rounded-lg border border-gray-200 bg-white p-4"
        >
          <dt className="text-sm text-gray-600">{label}</dt>
          <dd className="mt-1 text-2xl font-semibold">{value}</dd>
          <dd className="mt-0.5 text-xs text-gray-500">{note}</dd>
        </div>
      ))}
    </dl>
  );
}
