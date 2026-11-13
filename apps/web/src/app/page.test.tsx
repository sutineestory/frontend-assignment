import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home from "./page";

describe("Home page", () => {
  it("renders the page title", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", { name: "Auto Delete Todo List" }),
    ).toBeInTheDocument();
  });
});
