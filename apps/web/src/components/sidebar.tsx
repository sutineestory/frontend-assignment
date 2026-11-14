"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ASSIGNMENTS = [
  { href: "/", label: "Assignment 1", title: "Auto Delete Todo List" },
  {
    href: "/assignment-2",
    label: "Assignment 2",
    title: "Users by Department",
  },
] as const;

/**
 * A left sidebar from the md breakpoint up. Below it, a row of tabs above the
 * page, so the three board columns keep the full screen width on phones.
 */
export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="border-b border-gray-200 bg-gray-50 md:w-56 md:shrink-0 md:border-r md:border-b-0">
      <div className="p-2 md:sticky md:top-0 md:p-4">
        <p className="hidden px-3 pb-3 text-sm font-semibold text-gray-500 md:block">
          Frontend Assignment
        </p>
        <nav aria-label="Assignments">
          <ul className="flex gap-1 md:flex-col">
            {ASSIGNMENTS.map(({ href, label, title }) => (
              <li key={href} className="flex-1 md:flex-none">
                <Link
                  href={href}
                  aria-current={pathname === href ? "page" : undefined}
                  className="block rounded-md px-3 py-2 text-center text-sm text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 aria-[current=page]:bg-white aria-[current=page]:text-gray-900 aria-[current=page]:shadow-xs aria-[current=page]:ring-1 aria-[current=page]:ring-gray-200 md:text-left"
                >
                  <span className="block font-medium">{label}</span>
                  <span className="hidden text-xs text-gray-500 md:block">
                    {title}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  );
}
