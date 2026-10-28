-- ====================================================================
-- Magneto Database Schema Migration: Super Admin Control Centre
-- Version: 4.0.0
-- Tables:
--   1. platform_settings
--   2. audit_logs
--   3. support_tickets
--   4. admin_roles_directory
-- Alterations:
--   - merchant_profiles (account_status, suspension_reason, admin_notes, custom_discount_percentage)
--   - advertising_campaigns (is_globally_paused, priority_weight, budget_limit_minor, internal_notes)
--   - profiles (account_status, support_notes)
-- Security: Strict Row Level Security (RLS) with is_admin() checks
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. PLATFORM SETTINGS TABLE
-- --------------------------------------------------------------------
create table if not exists public.platform_settings (
  id text primary key default 'primary',
  global_advertising_enabled boolean not null default true,
  merchant_auto_approval boolean not null default false,
  ad_moderation_required boolean not null default true,
  default_currency text not null default 'INR',
  default_tax_rate numeric not null default 18.0,
  max_campaign_duration_days integer not null default 365,
  max_creative_file_size_mb integer not null default 50,
  platform_maintenance_mode boolean not null default false,
  disabled_placements text[] not null default array[]::text[],
  paused_merchant_ids text[] not null default array[]::text[],
  feature_flags jsonb not null default '{
    "enable_3d_fridge_ads": true,
    "enable_led_video_ads": true,
    "enable_coupon_codes": true,
    "allow_custom_plans": true
  }'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_by uuid references auth.users(id)
);

alter table public.platform_settings enable row level security;

-- Public/merchants can read basic platform settings (e.g. is ad enabled, maintenance)
create policy "Anyone can read platform settings"
  on public.platform_settings for select
  using (true);

-- Only administrators can modify platform settings
create policy "Only admins can update platform settings"
  on public.platform_settings for all
  using (public.is_admin());

-- Seed primary settings record if not exists
insert into public.platform_settings (id, global_advertising_enabled, merchant_auto_approval, ad_moderation_required)
values ('primary', true, false, true)
on conflict (id) do nothing;

-- --------------------------------------------------------------------
-- 2. AUDIT LOGS TABLE (Append-Only)
-- --------------------------------------------------------------------
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id),
  actor_email text not null,
  actor_role text not null default 'admin',
  action text not null,
  entity_type text not null check (
    entity_type in (
      'advertisement',
      'merchant',
      'user',
      'subscription_plan',
      'placement',
      'platform_settings',
      'support_session',
      'payment_refund',
      'role_permission',
      'system'
    )
  ),
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  before_state jsonb,
  after_state jsonb,
  ip_address text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_audit_logs_actor on public.audit_logs(actor_email);
create index if not exists idx_audit_logs_entity on public.audit_logs(entity_type, entity_id);
create index if not exists idx_audit_logs_created on public.audit_logs(created_at desc);

alter table public.audit_logs enable row level security;

-- Only admins can read audit logs
create policy "Only admins can view audit logs"
  on public.audit_logs for select
  using (public.is_admin());

-- Admins and system can insert audit logs
create policy "Admins can insert audit logs"
  on public.audit_logs for insert
  with check (public.is_admin());

-- --------------------------------------------------------------------
-- 3. SUPPORT TICKETS & MODERATION REPORTS
-- --------------------------------------------------------------------
create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  merchant_id uuid references public.merchant_profiles(id) on delete set null,
  ticket_type text not null check (
    ticket_type in ('report_abuse', 'billing_issue', 'account_recovery', 'moderation_review', 'general')
  ),
  subject text not null,
  description text not null,
  status text not null default 'open' check (
    status in ('open', 'in_progress', 'resolved', 'closed')
  ),
  priority text not null default 'medium' check (
    priority in ('low', 'medium', 'high', 'urgent')
  ),
  internal_notes text,
  assigned_to uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_support_tickets_status on public.support_tickets(status);
create index if not exists idx_support_tickets_user on public.support_tickets(user_id);
create index if not exists idx_support_tickets_merchant on public.support_tickets(merchant_id);

alter table public.support_tickets enable row level security;

create policy "Users and merchants can view their own tickets; admins view all"
  on public.support_tickets for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.merchant_profiles m
      where m.id = support_tickets.merchant_id and m.user_id = auth.uid()
    )
    or public.is_admin()
  );

create policy "Users and merchants can create tickets"
  on public.support_tickets for insert
  with check (auth.uid() is not null or public.is_admin());

create policy "Admins can update tickets"
  on public.support_tickets for update
  using (public.is_admin());

-- --------------------------------------------------------------------
-- 4. EXTEND EXISTING TABLES SAFELY
-- --------------------------------------------------------------------

-- Extend merchant_profiles
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'merchant_profiles' and column_name = 'account_status') then
    alter table public.merchant_profiles add column account_status text not null default 'active' check (account_status in ('active', 'suspended', 'restricted'));
  end if;

  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'merchant_profiles' and column_name = 'suspension_reason') then
    alter table public.merchant_profiles add column suspension_reason text;
  end if;

  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'merchant_profiles' and column_name = 'admin_notes') then
    alter table public.merchant_profiles add column admin_notes text;
  end if;

  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'merchant_profiles' and column_name = 'custom_discount_percentage') then
    alter table public.merchant_profiles add column custom_discount_percentage numeric default 0;
  end if;
end $$;

-- Extend advertising_campaigns
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'advertising_campaigns' and column_name = 'is_globally_paused') then
    alter table public.advertising_campaigns add column is_globally_paused boolean not null default false;
  end if;

  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'advertising_campaigns' and column_name = 'priority_weight') then
    alter table public.advertising_campaigns add column priority_weight integer not null default 1;
  end if;

  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'advertising_campaigns' and column_name = 'budget_limit_minor') then
    alter table public.advertising_campaigns add column budget_limit_minor bigint;
  end if;

  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'advertising_campaigns' and column_name = 'internal_notes') then
    alter table public.advertising_campaigns add column internal_notes text;
  end if;
end $$;

-- Extend profiles
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'account_status') then
    alter table public.profiles add column account_status text not null default 'active' check (account_status in ('active', 'suspended', 'restricted'));
  end if;

  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'support_notes') then
    alter table public.profiles add column support_notes text;
  end if;
end $$;
