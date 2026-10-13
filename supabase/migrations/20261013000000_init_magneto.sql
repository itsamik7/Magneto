-- ====================================================================
-- Magneto Database Schema Migration
-- Version: 1.0.0
-- Tables: profiles, trips, savings_transactions, itinerary_items, checklist_items
-- Security: Full Row Level Security (RLS) with auth.uid() checks
-- Currency: INR stored in minor units (paise) as bigint
-- ====================================================================

-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- --------------------------------------------------------------------
-- 1. PROFILES TABLE
-- --------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

-- Policies for profiles
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Trigger to create profile when auth.users signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, created_at, updated_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    now(),
    now()
  );
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists and recreate
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- --------------------------------------------------------------------
-- 2. TRIPS TABLE
-- --------------------------------------------------------------------
create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  destination_name text not null,
  magnet_key text not null default 'paris',
  start_date date,
  end_date date,
  target_budget_minor bigint not null,
  currency text not null default 'INR',
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,

  constraint check_positive_budget check (target_budget_minor > 0),
  constraint check_currency_inr check (currency = 'INR'),
  constraint check_date_range check (
    start_date is null or end_date is null or end_date >= start_date
  )
);

create index if not exists idx_trips_user_id on public.trips(user_id);

alter table public.trips enable row level security;

-- Policies for trips
create policy "Users can view their own trips"
  on public.trips for select
  using (auth.uid() = user_id);

create policy "Users can insert their own trips"
  on public.trips for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own trips"
  on public.trips for update
  using (auth.uid() = user_id);

create policy "Users can delete their own trips"
  on public.trips for delete
  using (auth.uid() = user_id);

-- --------------------------------------------------------------------
-- 3. SAVINGS TRANSACTIONS TABLE
-- --------------------------------------------------------------------
create table if not exists public.savings_transactions (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount_minor bigint not null,
  currency text not null default 'INR',
  note text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,

  constraint check_positive_deposit check (amount_minor > 0),
  constraint check_savings_currency_inr check (currency = 'INR')
);

create index if not exists idx_savings_trip_id on public.savings_transactions(trip_id);
create index if not exists idx_savings_user_id on public.savings_transactions(user_id);

alter table public.savings_transactions enable row level security;

-- Policies for savings_transactions
create policy "Users can view savings of their own trips"
  on public.savings_transactions for select
  using (
    auth.uid() = user_id and
    exists (select 1 from public.trips where id = savings_transactions.trip_id and user_id = auth.uid())
  );

create policy "Users can insert savings into their own trips"
  on public.savings_transactions for insert
  with check (
    auth.uid() = user_id and
    exists (select 1 from public.trips where id = savings_transactions.trip_id and user_id = auth.uid())
  );

create policy "Users can update their own savings transactions"
  on public.savings_transactions for update
  using (
    auth.uid() = user_id and
    exists (select 1 from public.trips where id = savings_transactions.trip_id and user_id = auth.uid())
  );

create policy "Users can delete their own savings transactions"
  on public.savings_transactions for delete
  using (
    auth.uid() = user_id and
    exists (select 1 from public.trips where id = savings_transactions.trip_id and user_id = auth.uid())
  );

-- --------------------------------------------------------------------
-- 4. ITINERARY ITEMS TABLE
-- --------------------------------------------------------------------
create table if not exists public.itinerary_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  activity_date date,
  trip_day integer,
  activity_time time,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_itinerary_trip_id on public.itinerary_items(trip_id);
create index if not exists idx_itinerary_user_id on public.itinerary_items(user_id);

alter table public.itinerary_items enable row level security;

-- Policies for itinerary_items
create policy "Users can view itinerary items of their own trips"
  on public.itinerary_items for select
  using (
    auth.uid() = user_id and
    exists (select 1 from public.trips where id = itinerary_items.trip_id and user_id = auth.uid())
  );

create policy "Users can insert itinerary items for their own trips"
  on public.itinerary_items for insert
  with check (
    auth.uid() = user_id and
    exists (select 1 from public.trips where id = itinerary_items.trip_id and user_id = auth.uid())
  );

create policy "Users can update their own itinerary items"
  on public.itinerary_items for update
  using (
    auth.uid() = user_id and
    exists (select 1 from public.trips where id = itinerary_items.trip_id and user_id = auth.uid())
  );

create policy "Users can delete their own itinerary items"
  on public.itinerary_items for delete
  using (
    auth.uid() = user_id and
    exists (select 1 from public.trips where id = itinerary_items.trip_id and user_id = auth.uid())
  );

-- --------------------------------------------------------------------
-- 5. CHECKLIST ITEMS TABLE
-- --------------------------------------------------------------------
create table if not exists public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  due_date date,
  is_completed boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_checklist_trip_id on public.checklist_items(trip_id);
create index if not exists idx_checklist_user_id on public.checklist_items(user_id);

alter table public.checklist_items enable row level security;

-- Policies for checklist_items
create policy "Users can view checklist items of their own trips"
  on public.checklist_items for select
  using (
    auth.uid() = user_id and
    exists (select 1 from public.trips where id = checklist_items.trip_id and user_id = auth.uid())
  );

create policy "Users can insert checklist items for their own trips"
  on public.checklist_items for insert
  with check (
    auth.uid() = user_id and
    exists (select 1 from public.trips where id = checklist_items.trip_id and user_id = auth.uid())
  );

create policy "Users can update their own checklist items"
  on public.checklist_items for update
  using (
    auth.uid() = user_id and
    exists (select 1 from public.trips where id = checklist_items.trip_id and user_id = auth.uid())
  );

create policy "Users can delete their own checklist items"
  on public.checklist_items for delete
  using (
    auth.uid() = user_id and
    exists (select 1 from public.trips where id = checklist_items.trip_id and user_id = auth.uid())
  );

-- Function for updated_at timestamps
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trigger_trips_updated_at
  before update on public.trips
  for each row execute procedure public.update_updated_at_column();

create trigger trigger_itinerary_updated_at
  before update on public.itinerary_items
  for each row execute procedure public.update_updated_at_column();

create trigger trigger_checklist_updated_at
  before update on public.checklist_items
  for each row execute procedure public.update_updated_at_column();
