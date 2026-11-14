"use client";

import { useEffect, useState } from "react";

import { RETURN_DELAY_MS } from "../store";
import { useBoardStoreApi } from "../store-provider";
import type { BoardState } from "../types";

/** Tells screen reader users what moved, including returns nobody clicked. */
export function MoveAnnouncer() {
  const store = useBoardStoreApi();
  const [message, setMessage] = useState("");

  useEffect(
    () =>
      store.subscribe((state, previous) => {
        const text = describeMove(previous, state);
        if (text) setMessage(text);
      }),
    [store],
  );

  return (
    <p role="status" className="sr-only">
      {message}
    </p>
  );
}

// Every change moves exactly one item, into the list or out of it.
function describeMove(before: BoardState, after: BoardState): string | null {
  if (after.list.length > before.list.length) {
    const item = after.list.at(-1);
    return item ? `${item.name} is back in the list.` : null;
  }
  const item = before.list.find((candidate) => !after.list.includes(candidate));
  return item
    ? `${item.name} moved to ${item.type}. It comes back in ${RETURN_DELAY_MS / 1000} seconds.`
    : null;
}
