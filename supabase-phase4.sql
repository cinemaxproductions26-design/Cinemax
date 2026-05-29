-- ============================================================
-- PHASE 4: Add hero text columns to contact_info
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

ALTER TABLE contact_info
  ADD COLUMN IF NOT EXISTS hero_eyebrow text DEFAULT 'Welcome to Cinemax',
  ADD COLUMN IF NOT EXISTS hero_title    text DEFAULT 'Creating Core Cinema',
  ADD COLUMN IF NOT EXISTS hero_cta      text DEFAULT 'Get A Quote';
