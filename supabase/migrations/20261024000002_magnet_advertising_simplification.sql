-- ====================================================================
-- Magneto Database Schema Migration: Magnet Advertising Simplification
-- Version: 3.1.0
-- Simplifies the advertising model exclusively to Magnet Advertising
-- on the static Virtual Fridge.
-- ====================================================================

-- 1. Ensure placement categories allow 'fridge_magnet'
do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'advertising_placements_category_check'
  ) then
    alter table public.advertising_placements drop constraint advertising_placements_category_check;
  end if;
  alter table public.advertising_placements
    add constraint advertising_placements_category_check
    check (category in ('fridge_magnet', 'fridge_product', 'magnet_banner', 'led_display'));
end $$;

-- 2. Add default_position_y and magnet_format to advertising_slots if not present
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'advertising_slots' and column_name = 'default_position_y'
  ) then
    alter table public.advertising_slots add column default_position_y numeric default 30;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_name = 'advertising_slots' and column_name = 'magnet_format'
  ) then
    alter table public.advertising_slots add column magnet_format text default 'standard';
  end if;
end $$;

-- 3. Add is_paid, payment_transaction_id, and change_request_note to advertising_campaigns if not present
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'advertising_campaigns' and column_name = 'is_paid'
  ) then
    alter table public.advertising_campaigns add column is_paid boolean default false;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_name = 'advertising_campaigns' and column_name = 'payment_transaction_id'
  ) then
    alter table public.advertising_campaigns add column payment_transaction_id text;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_name = 'advertising_campaigns' and column_name = 'change_request_note'
  ) then
    alter table public.advertising_campaigns add column change_request_note text;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_name = 'advertising_campaigns' and column_name = 'position_y'
  ) then
    alter table public.advertising_campaigns add column position_y numeric default 30;
  end if;
end $$;

-- 4. Seed default 'fridge_magnet' Placement
insert into public.advertising_placements (id, name, description, category, is_active, created_at)
values (
  'fridge_magnet',
  'Virtual Fridge Magnet Advertising',
  'Exclusive sponsored travel magnets placed directly on the virtual refrigerator surface, seen by users planning trips and saving money.',
  'fridge_magnet',
  true,
  now()
)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  is_active = true;

-- 5. Seed default Magnet Placement Slots on the Virtual Fridge Door
insert into public.advertising_slots (
  id, name, placement_id, location_description, default_position_x, default_position_y, default_display_scale, capacity, supported_formats, max_file_size_mb, is_exclusive, is_active, display_order, created_at
)
values
  (
    'slot_magnet_door_top_right',
    'Door Top Right — Prime Eye Level',
    'fridge_magnet',
    'Upper right quadrant of the refrigerator door, directly in the user primary line of sight.',
    72, 22, 1.05, 1, array['image/png', 'image/jpeg', 'image/webp']::text[], 10, true, true, 1, now()
  ),
  (
    'slot_magnet_door_top_left',
    'Door Top Left — High Visibility',
    'fridge_magnet',
    'Upper left quadrant of the refrigerator door, beside featured destination magnets.',
    28, 22, 1.0, 1, array['image/png', 'image/jpeg', 'image/webp']::text[], 10, true, true, 2, now()
  ),
  (
    'slot_magnet_door_center',
    'Door Center — Spotlight Feature',
    'fridge_magnet',
    'Central showcase placement on the main refrigerator door with highest visual prominence.',
    50, 42, 1.15, 1, array['image/png', 'image/jpeg', 'image/webp']::text[], 15, true, true, 3, now()
  ),
  (
    'slot_magnet_door_mid_right',
    'Door Mid Right — Interaction Zone',
    'fridge_magnet',
    'Right-side middle door placement situated naturally among travel milestone magnets.',
    75, 58, 1.0, 1, array['image/png', 'image/jpeg', 'image/webp']::text[], 10, true, true, 4, now()
  ),
  (
    'slot_magnet_door_mid_left',
    'Door Mid Left — Balanced Position',
    'fridge_magnet',
    'Left-side middle door placement with strong engagement as users review saved goals.',
    25, 58, 1.0, 1, array['image/png', 'image/jpeg', 'image/webp']::text[], 10, true, true, 5, now()
  ),
  (
    'slot_magnet_door_bottom_center',
    'Door Lower Anchor — Wide Magnet',
    'fridge_magnet',
    'Lower central anchor position ideal for prominent horizontal brand badges.',
    50, 75, 1.0, 1, array['image/png', 'image/jpeg', 'image/webp']::text[], 10, false, true, 6, now()
  )
