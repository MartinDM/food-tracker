import type { SupabaseClient } from "@supabase/supabase-js";
import { gramsForCapture, type CaptureItem } from "./capture";
import type { Database } from "./supabase";

export async function commitCaptureItems(
  supabase: SupabaseClient<Database>,
  userId: string,
  diaryDate: string,
  items: CaptureItem[],
): Promise<void> {
  const rows: Database["public"]["Tables"]["diary_entries"]["Insert"][] = items.map((item) => ({
    user_id: userId,
    diary_date: diaryDate,
    meal_slot: item.mealSlot,
    product_code: item.food.productCode,
    product_name: item.food.name,
    brand: item.food.brand ?? null,
    image_url: item.food.imageUrl ?? null,
    grams: gramsForCapture(item),
    nutrition_per_100g: item.food.nutritionPer100g,
    raw_nutrition: {
      ...(item.food.rawNutrition ?? {}),
      __servingOption: item.food.servingOption,
      __quantityDescription: item.food.quantityDescription,
    },
  }));
  const { error } = await supabase.from("diary_entries").insert(rows);
  if (error) throw error;
}
