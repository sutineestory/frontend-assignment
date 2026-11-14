import { percent, type DepartmentRow } from "../stats";

const COLUMNS = [
  "Department",
  "People",
  "Women",
  "Men",
  "Women %",
  "Youngest",
  "Oldest",
  "Most common hair",
];

/** Every number the charts show, readable without a pointer. */
export function DataTable({ rows }: { rows: DepartmentRow[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="w-full text-sm">
        <caption className="sr-only">Users by department</caption>
        <thead className="bg-gray-50 text-left text-xs text-gray-600">
          <tr>
            {COLUMNS.map((column, index) => (
              <th
                key={column}
                scope="col"
                className={`px-3 py-2 font-medium whitespace-nowrap ${index > 0 && index < 7 ? "text-right" : ""}`}
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row) => {
            const top = row.hair[0];
            return (
              <tr key={row.name}>
                <th
                  scope="row"
                  className="px-3 py-2 text-left font-medium whitespace-nowrap"
                >
                  {row.name}
                </th>
                {[
                  row.people,
                  row.women,
                  row.men,
                  percent(row.womenShare),
                  row.youngest,
                  row.oldest,
                ].map((value, index) => (
                  <td key={index} className="px-3 py-2 text-right tabular-nums">
                    {value}
                  </td>
                ))}
                <td className="px-3 py-2 whitespace-nowrap">
                  {top ? `${top.color} (${top.count})` : "–"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