on conflict (id) do update set
  name = excluded.name,
  location_description = excluded.location_description,
  default_position_x = excluded.default_position_x,
  default_position_y = excluded.default_position_y,
  default_display_scale = excluded.default_display_scale,
  is_exclusive = excluded.is_exclusive,
  is_active = true;

-- 6. Seed Magnet Advertising Subscription Plans
insert into public.advertising_plans (
  id, name, placement_id, tier, price_inr_minor, billing_currency, duration_days, creative_slots, inventory_capacity, supported_formats, max_file_size_mb, priority_weight, features, is_active, created_at, updated_at
)
values
  (
    'plan_magnet_starter_15d',
    'Starter Magnet Placement (15 Days)',
    'fridge_magnet',
    'standard',
    149900, -- ₹ 1,499
    'INR',
    15,
    1,
    1,
    array['image/png', 'image/jpeg', 'image/webp']::text[],
    10,
    1,
    array[
      'Virtual Fridge Door Magnet',
      '15 Days Continuous Visibility',
      'Direct Click-Through Destination URL',
      'Real-Time Impressions & Clicks Tracking',
      'Sponsored Brand Badge'
    ]::text[],
    true,
    now(),
    now()
  ),
  (
    'plan_magnet_standard_30d',
    'Standard Magnet Placement (30 Days)',
    'fridge_magnet',
    'featured',
    299900, -- ₹ 2,999
    'INR',
    30,
    1,
    1,
    array['image/png', 'image/jpeg', 'image/webp']::text[],
    10,
    2,
    array[
      'Virtual Fridge Door Magnet',
      '30 Days Continuous Placement',
      'Choice of Door Placement Zone',
      'Direct Destination URL CTA',
      'Impression & Click Analytics',
      'Priority Admin Review'
    ]::text[],
    true,
    now(),
    now()
  ),
  (
    'plan_magnet_featured_60d',
    'Featured Eye-Level Magnet (60 Days)',
    'fridge_magnet',
    'premium',
    549900, -- ₹ 5,499
    'INR',
    60,
    2,
    1,
    array['image/png', 'image/jpeg', 'image/webp']::text[],
    15,
    4,
    array[
      'Prime Eye-Level Placement Guarantee',
      '60 Days Continuous Presence',
      'A/B Creative Artwork Replacement',
      'Higher Priority Display Weight',
      'Detailed Performance & CTR Reports',
      'Discount on Plan Renewal'
    ]::text[],
    true,
    now(),
    now()
  ),
  (
    'plan_magnet_exclusive_90d',
    'Exclusive Center Spotlight Magnet (90 Days)',
    'fridge_magnet',
    'exclusive',
    799900, -- ₹ 7,999
    'INR',
    90,
    3,
    1,
    array['image/png', 'image/jpeg', 'image/webp']::text[],
    20,
    8,
    array[
      'Exclusive Centerpiece Magnet Position',
      '90 Days Uninterrupted Placement',
      'Conflict-Free Dedicated Slot Guarantee',
      'Prominent Brand CTA Button',
      'Weekly Engagement Reports',
      'Dedicated Account Support'
    ]::text[],
    true,
    now(),
    now()
  )
on conflict (id) do update set
  name = excluded.name,
  price_inr_minor = excluded.price_inr_minor,
  duration_days = excluded.duration_days,
  features = excluded.features,
  is_active = true,
  updated_at = now();
