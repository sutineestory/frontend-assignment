"use client";

import { useRef } from "react";

import { useBoardStore } from "../store-provider";
import { ItemList } from "./item-list";

export function MainList() {
  const items = useBoardStore((state) => state.list);
  const moveToColumn = useBoardStore((state) => state.moveToColumn);
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section
      ref={sectionRef}
      tabIndex={-1}
      aria-labelledby="main-list-title"
      className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
    >
      <h2 id="main-list-title" className="sr-only">
        Items
      </h2>
      <ItemList
        items={items}
        onItemClick={moveToColumn}
        emptyFocusRef={sectionRef}
      />
    </section>
  );
}
