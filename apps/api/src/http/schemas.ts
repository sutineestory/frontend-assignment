// Response schemas let Fastify serialize with fast-json-stringify
// instead of JSON.stringify, and document the response shape.

const departmentSummarySchema = {
  type: "object",
  required: ["male", "female", "ageRange", "hair", "addressUser"],
  properties: {
    male: { type: "integer" },
    female: { type: "integer" },
    ageRange: { type: "string" },
    hair: { type: "object", additionalProperties: { type: "integer" } },
    addressUser: { type: "object", additionalProperties: { type: "string" } },
  },
} as const;

export const departmentSummariesSchema = {
  type: "object",
  additionalProperties: departmentSummarySchema,
} as const;
