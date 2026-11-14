import type { Metadata } from "next";
import { Suspense } from "react";

import { DashboardSkeleton } from "@/features/departments/components/dashboard-skeleton";
import { DepartmentsDashboard } from "@/features/departments/components/departments-dashboard";

export const metadata: Metadata = {
  title: "Users by Department",
  description:
    "Dashboard of dummyjson users grouped by department, from the Part 2 API.",
};

export default function Assignment2Page() {
  return (
    <main className="mx-auto w-full max-w-5xl p-4 sm:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Users by Department</h1>
        <p className="mt-1 text-gray-600">
          Data from the Part 2 API. Select a department in any chart to compare
          it across all of them.
        </p>
      </header>
      <Suspense fallback={<DashboardSkeleton />}>
        <DepartmentsDashboard />
      </Suspense>
    </main>
  );
}
