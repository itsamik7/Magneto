-- ====================================================================
-- Magneto Database Schema Migration: Merchant Advertising Portal
-- Version: 3.0.0
-- Tables:
--   1. merchant_profiles
--   2. advertising_placements
--   3. advertising_slots
--   4. advertising_plans
--   5. merchant_subscriptions
--   6. advertising_creatives
--   7. advertising_campaigns
--   8. advertising_payments
--   9. advertising_events
-- Security: Full Row Level Security (RLS) with auth.uid() & is_admin() checks
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. MERCHANT PROFILES TABLE
-- --------------------------------------------------------------------
create table if not exists public.merchant_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_name text not null,
  contact_person text not null,
  business_email text not null,
  phone_number text not null,
  business_category text not null,
  business_website text,
  logo_url text,
  verification_status text not null default 'verified' check (
    verification_status in ('pending', 'verified', 'rejected')
  ),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint uq_merchant_user unique (user_id)
);

create index if not exists idx_merchant_profiles_user_id on public.merchant_profiles(user_id);
create index if not exists idx_merchant_profiles_status on public.merchant_profiles(verification_status);

alter table public.merchant_profiles enable row level security;

-- Policies for merchant_profiles
create policy "Merchants can view their own merchant profile; admins can view all"
  on public.merchant_profiles for select
  using (auth.uid() = user_id or public.is_admin());

create policy "Merchants can insert their own profile"
  on public.merchant_profiles for insert
  with check (auth.uid() = user_id);

create policy "Merchants can update their own profile; admins can update all"
  on public.merchant_profiles for update
  using (auth.uid() = user_id or public.is_admin());

create policy "Admins can delete merchant profiles"
  on public.merchant_profiles for delete
  using (public.is_admin());

