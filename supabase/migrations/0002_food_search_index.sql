create index if not exists diary_entries_recent_foods_idx
  on public.diary_entries (user_id, product_code, created_at desc);
