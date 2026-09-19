import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./supabase";

export type FoodSearchResult = {
  productCode: string;
  name: string;
  brand?: string;
  imageUrl?: string;
  servingOption?: { label: string; grams: number };
  quantityDescription?: string;
  rawNutrition?: Record<string, unknown>;
  foodType?: "fruit" | "meat" | "dairy" | "packaged" | "drink" | "sweets" | "food";
  metadataQuality?: "complete" | "partial";
  ukMarket?: boolean;
  wholeFood?: boolean;
  nutritionPer100g: Record<string, number | undefined>;
}

export type FoodSearchPage = {
  results: FoodSearchResult[];
  page: number;
  hasMore: boolean;
  total: number;
};

export async function getRecentFoods(
  supabase: SupabaseClient<Database>,
): Promise<FoodSearchResult[]> {
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const { data, error } = await supabase
    .from("diary_entries")
    .select("product_code, product_name, brand, image_url, nutrition_per_100g, raw_nutrition, created_at")
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: false });
  if (error) throw error;

  return rankRecentFoods((data ?? []) as RecentRow[]);
}

type RecentRow = {
  product_code: string;
  product_name: string;
  brand?: string | null;
  image_url?: string | null;
  nutrition_per_100g?: Record<string, number | undefined>;
  raw_nutrition?: Record<string, unknown>;
  created_at: string;
};

const macroNutrientKeys = new Set(["energy-kcal_100g", "proteins_100g", "carbohydrates_100g", "fat_100g"]);

function hasMicronutrients(rawNutrition: Record<string, unknown>): boolean {
  return Object.entries(rawNutrition).some(([key, value]) =>
    key.endsWith("_100g") && !macroNutrientKeys.has(key) && typeof value === "number" && Number.isFinite(value)
  );
}

export function rankRecentFoods(rows: RecentRow[], limit = 10): FoodSearchResult[] {
  const ranked = new Map<string, FoodSearchResult & { count: number; latest: string }>();
  for (const entry of rows) {
    if (!hasMicronutrients(entry.raw_nutrition ?? {})) continue;
    const existing = ranked.get(entry.product_code);
    if (existing) {
      existing.count += 1;
      continue;
    }
    ranked.set(entry.product_code, {
      productCode: entry.product_code,
      name: entry.product_name,
      brand: entry.brand ?? undefined,
      imageUrl: entry.image_url ?? undefined,
      servingOption: entry.raw_nutrition?.__servingOption as FoodSearchResult["servingOption"],
      quantityDescription: typeof entry.raw_nutrition?.__quantityDescription === "string" ? entry.raw_nutrition.__quantityDescription : undefined,
      rawNutrition: entry.raw_nutrition ?? {},
      nutritionPer100g: entry.nutrition_per_100g ?? {},
      count: 1,
      latest: entry.created_at,
    });
  }
  return [...ranked.values()]
    .sort((a, b) => b.count - a.count || b.latest.localeCompare(a.latest))
    .slice(0, limit)
    .map(({ count: _count, latest: _latest, ...food }) => food);
}

export async function searchFoods(
  supabase: SupabaseClient<Database>,
  query: string,
  page = 1,
): Promise<FoodSearchPage> {
  const { data, error } = await supabase.functions.invoke<FoodSearchPage>("search-foods", {
    body: { query, page, pageSize: 20 },
  });
  if (error) throw error;
  return data ?? { results: [], page, hasMore: false, total: 0 };
}
