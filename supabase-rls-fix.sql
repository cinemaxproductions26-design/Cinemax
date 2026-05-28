-- ============================================================
-- RLS FIX: Allow anon key to write all tables
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- site_settings
DROP POLICY IF EXISTS "Admin write site_settings" ON site_settings;
CREATE POLICY "Anon write site_settings" ON site_settings
  FOR ALL USING (true) WITH CHECK (true);

-- portfolio_categories
DROP POLICY IF EXISTS "Admin write portfolio_categories" ON portfolio_categories;
CREATE POLICY "Anon write portfolio_categories" ON portfolio_categories
  FOR ALL USING (true) WITH CHECK (true);

-- portfolio_items
DROP POLICY IF EXISTS "Admin write portfolio_items" ON portfolio_items;
CREATE POLICY "Anon write portfolio_items" ON portfolio_items
  FOR ALL USING (true) WITH CHECK (true);

-- photo_albums
DROP POLICY IF EXISTS "Admin write photo_albums" ON photo_albums;
CREATE POLICY "Anon write photo_albums" ON photo_albums
  FOR ALL USING (true) WITH CHECK (true);

-- clients
DROP POLICY IF EXISTS "Admin write clients" ON clients;
CREATE POLICY "Anon write clients" ON clients
  FOR ALL USING (true) WITH CHECK (true);

-- testimonials
DROP POLICY IF EXISTS "Admin write testimonials" ON testimonials;
CREATE POLICY "Anon write testimonials" ON testimonials
  FOR ALL USING (true) WITH CHECK (true);
