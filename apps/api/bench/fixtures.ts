import type { User } from "../src/users/types.js";

// Same 12 departments as dummyjson, so group counts match real data.
const DEPARTMENTS = [
  "Accounting",
  "Business Development",
  "Engineering",
  "Human Resources",
  "Legal",
  "Marketing",
  "Product Management",
  "Research and Development",
  "Sales",
  "Services",
  "Support",
  "Training",
] as const;

const HAIR_COLORS = [
  "Auburn",
  "Black",
  "Blonde",
  "Blue",
  "Brown",
  "Chestnut",
  "Gray",
  "Green",
  "Purple",
  "Red",
  "White",
] as const;

/** mulberry32: a tiny seeded PRNG so every run benchmarks the same data. */
function createRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), state | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Synthetic users with the same shape as the dummyjson response. */
export function makeUsers(count: number, seed = 1): User[] {
  const random = createRandom(seed);
  const pick = <T>(items: readonly T[]): T =>
    items[Math.floor(random() * items.length)]!;

  return Array.from({ length: count }, (_, i) => ({
    firstName: `First${i}`,
    lastName: `Last${i}`,
    gender: random() < 0.5 ? "male" : "female",
    age: 18 + Math.floor(random() * 50),
    hair: { color: pick(HAIR_COLORS) },
    address: { postalCode: String(10000 + Math.floor(random() * 90000)) },
    company: { department: pick(DEPARTMENTS) },
  }));
}
