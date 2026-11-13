import { createStore } from "zustand/vanilla";

import * as board from "./board";
import type { BoardState, Item } from "./types";

export const RETURN_DELAY_MS = 5000;

export type BoardActions = {
  /** Move a list item to its column; it returns to the list after 5 seconds. */
  moveToColumn: (name: string) => void;
  /** Move a column item back to the bottom of the list right away. */
  moveToList: (name: string) => void;
  /** Cancel every pending return timer. */
  dispose: () => void;
};

export type BoardStore = BoardState & BoardActions;

export function createBoardStore(items: readonly Item[]) {
  // Timers are not rendered, so they live outside the store state.
  const timers = new Map<string, ReturnType<typeof setTimeout>>();

  const cancelTimer = (name: string) => {
    clearTimeout(timers.get(name));
    timers.delete(name);
  };

  return createStore<BoardStore>()((set, get) => ({
    ...board.createBoard(items),

    moveToColumn: (name) => {
      const state = get();
      const next = board.moveToColumn(state, name);
      if (next === state) return;

      set(next);
      timers.set(
        name,
        setTimeout(() => get().moveToList(name), RETURN_DELAY_MS),
      );
    },

    moveToList: (name) => {
      cancelTimer(name);
      set((state) => board.moveToList(state, name));
    },

    dispose: () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    },
  }));
}
