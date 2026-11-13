"use client";

import { useBoardStore } from "../store-provider";
import type { ItemType } from "../types";
import { ItemList } from "./item-list";

type TypeColumnProps = {
  type: ItemType;
};

export function TypeColumn({ type }: TypeColumnProps) {
  const items = useBoardStore((state) => state.columns[type]);
  const moveToList = useBoardStore((state) => state.moveToList);
  const titleId = `${type.toLowerCase()}-column-title`;

  return (
    <section
      aria-labelledby={titleId}
      className="flex min-h-[40rem] flex-col border border-gray-200 bg-gray-50"
    >
      <h2
        id={titleId}
        className="border-b border-gray-200 bg-gray-100 py-2 text-center text-sm font-semibold sm:text-base"
      >
        {type}
      </h2>
      <div className="p-1 sm:p-2">
        <ItemList items={items} onItemClick={moveToList} />
      </div>
    </section>
  );
}
