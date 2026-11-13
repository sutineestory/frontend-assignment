import { ITEM_TYPES, type BoardState, type Item } from "./types";

export function createBoard(items: readonly Item[]): BoardState {
  return {
    list: [...items],
    columns: { Fruit: [], Vegetable: [] },
  };
}

/**
 * Moves an item from the main list to the bottom of its type column.
 * Returns the same state object when the item is not in the list.
 */
export function moveToColumn(state: BoardState, name: string): BoardState {
  const item = state.list.find((candidate) => candidate.name === name);
  if (!item) return state;

  return {
    list: state.list.filter((candidate) => candidate !== item),
    columns: {
      ...state.columns,
      [item.type]: [...state.columns[item.type], item],
    },
  };
}

/**
 * Moves an item from its column to the bottom of the main list.
 * Returns the same state object when the item is not in a column.
 */
export function moveToList(state: BoardState, name: string): BoardState {
  const item = findInColumns(state, name);
  if (!item) return state;

  return {
    list: [...state.list, item],
    columns: {
      ...state.columns,
      [item.type]: state.columns[item.type].filter(
        (candidate) => candidate !== item,
      ),
    },
  };
}

function findInColumns(state: BoardState, name: string): Item | undefined {
  for (const type of ITEM_TYPES) {
    const item = state.columns[type].find(
      (candidate) => candidate.name === name,
    );
    if (item) return item;
  }
  return undefined;
}
