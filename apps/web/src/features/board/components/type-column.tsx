"use client";

import { useRef } from "react";

import { RETURN_DELAY_MS } from "../store";
import { useBoardStore } from "../store-provider";
import type { ItemType } from "../types";
import { ItemList } from "./item-list";

type TypeColumnProps = {
  type: ItemType;
};

export function TypeColumn({ type }: TypeColumnProps) {
  const items = useBoardStore((state) => state.columns[type]);
  const moveToList = useBoardStore((state) => state.moveToList);
  const sectionRef = useRef<HTMLElement>(null);
  const titleId = `${type.toLowerCase()}-column-title`;

  return (
    <section
      ref={sectionRef}
      tabIndex={-1}
      aria-labelledby={titleId}
      className="flex min-h-[40rem] flex-col border border-gray-200 bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
    >
      <h2
        id={titleId}
        className="border-b border-gray-200 bg-gray-100 py-2 text-center text-sm font-semibold sm:text-base"
      >
        {type}
      </h2>
      <div className="p-1 sm:p-2">
        <ItemList
          items={items}
          onItemClick={moveToList}
          emptyFocusRef={sectionRef}
          countdownMs={RETURN_DELAY_MS}
        />
      </div>
    </section>
  );
}
