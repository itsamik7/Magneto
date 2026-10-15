-- ====================================================================
-- Magneto Database Schema Migration: Admin Roles & Fridge Interior Products
-- Version: 1.1.0
-- Tables: user_roles, fridge_products
-- Security: Strict Row Level Security (RLS) with role-based checks
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. USER ROLES TABLE
-- Stores authorized roles (e.g. 'admin', 'super_admin') for users.
-- --------------------------------------------------------------------
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'super_admin')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint user_roles_user_role_key unique (user_id, role)
);

create index if not exists idx_user_roles_user_id on public.user_roles(user_id);
create index if not exists idx_user_roles_role on public.user_roles(role);

alter table public.user_roles enable row level security;

-- Security Definer Function: checks if the current authenticated user is an administrator
create or replace function public.is_admin()
returns boolean as $$
begin
  -- Check user_roles table for 'admin' or 'super_admin' role
  return exists (
    select 1 from public.user_roles
    where user_id = auth.uid()
      and role in ('admin', 'super_admin')
  ) or (
    -- Also allow admin claim in jwt if configured via Supabase custom claims
    coalesce((auth.jwt()->'app_metadata'->>'role'), '') in ('admin', 'super_admin')
  );
end;
$$ language plpgsql security definer;

-- Policies for user_roles
create policy "Admins can view all user roles; users can view their own roles"
  on public.user_roles for select
  using (auth.uid() = user_id or public.is_admin());

create policy "Only existing admins can assign or update user roles"
  on public.user_roles for insert
  with check (public.is_admin());

create policy "Only existing admins can modify user roles"
  on public.user_roles for update
  using (public.is_admin());

create policy "Only existing admins can revoke user roles"
  on public.user_roles for delete
  using (public.is_admin());

-- --------------------------------------------------------------------
-- 2. FRIDGE INTERIOR PRODUCTS TABLE
-- Stores products placed inside the virtual refrigerator cavity & door bins.
-- --------------------------------------------------------------------
create table if not exists public.fridge_products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  image_url text not null,
  description text,
  shelf text not null default 'middle_shelf' check (
    shelf in (
      'freezer',
      'top_shelf',
      'middle_shelf',
      'bottom_shelf',
      'crisper_drawer',
      'door_bin_top',
      'door_bin_middle',
      'door_bin_bottom'
    )
  ),
  position_x numeric not null default 50 check (position_x >= 0 and position_x <= 100),
  display_scale numeric not null default 1.0 check (display_scale >= 0.4 and display_scale <= 2.5),
  quantity text default '1 unit',
  is_active boolean not null default true,
  is_archived boolean not null default false,
  display_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_by uuid references auth.users(id)
);

create index if not exists idx_fridge_products_shelf on public.fridge_products(shelf);
create index if not exists idx_fridge_products_active on public.fridge_products(is_active, is_archived);

alter table public.fridge_products enable row level security;

-- Policies for fridge_products
-- 1. Public and authenticated users can view active, non-archived products
create policy "Public and users can view active fridge products"
  on public.fridge_products for select
  using (
    (is_active = true and is_archived = false) or public.is_admin()
  );

-- 2. Only admins can insert products
create policy "Only admins can insert fridge products"
  on public.fridge_products for insert
  with check (public.is_admin());

-- 3. Only admins can update products
create policy "Only admins can update fridge products"
  on public.fridge_products for update
  using (public.is_admin());

-- 4. Only admins can delete products
create policy "Only admins can delete fridge products"
  on public.fridge_products for delete
  using (public.is_admin());

-- Trigger to keep updated_at current
create trigger trigger_fridge_products_updated_at
  before update on public.fridge_products
  for each row execute procedure public.update_updated_at_column();

-- --------------------------------------------------------------------
-- 3. SEED DEFAULT FRIDGE INTERIOR PRODUCTS
-- Pre-populates realistic groceries on refrigerator shelves and door bins.
-- --------------------------------------------------------------------
insert into public.fridge_products (id, name, category, image_url, description, shelf, position_x, display_scale, quantity, is_active, is_archived, display_order)
values
  ('11111111-1111-1111-1111-111111111101', 'Fresh Whole Milk Carton', 'Dairy', '/assets/products/milk-carton.svg', 'Organic whole milk, pasteurized & fortified with Vitamin D', 'middle_shelf', 22, 1.05, '1 Litre', true, false, 1),
  ('11111111-1111-1111-1111-111111111102', 'Farm Fresh Brown Eggs', 'Dairy', '/assets/products/egg-carton.svg', 'Pasture-raised grade A large brown eggs', 'top_shelf', 26, 0.95, 'Pack of 6', true, false, 2),
  ('11111111-1111-1111-1111-111111111103', 'Sparkling Mineral Water', 'Beverages', '/assets/products/water-bottle.svg', 'Naturally effervescent spring water with mineral electrolytes', 'middle_shelf', 75, 1.0, '2 Bottles', true, false, 3),
  ('11111111-1111-1111-1111-111111111104', 'Pure Squeezed Orange Juice', 'Beverages', '/assets/products/orange-juice.svg', '100% pure squeezed Florida orange juice with pulp', 'bottom_shelf', 28, 1.0, '1 Carafe', true, false, 4),
  ('11111111-1111-1111-1111-111111111105', 'Artisanal Greek Yogurt', 'Dairy', '/assets/products/yogurt-jar.svg', 'Strained whole milk plain Greek yogurt with probiotics', 'top_shelf', 70, 0.9, '500g Jar', true, false, 5),
  ('11111111-1111-1111-1111-111111111106', 'Dijon Mustard & Condiment', 'Condiments', '/assets/products/condiment-jar.svg', 'Authentic French stone-ground Dijon mustard', 'door_bin_middle', 25, 0.9, '250g Jar', true, false, 6),
  ('11111111-1111-1111-1111-111111111107', 'Artisan Strawberry Conserve', 'Condiments', '/assets/products/jam-jar.svg', 'Slow-cooked handpicked wild strawberry preserves', 'door_bin_middle', 75, 0.85, '340g Jar', true, false, 7),
  ('11111111-1111-1111-1111-111111111108', 'Crisper Fresh Citrus Basket', 'Fruits & Vegetables', '/assets/products/citrus-basket.svg', 'Juicy organic lemons, sweet clementines and Valencia oranges', 'crisper_drawer', 30, 1.1, '1.2 kg', true, false, 8),
  ('11111111-1111-1111-1111-111111111109', 'Hydroponic Salad Greens', 'Fruits & Vegetables', '/assets/products/green-lettuce.svg', 'Crisp romaine and butterhead salad greens', 'crisper_drawer', 72, 1.05, '1 Head', true, false, 9),
  ('11111111-1111-1111-1111-111111111110', 'Glass Meal Prep Container', 'Prepared Meals', '/assets/products/meal-container.svg', 'Grilled chicken, roasted asparagus, and quinoa in airtight borosilicate container', 'bottom_shelf', 72, 1.0, '1 Container', true, false, 10),
  ('11111111-1111-1111-1111-111111111111', 'Artisan Gelato Ice Cream Pint', 'Freezer', '/assets/products/ice-cream.svg', 'Madagascar vanilla bean and salted caramel gelato', 'freezer', 50, 1.0, '1 Pint', true, false, 11),
  ('11111111-1111-1111-1111-111111111112', 'Chilled Sparkling Champagne', 'Beverages', '/assets/products/champagne-bottle.svg', 'Brut vintage reserve champagne chilled for celebrations', 'door_bin_bottom', 50, 1.15, '750 ml', true, false, 12)
on conflict (id) do nothing;
