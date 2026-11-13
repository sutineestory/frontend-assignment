import { describe, expect, it } from "vitest";

import { summarizeByDepartment } from "../src/users/transform.js";
import { USERS } from "./helpers.js";

describe("summarizeByDepartment", () => {
  it("groups users by department into the requested shape", () => {
    expect(summarizeByDepartment(USERS)).toEqual({
      Engineering: {
        male: 2,
        female: 1,
        ageRange: "28-50",
        hair: { Black: 2, Blond: 1 },
        addressUser: {
          TerryMedhurst: "10001",
          SheldonQuigley: "10002",
          TerrillHills: "10003",
        },
      },
      Support: {
        male: 0,
        female: 1,
        ageRange: "31-31",
        hair: { Brown: 1 },
        addressUser: { MilesCummerata: "20001" },
      },
    });
  });

  it("returns an empty object when there are no users", () => {
    expect(summarizeByDepartment([])).toEqual({});
  });

  it("does not mutate the input", () => {
    const snapshot = structuredClone(USERS);

    summarizeByDepartment(USERS);

    expect(USERS).toEqual(snapshot);
  });
});
