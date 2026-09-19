import { describe, expect, it } from "vitest";
import { captureListIsValid, createCaptureItem, validateCaptureItem, type CaptureItem } from "./capture";

const food = { productCode: "1", name: "Oats", nutritionPer100g: {} };

describe("capture list", () => {
  it("retains duplicate products as separate items", () => {
    const first = createCaptureItem(food, "first");
    const second = createCaptureItem(food, "second");
    expect([first, second]).toHaveLength(2);
    expect(first.id).not.toBe(second.id);
  });

  it("validates independent grams and meal slots", () => {
    const items: CaptureItem[] = [
      { ...createCaptureItem(food, "breakfast"), amount: "42.5", mealSlot: "breakfast" },
      { ...createCaptureItem({ ...food, productCode: "2", name: "Milk" }, "snacks"), amount: "100", mealSlot: "snacks" },
    ];
    expect(captureListIsValid(items)).toBe(true);
    expect(validateCaptureItem({ ...items[0], amount: "0" }).valid).toBe(false);
  });
});
