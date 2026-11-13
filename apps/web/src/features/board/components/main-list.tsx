"use client";

import { useBoardStore } from "../store-provider";
import { ItemList } from "./item-list";

export function MainList() {
  const items = useBoardStore((state) => state.list);
  const moveToColumn = useBoardStore((state) => state.moveToColumn);

  return (
    <section aria-labelledby="main-list-title">
      <h2 id="main-list-title" className="sr-only">
        Items
      </h2>
      <ItemList items={items} onItemClick={moveToColumn} />
    </section>
  );
}
