alter table public.diary_entries
  add column if not exists brand text,
  add column if not exists image_url text,
  add column if not exists nutrition_per_100g jsonb not null default '{}'::jsonb,
  add column if not exists raw_nutrition jsonb not null default '{}'::jsonb;
