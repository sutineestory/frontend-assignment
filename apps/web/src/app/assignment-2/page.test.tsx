import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import Assignment2Page from "./page";

// The data loader is an async Server Component; it has its own tests.
vi.mock("@/features/departments/components/departments-dashboard", () => ({
  DepartmentsDashboard: () => <p>dashboard</p>,
}));

describe("Assignment 2 page", () => {
  it("renders the page title and the dashboard", () => {
    render(<Assignment2Page />);

    expect(
      screen.getByRole("heading", { name: "Users by Department" }),
    ).toBeInTheDocument();
    expect(screen.getByText("dashboard")).toBeInTheDocument();
  });
});
