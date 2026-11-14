import type { DepartmentSummaries } from "./types";

/** A small, hand-checkable stand-in for the API response. */
export const SUMMARIES: DepartmentSummaries = {
  Engineering: {
    male: 2,
    female: 1,
    ageRange: "25-46",
    hair: { Black: 1, Brown: 2 },
    addressUser: {
      VictoriaMcDonald: "10001",
      EmilyJohnson: "29112",
      AlexJones: "20002",
    },
  },
  Sales: {
    male: 0,
    female: 2,
    ageRange: "26-42",
    hair: { Red: 2 },
    addressUser: { ZoeBennett: "50908", SophiaJones: "24752" },
  },
  Legal: {
    male: 2,
    female: 1,
    ageRange: "30-35",
    hair: { Blonde: 1, Brown: 2 },
    addressUser: {
      NoraMills: "51983",
      HazelGardner: "35181",
      NoahHill: "40404",
    },
  },
};
