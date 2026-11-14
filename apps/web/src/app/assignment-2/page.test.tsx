import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Assignment2Page from "./page";

describe("Assignment 2 page", () => {
  it("renders the page title", () => {
    render(<Assignment2Page />);

    expect(
      screen.getByRole("heading", { name: "Users by Department" }),
    ).toBeInTheDocument();
  });
});
