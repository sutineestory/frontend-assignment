import { Board } from "@/features/board/components/board";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-5xl p-4 sm:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Auto Delete Todo List</h1>
        <p className="mt-1 text-gray-600">
          Click an item to move it into its column. It comes back after 5
          seconds, or right away if you click it again.
        </p>
      </header>
      <Board />
    </main>
  );
}
