import { useRef, useState, type KeyboardEvent } from "react";

const MOVES: Record<string, (index: number, last: number) => number> = {
  ArrowDown: (index, last) => Math.min(index + 1, last),
  ArrowUp: (index) => Math.max(index - 1, 0),
  Home: () => 0,
  End: (_index, last) => last,
};

/**
 * One Tab stop per chart: the arrow keys, Home and End move between its rows,
 * so keyboard users don't tab through every department in every chart.
 */
export function useRovingFocus(count: number) {
  const [active, setActive] = useState(0);
  const items = useRef<(HTMLElement | null)[]>([]);

  return (index: number) => ({
    ref: (node: HTMLElement | null) => {
      items.current[index] = node;
    },
    tabIndex: index === Math.min(active, count - 1) ? 0 : -1,
    onFocus: () => setActive(index),
    onKeyDown: (event: KeyboardEvent) => {
      const move = MOVES[event.key];
      if (!move) return;
      event.preventDefault();
      const next = move(index, count - 1);
      setActive(next);
      items.current[next]?.focus();
    },
  });
}
