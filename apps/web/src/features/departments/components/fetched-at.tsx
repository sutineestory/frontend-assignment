import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * The server renders in UTC and doesn't know the viewer's time zone, so show
 * UTC first and switch to local time once hydrated (no mismatch warning).
 */
export function FetchedAt({ iso }: { iso: string }) {
  const isClient = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const date = new Date(iso);
  const text = isClient
    ? date.toLocaleTimeString()
    : `${date.toISOString().slice(11, 19)} UTC`;

  return <time dateTime={iso}>{text}</time>;
}
