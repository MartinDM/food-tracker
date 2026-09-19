import { describe, expect, it } from "vitest";
import { nutritionForCapture, scaleNutrition, sumNutrition } from "./nutrition";

describe("nutrition scaling", () => {
  it("scales decimal weights from per-100-gram values", () => {
    expect(scaleNutrition({ calories: 250, protein: 10 }, 42.5)).toEqual({
      calories: 106.25,
      protein: 4.25,
      carbohydrates: undefined,
      fat: undefined,
    });
  });

  it("keeps missing nutrients unavailable in totals", () => {
    expect(sumNutrition([{ calories: 100 }, { protein: 5 }])).toEqual({
      calories: undefined,
      protein: undefined,
      carbohydrates: undefined,
      fat: undefined,
    });

  });

  it("converts a provider serving size to grams", () => {
    const item = {
      id: "serving",
      food: { productCode: "1", name: "Cereal", servingOption: { label: "serving", grams: 30 }, nutritionPer100g: { calories: 400 } },
      amount: "2",
      unit: "named" as const,
      mealSlot: "breakfast" as const,
    };
    expect(nutritionForCapture(item).calories).toBe(240);
  });
});
