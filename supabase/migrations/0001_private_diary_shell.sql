create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  timezone text not null default 'UTC',
  created_at timestamptz not null default now()
);

create table if not exists public.diary_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  diary_date date not null,
  meal_slot text not null check (meal_slot in ('breakfast', 'lunch', 'dinner', 'snacks')),
  product_code text not null,
  product_name text not null,
  grams numeric(10, 2) not null check (grams > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.diary_entries enable row level security;

create policy "People can read their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "People can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "People can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "People can manage their own diary entries"
  on public.diary_entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, timezone)
  values (new.id, coalesce(new.raw_user_meta_data->>'timezone', 'UTC'));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
