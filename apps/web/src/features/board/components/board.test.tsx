import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

    it("cancels pending timers when unmounted", () => {
      const { unmount } = render(<Board />);

      fireEvent.click(buttonIn("Items", "Apple"));
      expect(vi.getTimerCount()).toBe(1);

      unmount();
      expect(vi.getTimerCount()).toBe(0);
    });
  });
});
