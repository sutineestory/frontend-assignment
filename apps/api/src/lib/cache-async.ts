/**
 * Wraps an async loader so that:
 * - concurrent callers share one in-flight call, and
 * - a successful result is reused for `ttlMs`.
 * Failures are never cached; the next call tries again.
 */
export function cacheAsync<T>(
  load: () => Promise<T>,
  ttlMs: number,
): () => Promise<T> {
  let cached: { value: T; expiresAt: number } | undefined;
  let inFlight: Promise<T> | undefined;

  return () => {
    if (cached && Date.now() < cached.expiresAt) {
      return Promise.resolve(cached.value);
    }

    inFlight ??= load()
      .then((value) => {
        cached = { value, expiresAt: Date.now() + ttlMs };
        return value;
      })
      .finally(() => {
        inFlight = undefined;
      });

    return inFlight;
  };
}
