import { describe, expect, it } from "vitest";
import { rankRecentFoods } from "./foods";

describe("global recent foods", () => {
  it("ranks across meal slots by 30-day frequency, then latest use", () => {
    const foods = rankRecentFoods([
      { product_code: "oats", product_name: "Oats", raw_nutrition: { calcium_100g: 40 }, created_at: "2026-09-10T08:00:00Z" },
      { product_code: "oats", product_name: "Oats", raw_nutrition: { calcium_100g: 40 }, created_at: "2026-09-11T08:00:00Z" },
      { product_code: "banana", product_name: "Banana", raw_nutrition: { potassium_100g: 300 }, created_at: "2026-09-12T08:00:00Z" },
      { product_code: "apple", product_name: "Apple", raw_nutrition: { "vitamin-c_100g": 5 }, created_at: "2026-09-13T08:00:00Z" },
    ]);

    expect(foods.map((food) => food.productCode)).toEqual(["oats", "apple", "banana"]);
  });
});
