import type { DepartmentSummaries, DepartmentSummary, User } from "./types.js";

type Group = {
  summary: DepartmentSummary;
  minAge: number;
  maxAge: number;
};

/**
 * Groups users by `company.department` in a single pass over the input.
 * Ages are tracked as numbers and only formatted as "min-max" at the end.
 */
export function summarizeByDepartment(
  users: readonly User[],
): DepartmentSummaries {
  const groups = new Map<string, Group>();

  for (const user of users) {
    const department = user.company.department;
    let group = groups.get(department);
    if (!group) {
      group = {
        summary: {
          male: 0,
          female: 0,
          ageRange: "",
          hair: {},
          addressUser: {},
        },
        minAge: user.age,
        maxAge: user.age,
      };
      groups.set(department, group);
    }

    const { summary } = group;
    if (user.gender === "male") summary.male += 1;
    else if (user.gender === "female") summary.female += 1;

    group.minAge = Math.min(group.minAge, user.age);
    group.maxAge = Math.max(group.maxAge, user.age);

    const hairColor = user.hair.color;
    summary.hair[hairColor] = (summary.hair[hairColor] ?? 0) + 1;
    summary.addressUser[`${user.firstName}${user.lastName}`] =
      user.address.postalCode;
  }

  const result: DepartmentSummaries = {};
  for (const [department, { summary, minAge, maxAge }] of groups) {
    summary.ageRange = `${minAge}-${maxAge}`;
    result[department] = summary;
  }
  return result;
}
