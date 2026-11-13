"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
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
 */
export function BoardStoreProvider({
  items,
  children,
}: BoardStoreProviderProps) {
  const [store] = useState(() => createBoardStore(items));

  useEffect(() => () => store.getState().dispose(), [store]);

  return <BoardStoreContext value={store}>{children}</BoardStoreContext>;
}

export function useBoardStore<T>(selector: (state: BoardStore) => T): T {
  const store = useContext(BoardStoreContext);
  if (!store) {
    throw new Error("useBoardStore must be used inside <BoardStoreProvider>");
  }
  return useStore(store, selector);
}
