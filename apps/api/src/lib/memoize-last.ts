/**
 * Remembers the result for the most recent argument, compared by reference.
 * Meant for a value that is passed again and again until it is replaced,
 * like a cached object that only changes when the cache refills.
 * The argument must not be mutated after it is passed in.
 */
export function memoizeLast<A extends object, R>(
  compute: (arg: A) => R,
): (arg: A) => R {
  let last: { arg: A; result: R } | undefined;

  return (arg) => {
    if (last?.arg !== arg) last = { arg, result: compute(arg) };
    return last.result;
  };
}
