import { describe, expect, it } from "vitest";

import { SUMMARIES } from "./fixtures";
import {
  ageInsight,
  genderInsight,
  getOverview,
  hairInsight,
  hairTotals,
  headcountInsight,
  listNames,
  sortRows,
  splitName,
  toRows,
} from "./stats";

const rows = toRows(SUMMARIES);
const names = (list: { name: string }[]) => list.map((item) => item.name);

describe("splitName", () => {
  it("splits the joined first and last name at the first capital", () => {
    expect(splitName("EmilyJohnson")).toBe("Emily Johnson");
    expect(splitName("VictoriaMcDonald")).toBe("Victoria McDonald");
  });
});

describe("toRows", () => {
  it("shapes each department for the charts", () => {
    const engineering = rows.find((row) => row.name === "Engineering");

    expect(engineering).toEqual({
      name: "Engineering",
      people: 3,
      men: 2,
      women: 1,
      womenShare: 1 / 3,
      youngest: 25,
      oldest: 46,
      hair: [
        { color: "Brown", count: 2 },
        { color: "Black", count: 1 },
      ],
      members: [
        { name: "Alex Jones", postalCode: "20002" },
        { name: "Emily Johnson", postalCode: "29112" },
        { name: "Victoria McDonald", postalCode: "10001" },
      ],
    });
  });
});

describe("sortRows", () => {
  it("sorts by headcount, share of women, or name, breaking ties by name", () => {
    expect(names(sortRows(rows, "people"))).toEqual([
      "Engineering",
      "Legal",
      "Sales",
    ]);
    expect(names(sortRows(rows, "women"))).toEqual([
      "Sales",
      "Engineering",
      "Legal",
    ]);
    expect(names(sortRows(rows, "name"))).toEqual([
      "Engineering",
      "Legal",
      "Sales",
    ]);
  });

  it("does not reorder the input", () => {
    const before = names(rows);
    sortRows(rows, "women");
    expect(names(rows)).toEqual(before);
  });
});

describe("summaries across departments", () => {
  it("totals people, women and the overall age range", () => {
    expect(getOverview(rows)).toEqual({
      people: 8,
      departments: 3,
      women: 4,
      womenShare: 0.5,
      youngest: 25,
      oldest: 46,
    });
  });

  it("totals hair colors, most common first", () => {
    expect(hairTotals(rows)).toEqual([
      { color: "Brown", count: 4 },
      { color: "Red", count: 2 },
      { color: "Black", count: 1 },
      { color: "Blonde", count: 1 },
    ]);
  });
});

describe("insights", () => {
  it("joins names in plain English", () => {
    expect(listNames(["A"])).toBe("A");
    expect(listNames(["A", "B"])).toBe("A and B");
    expect(listNames(["A", "B", "C"])).toBe("A, B and C");
  });

  it("names the largest and smallest departments, including ties", () => {
    expect(headcountInsight(rows)).toBe(
      "Engineering and Legal are the largest (3 people each); Sales is the smallest (2).",
    );
  });

  it("compares the most and least female departments with the overall share", () => {
    expect(genderInsight(rows)).toBe(
      "50% women overall, but Sales is 100% women and Engineering and Legal only 33%.",
    );
  });

  it("names the narrowest and widest age ranges", () => {
    expect(ageInsight(rows)).toBe(
      "Ages run from 25 to 46. Legal has the narrowest range (5 years), Engineering the widest (21).",
    );
  });

  it("names the most and least common hair colors", () => {
    expect(hairInsight(hairTotals(rows))).toBe(
      "Brown is the most common hair color (4 people), Black and Blonde the least (1). The source data is random, so expect no strong pattern.",
    );
  });
});
