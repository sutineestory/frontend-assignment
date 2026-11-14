import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { RETURN_DELAY_MS, createBoardStore } from "./store";
import type { Item } from "./types";

const ITEMS: Item[] = [
  { type: "Fruit", name: "Apple" },
  { type: "Vegetable", name: "Broccoli" },
  { type: "Fruit", name: "Banana" },
  { type: "Vegetable", name: "Carrot" },
];

const names = (items: Item[]) => items.map((item) => item.name);

describe("createBoardStore", () => {
  let store: ReturnType<typeof createBoardStore>;

  beforeEach(() => {
    vi.useFakeTimers();
    store = createBoardStore(ITEMS);
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  const state = () => store.getState();

  it("waits 5 seconds", () => {
    expect(RETURN_DELAY_MS).toBe(5000);
  });

  it("moves a clicked list item to its column immediately", () => {
    state().moveToColumn("Apple");

    expect(names(state().columns.Fruit)).toEqual(["Apple"]);
    expect(names(state().list)).toEqual(["Broccoli", "Banana", "Carrot"]);
  });

  it("returns the item to the bottom of the list after exactly 5 seconds", () => {
    state().moveToColumn("Apple");

    vi.advanceTimersByTime(RETURN_DELAY_MS - 1);
    expect(names(state().columns.Fruit)).toEqual(["Apple"]);

    vi.advanceTimersByTime(1);
    expect(state().columns.Fruit).toEqual([]);
    expect(names(state().list)).toEqual([
      "Broccoli",
      "Banana",
      "Carrot",
      "Apple",
    ]);
  });

  it("gives every item its own timer and returns them in the order they were moved", () => {
    state().moveToColumn("Apple"); // t = 0
    vi.advanceTimersByTime(1000);
    state().moveToColumn("Broccoli"); // t = 1s
    vi.advanceTimersByTime(1000);
    state().moveToColumn("Banana"); // t = 2s

    vi.advanceTimersByTime(3000); // t = 5s
    expect(names(state().list)).toEqual(["Carrot", "Apple"]);

    vi.advanceTimersByTime(1000); // t = 6s
    expect(names(state().list)).toEqual(["Carrot", "Apple", "Broccoli"]);

    vi.advanceTimersByTime(1000); // t = 7s
    expect(names(state().list)).toEqual([
      "Carrot",
      "Apple",
      "Broccoli",
      "Banana",
    ]);
  });

  it("returns a clicked column item to the bottom of the list immediately", () => {
    state().moveToColumn("Apple");
    vi.advanceTimersByTime(1000);

    state().moveToList("Apple");

    expect(state().columns.Fruit).toEqual([]);
    expect(names(state().list)).toEqual([
      "Broccoli",
      "Banana",
      "Carrot",
      "Apple",
    ]);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("does not let a cancelled timer move an item that was clicked again", () => {
    state().moveToColumn("Apple"); // t = 0, old timer would fire at 5s
    vi.advanceTimersByTime(1000);
    state().moveToList("Apple"); // t = 1s, returned early
    vi.advanceTimersByTime(1000);
    state().moveToColumn("Apple"); // t = 2s, new timer fires at 7s

    vi.advanceTimersByTime(3000); // t = 5s
    expect(names(state().columns.Fruit)).toEqual(["Apple"]);

    vi.advanceTimersByTime(2000); // t = 7s
    expect(state().columns.Fruit).toEqual([]);
  });

  it("ignores clicks that do not change the board", () => {
    const before = state();

    state().moveToList("Apple"); // already in the list
    state().moveToColumn("Unknown");

    expect(state()).toBe(before);
    expect(vi.getTimerCount()).toBe(0);
  });
});
