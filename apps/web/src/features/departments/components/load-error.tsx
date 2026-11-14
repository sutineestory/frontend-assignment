"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function LoadError() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <div
      role="alert"
      className="rounded-lg border border-gray-200 bg-white p-6"
    >
      <h2 className="font-semibold">Couldn&apos;t load data from the API</h2>
      <p className="mt-1 text-sm text-gray-600">
        The Part 2 API didn&apos;t answer, or sent something unexpected. It may
        be starting up; try again in a moment.
      </p>
      <button
        type="button"
        disabled={isPending}
        onClick={() => startTransition(() => router.refresh())}
        className="mt-4 rounded-md bg-gray-900 px-3 py-1.5 text-sm text-white hover:bg-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:opacity-60"
      >
        {isPending ? "Trying again…" : "Try again"}
      </button>
    </div>
  );
}
