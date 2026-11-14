import { useLayoutEffect, useRef, type RefObject } from "react";

import type { Item } from "../types";
import { ItemButton } from "./item-button";

type ItemListProps = {
  items: Item[];
  onItemClick: (name: string) => void;
  /** Gets focus when the focused item leaves and the list is now empty. */
  emptyFocusRef: RefObject<HTMLElement | null>;
  countdownMs?: number;
};

export function ItemList({
  items,
  onItemClick,
  emptyFocusRef,
  countdownMs,
}: ItemListProps) {
  const buttons = useRef(new Map<string, HTMLButtonElement>());
  const previousItems = useRef(items);
  // The item whose button has focus. It is kept when that button is removed
  // (which gives no relatedTarget), so focus can move to a neighbor.
  const focusedName = useRef<string | null>(null);

  // When the focused item leaves (clicked, or its timer ran out), the browser
  // drops focus to <body>. Keyboard and screen reader users would have to
  // start again from the top, so focus the item that took its place instead,
  // else the one above it, else the empty list's fallback.
  useLayoutEffect(() => {
    const before = previousItems.current;
    previousItems.current = items;

    const name = focusedName.current;
    if (name === null || items.some((item) => item.name === name)) return;
    focusedName.current = null;

    const active = document.activeElement;
    if (active !== null && active !== document.body) return; // focus moved on

    const index = before.findIndex((item) => item.name === name);
    const neighbor = items[index] ?? items[index - 1];
    const target = neighbor ? buttons.current.get(neighbor.name) : undefined;
    (target ?? emptyFocusRef.current)?.focus();
  }, [items, emptyFocusRef]);

  return (
    <ul
      className="flex flex-col gap-2"
      onBlur={(event) => {
        if (event.relatedTarget) focusedName.current = null;
      }}
    >
      {items.map((item) => (
        <li key={item.name}>
          <ItemButton
            ref={(node) => {
              if (node) buttons.current.set(item.name, node);
              else buttons.current.delete(item.name);
            }}
            item={item}
            onClick={onItemClick}
            onFocus={(name) => {
              focusedName.current = name;
            }}
            countdownMs={countdownMs}
          />
        </li>
      ))}
    </ul>
  );
}
