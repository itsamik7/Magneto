-- ====================================================================
-- Magneto Database Schema Migration: Global Destination Catalog & Magnets
-- Version: 2.0.0
-- Tables: countries, destinations, magnet_assets, user_magnets
-- Includes full seed data for 100 world-class travel destinations
-- ====================================================================


-- 1. COUNTRIES TABLE
create table if not exists public.countries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country_code text unique not null,
  continent text not null,
  flag_emoji text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_countries_continent on public.countries(continent);
create index if not exists idx_countries_country_code on public.countries(country_code);
alter table public.countries enable row level security;

drop policy if exists "Allow public read access on countries" on public.countries;
create policy "Allow public read access on countries"
  on public.countries for select using (true);

-- 2. DESTINATIONS TABLE
create table if not exists public.destinations (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  country_id uuid not null references public.countries(id) on delete cascade,
  city text,
  region text,
  continent text not null,
  destination_type text not null,
  short_description text,
  landmark_names text[] default array[]::text[],
  tags text[] default array[]::text[],
  popularity_score integer default 0,
  is_featured boolean default false,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_destinations_slug on public.destinations(slug);
create index if not exists idx_destinations_country_id on public.destinations(country_id);
create index if not exists idx_destinations_continent on public.destinations(continent);
create index if not exists idx_destinations_type on public.destinations(destination_type);
create index if not exists idx_destinations_is_featured on public.destinations(is_featured);
create index if not exists idx_destinations_popularity on public.destinations(popularity_score desc);
alter table public.destinations enable row level security;

drop policy if exists "Allow public read access on destinations" on public.destinations;
create policy "Allow public read access on destinations"
  on public.destinations for select using (is_active = true);

-- 3. MAGNET_ASSETS TABLE
create table if not exists public.magnet_assets (
  id uuid primary key default gen_random_uuid(),
  destination_id uuid not null references public.destinations(id) on delete cascade,
  asset_url text not null,
  thumbnail_url text,
  asset_format text default 'svg',
  background_type text default 'transparent',
  magnet_shape text default 'die-cut',
  artwork_style text default 'enamel-souvenir',
  dominant_colors text[] default array[]::text[],
  generation_status text default 'ready',
  is_primary boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_magnet_assets_destination_id on public.magnet_assets(destination_id);
create index if not exists idx_magnet_assets_is_primary on public.magnet_assets(is_primary);
alter table public.magnet_assets enable row level security;

drop policy if exists "Allow public read access on magnet_assets" on public.magnet_assets;
create policy "Allow public read access on magnet_assets"
  on public.magnet_assets for select using (true);

-- 4. USER_MAGNETS TABLE
create table if not exists public.user_magnets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  destination_id uuid not null references public.destinations(id) on delete cascade,
  magnet_asset_id uuid not null references public.magnet_assets(id) on delete cascade,
  trip_id uuid references public.trips(id) on delete set null,
  acquired_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint uq_user_destination unique (user_id, destination_id)
);

create index if not exists idx_user_magnets_user_id on public.user_magnets(user_id);
create index if not exists idx_user_magnets_destination_id on public.user_magnets(destination_id);
create index if not exists idx_user_magnets_trip_id on public.user_magnets(trip_id);
alter table public.user_magnets enable row level security;

drop policy if exists "Users can view their own magnets" on public.user_magnets;
create policy "Users can view their own magnets"
  on public.user_magnets for select using (auth.uid() = user_id);

drop policy if exists "Users can collect magnets for their fridge" on public.user_magnets;
create policy "Users can collect magnets for their fridge"
  on public.user_magnets for insert with check (auth.uid() = user_id);

drop policy if exists "Users can remove magnets from their fridge" on public.user_magnets;
create policy "Users can remove magnets from their fridge"
  on public.user_magnets for delete using (auth.uid() = user_id);


-- --------------------------------------------------------------------
-- SEED COUNTRIES
-- --------------------------------------------------------------------
insert into public.countries (name, country_code, continent, flag_emoji)
values ('India', 'IN', 'Asia', '🇮🇳')
on conflict (country_code) do update set name = excluded.name, flag_emoji = excluded.flag_emoji;
insert into public.countries (name, country_code, continent, flag_emoji)
values ('France', 'FR', 'Europe', '🇫🇷')
on conflict (country_code) do update set name = excluded.name, flag_emoji = excluded.flag_emoji;
insert into public.countries (name, country_code, continent, flag_emoji)
values ('United Kingdom', 'GB', 'Europe', '🇬🇧')
on conflict (country_code) do update set name = excluded.name, flag_emoji = excluded.flag_emoji;
insert into public.countries (name, country_code, continent, flag_emoji)
values ('Switzerland', 'CH', 'Europe', '🇨🇭')
on conflict (country_code) do update set name = excluded.name, flag_emoji = excluded.flag_emoji;
insert into public.countries (name, country_code, continent, flag_emoji)
values ('Italy', 'IT', 'Europe', '🇮🇹')
on conflict (country_code) do update set name = excluded.name, flag_emoji = excluded.flag_emoji;
insert into public.countries (name, country_code, continent, flag_emoji)
values ('Greece', 'GR', 'Europe', '🇬🇷')
on conflict (country_code) do update set name = excluded.name, flag_emoji = excluded.flag_emoji;
insert into public.countries (name, country_code, continent, flag_emoji)
values ('Spain', 'ES', 'Europe', '🇪🇸')
on conflict (country_code) do update set name = excluded.name, flag_emoji = excluded.flag_emoji;
insert into public.countries (name, country_code, continent, flag_emoji)
values ('Netherlands', 'NL', 'Europe', '🇳🇱')
on conflict (country_code) do update set name = excluded.name, flag_emoji = excluded.flag_emoji;
insert into public.countries (name, country_code, continent, flag_emoji)
values ('Czech Republic', 'CZ', 'Europe', '🇨🇿')
on conflict (country_code) do update set name = excluded.name, flag_emoji = excluded.flag_emoji;
insert into public.countries (name, country_code, continent, flag_emoji)
values ('Austria', 'AT', 'Europe', '🇦🇹')
on conflict (country_code) do update set name = excluded.name, flag_emoji = excluded.flag_emoji;
insert into public.countries (name, country_code, continent, flag_emoji)
values ('Iceland', 'IS', 'Europe', '🇮🇸')
on conflict (country_code) do update set name = excluded.name, flag_emoji = excluded.flag_emoji;
insert into public.countries (name, country_code, continent, flag_emoji)
values ('Croatia', 'HR', 'Europe', '🇭🇷')
on conflict (country_code) do update set name = excluded.name, flag_emoji = excluded.flag_emoji;
insert into public.countries (name, country_code, continent, flag_emoji)
values ('Ireland', 'IE', 'Europe', '🇮🇪')
on conflict (country_code) do update set name = excluded.name, flag_emoji = excluded.flag_emoji;
insert into public.countries (name, country_code, continent, flag_emoji)
values ('Portugal', 'PT', 'Europe', '🇵🇹')
on conflict (country_code) do update set name = excluded.name, flag_emoji = excluded.flag_emoji;
insert into public.countries (name, country_code, continent, flag_emoji)
values ('Germany', 'DE', 'Europe', '🇩🇪')
on conflict (country_code) do update set name = excluded.name, flag_emoji = excluded.flag_emoji;
insert into public.countries (name, country_code, continent, flag_emoji)
values ('Hungary', 'HU', 'Europe', '🇭🇺')
on conflict (country_code) do update set name = excluded.name, flag_emoji = excluded.flag_emoji;
insert into public.countries (name, country_code, continent, flag_emoji)
values ('Japan', 'JP', 'Asia', '🇯🇵')
on conflict (country_code) do update set name = excluded.name, flag_emoji = excluded.flag_emoji;
insert into public.countries (name, country_code, continent, flag_emoji)
values ('Indonesia', 'ID', 'Asia', '🇮🇩')
on conflict (country_code) do update set name = excluded.name, flag_emoji = excluded.flag_emoji;
insert into public.countries (name, country_code, continent, flag_emoji)
values ('Singapore', 'SG', 'Asia', '🇸🇬')
on conflict (country_code) do update set name = excluded.name, flag_emoji = excluded.flag_emoji;
insert into public.countries (name, country_code, continent, flag_emoji)
values ('Thailand', 'TH', 'Asia', '🇹🇭')
on conflict (country_code) do update set name = excluded.name, flag_emoji = excluded.flag_emoji;
insert into public.countries (name, country_code, continent, flag_emoji)
values ('South Korea', 'KR', 'Asia', '🇰🇷')
on conflict (country_code) do update set name = excluded.name, flag_emoji = excluded.flag_emoji;
insert into public.countries (name, country_code, continent, flag_emoji)
values ('United Arab Emirates', 'AE', 'Asia', '🇦🇪')
on conflict (country_code) do update set name = excluded.name, flag_emoji = excluded.flag_emoji;
insert into public.countries (name, country_code, continent, flag_emoji)
values ('Vietnam', 'VN', 'Asia', '🇻🇳')
on conflict (country_code) do update set name = excluded.name, flag_emoji = excluded.flag_emoji;
insert into public.countries (name, country_code, continent, flag_emoji)
values ('Cambodia', 'KH', 'Asia', '🇰🇭')
on conflict (country_code) do update set name = excluded.name, flag_emoji = excluded.flag_emoji;
insert into public.countries (name, country_code, continent, flag_emoji)
values ('Jordan', 'JO', 'Asia', '🇯🇴')
on conflict (country_code) do update set name = excluded.name, flag_emoji = excluded.flag_emoji;
insert into public.countries (name, country_code, continent, flag_emoji)
values ('Turkey', 'TR', 'Asia', '🇹🇷')
on conflict (country_code) do update set name = excluded.name, flag_emoji = excluded.flag_emoji;
insert into public.countries (name, country_code, continent, flag_emoji)
values ('Maldives', 'MV', 'Asia', '🇲🇻')
on conflict (country_code) do update set name = excluded.name, flag_emoji = excluded.flag_emoji;
insert into public.countries (name, country_code, continent, flag_emoji)
values ('China', 'CN', 'Asia', '🇨🇳')
on conflict (country_code) do update set name = excluded.name, flag_emoji = excluded.flag_emoji;
insert into public.countries (name, country_code, continent, flag_emoji)
values ('Hong Kong', 'HK', 'Asia', '🇭🇰')
on conflict (country_code) do update set name = excluded.name, flag_emoji = excluded.flag_emoji;
insert into public.countries (name, country_code, continent, flag_emoji)
values ('Taiwan', 'TW', 'Asia', '🇹🇼')
on conflict (country_code) do update set name = excluded.name, flag_emoji = excluded.flag_emoji;
insert into public.countries (name, country_code, continent, flag_emoji)
values ('Laos', 'LA', 'Asia', '🇱🇦')
on conflict (country_code) do update set name = excluded.name, flag_emoji = excluded.flag_emoji;
insert into public.countries (name, country_code, continent, flag_emoji)
values ('Nepal', 'NP', 'Asia', '🇳🇵')
on conflict (country_code) do update set name = excluded.name, flag_emoji = excluded.flag_emoji;
insert into public.countries (name, country_code, continent, flag_emoji)
values ('Philippines', 'PH', 'Asia', '🇵🇭')
on conflict (country_code) do update set name = excluded.name, flag_emoji = excluded.flag_emoji;
insert into public.countries (name, country_code, continent, flag_emoji)
values ('United States', 'US', 'Americas', '🇺🇸')
on conflict (country_code) do update set name = excluded.name, flag_emoji = excluded.flag_emoji;
insert into public.countries (name, country_code, continent, flag_emoji)
values ('Canada', 'CA', 'Americas', '🇨🇦')
on conflict (country_code) do update set name = excluded.name, flag_emoji = excluded.flag_emoji;
insert into public.countries (name, country_code, continent, flag_emoji)
values ('Peru', 'PE', 'Americas', '🇵🇪')
on conflict (country_code) do update set name = excluded.name, flag_emoji = excluded.flag_emoji;
insert into public.countries (name, country_code, continent, flag_emoji)
values ('Brazil', 'BR', 'Americas', '🇧🇷')
on conflict (country_code) do update set name = excluded.name, flag_emoji = excluded.flag_emoji;
insert into public.countries (name, country_code, continent, flag_emoji)
values ('Mexico', 'MX', 'Americas', '🇲🇽')
on conflict (country_code) do update set name = excluded.name, flag_emoji = excluded.flag_emoji;
insert into public.countries (name, country_code, continent, flag_emoji)
values ('Argentina', 'AR', 'Americas', '🇦🇷')
on conflict (country_code) do update set name = excluded.name, flag_emoji = excluded.flag_emoji;
insert into public.countries (name, country_code, continent, flag_emoji)
values ('Cuba', 'CU', 'Americas', '🇨🇺')
on conflict (country_code) do update set name = excluded.name, flag_emoji = excluded.flag_emoji;
insert into public.countries (name, country_code, continent, flag_emoji)
values ('Ecuador', 'EC', 'Americas', '🇪🇨')
on conflict (country_code) do update set name = excluded.name, flag_emoji = excluded.flag_emoji;
insert into public.countries (name, country_code, continent, flag_emoji)
values ('Egypt', 'EG', 'Africa', '🇪🇬')
on conflict (country_code) do update set name = excluded.name, flag_emoji = excluded.flag_emoji;
insert into public.countries (name, country_code, continent, flag_emoji)
values ('South Africa', 'ZA', 'Africa', '🇿🇦')
on conflict (country_code) do update set name = excluded.name, flag_emoji = excluded.flag_emoji;
insert into public.countries (name, country_code, continent, flag_emoji)
values ('Tanzania', 'TZ', 'Africa', '🇹🇿')
on conflict (country_code) do update set name = excluded.name, flag_emoji = excluded.flag_emoji;
insert into public.countries (name, country_code, continent, flag_emoji)
values ('Morocco', 'MA', 'Africa', '🇲🇦')
on conflict (country_code) do update set name = excluded.name, flag_emoji = excluded.flag_emoji;
insert into public.countries (name, country_code, continent, flag_emoji)
values ('Zimbabwe', 'ZW', 'Africa', '🇿🇼')
on conflict (country_code) do update set name = excluded.name, flag_emoji = excluded.flag_emoji;
insert into public.countries (name, country_code, continent, flag_emoji)
values ('Mauritius', 'MU', 'Africa', '🇲🇺')
on conflict (country_code) do update set name = excluded.name, flag_emoji = excluded.flag_emoji;
insert into public.countries (name, country_code, continent, flag_emoji)
values ('Kenya', 'KE', 'Africa', '🇰🇪')
on conflict (country_code) do update set name = excluded.name, flag_emoji = excluded.flag_emoji;
insert into public.countries (name, country_code, continent, flag_emoji)
values ('Australia', 'AU', 'Oceania', '🇦🇺')
on conflict (country_code) do update set name = excluded.name, flag_emoji = excluded.flag_emoji;
insert into public.countries (name, country_code, continent, flag_emoji)
values ('New Zealand', 'NZ', 'Oceania', '🇳🇿')
on conflict (country_code) do update set name = excluded.name, flag_emoji = excluded.flag_emoji;
insert into public.countries (name, country_code, continent, flag_emoji)
values ('Fiji', 'FJ', 'Oceania', '🇫🇯')
on conflict (country_code) do update set name = excluded.name, flag_emoji = excluded.flag_emoji;
insert into public.countries (name, country_code, continent, flag_emoji)
values ('French Polynesia', 'PF', 'Oceania', '🇵🇫')
on conflict (country_code) do update set name = excluded.name, flag_emoji = excluded.flag_emoji;
insert into public.countries (name, country_code, continent, flag_emoji)
values ('Cook Islands', 'CK', 'Oceania', '🇨🇰')
on conflict (country_code) do update set name = excluded.name, flag_emoji = excluded.flag_emoji;

-- --------------------------------------------------------------------
-- SEED 100 DESTINATIONS AND MAGNET ASSETS
-- --------------------------------------------------------------------

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'IN';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'taj-mahal', 'Taj Mahal, Agra', cid, 'Agra', 'Uttar Pradesh', 'Asia', 'Historical Site',
    'The ivory-white marble mausoleum of eternal love on the south bank of the Yamuna river.', array['Taj Mahal Dome', 'Yamuna Reflection Pool', 'Agra Fort', 'Chhatri Minarets']::text[], array['UNESCO', 'Romance', 'Architecture', 'Wonder of the World']::text[], 99, true
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/taj-mahal.svg', 'svg', 'arch', array['#FFFDF8', '#E0A96D', '#703030', '#3D2C8D']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'IN';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'jaipur', 'Jaipur, Rajasthan', cid, 'Jaipur', 'Rajasthan', 'Asia', 'Cultural Heritage',
    'The vibrant Pink City known for honeycomb facades, royal hill forts, and starry observatories.', array['Hawa Mahal', 'Amer Fort', 'City Palace', 'Jantar Mantar']::text[], array['Heritage', 'Forts', 'Palaces', 'Culture']::text[], 94, true
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/jaipur.svg', 'svg', 'shield', array['#E86A58', '#FCD34D', '#831843', '#FEF3C7']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'IN';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'varanasi', 'Varanasi Ghats', cid, 'Varanasi', 'Uttar Pradesh', 'Asia', 'Religious Destination',
    'The spiritual capital of India on the sacred Ganges, where thousands gather for sunrise aarti.', array['Dashashwamedh Ghat', 'Kashi Vishwanath', 'Assi Ghat', 'Ganga Aarti']::text[], array['Spiritual', 'River', 'Ancient', 'Culture']::text[], 91, false
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/varanasi.svg', 'svg', 'arch', array['#F59E0B', '#DC2626', '#1E3A8A', '#FEF08A']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'IN';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'goa', 'Goa Golden Beaches', cid, 'Panaji', 'Goa', 'Asia', 'Beach',
    'Sun-drenched Arabian coast fringed with leaning coconut palms, Portuguese churches, and surf.', array['Palolem Beach', 'Fort Aguada', 'Basilica of Bom Jesus', 'Anjuna Coast']::text[], array['Beach', 'Nightlife', 'Seafood', 'Sun']::text[], 96, true
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/goa.svg', 'svg', 'organic', array['#0EA5E9', '#FBBF24', '#059669', '#EA580C']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'IN';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'kerala-backwaters', 'Kerala Backwaters', cid, 'Alleppey', 'Kerala', 'Asia', 'Scenic Region',
    'A tranquil labyrinth of emerald palm-lined canals navigated by traditional thatched kettuvallam houseboats.', array['Vembanad Lake', 'Alleppey Houseboats', 'Kumarakom', 'Chinese Fishing Nets']::text[], array['Nature', 'Backwaters', 'Ayurveda', 'Serene']::text[], 93, true
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/kerala-backwaters.svg', 'svg', 'landscape', array['#10B981', '#047857', '#F59E0B', '#0284C7']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'IN';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'munnar', 'Munnar Tea Hills', cid, 'Munnar', 'Kerala', 'Asia', 'Mountain',
    'Rolling carpeted tea plantations shrouded in morning mist and high Western Ghats peaks.', array['Anamudi Peak', 'Mattupetty Dam', 'Kolukkumalai Tea Estate', 'Eravikulam']::text[], array['Tea', 'Misty Hills', 'Trekking', 'Wildlife']::text[], 89, false
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/munnar.svg', 'svg', 'organic', array['#059669', '#34D399', '#1E293B', '#A7F3D0']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'IN';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'ladakh', 'Ladakh & Pangong Tso', cid, 'Leh', 'Ladakh', 'Asia', 'Adventure',
    'The high-altitude cold desert with shifting sapphire lakes, Buddhist gompas, and snowbound passes.', array['Pangong Tso Lake', 'Khardung La Pass', 'Thiksey Monastery', 'Nubra Valley']::text[], array['Himalayas', 'Biking', 'Monastery', 'Lake']::text[], 95, true
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/ladakh.svg', 'svg', 'shield', array['#1D4ED8', '#F59E0B', '#B45309', '#E0F2FE']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'IN';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'udaipur', 'Udaipur Lake City', cid, 'Udaipur', 'Rajasthan', 'Asia', 'Cultural Heritage',
    'The City of Lakes with ornate marble palaces reflected on the shimmering waters of Lake Pichola.', array['Lake Palace', 'City Palace Udaipur', 'Jag Mandir', 'Saheliyon-ki-Bari']::text[], array['Royalty', 'Romance', 'Palace', 'Lake']::text[], 92, false
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/udaipur.svg', 'svg', 'arch', array['#38BDF8', '#F43F5E', '#E2E8F0', '#312E81']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'IN';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'rishikesh', 'Rishikesh Yoga Capital', cid, 'Rishikesh', 'Uttarakhand', 'Asia', 'Adventure',
    'Suspension bridges over emerald rapids where Himalayan serenity meets river rafting and yoga.', array['Laxman Jhula', 'Ram Jhula', 'Triveni Ghat', 'Beatles Ashram']::text[], array['Yoga', 'Rafting', 'Himalayas', 'Ganges']::text[], 88, false
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/rishikesh.svg', 'svg', 'landscape', array['#0D9488', '#F97316', '#047857', '#CCFBF1']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'IN';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'darjeeling', 'Darjeeling Toy Train', cid, 'Darjeeling', 'West Bengal', 'Asia', 'Mountain',
    'Colonial hill station famous for narrow-gauge steam trains, muscatel tea, and Kanchenjunga panoramas.', array['Himalayan Railway Toy Train', 'Tiger Hill', 'Batasia Loop', 'Happy Valley Tea']::text[], array['Tea', 'Steam Train', 'Kanchenjunga', 'Himalayas']::text[], 87, false
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/darjeeling.svg', 'svg', 'arch', array['#1E3A8A', '#059669', '#D97706', '#DBEAFE']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'IN';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'hampi', 'Hampi Boulder Ruins', cid, 'Hampi', 'Karnataka', 'Asia', 'Historical Site',
    'A surreal moonscape of granite boulders concealing the glorious stone ruins of the Vijayanagara Empire.', array['Vittala Stone Chariot', 'Virupaksha Temple', 'Lotus Mahal', 'Tungabhadra River']::text[], array['UNESCO', 'Ruins', 'Ancient', 'Boulders']::text[], 90, false
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/hampi.svg', 'svg', 'shield', array['#D97706', '#78350F', '#0284C7', '#FEF3C7']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'IN';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'manali', 'Manali Snow Valley', cid, 'Manali', 'Himachal Pradesh', 'Asia', 'Mountain',
    'Snow-capped Himalayan playground nestled among towering deodar cedar forests and rushing rivers.', array['Solang Valley', 'Rohtang Pass', 'Hadimba Temple', 'Atal Tunnel']::text[], array['Snow', 'Skiing', 'Himalayas', 'Adventure']::text[], 92, false
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/manali.svg', 'svg', 'die-cut', array['#0284C7', '#065F46', '#E2E8F0', '#38BDF8']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'IN';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'amritsar', 'Amritsar Golden Temple', cid, 'Amritsar', 'Punjab', 'Asia', 'Religious Destination',
    'The sacred sanctum of Sikhism with its gleaming gilded sanctuary floating on the holy Amrit Sarovar.', array['Harmandir Sahib', 'Akal Takht', 'Jallianwala Bagh', 'Wagah Border']::text[], array['Spiritual', 'Gold', 'Sanctuary', 'Culture']::text[], 94, false
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/amritsar.svg', 'svg', 'arch', array['#F59E0B', '#B45309', '#0284C7', '#FEF08A']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'IN';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'meghalaya', 'Meghalaya Living Bridges', cid, 'Cherrapunji', 'Meghalaya', 'Asia', 'Natural Wonder',
    'The abode of clouds renowned for living ficus root bridges, towering plunge waterfalls, and deep caves.', array['Double Decker Root Bridge', 'Nohkalikai Falls', 'Dawki River', 'Mawsynram']::text[], array['Living Bridges', 'Rainforest', 'Waterfalls', 'Nature']::text[], 89, false
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/meghalaya.svg', 'svg', 'organic', array['#047857', '#065F46', '#38BDF8', '#A7F3D0']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'IN';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'andaman', 'Andaman & Havelock', cid, 'Port Blair', 'Andaman & Nicobar Islands', 'Asia', 'Island',
    'Turquoise tropical paradise with powder-white sands, coral reefs, and primeval rainforest.', array['Radhanagar Beach', 'Elephant Beach', 'Cellular Jail', 'Neil Island']::text[], array['Island', 'Scuba', 'Beaches', 'Coral']::text[], 91, false
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/andaman.svg', 'svg', 'organic', array['#0284C7', '#0D9488', '#FDE047', '#E0F2FE']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'IN';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'jodhpur', 'Jodhpur Blue City', cid, 'Jodhpur', 'Rajasthan', 'Asia', 'Cultural Heritage',
    'Indigo-painted houses sprawling beneath the towering ramparts of Mehrangarh Fort on a sheer cliff.', array['Mehrangarh Fort', 'Jaswant Thada', 'Umaid Bhawan Palace', 'Clock Tower']::text[], array['Blue City', 'Fort', 'Desert', 'Heritage']::text[], 90, false
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/jodhpur.svg', 'svg', 'die-cut', array['#2563EB', '#1D4ED8', '#D97706', '#DBEAFE']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'IN';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'mysore', 'Mysore Royal Palace', cid, 'Mysuru', 'Karnataka', 'Asia', 'Historical Site',
    'The opulent seat of the Wodeyars featuring Indo-Saracenic grandeur illuminated by 100,000 bulbs.', array['Mysore Palace', 'Chamundi Hill', 'Brindavan Gardens', 'Devaraja Market']::text[], array['Palace', 'Silk', 'Sandalwood', 'Illuminations']::text[], 86, false
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/mysore.svg', 'svg', 'arch', array['#EAB308', '#B45309', '#4338CA', '#FEF08A']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'IN';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'pondicherry', 'Pondicherry French Quarter', cid, 'Puducherry', 'Puducherry', 'Asia', 'Beach',
    'Pastel mustard colonial villas with bougainvillea arches along the Bay of Bengal promenade.', array['Promenade Beach', 'White Town', 'Auroville', 'Sri Aurobindo Ashram']::text[], array['French Quarter', 'Colonial', 'Coastal', 'Peace']::text[], 88, false
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/pondicherry.svg', 'svg', 'arch', array['#EAB308', '#0284C7', '#BE185D', '#FEF9C3']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'IN';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'rann-of-kutch', 'Rann of Kutch', cid, 'Dhordo', 'Gujarat', 'Asia', 'Natural Wonder',
    'An endless glistening white salt desert bathed in silvery moonlight and colourful folk handicraft.', array['White Rann', 'Kala Dungar', 'Rann Utsav Camp', 'Dholavira']::text[], array['Salt Desert', 'Moonlight', 'Folk Art', 'Unique']::text[], 89, false
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/rann-of-kutch.svg', 'svg', 'landscape', array['#F8FAFC', '#475569', '#EA580C', '#9333EA']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'IN';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'ooty', 'Ooty Nilgiri Hills', cid, 'Ooty', 'Tamil Nadu', 'Asia', 'Mountain',
    'Queen of Hill Stations with eucalyptus-scented forests, botanical gardens, and blue mountain railways.', array['Nilgiri Mountain Railway', 'Doddabetta Peak', 'Ooty Lake', 'Pykara Falls']::text[], array['Blue Mountains', 'Eucalyptus', 'Lake', 'Colonial']::text[], 85, false
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/ooty.svg', 'svg', 'organic', array['#15803D', '#0284C7', '#A16207', '#DCFCE7']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'FR';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'paris', 'Paris, France', cid, 'Paris', 'Île-de-France', 'Europe', 'City',
    'The City of Light with the romantic Eiffel Tower, Haussmann boulevards, and Seine sunsets.', array['Eiffel Tower', 'Louvre Museum', 'Notre-Dame', 'Arc de Triomphe']::text[], array['Romance', 'Art', 'Cuisine', 'Architecture']::text[], 100, true
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/paris.png', 'png', 'arch', array['#E98267', '#243447', '#FBBF24', '#FEF3C7']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'GB';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'london', 'London, UK', cid, 'London', 'Greater London', 'Europe', 'City',
    'A historic metropolis combining Big Ben, red double-decker buses, telephone boxes, and royal landmarks.', array['Big Ben', 'Tower Bridge', 'Buckingham Palace', 'London Eye']::text[], array['History', 'Royalty', 'Icons', 'Culture']::text[], 98, true
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/london.png', 'png', 'die-cut', array['#DC2626', '#1E3A8A', '#D97706', '#F3F4F6']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'CH';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'switzerland', 'Swiss Alps, Switzerland', cid, 'Interlaken', 'Bernese Oberland', 'Europe', 'Mountain',
    'Dramatic snow-covered Alpine peaks, crystal turquoise glacial lakes, and traditional wooden chalets.', array['Matterhorn', 'Jungfraujoch', 'Lake Geneva', 'Eiger']::text[], array['Alps', 'Snow', 'Lakes', 'Scenic']::text[], 97, true
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/switzerland.png', 'png', 'organic', array['#0284C7', '#065F46', '#E11D48', '#FFFFFF']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'IT';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'rome', 'Rome Colosseum', cid, 'Rome', 'Lazio', 'Europe', 'Historical Site',
    'The Eternal City displaying the ancient Colosseum, Roman Forum, and glorious baroque fountains.', array['Colosseum', 'Trevi Fountain', 'Pantheon', 'Vatican City']::text[], array['Ancient', 'History', 'Gelato', 'Architecture']::text[], 97, true
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/rome.svg', 'svg', 'arch', array['#D97706', '#78350F', '#2563EB', '#FEF3C7']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'IT';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'venice', 'Venice Canals', cid, 'Venice', 'Veneto', 'Europe', 'City',
    'Floating city of marble palaces, romantic gondolas, and arched bridges over the Grand Canal.', array['Rialto Bridge', 'St. Mark''s Basilica', 'Grand Canal', 'Bridge of Sighs']::text[], array['Canals', 'Gondola', 'Romance', 'Palaces']::text[], 95, false
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/venice.svg', 'svg', 'landscape', array['#0284C7', '#EA580C', '#D97706', '#E0F2FE']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'GR';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'santorini', 'Santorini Caldera', cid, 'Oia', 'South Aegean', 'Europe', 'Island',
    'Whitewashed cubist houses with cobalt-blue domes perched on cliffs over the Aegean caldera.', array['Oia Blue Domes', 'Amoudi Bay', 'Akrotiri', 'Red Beach']::text[], array['Sunsets', 'Blue Domes', 'Aegean', 'Island']::text[], 96, true
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/santorini.svg', 'svg', 'circle', array['#1D4ED8', '#FFFFFF', '#F59E0B', '#DBEAFE']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'ES';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'barcelona', 'Barcelona & Gaudí', cid, 'Barcelona', 'Catalonia', 'Europe', 'City',
    'Mediterranean artistic city crowned by Gaudí''s fantastical Sagrada Família and vibrant mosaic parks.', array['Sagrada Família', 'Park Güell', 'Casa Batlló', 'Las Ramblas']::text[], array['Gaudí', 'Modernisme', 'Beach', 'Tapas']::text[], 95, false
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/barcelona.svg', 'svg', 'arch', array['#EA580C', '#0284C7', '#16A34A', '#FDE047']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'NL';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'amsterdam', 'Amsterdam Canals', cid, 'Amsterdam', 'North Holland', 'Europe', 'City',
    'Historic canal belt lined with charming gabled brick townhouses, arched bridges, and countless bicycles.', array['Canal Ring', 'Rijksmuseum', 'Anne Frank House', 'Van Gogh Museum']::text[], array['Canals', 'Bicycles', 'Tulips', 'Art']::text[], 94, false
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/amsterdam.svg', 'svg', 'die-cut', array['#B45309', '#0284C7', '#DC2626', '#FEF3C7']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'CZ';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'prague', 'Prague Golden Spires', cid, 'Prague', 'Bohemia', 'Europe', 'Historical Site',
    'The City of a Hundred Spires with Gothic Charles Bridge spanning the Vltava under Prague Castle.', array['Charles Bridge', 'Prague Castle', 'Astronomical Clock', 'Old Town Square']::text[], array['Gothic', 'Castle', 'Beer', 'Medieval']::text[], 92, false
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/prague.svg', 'svg', 'shield', array['#78350F', '#D97706', '#1E3A8A', '#FEF3C7']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'AT';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'vienna', 'Vienna Imperial Palaces', cid, 'Vienna', 'Vienna', 'Europe', 'Cultural Heritage',
    'Imperial capital of classical music, gilded baroque palaces, and grand historic coffeehouses.', array['Schönbrunn Palace', 'St. Stephen''s Cathedral', 'Hofburg', 'Belvedere']::text[], array['Classical', 'Mozart', 'Palace', 'Coffee']::text[], 91, false
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/vienna.svg', 'svg', 'arch', array['#EAB308', '#1E293B', '#DC2626', '#FEF9C3']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'IT';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'florence', 'Florence Renaissance Duomo', cid, 'Florence', 'Tuscany', 'Europe', 'Cultural Heritage',
    'Cradle of the Renaissance crowned by Brunelleschi''s terracotta Duomo dome and Ponte Vecchio.', array['Florence Duomo', 'Ponte Vecchio', 'Uffizi Gallery', 'Piazza della Signoria']::text[], array['Renaissance', 'Art', 'Tuscany', 'Architecture']::text[], 93, false
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/florence.svg', 'svg', 'arch', array['#C2410C', '#047857', '#FFFFFF', '#FEF2F2']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'GB';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'edinburgh', 'Edinburgh Royal Castle', cid, 'Edinburgh', 'Scotland', 'Europe', 'Historical Site',
    'Volcanic crags crowned by medieval Edinburgh Castle towering over the cobblestones of the Royal Mile.', array['Edinburgh Castle', 'Royal Mile', 'Arthur''s Seat', 'Holyroodhouse']::text[], array['Scotland', 'Castle', 'Cobblestones', 'History']::text[], 91, false
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/edinburgh.svg', 'svg', 'shield', array['#1E293B', '#065F46', '#B45309', '#94A3B8']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'IS';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'reykjavik', 'Iceland & Northern Lights', cid, 'Reykjavik', 'Capital Region', 'Europe', 'Natural Wonder',
    'Land of Fire and Ice where emerald Aurora Borealis dances above steaming geothermal lagoons and waterfalls.', array['Hallgrimskirkja', 'Blue Lagoon', 'Gullfoss Waterfall', 'Geysir']::text[], array['Aurora', 'Geysers', 'Volcano', 'Ice']::text[], 96, true
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/reykjavik.svg', 'svg', 'organic', array['#10B981', '#0284C7', '#0F172A', '#6EE7B7']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'HR';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'dubrovnik', 'Dubrovnik Adriatic Walls', cid, 'Dubrovnik', 'Dalmatia', 'Europe', 'Historical Site',
    'The Pearl of the Adriatic enclosed by massive medieval stone ramparts and terracotta-roofed streets.', array['Dubrovnik City Walls', 'Stradun', 'Fort Lovrijenac', 'Old Port']::text[], array['Adriatic', 'Medieval Walls', 'Coast', 'History']::text[], 92, false
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/dubrovnik.svg', 'svg', 'die-cut', array['#EA580C', '#0284C7', '#E2E8F0', '#1E3A8A']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'GR';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'athens', 'Athens Acropolis', cid, 'Athens', 'Attica', 'Europe', 'Historical Site',
    'The monumental cradle of Western democracy crowned by the ancient Doric marble columns of the Parthenon.', array['Parthenon', 'Acropolis', 'Plaka', 'Temple of Olympian Zeus']::text[], array['Ancient Greece', 'Parthenon', 'Democracy', 'Marble']::text[], 93, false
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/athens.svg', 'svg', 'circle', array['#0284C7', '#D97706', '#FFFBEB', '#1E3A8A']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'IE';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'dublin', 'Dublin & Emerald Isle', cid, 'Dublin', 'Leinster', 'Europe', 'City',
    'Lively Georgian squares, literary legends, Celtic music, and the iconic cobblestones of Temple Bar.', array['Trinity College', 'Temple Bar', 'Dublin Castle', 'Guinness Storehouse']::text[], array['Celtic', 'Pubs', 'Literature', 'Emerald']::text[], 89, false
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/dublin.svg', 'svg', 'shield', array['#16A34A', '#15803D', '#F59E0B', '#DCFCE7']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'PT';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'lisbon', 'Lisbon Yellow Tram', cid, 'Lisbon', 'Lisbon Region', 'Europe', 'City',
    'Sunlit city of seven hills with vintage yellow trams rattling past azulejo-tiled miradouros on the Tagus.', array['Tram 28', 'Belém Tower', 'Jerónimos Monastery', 'Castelo de São Jorge']::text[], array['Yellow Tram', 'Azulejos', 'Pastel de Nata', 'Ocean']::text[], 93, false
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/lisbon.svg', 'svg', 'arch', array['#EAB308', '#0284C7', '#DC2626', '#FEF08A']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'DE';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'berlin', 'Berlin Brandenburg Gate', cid, 'Berlin', 'Berlin', 'Europe', 'City',
    'A dynamic metropolis of modern art and history symbolized by the neoclassical Brandenburg Gate.', array['Brandenburg Gate', 'Reichstag', 'Museum Island', 'Berlin Wall']::text[], array['History', 'Brandenburg', 'Art', 'Culture']::text[], 90, false
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/berlin.svg', 'svg', 'arch', array['#D97706', '#1E293B', '#DC2626', '#FEF3C7']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'HU';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'budapest', 'Budapest Danube River', cid, 'Budapest', 'Central Hungary', 'Europe', 'City',
    'Twin cities Buda and Pest connected by Chain Bridge with the illuminated Neo-Gothic Parliament.', array['Hungarian Parliament', 'Buda Castle', 'Chain Bridge', 'Fisherman''s Bastion']::text[], array['Danube', 'Thermal Baths', 'Gothic', 'Architecture']::text[], 92, false
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/budapest.svg', 'svg', 'landscape', array['#0284C7', '#D97706', '#B91C1C', '#E0F2FE']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'IT';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'amalfi-coast', 'Amalfi Coast & Positano', cid, 'Positano', 'Campania', 'Europe', 'Scenic Region',
    'Dramatic Mediterranean cliffs tumbling into the sea with pastel houses, lemon groves, and yachts.', array['Positano Spiaggia', 'Amalfi Cathedral', 'Ravello Gardens', 'Capri Island']::text[], array['Cliffs', 'Lemons', 'Pastel', 'Mediterranean']::text[], 95, true
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/amalfi-coast.svg', 'svg', 'organic', array['#0284C7', '#F59E0B', '#F43F5E', '#E0F2FE']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'JP';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'japan', 'Japan & Mount Fuji', cid, 'Kyoto', 'Honshu', 'Asia', 'Cultural Heritage',
    'Snow-capped Mount Fuji rising behind ancient crimson pagodas, cherry blossoms, and tranquil lakes.', array['Mount Fuji', 'Chureito Pagoda', 'Fushimi Inari', 'Kinkaku-ji']::text[], array['Fuji', 'Pagoda', 'Cherry Blossoms', 'Zen']::text[], 99, true
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/japan.png', 'png', 'circle', array['#DC2626', '#1E293B', '#FFFFFF', '#FCA5A5']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'ID';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'bali', 'Bali Tropical Paradise', cid, 'Ubud', 'Bali', 'Asia', 'Island',
    'Island of the Gods boasting floating water temples, emerald rice terraces, and coral beaches.', array['Ulun Danu Beratan', 'Tanah Lot', 'Tegallalang Rice Terraces', 'Uluwatu']::text[], array['Temples', 'Beaches', 'Rice Fields', 'Spiritual']::text[], 98, true
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/bali.png', 'png', 'organic', array['#047857', '#0284C7', '#D97706', '#A7F3D0']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'SG';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'singapore', 'Singapore City & Marina', cid, 'Singapore', 'Central Region', 'Asia', 'City',
    'Futuristic garden city defined by Marina Bay Sands, the iconic Merlion, and Supertree Grove.', array['Marina Bay Sands', 'Merlion Park', 'Gardens by the Bay', 'Jewel Changi']::text[], array['Modern', 'Gardens', 'Skyline', 'Clean']::text[], 97, true
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/singapore.png', 'png', 'cityscape', array['#0284C7', '#10B981', '#6366F1', '#E0F2FE']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'TH';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'bangkok', 'Bangkok Golden Wats', cid, 'Bangkok', 'Central Thailand', 'Asia', 'City',
    'Ornate riverside temples of dawn gleaming above bustling river canals and vibrant street food markets.', array['Wat Arun', 'Grand Palace', 'Wat Phra Kaew', 'Chao Phraya River']::text[], array['Golden Temples', 'Street Food', 'River', 'Culture']::text[], 96, false
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/bangkok.svg', 'svg', 'arch', array['#F59E0B', '#B45309', '#0284C7', '#FEF08A']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'TH';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'phuket', 'Phuket & Karst Islands', cid, 'Phuket', 'Southern Thailand', 'Asia', 'Beach',
    'Dramatic limestone karsts rising vertically from Andaman turquoise waters fringed with longtail boats.', array['James Bond Island', 'Phi Phi Islands', 'Big Buddha', 'Patong Beach']::text[], array['Limestone', 'Longtail Boats', 'Turquoise', 'Beach']::text[], 95, false
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/phuket.svg', 'svg', 'organic', array['#0D9488', '#0284C7', '#F59E0B', '#CCFBF1']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'KR';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'seoul', 'Seoul Dynasties & Neon', cid, 'Seoul', 'Seoul Capital Area', 'Asia', 'City',
    'Harmonious fusion of ancient Joseon royal palaces and futuristic skyscrapers with N Seoul Tower.', array['Gyeongbokgung Palace', 'N Seoul Tower', 'Bukchon Hanok', 'Dongdaemun']::text[], array['K-Culture', 'Palaces', 'Neon', 'Futuristic']::text[], 95, false
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/seoul.svg', 'svg', 'arch', array['#DC2626', '#2563EB', '#1E293B', '#DBEAFE']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'AE';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'dubai', 'Dubai Burj Skyline', cid, 'Dubai', 'Emirate of Dubai', 'Asia', 'City',
    'Record-shattering desert oasis crowned by the needle of Burj Khalifa and sail of Burj Al Arab.', array['Burj Khalifa', 'Burj Al Arab', 'Palm Jumeirah', 'Dubai Mall']::text[], array['Luxury', 'Skyscrapers', 'Desert', 'Architecture']::text[], 97, true
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/dubai.svg', 'svg', 'cityscape', array['#0284C7', '#D97706', '#475569', '#FEF3C7']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'VN';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'ha-long-bay', 'Ha Long Bay Emerald Waters', cid, 'Ha Long', 'Quang Ninh', 'Asia', 'Natural Wonder',
    'Thousands of towering limestone islands topped by rainforest rising from calm emerald gulf waters.', array['Sung Sot Cave', 'Ti Top Island', 'Traditional Junk Boats', 'Cat Ba Island']::text[], array['UNESCO', 'Limestone Karsts', 'Emerald Bay', 'Junk Boats']::text[], 93, false
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/ha-long-bay.svg', 'svg', 'landscape', array['#059669', '#047857', '#EA580C', '#A7F3D0']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'KH';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'angkor-wat', 'Angkor Wat Temple Towers', cid, 'Siem Reap', 'Siem Reap Province', 'Asia', 'Historical Site',
    'The largest religious complex in the world with iconic sandstone lotus towers reflected in lily ponds.', array['Angkor Wat Central Towers', 'Bayon Stone Faces', 'Ta Prohm Jungle Roots', 'Angkor Thom']::text[], array['Khmer', 'Ancient Temples', 'UNESCO', 'Sunrise']::text[], 94, true
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/angkor-wat.svg', 'svg', 'arch', array['#D97706', '#78350F', '#475569', '#FEF3C7']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'JO';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'petra', 'Petra Rose City', cid, 'Wadi Musa', 'Ma''an Governorate', 'Asia', 'Historical Site',
    'Ancient Nabataean capital carved directly into sandstone canyon cliffs emerging from the Siq gorge.', array['The Treasury (Al-Khazneh)', 'The Monastery', 'The Siq', 'Royal Tombs']::text[], array['Rose City', 'Wonder of the World', 'Canyon', 'Nabataean']::text[], 95, true
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/petra.svg', 'svg', 'arch', array['#DC2626', '#EA580C', '#7C2D12', '#FEE2E2']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'TR';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'cappadocia', 'Cappadocia Fairy Chimneys', cid, 'Göreme', 'Central Anatolia', 'Asia', 'Natural Wonder',
    'Hundreds of colorful hot air balloons greeting sunrise over volcanic fairy chimney valleys and cave dwellings.', array['Göreme Valley', 'Uchisar Castle', 'Hot Air Balloons', 'Love Valley']::text[], array['Hot Air Balloons', 'Fairy Chimneys', 'Sunrise', 'Caves']::text[], 96, true
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/cappadocia.svg', 'svg', 'organic', array['#EA580C', '#0284C7', '#F59E0B', '#FEF3C7']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'TR';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'istanbul', 'Istanbul Hagia Sophia', cid, 'Istanbul', 'Marmara', 'Asia', 'Cultural Heritage',
    'Where East meets West across the Bosphorus Strait crowned by majestic Ottoman domes and minarets.', array['Hagia Sophia', 'Blue Mosque', 'Topkapi Palace', 'Bosphorus Strait']::text[], array['Bosphorus', 'Mosques', 'Two Continents', 'History']::text[], 95, false
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/istanbul.svg', 'svg', 'arch', array['#1E3A8A', '#D97706', '#DC2626', '#DBEAFE']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'MV';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'maldives', 'Maldives Overwater Atolls', cid, 'Malé', 'Kaafu Atoll', 'Asia', 'Beach',
    'Overwater thatched villas suspended above crystal clear turquoise lagoons and pristine coral reefs.', array['Baa Atoll', 'Overwater Bungalows', 'Ari Atoll', 'Male Coral Mosque']::text[], array['Luxury', 'Overwater Bungalow', 'Turquoise', 'Reef']::text[], 98, true
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/maldives.svg', 'svg', 'organic', array['#0284C7', '#06B6D4', '#F59E0B', '#E0F2FE']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'CN';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'great-wall', 'Great Wall of China', cid, 'Beijing', 'Hebei', 'Asia', 'Historical Site',
    'Ancient stone ramparts and watchtowers winding like a dragon over misty rugged mountain ridges.', array['Mutianyu Section', 'Badaling', 'Simatai', 'Watchtowers']::text[], array['Wonder of the World', 'Great Wall', 'History', 'Mountains']::text[], 96, false
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/great-wall.svg', 'svg', 'landscape', array['#78350F', '#B45309', '#047857', '#FEF3C7']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'HK';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'hong-kong', 'Hong Kong Victoria Peak', cid, 'Hong Kong', 'Victoria Harbour', 'Asia', 'City',
    'Electrifying vertical skyline surrounding Victoria Harbour viewed from the legendary Star Ferry and The Peak.', array['Victoria Peak', 'Victoria Harbour', 'Star Ferry', 'Tian Tan Buddha']::text[], array['Skyline', 'Harbour', 'Neon', 'Dim Sum']::text[], 94, false
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/hong-kong.svg', 'svg', 'cityscape', array['#DC2626', '#1E293B', '#38BDF8', '#FEF08A']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'TW';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'taipei', 'Taipei 101 Tower', cid, 'Taipei', 'Taipei Region', 'Asia', 'City',
    'Bamboo-inspired Taipei 101 soaring above misty green hills, vibrant night markets, and temple alleys.', array['Taipei 101', 'Elephant Mountain', 'Shilin Night Market', 'Longshan Temple']::text[], array['Taipei 101', 'Night Market', 'Mountains', 'Food']::text[], 91, false
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/taipei.svg', 'svg', 'cityscape', array['#059669', '#0284C7', '#DC2626', '#D1FAE5']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'TH';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'chiang-mai', 'Chiang Mai Lanterns', cid, 'Chiang Mai', 'Northern Thailand', 'Asia', 'Cultural Heritage',
    'Northern mountain valley of golden teak wats where thousands of glowing lanterns fill the night sky during Yi Peng.', array['Wat Phra That Doi Suthep', 'Wat Chedi Luang', 'Old City Moat', 'Night Bazaar']::text[], array['Lanterns', 'Temples', 'Mountains', 'Culture']::text[], 90, false
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/chiang-mai.svg', 'svg', 'arch', array['#F59E0B', '#D97706', '#047857', '#FEF08A']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'LA';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'luang-prabang', 'Luang Prabang Mekong', cid, 'Luang Prabang', 'Luang Prabang Province', 'Asia', 'Cultural Heritage',
    'Enchanting UNESCO town where golden temples meet French colonial villas at the confluence of the Mekong.', array['Wat Xieng Thong', 'Kuang Si Falls', 'Mount Phousi', 'Mekong River']::text[], array['UNESCO', 'Mekong', 'Waterfalls', 'Peaceful']::text[], 88, false
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/luang-prabang.svg', 'svg', 'landscape', array['#059669', '#D97706', '#0284C7', '#A7F3D0']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'NP';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'kathmandu', 'Kathmandu Himalayan Valley', cid, 'Kathmandu', 'Kathmandu Valley', 'Asia', 'Mountain',
    'Spiritual gateway to Everest adorned with fluttering prayer flags, ancient stupas, and snow-capped peaks.', array['Boudhanath Stupa', 'Swayambhunath Monkey Temple', 'Pashupatinath', 'Durbar Square']::text[], array['Himalayas', 'Everest', 'Stupa', 'Prayer Flags']::text[], 92, false
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/kathmandu.svg', 'svg', 'arch', array['#DC2626', '#F59E0B', '#1E3A8A', '#FEF08A']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'PH';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'boracay', 'Boracay White Beach', cid, 'Malay', 'Aklan', 'Asia', 'Beach',
    'Powdery soft white sand shoreline graced by iconic blue-sailed paraw boats at golden sunset.', array['White Beach', 'Willy''s Rock', 'Puka Shell Beach', 'Paraw Boats']::text[], array['White Sand', 'Sunset', 'Sailboat', 'Island']::text[], 90, false
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/boracay.svg', 'svg', 'organic', array['#0284C7', '#F59E0B', '#10B981', '#E0F2FE']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'US';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'new-york', 'New York City Skyline', cid, 'New York', 'New York State', 'Americas', 'City',
    'The Empire City with the Statue of Liberty, soaring art-deco skyscrapers, and yellow cabs.', array['Statue of Liberty', 'Empire State Building', 'Central Park', 'Brooklyn Bridge']::text[], array['Skyline', 'Broadway', 'Yellow Cabs', 'Icons']::text[], 99, true
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/new-york.svg', 'svg', 'cityscape', array['#0284C7', '#EAB308', '#1E293B', '#F8FAFC']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'US';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'grand-canyon', 'Grand Canyon Canyons', cid, 'Flagstaff', 'Arizona', 'Americas', 'Natural Wonder',
    'Vast miles of red-banded rock strata carved by the Colorado River glowing at dawn and dusk.', array['South Rim', 'Bright Angel Trail', 'Horseshoe Bend', 'Colorado River']::text[], array['Wonder', 'Canyon', 'Red Rock', 'National Park']::text[], 97, true
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/grand-canyon.svg', 'svg', 'landscape', array['#C2410C', '#D97706', '#0284C7', '#FEF3C7']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'US';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'san-francisco', 'San Francisco Golden Gate', cid, 'San Francisco', 'California', 'Americas', 'City',
    'The dramatic Golden Gate Bridge spanning Pacific fog, Victorian painted ladies, and cable cars.', array['Golden Gate Bridge', 'Alcatraz', 'Cable Cars', 'Fisherman''s Wharf']::text[], array['Golden Gate', 'Cable Car', 'Bay Area', 'Fog']::text[], 96, false
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/san-francisco.svg', 'svg', 'arch', array['#EA580C', '#0284C7', '#475569', '#FFEDD5']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'US';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'hawaii', 'Hawaii Tropical Islands', cid, 'Honolulu', 'Hawaii', 'Americas', 'Island',
    'Polynesian paradise of volcanic peaks, turquoise surf, blooming hibiscus, and warm aloha spirit.', array['Diamond Head', 'Waikiki Beach', 'Haleakala', 'Na Pali Coast']::text[], array['Aloha', 'Surfing', 'Volcano', 'Paradise']::text[], 97, true
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/hawaii.svg', 'svg', 'organic', array['#0284C7', '#F59E0B', '#10B981', '#E0F2FE']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'US';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'las-vegas', 'Las Vegas Neon Strip', cid, 'Las Vegas', 'Nevada', 'Americas', 'City',
    'Dazzling neon metropolis in the Mojave Desert known for iconic casino signs and Bellagio fountains.', array['Welcome to Vegas Sign', 'Bellagio Fountains', 'The Strip', 'Fremont Street']::text[], array['Neon', 'Casinos', 'Nightlife', 'Desert']::text[], 94, false
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/las-vegas.svg', 'svg', 'die-cut', array['#DC2626', '#F59E0B', '#1E293B', '#FEF08A']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'US';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'miami', 'Miami Art Deco Beach', cid, 'Miami', 'Florida', 'Americas', 'Beach',
    'Pastel neon Art Deco hotels lined with royal palms along the white sands of South Beach.', array['South Beach', 'Ocean Drive', 'Art Deco District', 'Wynwood Walls']::text[], array['Art Deco', 'Palms', 'South Beach', 'Ocean']::text[], 93, false
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/miami.svg', 'svg', 'arch', array['#EC4899', '#06B6D4', '#F59E0B', '#FDF2F8']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'US';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'yellowstone', 'Yellowstone Geysers', cid, 'Jackson', 'Wyoming', 'Americas', 'National Park',
    'Wilderness wonder with rainbow prismatic hot springs, Old Faithful geyser, and roaming bison herds.', array['Grand Prismatic Spring', 'Old Faithful', 'Yellowstone Canyon', 'Lamar Valley']::text[], array['Geysers', 'Wildlife', 'Bison', 'National Park']::text[], 95, false
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/yellowstone.svg', 'svg', 'landscape', array['#0284C7', '#EA580C', '#047857', '#FEF3C7']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'CA';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'banff', 'Banff & Lake Louise', cid, 'Banff', 'Alberta', 'Americas', 'Mountain',
    'The Canadian Rockies'' crown jewel with turquoise glacial waters reflecting towering mountain walls.', array['Lake Louise', 'Moraine Lake', 'Banff Gondola', 'Mount Rundle']::text[], array['Rockies', 'Glacial Lake', 'Canoe', 'Wildlife']::text[], 96, true
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/banff.svg', 'svg', 'shield', array['#0284C7', '#0D9488', '#1E293B', '#CCFBF1']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'PE';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'machu-picchu', 'Machu Picchu Citadel', cid, 'Cusco', 'Cusco Region', 'Americas', 'Historical Site',
    'Lost City of the Incas terraced high in cloud forest mountains beneath the peak of Huayna Picchu.', array['Inca Citadel', 'Huayna Picchu', 'Sun Gate', 'Intihuatana']::text[], array['Inca', 'Wonder of the World', 'Andes', 'Ruins']::text[], 98, true
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/machu-picchu.svg', 'svg', 'arch', array['#059669', '#78350F', '#0284C7', '#DCFCE7']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'BR';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'rio-de-janeiro', 'Rio de Janeiro & Christ', cid, 'Rio de Janeiro', 'Rio de Janeiro State', 'Americas', 'City',
    'Marvelous city with Christ the Redeemer embracing Sugarloaf mountain, Copacabana, and samba beats.', array['Christ the Redeemer', 'Sugarloaf Mountain', 'Copacabana Beach', 'Ipanema']::text[], array['Christ Statue', 'Beaches', 'Sugarloaf', 'Carnaval']::text[], 97, true
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/rio-de-janeiro.svg', 'svg', 'arch', array['#0284C7', '#059669', '#F59E0B', '#E0F2FE']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'MX';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'cancun', 'Cancun & Mayan Ruins', cid, 'Cancun', 'Quintana Roo', 'Americas', 'Beach',
    'Caribbean jewel with crystalline turquoise waves and ancient Mayan stone pyramids perched on coastal bluffs.', array['Tulum Ruins', 'Chichen Itza', 'Isla Mujeres', 'Playa Delfines']::text[], array['Mayan', 'Caribbean', 'Cenotes', 'Turquoise']::text[], 95, false
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/cancun.svg', 'svg', 'organic', array['#0D9488', '#0284C7', '#D97706', '#CCFBF1']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'AR';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'patagonia', 'Patagonia Fitz Roy', cid, 'El Chaltén', 'Santa Cruz', 'Americas', 'Mountain',
    'Dramatic windswept wilderness of jagged granite needles, glacial blue lakes, and calving icebergs.', array['Mount Fitz Roy', 'Perito Moreno Glacier', 'Torres del Paine', 'Laguna de los Tres']::text[], array['Glaciers', 'Trekking', 'Granite Peaks', 'Wild']::text[], 94, false
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/patagonia.svg', 'svg', 'shield', array['#0284C7', '#1E293B', '#E2E8F0', '#38BDF8']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'MX';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'mexico-city', 'Mexico City Bellas Artes', cid, 'Mexico City', 'CDMX', 'Americas', 'Cultural Heritage',
    'Vibrant cultural metropolis featuring the marble palace of Bellas Artes, murals, and ancient Aztec roots.', array['Palacio de Bellas Artes', 'Zócalo', 'Teotihuacan', 'Chapultepec Castle']::text[], array['Culture', 'Murals', 'Palace', 'Cuisine']::text[], 92, false
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/mexico-city.svg', 'svg', 'arch', array['#EA580C', '#D97706', '#1E3A8A', '#FEF3C7']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'CU';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'havana', 'Havana Classic Cars', cid, 'Havana', 'La Habana', 'Americas', 'City',
    'Pastel colonial facades and classic vintage convertibles along the wave-swept seawall of the Malecón.', array['El Malecón', 'Old Havana (Habana Vieja)', 'El Capitolio', 'Plaza de la Revolución']::text[], array['Classic Cars', 'Colonial', 'Music', 'Caribbean']::text[], 91, false
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/havana.svg', 'svg', 'arch', array['#0284C7', '#E11D48', '#F59E0B', '#E0F2FE']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'EC';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'galapagos', 'Galápagos Islands', cid, 'Puerto Ayora', 'Galápagos Province', 'Americas', 'Wildlife',
    'Living museum of evolution with giant tortoises, blue-footed boobies, and marine iguanas on volcanic shores.', array['Kicker Rock', 'Tortuga Bay', 'Bartolomé Island', 'Charles Darwin Station']::text[], array['Evolution', 'Tortoises', 'Volcanic', 'Wildlife']::text[], 94, false
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/galapagos.svg', 'svg', 'organic', array['#0284C7', '#059669', '#78350F', '#E0F2FE']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'EG';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'pyramids-giza', 'Giza Pyramids & Cairo', cid, 'Giza', 'Cairo', 'Africa', 'Historical Site',
    'Last standing Wonder of the Ancient World with Great Pyramids guarded by the enigmatic Great Sphinx.', array['Great Pyramid of Khufu', 'The Sphinx', 'Pyramid of Khafre', 'Nile River']::text[], array['Ancient Egypt', 'Pyramids', 'Sphinx', 'Wonder of the World']::text[], 98, true
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/pyramids-giza.svg', 'svg', 'shield', array['#D97706', '#B45309', '#0284C7', '#FEF3C7']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'ZA';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'cape-town', 'Cape Town Table Mountain', cid, 'Cape Town', 'Western Cape', 'Africa', 'Scenic Region',
    'Flat-topped Table Mountain towering between two roaring oceans with colorful Bo-Kaap houses.', array['Table Mountain', 'Cape Point', 'Bo-Kaap', 'Boulders Beach Penguins']::text[], array['Table Mountain', 'Penguins', 'Ocean', 'Two Oceans']::text[], 96, true
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/cape-town.svg', 'svg', 'landscape', array['#0284C7', '#059669', '#F59E0B', '#E0F2FE']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'TZ';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'serengeti', 'Serengeti Great Migration', cid, 'Arusha', 'Mara Region', 'Africa', 'Wildlife',
    'Endless savanna plains staging the Great Migration beneath golden acacia trees and blazing sunsets.', array['Great Migration', 'Acacia Trees', 'Ngorongoro Crater', 'Seronera Valley']::text[], array['Safari', 'Migration', 'Lions', 'Savanna']::text[], 97, true
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/serengeti.svg', 'svg', 'landscape', array['#EA580C', '#D97706', '#78350F', '#FEF3C7']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'MA';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'marrakech', 'Marrakech Medina & Souks', cid, 'Marrakech', 'Marrakesh-Safi', 'Africa', 'Cultural Heritage',
    'The Red City of terracotta ramparts, aromatic spice souks, and vibrant Jemaa el-Fnaa square.', array['Jemaa el-Fnaa', 'Koutoubia Mosque', 'Jardin Majorelle', 'Bahia Palace']::text[], array['Souks', 'Medina', 'Spices', 'Riad']::text[], 94, false
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/marrakech.svg', 'svg', 'arch', array['#DC2626', '#D97706', '#1D4ED8', '#FEF3C7']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'ZW';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'victoria-falls', 'Victoria Falls Smoke', cid, 'Victoria Falls', 'Matabeleland North', 'Africa', 'Natural Wonder',
    'The Smoke That Thunders: the world''s largest curtain of falling water creating permanent rainbows.', array['Devil''s Pool', 'Zambezi River Gorge', 'Knife-Edge Bridge', 'Rainforest Walk']::text[], array['Waterfalls', 'Rainbow', 'Zambezi', 'Wonder']::text[], 95, false
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/victoria-falls.svg', 'svg', 'landscape', array['#0284C7', '#059669', '#F59E0B', '#E0F2FE']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'TZ';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'zanzibar', 'Zanzibar Spice Island', cid, 'Zanzibar City', 'Unguja', 'Africa', 'Beach',
    'Carved teak doors of Stone Town, fragrant clove plantations, and traditional wooden dhows on cyan seas.', array['Stone Town', 'Nungwi Beach', 'Prison Island', 'Dhow Sailboats']::text[], array['Dhows', 'Spices', 'Indian Ocean', 'Stone Town']::text[], 92, false
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/zanzibar.svg', 'svg', 'organic', array['#0284C7', '#0D9488', '#D97706', '#E0F2FE']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'MU';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'mauritius', 'Mauritius Underwater Waterfall', cid, 'Port Louis', 'Black River', 'Africa', 'Island',
    'Rugged basalt monolith of Le Morne towering over the breathtaking underwater waterfall optical illusion.', array['Le Morne Brabant', 'Underwater Waterfall', 'Chamarel 7 Colored Earth', 'Ile aux Cerfs']::text[], array['Underwater Waterfall', 'Le Morne', 'Lagoon', 'Island']::text[], 93, false
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/mauritius.svg', 'svg', 'organic', array['#0284C7', '#06B6D4', '#047857', '#E0F2FE']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'AE';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'abu-dhabi', 'Abu Dhabi Grand Mosque', cid, 'Abu Dhabi', 'Emirate of Abu Dhabi', 'Middle East', 'Cultural Heritage',
    'The majestic Sheikh Zayed Grand Mosque with 82 white marble domes and reflective prayer pools.', array['Sheikh Zayed Grand Mosque', 'Louvre Abu Dhabi', 'Corniche', 'Qasr Al Watan']::text[], array['White Marble', 'Grand Mosque', 'Architecture', 'Luxury']::text[], 94, false
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/abu-dhabi.svg', 'svg', 'arch', array['#FFFFFF', '#0284C7', '#EAB308', '#E2E8F0']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'KE';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'masai-mara', 'Masai Mara Savanna', cid, 'Narok', 'Rift Valley', 'Africa', 'Wildlife',
    'The ancestral savanna of the Maasai where giraffes and lions roam beneath big African skies.', array['Mara River Crossing', 'Maasai Villages', 'Oloololo Escarpment', 'Big Five']::text[], array['Safari', 'Maasai', 'Giraffe', 'Lion']::text[], 95, false
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/masai-mara.svg', 'svg', 'landscape', array['#EA580C', '#D97706', '#78350F', '#FEF3C7']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'EG';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'luxor', 'Luxor & Valley of Kings', cid, 'Luxor', 'Upper Egypt', 'Africa', 'Historical Site',
    'World''s greatest open-air museum where Karnak''s colossal stone columns rise beside the Nile.', array['Karnak Temple', 'Valley of the Kings', 'Luxor Temple', 'Nile Feluccas']::text[], array['Pharaohs', 'Karnak', 'Nile', 'Tombs']::text[], 93, false
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/luxor.svg', 'svg', 'arch', array['#D97706', '#B45309', '#0284C7', '#FEF3C7']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'AU';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'sydney', 'Sydney Harbour & Opera', cid, 'Sydney', 'New South Wales', 'Oceania', 'City',
    'Iconic billowing sails of the Sydney Opera House and the arch of Harbour Bridge over sparkling waters.', array['Sydney Opera House', 'Harbour Bridge', 'Bondi Beach', 'Circular Quay']::text[], array['Opera House', 'Harbour', 'Bondi', 'Sails']::text[], 98, true
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/sydney.svg', 'svg', 'die-cut', array['#0284C7', '#FFFFFF', '#1E293B', '#DBEAFE']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'AU';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'great-barrier-reef', 'Great Barrier Reef', cid, 'Cairns', 'Queensland', 'Oceania', 'Natural Wonder',
    'Earth''s largest living organism: kaleidoscopic coral gardens teeming with sea turtles and clownfish.', array['Heart Reef', 'Outer Reef Pontoon', 'Green Island', 'Coral Gardens']::text[], array['Coral Reef', 'Scuba', 'Turtles', 'Natural Wonder']::text[], 97, true
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/great-barrier-reef.svg', 'svg', 'organic', array['#0284C7', '#06B6D4', '#F43F5E', '#E0F2FE']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'AU';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'melbourne', 'Melbourne Lanes & Tram', cid, 'Melbourne', 'Victoria', 'Oceania', 'City',
    'Cultural capital of copper-domed Flinders Street station, world-famous coffee, and street art laneways.', array['Flinders Street Station', 'Hosier Lane', 'Yarra River', 'St Kilda Pier']::text[], array['Coffee', 'Laneways', 'Trams', 'Art']::text[], 92, false
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/melbourne.svg', 'svg', 'arch', array['#EAB308', '#1E293B', '#15803D', '#FEF08A']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'NZ';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'queenstown', 'Queenstown Alpine Alps', cid, 'Queenstown', 'Otago', 'Oceania', 'Adventure',
    'Adventure capital nestled on the shores of Lake Wakatipu beneath the jagged peaks of The Remarkables.', array['The Remarkables', 'Lake Wakatipu', 'Skyline Gondola', 'Milford Road']::text[], array['Adventure', 'Alps', 'Lake', 'Bungy']::text[], 96, true
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/queenstown.svg', 'svg', 'shield', array['#0284C7', '#059669', '#1E293B', '#E0F2FE']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'NZ';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'milford-sound', 'Milford Sound Fjords', cid, 'Te Anau', 'Fiordland', 'Oceania', 'Natural Wonder',
    'Eighth Wonder of the World where Mitre Peak rises sheer from black deep waters amidst cascading falls.', array['Mitre Peak', 'Stirling Falls', 'Fiordland National Park', 'Bowen Falls']::text[], array['Fjords', 'Mitre Peak', 'Waterfalls', 'Nature']::text[], 95, false
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/milford-sound.svg', 'svg', 'landscape', array['#047857', '#0284C7', '#1E293B', '#A7F3D0']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'NZ';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'rotorua', 'Rotorua Geothermal & Māori', cid, 'Rotorua', 'Bay of Plenty', 'Oceania', 'Cultural Heritage',
    'Māori cultural heartland steeped in bubbling champagne pools, erupting geysers, and red cedar forests.', array['Pohutu Geyser', 'Te Puia Māori Village', 'Wai-O-Tapu', 'Redwoods Treewalk']::text[], array['Māori', 'Geothermal', 'Geysers', 'Culture']::text[], 90, false
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/rotorua.svg', 'svg', 'organic', array['#EA580C', '#059669', '#78350F', '#FEF3C7']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'FJ';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'fiji', 'Fiji Bula Coral Islands', cid, 'Nadi', 'Viti Levu', 'Oceania', 'Island',
    'South Pacific paradise of smiling Bula hospitality, sandbars, coconut palms, and crystal reefs.', array['Mamanuca Islands', 'Yasawa Islands', 'Coral Coast', 'Cloud 9 Floating Bar']::text[], array['Bula', 'Coral', 'Sandbar', 'Island']::text[], 94, false
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/fiji.svg', 'svg', 'organic', array['#0284C7', '#06B6D4', '#F59E0B', '#E0F2FE']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'PF';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'bora-bora', 'Bora Bora Otemanu Lagoon', cid, 'Vaitape', 'Leeward Islands', 'Oceania', 'Island',
    'Dramatic volcanic peak of Mount Otemanu surrounded by fifty shades of turquoise and overwater fares.', array['Mount Otemanu', 'Matira Beach', 'Coral Gardens', 'Overwater Fares']::text[], array['Romantic', 'Lagoon', 'Otemanu', 'Paradise']::text[], 97, true
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/bora-bora.svg', 'svg', 'organic', array['#0284C7', '#059669', '#06B6D4', '#E0F2FE']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'AU';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'uluru', 'Uluru Sacred Red Center', cid, 'Yulara', 'Northern Territory', 'Oceania', 'Cultural Heritage',
    'Sacred ancient red sandstone monolith glowing fiery crimson at sunset in the heart of the Outback.', array['Uluru Monolith', 'Kata Tjuta', 'Field of Light', 'Anangu Cultural Center']::text[], array['Sacred', 'Outback', 'Red Monolith', 'Aboriginal']::text[], 95, false
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/uluru.svg', 'svg', 'landscape', array['#DC2626', '#B45309', '#0284C7', '#FEE2E2']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'NZ';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'auckland', 'Auckland City of Sails', cid, 'Auckland', 'Auckland Region', 'Oceania', 'City',
    'Harbour city framed by volcanic cones with the iconic Sky Tower rising over fleets of white sailboats.', array['Sky Tower', 'Waitemata Harbour', 'Mount Eden', 'Waiheke Island']::text[], array['Sky Tower', 'Sailboats', 'Harbour', 'Volcanoes']::text[], 91, false
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/auckland.svg', 'svg', 'cityscape', array['#0284C7', '#1E293B', '#38BDF8', '#E0F2FE']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'AU';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'cairns-daintree', 'Cairns & Ancient Daintree', cid, 'Cairns', 'Queensland', 'Oceania', 'National Park',
    'Oldest rainforest on Earth where primordial green canopy meets the coral sea at Cape Tribulation.', array['Daintree Rainforest', 'Kuranda Scenic Railway', 'Cape Tribulation', 'Mossman Gorge']::text[], array['Rainforest', 'Ancient', 'Canopy', 'Wild']::text[], 90, false
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/cairns-daintree.svg', 'svg', 'organic', array['#047857', '#059669', '#D97706', '#A7F3D0']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'AU';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'gold-coast', 'Gold Coast Surfers Paradise', cid, 'Gold Coast', 'Queensland', 'Oceania', 'Beach',
    'Golden sandy coastline where glittering high-rises overlook world-class rolling ocean surf breaks.', array['Surfers Paradise Beach', 'Q1 Skypoint', 'Burleigh Heads', 'Snapper Rocks']::text[], array['Surfing', 'Golden Sands', 'Skyscrapers', 'Sun']::text[], 91, false
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/gold-coast.svg', 'svg', 'cityscape', array['#0284C7', '#F59E0B', '#1E293B', '#E0F2FE']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'AU';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'tasmania', 'Tasmania Cradle Mountain', cid, 'Hobart', 'Tasmania', 'Oceania', 'Mountain',
    'Jagged dolerite peak reflected in glacial Dove Lake surrounded by ancient button grass and wombats.', array['Cradle Mountain', 'Dove Lake', 'Wineglass Bay', 'Salamanca Market']::text[], array['Wilderness', 'Wombats', 'Alpine', 'Glacial Lake']::text[], 89, false
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/tasmania.svg', 'svg', 'shield', array['#1E293B', '#059669', '#0284C7', '#E2E8F0']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'CK';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'cook-islands', 'Cook Islands & Rarotonga', cid, 'Avarua', 'Rarotonga', 'Oceania', 'Island',
    'Verdant volcanic needle pinnacles encircled by a crystalline reef lagoon where giant clams flourish.', array['Aitutaki Lagoon', 'Muri Lagoon', 'The Needle (Te Rua Manga)', 'One Foot Island']::text[], array['Polynesia', 'Lagoon', 'Pacific', 'Reef']::text[], 92, false
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/cook-islands.svg', 'svg', 'organic', array['#0284C7', '#059669', '#F59E0B', '#E0F2FE']::text[], true
  )
  on conflict do nothing;
end $$;

do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = 'AU';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    'whitehaven-beach', 'Whitsundays Whitehaven', cid, 'Airlie Beach', 'Queensland', 'Oceania', 'Beach',
    'Pure white 98% silica sand swirling with brilliant turquoise tidal currents at Hill Inlet.', array['Hill Inlet Lookout', 'Whitehaven Beach', 'Hamilton Island', 'Heart Reef']::text[], array['Silica Sand', 'Hill Inlet', 'Turquoise', 'Whitsundays']::text[], 96, true
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '/magnets/destinations/whitehaven-beach.svg', 'svg', 'organic', array['#06B6D4', '#0284C7', '#FFFFFF', '#CCFBF1']::text[], true
  )
  on conflict do nothing;
end $$;