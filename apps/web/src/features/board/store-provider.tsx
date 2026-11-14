"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { useStore } from "zustand";

import { createBoardStore, type BoardStore } from "./store";
import type { Item } from "./types";

type BoardStoreApi = ReturnType<typeof createBoardStore>;

const BoardStoreContext = createContext<BoardStoreApi | null>(null);

type BoardStoreProviderProps = {
  items: readonly Item[];
  children: ReactNode;
};

/**
 * Creates one store per mounted board instead of a module-level singleton,
 * so server renders never share state between requests.
 *
 * Return timers belong to the store, not to this component's Effects. Effect
 * cleanups also run when the board is only hidden (Next.js keeps visited
 * pages in <Activity>) or hot-reloaded, and the state survives both, so
 * clearing timers there would leave items stuck in a column. After a real
 * unmount, a pending timer still fires once, within 5 seconds, on a store
 * that nothing renders.
 */
export function BoardStoreProvider({
  items,
  children,
}: BoardStoreProviderProps) {
  const [store] = useState(() => createBoardStore(items));

  return <BoardStoreContext value={store}>{children}</BoardStoreContext>;
}

/** The store itself, for subscribing to changes outside of rendering. */
export function useBoardStoreApi(): BoardStoreApi {
  const store = useContext(BoardStoreContext);
  if (!store) {
    throw new Error(
      "Board store hooks must be used inside <BoardStoreProvider>",
    );
  }
  return store;
}

export function useBoardStore<T>(selector: (state: BoardStore) => T): T {
  return useStore(useBoardStoreApi(), selector);
}
