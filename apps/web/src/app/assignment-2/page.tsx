import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Users by Department",
};

export default function Assignment2Page() {
  return (
    <main className="mx-auto w-full max-w-5xl p-4 sm:p-8">
      <h1 className="text-2xl font-semibold">Users by Department</h1>
    </main>
  );
}