-- --------------------------------------------------------------------
-- 2. ADVERTISING PLACEMENTS TABLE
-- Categories: fridge_product, magnet_banner, led_display
-- --------------------------------------------------------------------
create table if not exists public.advertising_placements (
  id text primary key, -- 'fridge_product', 'magnet_banner', 'led_display'
  name text not null,
  description text not null,
  category text not null check (category in ('fridge_product', 'magnet_banner', 'led_display')),
  is_active boolean not null default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.advertising_placements enable row level security;

create policy "Anyone can read active advertising placements"
  on public.advertising_placements for select
  using (is_active = true or public.is_admin());

create policy "Only admins can modify advertising placements"
  on public.advertising_placements for all
  using (public.is_admin());

-- --------------------------------------------------------------------
-- 3. ADVERTISING SLOTS TABLE
-- Concrete inventory spots defined and governed strictly by admin
-- --------------------------------------------------------------------
create table if not exists public.advertising_slots (
  id text primary key, -- e.g. 'slot_fridge_top_shelf_1', 'slot_banner_sidebar_top', 'slot_led_tv_main'
  name text not null,
  placement_id text not null references public.advertising_placements(id) on delete cascade,
  location_description text not null,
  shelf text check (
    shelf is null or shelf in (
      'top_shelf',
      'middle_shelf',
      'bottom_shelf',
      'crisper_drawer',
      'freezer',
      'door_bin_top',
      'door_bin_middle',
      'door_bin_bottom'
    )
  ),
  default_position_x numeric default 50,
  default_display_scale numeric default 1.0,
  capacity integer not null default 1,
  supported_formats text[] not null default array['image/png', 'image/jpeg']::text[],
  max_file_size_mb integer not null default 10,
  is_exclusive boolean not null default false,
  is_active boolean not null default true,
  display_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_advertising_slots_placement on public.advertising_slots(placement_id);
create index if not exists idx_advertising_slots_active on public.advertising_slots(is_active);

alter table public.advertising_slots enable row level security;

create policy "Anyone can read active advertising slots"
  on public.advertising_slots for select
  using (is_active = true or public.is_admin());

create policy "Only admins can manage advertising slots"
  on public.advertising_slots for all
  using (public.is_admin());

-- --------------------------------------------------------------------
-- 4. ADVERTISING SUBSCRIPTION PLANS TABLE
-- Configurable pricing, durations, slot quotas, and renewal rules
-- --------------------------------------------------------------------
create table if not exists public.advertising_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  placement_id text not null references public.advertising_placements(id) on delete cascade,
  tier text not null check (tier in ('standard', 'featured', 'premium', 'exclusive')),
  price_inr_minor bigint not null check (price_inr_minor >= 0),
  billing_currency text not null default 'INR',
  duration_days integer not null check (duration_days > 0),
  creative_slots integer not null default 1,
  inventory_capacity integer not null default 1,
  supported_formats text[] not null default array['image/png', 'image/jpeg']::text[],
  max_file_size_mb integer not null default 15,
  priority_weight integer not null default 1,
  features text[] not null default array[]::text[],
  is_active boolean not null default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_advertising_plans_placement on public.advertising_plans(placement_id);
create index if not exists idx_advertising_plans_active on public.advertising_plans(is_active);

alter table public.advertising_plans enable row level security;

create policy "Anyone can view active advertising plans"
  on public.advertising_plans for select
  using (is_active = true or public.is_admin());

create policy "Only admins can insert or update advertising plans"
  on public.advertising_plans for all
  using (public.is_admin());

-- --------------------------------------------------------------------
-- 5. MERCHANT SUBSCRIPTIONS TABLE
-- Active merchant entitlements purchased through payment gateway
-- --------------------------------------------------------------------
create table if not exists public.merchant_subscriptions (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchant_profiles(id) on delete cascade,
  plan_id uuid not null references public.advertising_plans(id) on delete cascade,
  status text not null default 'pending_payment' check (
    status in ('pending_payment', 'active', 'cancelled', 'expired')
  ),
  current_period_start timestamp with time zone default timezone('utc'::text, now()) not null,
  current_period_end timestamp with time zone not null,
  payment_method text default 'sandbox_inr',
  auto_renew boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_merchant_subs_merchant on public.merchant_subscriptions(merchant_id);
create index if not exists idx_merchant_subs_status on public.merchant_subscriptions(status);

alter table public.merchant_subscriptions enable row level security;

create policy "Merchants can view their own subscriptions; admins can view all"
  on public.merchant_subscriptions for select
  using (
    exists (
      select 1 from public.merchant_profiles
      where id = merchant_subscriptions.merchant_id and user_id = auth.uid()
    ) or public.is_admin()
  );

create policy "Merchants can create their subscriptions"
  on public.merchant_subscriptions for insert
  with check (
    exists (
      select 1 from public.merchant_profiles
      where id = merchant_subscriptions.merchant_id and user_id = auth.uid()
    ) or public.is_admin()
  );

create policy "Merchants can update own subscriptions; admins can update all"
  on public.merchant_subscriptions for update
  using (
    exists (
      select 1 from public.merchant_profiles
      where id = merchant_subscriptions.merchant_id and user_id = auth.uid()
    ) or public.is_admin()
  );

-- --------------------------------------------------------------------
-- 6. ADVERTISING CREATIVES TABLE
-- Images, banners, videos, and 3D assets stored in creative library
-- --------------------------------------------------------------------
create table if not exists public.advertising_creatives (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchant_profiles(id) on delete cascade,
  name text not null,
  creative_type text not null check (creative_type in ('image', 'video', '3d_model')),
  placement_category text not null check (placement_category in ('fridge_product', 'magnet_banner', 'led_display')),
  file_url text not null,
  thumbnail_url text,
  aspect_ratio text default '1:1',
  file_size_bytes bigint not null default 0,
  mime_type text not null,
  dimensions jsonb default '{"width": 800, "height": 800}'::jsonb,
  model_metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_advertising_creatives_merchant on public.advertising_creatives(merchant_id);
create index if not exists idx_advertising_creatives_category on public.advertising_creatives(placement_category);

alter table public.advertising_creatives enable row level security;

create policy "Merchants can view their own creatives; admins can view all"
  on public.advertising_creatives for select
  using (
    exists (
      select 1 from public.merchant_profiles
      where id = advertising_creatives.merchant_id and user_id = auth.uid()
    ) or public.is_admin()
  );

create policy "Merchants can insert their own creatives"
  on public.advertising_creatives for insert
  with check (
    exists (
      select 1 from public.merchant_profiles
      where id = advertising_creatives.merchant_id and user_id = auth.uid()
    ) or public.is_admin()
  );

create policy "Merchants can update their own creatives; admins can update all"
  on public.advertising_creatives for update
  using (
    exists (
      select 1 from public.merchant_profiles
      where id = advertising_creatives.merchant_id and user_id = auth.uid()
    ) or public.is_admin()
  );

create policy "Merchants can delete their own creatives; admins can delete all"
  on public.advertising_creatives for delete
  using (
    exists (
      select 1 from public.merchant_profiles
      where id = advertising_creatives.merchant_id and user_id = auth.uid()
    ) or public.is_admin()
  );

-- --------------------------------------------------------------------
-- 7. ADVERTISING CAMPAIGNS TABLE
-- State machine: draft, pending_payment, pending_approval, scheduled, active, paused, rejected, completed, expired
-- --------------------------------------------------------------------
create table if not exists public.advertising_campaigns (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchant_profiles(id) on delete cascade,
  subscription_id uuid references public.merchant_subscriptions(id) on delete set null,
  placement_id text not null references public.advertising_placements(id) on delete restrict,
  slot_id text references public.advertising_slots(id) on delete set null,
  name text not null,
  brand_name text not null,
  product_name text not null,
  description text,
  destination_url text not null,
  cta_text text default 'Shop Now',
  creative_id uuid references public.advertising_creatives(id) on delete set null,
  creative_url text not null,
  model_3d_url text,
  shelf text check (
    shelf is null or shelf in (
      'top_shelf',
      'middle_shelf',
      'bottom_shelf',
      'crisper_drawer',
      'freezer',
      'door_bin_top',
      'door_bin_middle',
      'door_bin_bottom'
    )
  ),
  position_x numeric default 50 check (position_x >= 0 and position_x <= 100),
  display_scale numeric default 1.0 check (display_scale >= 0.4 and display_scale <= 2.5),
  status text not null default 'draft' check (
    status in (
      'draft',
      'pending_payment',
      'pending_approval',
      'scheduled',
      'active',
      'paused',
      'rejected',
      'completed',
      'expired'
    )
  ),
  rejection_reason text,
  start_date timestamp with time zone default timezone('utc'::text, now()) not null,
  end_date timestamp with time zone not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_campaigns_merchant on public.advertising_campaigns(merchant_id);
create index if not exists idx_campaigns_status on public.advertising_campaigns(status);
create index if not exists idx_campaigns_placement on public.advertising_campaigns(placement_id);
create index if not exists idx_campaigns_slot on public.advertising_campaigns(slot_id);
create index if not exists idx_campaigns_delivery on public.advertising_campaigns(status, start_date, end_date);

alter table public.advertising_campaigns enable row level security;

-- Policies for advertising_campaigns:
-- 1. Public normal users can ONLY view active campaigns within current date range
create policy "Normal users can view active published campaigns"
  on public.advertising_campaigns for select
  using (
    (status = 'active' and now() between start_date and end_date)
    or
    exists (
      select 1 from public.merchant_profiles
      where id = advertising_campaigns.merchant_id and user_id = auth.uid()
    )
    or
    public.is_admin()
  );

create policy "Merchants can insert campaigns for their merchant account"
  on public.advertising_campaigns for insert
  with check (
    exists (
      select 1 from public.merchant_profiles
      where id = advertising_campaigns.merchant_id and user_id = auth.uid()
    ) or public.is_admin()
  );

create policy "Merchants can update own draft or paused campaigns; admins can update all"
  on public.advertising_campaigns for update
  using (
    exists (
      select 1 from public.merchant_profiles
      where id = advertising_campaigns.merchant_id and user_id = auth.uid()
    ) or public.is_admin()
  );

create policy "Merchants can delete their draft campaigns; admins can delete all"
  on public.advertising_campaigns for delete
  using (
    (
      exists (
        select 1 from public.merchant_profiles
        where id = advertising_campaigns.merchant_id and user_id = auth.uid()
      ) and status = 'draft'
    ) or public.is_admin()
  );

-- --------------------------------------------------------------------
-- 8. PAYMENT TRANSACTIONS TABLE
-- Verifiable sandbox / live payment gateway events
-- --------------------------------------------------------------------
create table if not exists public.advertising_payments (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchant_profiles(id) on delete cascade,
  subscription_id uuid references public.merchant_subscriptions(id) on delete set null,
  amount_minor bigint not null check (amount_minor >= 0),
  currency text not null default 'INR',
  gateway text not null default 'magneto_sandbox',
  gateway_order_id text not null,
  gateway_payment_id text,
  gateway_signature text,
  status text not null default 'pending' check (
    status in ('pending', 'success', 'failed', 'refunded')
  ),
  payment_method text not null default 'upi',
  receipt_url text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_advertising_payments_merchant on public.advertising_payments(merchant_id);
create index if not exists idx_advertising_payments_order on public.advertising_payments(gateway_order_id);
create index if not exists idx_advertising_payments_status on public.advertising_payments(status);

alter table public.advertising_payments enable row level security;

create policy "Merchants can view their own payment transactions; admins can view all"
  on public.advertising_payments for select
  using (
    exists (
      select 1 from public.merchant_profiles
      where id = advertising_payments.merchant_id and user_id = auth.uid()
    ) or public.is_admin()
  );

create policy "Merchants and system can record payments"
  on public.advertising_payments for insert
  with check (
    exists (
      select 1 from public.merchant_profiles
      where id = advertising_payments.merchant_id and user_id = auth.uid()
    ) or public.is_admin()
  );

create policy "Admins can update payment transactions"
  on public.advertising_payments for update
  using (public.is_admin());

-- --------------------------------------------------------------------
-- 9. ADVERTISING EVENTS (ANALYTICS) TABLE
-- Tracks impressions, clicks, product inspections, and display interactions
-- --------------------------------------------------------------------
create table if not exists public.advertising_events (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.advertising_campaigns(id) on delete cascade,
  event_type text not null check (
    event_type in ('impression', 'click', 'interaction', 'fridge_product_inspect')
  ),
  placement_type text not null check (
    placement_type in ('fridge_product', 'magnet_banner', 'led_display')
  ),
  visitor_ip_hash text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_advertising_events_campaign on public.advertising_events(campaign_id);
create index if not exists idx_advertising_events_type on public.advertising_events(event_type);
create index if not exists idx_advertising_events_created on public.advertising_events(created_at);

alter table public.advertising_events enable row level security;

-- Normal users can record ad delivery events (impressions/clicks)
create policy "Anyone can record advertising events"
  on public.advertising_events for insert
  with check (true);

-- Merchants can view events belonging to their campaigns; admins can view all
create policy "Merchants can view events for their campaigns; admins can view all"
  on public.advertising_events for select
  using (
    exists (
      select 1 from public.advertising_campaigns c
      join public.merchant_profiles m on m.id = c.merchant_id
      where c.id = advertising_events.campaign_id and m.user_id = auth.uid()
    ) or public.is_admin()
  );

-- --------------------------------------------------------------------
-- 10. SEED PLACEMENTS, SLOTS & INITIAL SUBSCRIPTION PLANS
-- --------------------------------------------------------------------
insert into public.advertising_placements (id, name, description, category, is_active)
values
  ('fridge_product', 'Virtual Fridge 3D Products', 'Photorealistic sponsored products placed naturally onto interior refrigerator shelves and compartments.', 'fridge_product', true),
  ('magnet_banner', 'Destination Magnet Banner', 'Premium advertising banner embedded in the right-side destination details and trip savings panel.', 'magnet_banner', true),
  ('led_display', 'Digital LED Screen Display', 'Modern thin-bezel advertising LED TV display standing attractively beside the refrigerator.', 'led_display', true)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  is_active = excluded.is_active;

-- Seed Fridge Slots
insert into public.advertising_slots (id, name, placement_id, location_description, shelf, default_position_x, default_display_scale, capacity, supported_formats, is_exclusive, is_active, display_order)
values
  ('slot_fridge_middle_shelf_featured', 'Middle Shelf - Prime Eyeline', 'fridge_product', 'Center stage on the main glass refrigerator shelf, immediately visible upon opening doors.', 'middle_shelf', 50, 1.1, 1, array['image/png', 'image/jpeg', 'model/gltf-binary'], false, true, 1),
  ('slot_fridge_top_shelf_center', 'Top Shelf - High Visibility', 'fridge_product', 'Upper tempered glass shelf ideal for premium beverages and gourmet specialties.', 'top_shelf', 40, 1.0, 1, array['image/png', 'image/jpeg', 'model/gltf-binary'], false, true, 2),
  ('slot_fridge_bottom_shelf', 'Bottom Shelf - Family Pack Area', 'fridge_product', 'Spacious lower level ideal for beverage packs, large cartons, and grocery essentials.', 'bottom_shelf', 60, 1.0, 1, array['image/png', 'image/jpeg', 'model/gltf-binary'], false, true, 3),
  ('slot_fridge_crisper_drawer', 'Fresh Harvest Crisper Drawer', 'fridge_product', 'Articulated vegetable crisper drawer for farm-fresh produce and health beverages.', 'crisper_drawer', 50, 0.95, 1, array['image/png', 'image/jpeg', 'model/gltf-binary'], false, true, 4),
  ('slot_fridge_door_bin_mid', 'Right Door Bin - Quick Grab', 'fridge_product', 'Swinging door bin with high interaction rate when user checks snacks.', 'door_bin_middle', 35, 0.9, 1, array['image/png', 'image/jpeg', 'model/gltf-binary'], false, true, 5),
  ('slot_banner_sidebar_top', 'Magnet Details Top-Right Banner', 'magnet_banner', 'Prominently placed above destination insights and itinerary milestones.', null, null, null, 1, array['image/png', 'image/jpeg', 'image/webp'], false, true, 1),
  ('slot_led_tv_main', 'Beside-Fridge Digital LED TV', 'led_display', 'High-definition digital screen ambiently integrated beside the refrigerator.', null, null, null, 5, array['image/png', 'image/jpeg', 'video/mp4'], false, true, 1)
on conflict (id) do update set
  name = excluded.name,
  location_description = excluded.location_description,
  is_active = excluded.is_active;

-- Seed Configurable Subscription Plans
insert into public.advertising_plans (name, placement_id, tier, price_inr_minor, billing_currency, duration_days, creative_slots, inventory_capacity, supported_formats, max_file_size_mb, priority_weight, features, is_active)
values
  (
    'Fridge Shelf Placement — Standard',
    'fridge_product',
    'standard',
    499900, -- ₹ 4,999 / month
    'INR',
    30,
    1,
    1,
    array['image/png', 'image/jpeg', 'model/gltf-binary'],
    15,
    1,
    array['3D Shelf Placement', 'Standard Rotation', 'Basic Analytics', 'Destination URL CTA'],
    true
  ),
  (
    'Featured Shelf Placement — Prime Eyeline',
    'fridge_product',
    'featured',
    899900, -- ₹ 8,999 / month
    'INR',
    30,
    2,
    1,
    array['image/png', 'image/jpeg', 'model/gltf-binary'],
    25,
    2,
    array['Middle Eyeline Shelf Guarantee', '2 Creative Variants', 'Priority Rotation', 'Product Inspection Popover', 'Full Click Analytics'],
    true
  ),
  (
    'Premium 3D Exclusive Fridge Spot',
    'fridge_product',
    'premium',
    1999900, -- ₹ 19,999 / quarter
    'INR',
    90,
    4,
    1,
    array['image/png', 'image/jpeg', 'model/gltf-binary'],
    50,
    5,
    array['Exclusive 90-Day Cavity Presence', 'Interactive Multi-unit Stacking', 'Direct Brand Link & Coupon Code', 'Weekly Performance Reports'],
    true
  ),
  (
    'Magnet Details Standard Banner',
    'magnet_banner',
    'standard',
    299900, -- ₹ 2,999 / month
    'INR',
    30,
    1,
    1,
    array['image/png', 'image/jpeg', 'image/webp'],
    10,
    1,
    array['Top-Right Header Banner', 'Responsive Mobile & Desktop Fit', 'Sponsored Badge', 'Click Tracking'],
    true
  ),
  (
    'Magnet Details Featured Sponsor Banner',
    'magnet_banner',
    'featured',
    599900, -- ₹ 5,999 / month
    'INR',
    30,
    3,
    1,
    array['image/png', 'image/jpeg', 'image/webp'],
    15,
    3,
    array['Featured Sticky Banner Placement', 'Headline & Custom CTA Button', 'A/B Testing Creative Rotation', 'Detailed Demographics Analytics'],
    true
  ),
  (
    'Digital LED Display — Standard Rotation',
    'led_display',
    'standard',
    399900, -- ₹ 3,999 / month
    'INR',
    30,
    2,
    5,
    array['image/png', 'image/jpeg', 'video/mp4'],
    25,
    1,
    array['Digital LED Screen Beside Fridge', 'Looping 10s Creative Slots', 'Image & Silent Video Support', 'Real-time Impressions'],
    true
  ),
  (
    'Digital LED Display — Premium Brand Takeover',
    'led_display',
    'premium',
    1299900, -- ₹ 12,999 / month
    'INR',
    30,
    5,
    2,
    array['image/png', 'image/jpeg', 'video/mp4'],
    60,
    4,
    array['High-Frequency Display Loop (50% airtime)', '15s Video & Dynamic Artwork', 'Custom Ambient Screen Bezel Glow', 'Full Interactive Video Metrics'],
    true
  );
