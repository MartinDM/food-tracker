import type { FoodSearchResult } from "./foods";
import type { MealSlot } from "./diary";

export type CaptureItem = {
  id: string;
  food: FoodSearchResult;
  amount: string;
  unit: "g" | "named";
  mealSlot: MealSlot;
};

export type CaptureValidation = {
  valid: boolean;
  message?: string;
};

const STORAGE_KEY = "food-diary.capture-list";

export function createCaptureItem(food: FoodSearchResult, id: string = crypto.randomUUID()): CaptureItem {
  return { id, food, amount: "", unit: "g", mealSlot: "breakfast" };
}

export function validateCaptureItem(item: CaptureItem): CaptureValidation {
  if (!item.amount.trim()) return { valid: false, message: `Enter ${item.unit === "named" ? item.food.servingOption?.label ?? "amount" : "grams"}.` };
  const grams = gramsForCapture(item);
  if (!Number.isFinite(grams) || grams <= 0) return { valid: false, message: "Grams must be greater than zero." };
  return { valid: true };
}

export function gramsForCapture(item: CaptureItem): number {
  const amount = Number(item.amount);
  return item.unit === "named" ? amount * (item.food.servingOption?.grams ?? 0) : amount;
}

export function loadCaptureItems(storage: Pick<Storage, "getItem"> = sessionStorage): CaptureItem[] {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Array<CaptureItem & { grams?: string }>;
    return Array.isArray(parsed) ? parsed.map((item) => ({
      ...item,
      amount: item.amount ?? item.grams ?? "",
      unit: item.unit ?? "g",
    })) : [];
  } catch {
    return [];
  }
}

export function saveCaptureItems(items: CaptureItem[], storage: Pick<Storage, "setItem"> = sessionStorage): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function captureListIsValid(items: CaptureItem[]): boolean {
  return items.length > 0 && items.every((item) => validateCaptureItem(item).valid);
}
