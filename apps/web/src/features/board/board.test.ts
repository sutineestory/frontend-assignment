import { describe, expect, it } from "vitest";

import { createBoard, moveToColumn, moveToList } from "./board";
import type { BoardState, Item } from "./types";

const apple: Item = { type: "Fruit", name: "Apple" };
const broccoli: Item = { type: "Vegetable", name: "Broccoli" };
const banana: Item = { type: "Fruit", name: "Banana" };

const names = (items: Item[]) => items.map((item) => item.name);

describe("createBoard", () => {
  it("puts every item in the list, in order, with empty columns", () => {
    const state = createBoard([apple, broccoli, banana]);

    expect(names(state.list)).toEqual(["Apple", "Broccoli", "Banana"]);
    expect(state.columns).toEqual({ Fruit: [], Vegetable: [] });
  });
});

describe("moveToColumn", () => {
  it("moves the item from the list to its type column", () => {
    const state = moveToColumn(createBoard([apple, broccoli]), "Apple");

    expect(names(state.list)).toEqual(["Broccoli"]);
    expect(names(state.columns.Fruit)).toEqual(["Apple"]);
    expect(state.columns.Vegetable).toEqual([]);
  });

  it("appends to the bottom of the column", () => {
    let state = createBoard([apple, broccoli, banana]);
    state = moveToColumn(state, "Banana");
    state = moveToColumn(state, "Apple");

    expect(names(state.columns.Fruit)).toEqual(["Banana", "Apple"]);
  });

  it("does nothing when the item is not in the list", () => {
    const moved = moveToColumn(createBoard([apple]), "Apple");

    expect(moveToColumn(moved, "Apple")).toBe(moved);
    expect(moveToColumn(moved, "Unknown")).toBe(moved);
  });

  it("does not mutate the previous state", () => {
    const state = createBoard([apple, broccoli]);
    const snapshot = structuredClone(state);

    moveToColumn(state, "Apple");

    expect(state).toEqual(snapshot);
  });
});

describe("moveToList", () => {
  it("moves the item from its column to the bottom of the list", () => {
    let state: BoardState = createBoard([apple, broccoli, banana]);
    state = moveToColumn(state, "Apple");
    state = moveToList(state, "Apple");

    expect(names(state.list)).toEqual(["Broccoli", "Banana", "Apple"]);
    expect(state.columns.Fruit).toEqual([]);
  });

  it("does nothing when the item is not in a column", () => {
    const state = createBoard([apple]);

    expect(moveToList(state, "Apple")).toBe(state);
    expect(moveToList(state, "Unknown")).toBe(state);
  });

  it("does not mutate the previous state", () => {
    const state = moveToColumn(createBoard([apple, broccoli]), "Apple");
    const snapshot = structuredClone(state);

    moveToList(state, "Apple");

    expect(state).toEqual(snapshot);
  });
});
