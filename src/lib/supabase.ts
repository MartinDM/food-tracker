import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readConfig } from "./config";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; timezone: string };
        Insert: { id: string; timezone?: string };
        Update: { timezone?: string };
        Relationships: [];
      };
      diary_entries: {
        Row: {
          id: string;
          user_id: string;
          diary_date: string;
          meal_slot: "breakfast" | "lunch" | "dinner" | "snacks";
          product_code: string;
          product_name: string;
          brand: string | null;
          image_url: string | null;
          grams: number;
          nutrition_per_100g: Record<string, number | undefined>;
          raw_nutrition: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          user_id: string;
          diary_date: string;
          meal_slot: "breakfast" | "lunch" | "dinner" | "snacks";
          product_code: string;
          product_name: string;
          brand?: string | null;
          image_url?: string | null;
          grams: number;
          nutrition_per_100g: Record<string, number | undefined>;
          raw_nutrition: Record<string, unknown>;
        };
        Update: Partial<Database["public"]["Tables"]["diary_entries"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};

export function createSupabaseClient(): SupabaseClient<Database> | null {
  const config = readConfig(import.meta.env);
  return config ? createClient<Database>(config.VITE_SUPABASE_URL, config.VITE_SUPABASE_PUBLISHABLE_KEY) : null;
}
