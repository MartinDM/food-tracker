import { gramsForCapture, type CaptureItem } from "./capture";

export type NutritionValues = {
  calories?: number;
  protein?: number;
  carbohydrates?: number;
  fat?: number;
};

export function scaleNutrition(
  nutritionPer100g: Record<string, number | undefined>,
  grams: number,
): NutritionValues {
  const factor = grams / 100;
  return {
    calories: scaleValue(nutritionPer100g.calories, factor),
    protein: scaleValue(nutritionPer100g.protein, factor),
    carbohydrates: scaleValue(nutritionPer100g.carbohydrates, factor),
    fat: scaleValue(nutritionPer100g.fat, factor),
  };
}

function scaleValue(value: number | undefined, factor: number): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value * factor : undefined;
}

export function sumNutrition(values: NutritionValues[]): NutritionValues {
  return {
    calories: sumKnown(values.map((value) => value.calories)),
    protein: sumKnown(values.map((value) => value.protein)),
    carbohydrates: sumKnown(values.map((value) => value.carbohydrates)),
    fat: sumKnown(values.map((value) => value.fat)),
  };
}

function sumKnown(values: Array<number | undefined>): number | undefined {
  if (values.length === 0 || values.some((value) => value === undefined)) return undefined;
  return values.reduce<number>((total, value) => total + (value ?? 0), 0);
}

export function nutritionForCapture(item: CaptureItem): NutritionValues {
  return scaleNutrition(item.food.nutritionPer100g, gramsForCapture(item));
}

export function formatNutrition(value: number | undefined, unit: string): string {
  return value === undefined ? "—" : `${value.toFixed(1)}${unit}`;
}
