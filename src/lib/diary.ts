import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./supabase";

export const MEAL_SLOTS = ["breakfast", "lunch", "dinner", "snacks"] as const;
export type MealSlot = (typeof MEAL_SLOTS)[number];
export type DiaryEntry = Database["public"]["Tables"]["diary_entries"]["Row"];

export function getLocalDiaryDate(timezone: string, now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export const mealSlotLabel = (slot: MealSlot) => slot[0].toUpperCase() + slot.slice(1);

export async function getDiaryEntries(
  supabase: SupabaseClient<Database>,
  userId: string,
  diaryDate: string,
): Promise<DiaryEntry[]> {
  const { data, error } = await supabase
    .from("diary_entries")
    .select("*")
    .eq("user_id", userId)
    .eq("diary_date", diaryDate)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function updateDiaryEntry(
  supabase: SupabaseClient<Database>,
  id: string,
  update: Database["public"]["Tables"]["diary_entries"]["Update"],
): Promise<void> {
  const { error } = await supabase.from("diary_entries").update(update).eq("id", id);
  if (error) throw error;
}

export async function deleteDiaryEntry(supabase: SupabaseClient<Database>, id: string): Promise<void> {
  const { error } = await supabase.from("diary_entries").delete().eq("id", id);
  if (error) throw error;
}

export function shiftDiaryDate(date: string, days: number): string {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}
