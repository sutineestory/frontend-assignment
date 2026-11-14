/** One department in GET /users/departments (see apps/api/src/users/types.ts). */
export type DepartmentSummary = {
  male: number;
  female: number;
  /** "min-max", e.g. "28-50" */
  ageRange: string;
  /** hair color -> number of people */
  hair: Record<string, number>;
  /** `${firstName}${lastName}` -> postal code */
  addressUser: Record<string, string>;
};

/** department -> summary */
export type DepartmentSummaries = Record<string, DepartmentSummary>;
