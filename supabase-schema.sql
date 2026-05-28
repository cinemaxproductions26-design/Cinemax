-- ============================================================
-- CINEMAX — Supabase Schema
-- Paste this entire file into Supabase SQL Editor and run it
-- ============================================================

-- Site settings (colors, fonts per section)
create table if not exists site_settings (
  id serial primary key,
  section text not null,
  font_family text,
  google_fonts_url text,
  bg_color text,
  accent_color text,
  updated_at timestamptz default now()
);

-- Portfolio categories
create table if not exists portfolio_categories (
  id serial primary key,
  name text not null,
  slug text unique not null,
  icon text,
  enabled boolean default true,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- Portfolio items (music tracks, sfx, design images)
create table if not exists portfolio_items (
  id serial primary key,
  category_slug text not null,
  title text,
  subtitle text,
  media_url text,
  cover_url text,
  album_id int,
  orientation text default 'horizontal',
  enabled boolean default true,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- Photography albums
create table if not exists photo_albums (
  id serial primary key,
  title text not null,
  description text,
  cover_url text,
  enabled boolean default true,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- Clients
create table if not exists clients (
  id serial primary key,
  name text not null,
  logo_url text,
  website_url text,
  enabled boolean default true,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- Testimonials
create table if not exists testimonials (
  id serial primary key,
  name text not null,
  role text,
  quote text,
  avatar_initials text,
  rating int default 5,
  enabled boolean default true,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- ── RLS Policies ──────────────────────────────────────────────
alter table site_settings      enable row level security;
alter table portfolio_categories enable row level security;
alter table portfolio_items    enable row level security;
alter table photo_albums       enable row level security;
alter table clients            enable row level security;
alter table testimonials       enable row level security;

-- Public read
create policy "Public read" on site_settings      for select using (true);
create policy "Public read" on portfolio_categories for select using (true);
create policy "Public read" on portfolio_items    for select using (true);
create policy "Public read" on photo_albums       for select using (true);
create policy "Public read" on clients            for select using (true);
create policy "Public read" on testimonials       for select using (true);

-- Authenticated write (admin user)
create policy "Auth write" on site_settings      for all using (auth.role() = 'authenticated');
create policy "Auth write" on portfolio_categories for all using (auth.role() = 'authenticated');
create policy "Auth write" on portfolio_items    for all using (auth.role() = 'authenticated');
create policy "Auth write" on photo_albums       for all using (auth.role() = 'authenticated');
create policy "Auth write" on clients            for all using (auth.role() = 'authenticated');
create policy "Auth write" on testimonials       for all using (auth.role() = 'authenticated');

-- ── Seed: default categories ──────────────────────────────────
insert into portfolio_categories (name, slug, icon, sort_order) values
  ('Music Production', 'music',       '🎵', 1),
  ('SFX',              'sfx',         '🔊', 2),
  ('Photography',      'photography', '📷', 3),
  ('Publicity Design', 'design',      '🎨', 4)
on conflict (slug) do nothing;
