import { useLayoutEffect, useRef, type CSSProperties } from "react";

type CountdownBarProps = {
  durationMs: number;
};

/** A bar that empties over `durationMs`, counted from when it first mounts. */
export function CountdownBar({ durationMs }: CountdownBarProps) {
  const bar = useRef<HTMLSpanElement>(null);
  const startedAt = useRef<number | null>(null);

  // Next.js keeps a page you navigate away from mounted but hidden in
  // <Activity>, and CSS animations restart when it is shown again. Effects
  // re-run at that point, so start the animation from the time already spent.
  useLayoutEffect(() => {
    startedAt.current ??= Date.now();
    bar.current?.style.setProperty(
      "--countdown-delay",
      `${startedAt.current - Date.now()}ms`,
    );
  }, []);

  return (
    <span
      ref={bar}
      aria-hidden="true"
      className="absolute inset-x-0 bottom-0 h-0.5 origin-left animate-countdown bg-blue-500 motion-reduce:hidden"
      style={{ "--countdown-duration": `${durationMs}ms` } as CSSProperties}
    />
  );
}
