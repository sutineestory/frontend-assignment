const block = "rounded-lg bg-gray-100 motion-safe:animate-pulse";

/** Same layout as the dashboard, so nothing jumps when the data arrives. */
export function DashboardSkeleton() {
  return (
    <div role="status" className="space-y-6">
      <span className="sr-only">Loading department data…</span>
      <div className="h-5 w-64 max-w-full rounded bg-gray-100" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[1, 2, 3, 4].map((key) => (
          <div key={key} className={`h-24 ${block}`} />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {[1, 2].map((key) => (
          <div key={key} className={`h-96 ${block}`} />
        ))}
      </div>
    </div>
  );
}
