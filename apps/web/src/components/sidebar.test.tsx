import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Sidebar } from "./sidebar";

const pathname = vi.hoisted(() => ({ current: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => pathname.current }));

const links = () =>
  within(screen.getByRole("navigation", { name: "Assignments" })).getAllByRole(
    "link",
  );

describe("<Sidebar />", () => {
  it("links to both assignments", () => {
    render(<Sidebar />);

    expect(links().map((link) => link.getAttribute("href"))).toEqual([
      "/",
      "/assignment-2",
    ]);
  });

  it.each([
    ["/", "Assignment 1"],
    ["/assignment-2", "Assignment 2"],
  ])("marks %s as the current page", (path, label) => {
    pathname.current = path;
    render(<Sidebar />);

    const current = links().filter(
      (link) => link.getAttribute("aria-current") === "page",
    );
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveTextContent(label);
  });
});
