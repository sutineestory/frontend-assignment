import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SUMMARIES } from "../fixtures";
import { DepartmentsDashboard } from "./departments-dashboard";

vi.mock("next/server", () => ({ connection: async () => {} }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("<DepartmentsDashboard />", () => {
  it("renders the dashboard with data from the API", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json(SUMMARIES)),
    );

    render(await DepartmentsDashboard());

    expect(fetch).toHaveBeenCalledWith(
      new URL("http://localhost:4000/users/departments"),
      expect.anything(),
    );
    expect(
      screen.getByRole("group", { name: "Headcount by department" }),
    ).toBeInTheDocument();
  });

  it("shows an error with a retry button when the API is down", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("fetch failed");
      }),
    );
    vi.spyOn(console, "error").mockImplementation(() => {});

    render(await DepartmentsDashboard());

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Couldn't load data from the API",
    );
    expect(
      screen.getByRole("button", { name: "Try again" }),
    ).toBeInTheDocument();
  });
});
