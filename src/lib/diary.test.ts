import { describe, expect, it } from "vitest";
import { getLocalDiaryDate, MEAL_SLOTS, mealSlotLabel } from "./diary";

describe("food diary shell", () => {
  it("exposes the four fixed meal slots", () => {
    expect(MEAL_SLOTS).toEqual(["breakfast", "lunch", "dinner", "snacks"]);
    expect(mealSlotLabel("snacks")).toBe("Snacks");
  });

  it("derives the diary date in the account timezone", () => {
    const instant = new Date("2026-09-18T00:30:00.000Z");
    expect(getLocalDiaryDate("Europe/London", instant)).toBe("2026-09-18");
    expect(getLocalDiaryDate("America/New_York", instant)).toBe("2026-09-17");
  });
});
