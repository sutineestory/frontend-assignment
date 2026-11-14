import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Activity } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { INITIAL_ITEMS } from "../data";
import { RETURN_DELAY_MS } from "../store";
import { Board } from "./board";

const region = (name: string) => screen.getByRole("region", { name });
const buttonIn = (regionName: string, name: string) =>
  within(region(regionName)).getByRole("button", { name });
const buttonNames = (regionName: string) =>
  within(region(regionName))
    .queryAllByRole("button")
    .map((button) => button.textContent);

describe("<Board />", () => {
  it("starts with every item in the main list and empty columns", () => {
    render(<Board />);

    expect(buttonNames("Items")).toEqual(INITIAL_ITEMS.map((i) => i.name));
    expect(buttonNames("Fruit")).toEqual([]);
    expect(buttonNames("Vegetable")).toEqual([]);
  });

  it("works with the keyboard", async () => {
    const user = userEvent.setup();
    render(<Board />);

    await user.tab();
    expect(buttonIn("Items", "Apple")).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(buttonNames("Fruit")).toEqual(["Apple"]);
  });

  // Testing Library's async helpers only auto-advance Jest's fake timers, so
  // these tests use the synchronous fireEvent instead of userEvent.
  describe("with fake timers", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("moves clicked items to their columns and back to the bottom of the list after 5 seconds", () => {
      render(<Board />);

      fireEvent.click(buttonIn("Items", "Apple"));
      fireEvent.click(buttonIn("Items", "Broccoli"));

      expect(buttonNames("Fruit")).toEqual(["Apple"]);
      expect(buttonNames("Vegetable")).toEqual(["Broccoli"]);
      expect(buttonNames("Items")).not.toContain("Apple");

      act(() => vi.advanceTimersByTime(RETURN_DELAY_MS));

      expect(buttonNames("Fruit")).toEqual([]);
      expect(buttonNames("Vegetable")).toEqual([]);
      expect(buttonNames("Items").slice(-2)).toEqual(["Apple", "Broccoli"]);
    });

    it("returns a clicked column item to the bottom of the list immediately", () => {
      render(<Board />);

      fireEvent.click(buttonIn("Items", "Banana"));
      fireEvent.click(buttonIn("Fruit", "Banana"));

      expect(buttonNames("Fruit")).toEqual([]);
      expect(buttonNames("Items").at(-1)).toBe("Banana");
      expect(vi.getTimerCount()).toBe(0);
    });

    // With cacheComponents, Next.js hides a page with <Activity> when you
    // navigate away. Its Effects clean up but its state stays.
    it("still returns items that time out while the board is hidden", () => {
      const { rerender } = render(
        <Activity mode="visible">
          <Board />
        </Activity>,
      );
      fireEvent.click(buttonIn("Items", "Apple"));

      rerender(
        <Activity mode="hidden">
          <Board />
        </Activity>,
      );
      act(() => vi.advanceTimersByTime(RETURN_DELAY_MS));
      rerender(
        <Activity mode="visible">
          <Board />
        </Activity>,
      );

      expect(buttonNames("Fruit")).toEqual([]);
      expect(buttonNames("Items").at(-1)).toBe("Apple");
    });
  });
});
