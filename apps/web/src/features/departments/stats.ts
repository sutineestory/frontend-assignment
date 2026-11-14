import type { DepartmentSummaries } from "./types";

export type HairCount = { color: string; count: number };
export type Member = { name: string; postalCode: string };

/** One department, shaped for the charts. */
export type DepartmentRow = {
  name: string;
  people: number;
  men: number;
  women: number;
  /** 0 to 1 */
  womenShare: number;
  youngest: number;
  oldest: number;
  /** Most common first. */
  hair: HairCount[];
  /** Sorted by name. */
  members: Member[];
};

export type Overview = {
  people: number;
  departments: number;
  women: number;
  womenShare: number;
  youngest: number;
  oldest: number;
};

export type SortKey = "people" | "women" | "name";

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "people", label: "Headcount" },
  { value: "women", label: "Share of women" },
  { value: "name", label: "Name" },
];

const byName = (a: { name: string }, b: { name: string }) =>
  a.name.localeCompare(b.name);

const byCount = (a: HairCount, b: HairCount) =>
  b.count - a.count || a.color.localeCompare(b.color);

/**
 * The API joins first and last name ("EmilyJohnson"). Split at the first
 * lower-to-upper case boundary only, so "VictoriaMcDonald" keeps "McDonald".
 */
export function splitName(joined: string): string {
  return joined.replace(/(?<=[a-z])(?=[A-Z])/, " ");
}

export function toRows(summaries: DepartmentSummaries): DepartmentRow[] {
  return Object.entries(summaries).map(([name, summary]) => {
    const [youngest = 0, oldest = 0] = summary.ageRange.split("-").map(Number);
    const people = summary.male + summary.female;
    return {
      name,
      people,
      men: summary.male,
      women: summary.female,
      womenShare: people === 0 ? 0 : summary.female / people,
      youngest,
      oldest,
      hair: Object.entries(summary.hair)
        .map(([color, count]) => ({ color, count }))
        .sort(byCount),
      members: Object.entries(summary.addressUser)
        .map(([joined, postalCode]) => ({
          name: splitName(joined),
          postalCode,
        }))
        .sort(byName),
    };
  });
}

export function sortRows(rows: DepartmentRow[], key: SortKey): DepartmentRow[] {
  const compare = {
    people: (a: DepartmentRow, b: DepartmentRow) =>
      b.people - a.people || byName(a, b),
    women: (a: DepartmentRow, b: DepartmentRow) =>
      b.womenShare - a.womenShare || byName(a, b),
    name: byName,
  }[key];
  return [...rows].sort(compare);
}

export function getOverview(rows: DepartmentRow[]): Overview {
  const people = rows.reduce((sum, row) => sum + row.people, 0);
  const women = rows.reduce((sum, row) => sum + row.women, 0);
  return {
    people,
    departments: rows.length,
    women,
    womenShare: people === 0 ? 0 : women / people,
    youngest: Math.min(...rows.map((row) => row.youngest)),
    oldest: Math.max(...rows.map((row) => row.oldest)),
  };
}

/** Hair colors across all departments, most common first. */
export function hairTotals(rows: DepartmentRow[]): HairCount[] {
  const totals = new Map<string, number>();
  for (const row of rows) {
    for (const { color, count } of row.hair) {
      totals.set(color, (totals.get(color) ?? 0) + count);
    }
  }
  return [...totals].map(([color, count]) => ({ color, count })).sort(byCount);
}

export const percent = (share: number) => `${Math.round(share * 100)}%`;

/** "A", "A and B", "A, B and C" */
export function listNames(names: string[]): string {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
}

/** The names of the rows where `value` is highest (or lowest), ties included. */
function extreme(
  rows: DepartmentRow[],
  value: (row: DepartmentRow) => number,
  pick: "max" | "min",
) {
  const values = rows.map(value);
  const target = pick === "max" ? Math.max(...values) : Math.min(...values);
  const names = rows
    .filter((row) => value(row) === target)
    .map((row) => row.name);
  return { names: listNames(names), plural: names.length > 1, value: target };
}

// One-sentence takeaways under each chart title, written from the data.

export function headcountInsight(rows: DepartmentRow[]): string {
  if (rows.length === 0) return "";
  const largest = extreme(rows, (row) => row.people, "max");
  const smallest = extreme(rows, (row) => row.people, "min");
  const each = largest.plural ? " each" : "";
  return `${largest.names} ${largest.plural ? "are" : "is"} the largest (${largest.value} people${each}); ${smallest.names} ${smallest.plural ? "are" : "is"} the smallest (${smallest.value}).`;
}

export function genderInsight(rows: DepartmentRow[]): string {
  if (rows.length === 0) return "";
  const overall = getOverview(rows).womenShare;
  const most = extreme(rows, (row) => row.womenShare, "max");
  const least = extreme(rows, (row) => row.womenShare, "min");
  if (most.value === least.value) {
    return `Every department is ${percent(overall)} women.`;
  }
  return `${percent(overall)} women overall, but ${most.names} ${most.plural ? "are" : "is"} ${percent(most.value)} women and ${least.names} only ${percent(least.value)}.`;
}

export function ageInsight(rows: DepartmentRow[]): string {
  if (rows.length === 0) return "";
  const { youngest, oldest } = getOverview(rows);
  const span = (row: DepartmentRow) => row.oldest - row.youngest;
  const narrowest = extreme(rows, span, "min");
  const widest = extreme(rows, span, "max");
  return `Ages run from ${youngest} to ${oldest}. ${narrowest.names} ${narrowest.plural ? "have" : "has"} the narrowest range (${narrowest.value} years), ${widest.names} the widest (${widest.value}).`;
}

export function hairInsight(totals: HairCount[]): string {
  const [top] = totals;
  if (!top) return "";
  const lowest = Math.min(...totals.map((total) => total.count));
  const least = totals
    .filter((total) => total.count === lowest)
    .map((total) => total.color);
  return `${top.color} is the most common hair color (${top.count} people), ${listNames(least)} the least (${lowest}). The source data is random, so expect no strong pattern.`;
}
