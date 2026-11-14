import type { Schema } from "fast-json-stringify";

/**
 * The response schema GET /users/departments used before it switched to
 * encoding once. Kept here so the benchmarks can compare against it.
 */
export const departmentSummariesSchema: Schema = {
  type: "object",
  additionalProperties: {
    type: "object",
    required: ["male", "female", "ageRange", "hair", "addressUser"],
    properties: {
      male: { type: "integer" },
      female: { type: "integer" },
      ageRange: { type: "string" },
      hair: { type: "object", additionalProperties: { type: "integer" } },
      addressUser: { type: "object", additionalProperties: { type: "string" } },
    },
  },
};
