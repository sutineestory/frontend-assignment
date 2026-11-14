import type { Ref } from "react";

import type { Item } from "../types";
import { CountdownBar } from "./countdown-bar";

type ItemButtonProps = {
  item: Item;
  onClick: (name: string) => void;
  onFocus: (name: string) => void;
  /** Shows a bar that empties over this many milliseconds. */
  countdownMs?: number;
  ref?: Ref<HTMLButtonElement>;
};

export function ItemButton({
  item,
  onClick,
  onFocus,
  countdownMs,
  ref,
}: ItemButtonProps) {
  return (
    <button
      ref={ref}
      type="button"
      onClick={() => onClick(item.name)}
      onFocus={() => onFocus(item.name)}
      className="relative w-full overflow-hidden border border-gray-200 bg-white px-1 py-3 text-center text-sm wrap-break-word shadow-xs transition-colors hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 sm:px-4 sm:text-base"
    >
      {item.name}
      {countdownMs !== undefined && <CountdownBar durationMs={countdownMs} />}
    </button>
  );
}
