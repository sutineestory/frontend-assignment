/** The fields we request from https://dummyjson.com/users. */
export type User = {
  firstName: string;
  lastName: string;
  gender: "male" | "female";
  age: number;
  hair: { color: string };
  address: { postalCode: string };
  company: { department: string };
};

export type DepartmentSummary = {
  male: number;
  female: number;
  /** "min-max", e.g. "28-50" */
  ageRange: string;
  /** hair color -> number of users */
  hair: Record<string, number>;
  /** `${firstName}${lastName}` -> postal code */
  addressUser: Record<string, string>;
};

/** department -> summary */
export type DepartmentSummaries = Record<string, DepartmentSummary>;
