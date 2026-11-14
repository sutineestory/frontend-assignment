import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { SUMMARIES } from "../fixtures";
import { Dashboard } from "./dashboard";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

beforeAll(() => {
  // Not implemented by jsdom.
  Element.prototype.scrollIntoView = vi.fn();
  window.matchMedia = vi.fn(() => ({ matches: false }) as MediaQueryList);
});

const renderDashboard = () =>
  render(
    <Dashboard summaries={SUMMARIES} fetchedAt="2026-11-14T10:00:00.000Z" />,
  );

const chart = (name: string) => screen.getByRole("group", { name });
const rowNames = (group: HTMLElement) =>
  within(group)
    .getAllByRole("button")
    .map((button) => button.getAttribute("aria-label")?.split(":")[0]);

const CHARTS = [
  "Headcount by department",
  "Share of women by department",
  "Age range by department",
  "Hair color by department",
];

describe("<Dashboard />", () => {
  it("shows the overall numbers and an insight under each chart", () => {
    renderDashboard();

    const people = screen.getByText("People", { selector: "dt" }).parentElement;
    expect(people).toHaveTextContent("8");
    expect(
      screen.getByText("Sales is 100% women", { exact: false }),
    ).toBeInTheDocument();
  });

  it("sorts every chart the same way", async () => {
    const user = userEvent.setup();
    renderDashboard();

    await user.selectOptions(
      screen.getByLabelText("Sort by"),
      "Share of women",
    );

    for (const name of CHARTS) {
      expect(rowNames(chart(name))).toEqual(["Sales", "Engineering", "Legal"]);
    }
  });

  it("selects a department across all charts and shows its details", async () => {
    const user = userEvent.setup();
    renderDashboard();

    await user.click(
      within(chart("Age range by department")).getByRole("button", {
        name: /^Sales/,
      }),
    );

    for (const name of CHARTS) {
      expect(
        within(chart(name)).getByRole("button", { name: /^Sales/ }),
      ).toHaveAttribute("aria-pressed", "true");
    }
    expect(screen.getByRole("heading", { name: "Sales" })).toBeInTheDocument();
    expect(screen.getByLabelText("Department")).toHaveValue("Sales");

    // Clicking the selected department again clears the selection.
    await user.click(
      within(chart("Headcount by department")).getByRole("button", {
        name: /^Sales/,
      }),
    );
    expect(
      screen.queryByRole("heading", { name: "Sales" }),
    ).not.toBeInTheDocument();
  });

  it("searches the selected department's people by name or postal code", async () => {
    const user = userEvent.setup();
    renderDashboard();
    await user.selectOptions(
      screen.getByLabelText("Department"),
      "Engineering",
    );

    const search = screen.getByRole("searchbox", { name: /search people/i });
    await user.type(search, "mcd");
    expect(screen.getByText("Victoria McDonald")).toBeInTheDocument();
    expect(screen.queryByText("Emily Johnson")).not.toBeInTheDocument();
    expect(screen.getByText("Showing 1 of 3")).toBeInTheDocument();

    await user.clear(search);
    await user.type(search, "2911");
    expect(screen.getByText("Emily Johnson")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Clear selection" }));
    expect(screen.getByLabelText("Department")).toHaveValue("");
  });

  it("moves between departments in a chart with the arrow keys", async () => {
    const user = userEvent.setup();
    renderDashboard();
    const rows = within(chart("Headcount by department")).getAllByRole(
      "button",
    );

    // Only one row per chart is in the Tab order.
    expect(rows.map((row) => row.tabIndex)).toEqual([0, -1, -1]);

    act(() => rows[0]!.focus());
    await user.keyboard("{ArrowDown}");
    expect(rows[1]).toHaveFocus();
    await user.keyboard("{End}");
    expect(rows[2]).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(rows[2]).toHaveAttribute("aria-pressed", "true");
  });

  it("shows a department's numbers on hover", () => {
    renderDashboard();
    const group = chart("Share of women by department");

    fireEvent.pointerEnter(
      within(group).getByRole("button", { name: /^Engineering/ }),
    );

    const card = group.closest("section")!;
    expect(card).toHaveTextContent("Engineering: 1 women, 2 men (33% women)");
  });

  it("switches to a table with every number", async () => {
    const user = userEvent.setup();
    renderDashboard();

    await user.click(screen.getByRole("button", { name: "table" }));

    const table = screen.getByRole("table", { name: "Users by department" });
    const sales = within(table).getByRole("row", { name: /Sales/ });
    expect(
      within(sales)
        .getAllByRole("cell")
        .map((cell) => cell.textContent),
    ).toEqual(["2", "2", "0", "100%", "26", "42", "Red (2)"]);
    expect(
      screen.queryByRole("group", { name: CHARTS[0] }),
    ).not.toBeInTheDocument();
  });
});
