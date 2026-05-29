-- ============================================================
-- CINEMAX Phase 3 — Run in Supabase SQL Editor
-- ============================================================

-- Contact & Hero/About info (single row, id=1)
CREATE TABLE IF NOT EXISTS contact_info (
  id int primary key default 1,
  email text default 'hello@cinemax.in',
  whatsapp text default '919999999999',
  instagram_url text default '',
  youtube_url text default '',
  linkedin_url text default '',
  location text default 'Chennai, Tamil Nadu, India',
  hero_logo_url text default '',
  about_title text default 'We Craft Cinematic Experiences',
  about_description text default 'Cinemax is a full-spectrum creative studio bringing stories to life through sound and vision. From crafting immersive film scores and bespoke sound effects to capturing stunning visuals and designing bold publicity campaigns — we are the creative force behind unforgettable cinematic moments.',
  about_image_url text default '',
  stat1_num text default '100+',
  stat1_label text default 'Projects',
  stat2_num text default '50+',
  stat2_label text default 'Clients',
  stat3_num text default '5+',
  stat3_label text default 'Years',
  updated_at timestamptz default now()
);
INSERT INTO contact_info (id) VALUES (1) ON CONFLICT DO NOTHING;
ALTER TABLE contact_info ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read contact_info" ON contact_info;
CREATE POLICY "Public read contact_info" ON contact_info FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anon write contact_info" ON contact_info;
CREATE POLICY "Anon write contact_info" ON contact_info FOR ALL USING (true) WITH CHECK (true);

-- Pricing Plans
CREATE TABLE IF NOT EXISTS pricing_plans (
  id serial primary key,
  category text NOT NULL,
  tier_name text NOT NULL,
  price text,
  unit text,
  description text,
  features text[],
  is_featured boolean default false,
  sort_order int default 0
);
ALTER TABLE pricing_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read pricing_plans" ON pricing_plans;
CREATE POLICY "Public read pricing_plans" ON pricing_plans FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anon write pricing_plans" ON pricing_plans;
CREATE POLICY "Anon write pricing_plans" ON pricing_plans FOR ALL USING (true) WITH CHECK (true);

-- Seed pricing (only if empty)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pricing_plans LIMIT 1) THEN
    INSERT INTO pricing_plans (category, tier_name, price, unit, description, features, is_featured, sort_order) VALUES
    ('music','Basic','₹5,000','/ track','Perfect for short films, reels, and single-track projects.',ARRAY['1 original track','Basic mix & balance','2 revisions','WAV + MP3 delivery','5-day turnaround'],false,1),
    ('music','Standard','₹15,000','/ project','Ideal for short films, web series, and branded content.',ARRAY['3 original tracks','Full mix & mastering','5 revisions','Stems included','Sync-ready delivery','8-day turnaround'],true,2),
    ('music','Premium','₹35,000','/ project','Full cinematic score for feature films and major campaigns.',ARRAY['5+ original tracks','Full orchestral production','Unlimited revisions','All stems + license','Dolby Atmos mix','Priority support'],false,3),
    ('sfx','Basic','₹3,000','/ pack','Quick custom SFX for short-form content and social media.',ARRAY['10 custom SFX','WAV format, 48kHz','2 revisions per sound','3-day turnaround'],false,1),
    ('sfx','Standard','₹8,000','/ pack','Comprehensive SFX library for web series and ad films.',ARRAY['30 custom SFX','Categorised library','WAV + AIFF formats','Unlimited revisions','5-day turnaround'],true,2),
    ('sfx','Premium','₹20,000','/ project','Full-film SFX suite with integration support.',ARRAY['100+ custom SFX','Fully licensed','Multi-format delivery','On-site integration support','Priority turnaround'],false,3),
    ('photography','Basic','₹4,000','/ session','Ideal for social media content and quick product shoots.',ARRAY['1-hour shoot','1 location','20 edited photos','HD digital delivery','3-day delivery'],false,1),
    ('photography','Standard','₹10,000','/ session','Perfect for events, brand campaigns, and portraits.',ARRAY['3-hour shoot','2 locations','60 edited photos','Advanced retouching','Print-ready files','5-day delivery'],true,2),
    ('photography','Premium','₹25,000','/ day','Full-day commercial and film promotional shoots.',ARRAY['Full-day shoot (8 hrs)','Multiple locations','150+ edited photos','Full retouching suite','Exclusive license','BTS footage bonus'],false,3),
    ('design','Basic','₹3,500','/ project','Launch-ready visuals for small releases and events.',ARRAY['Logo design','3 social media templates','2 revisions','PNG + PDF files','4-day turnaround'],false,1),
    ('design','Standard','₹9,000','/ project','Full brand kit for films, albums, and brand launches.',ARRAY['Full brand identity','Movie / album poster','10 social templates','5 revisions','Print-ready files','7-day turnaround'],true,2),
    ('design','Premium','₹22,000','/ project','Complete publicity campaign for major theatrical releases.',ARRAY['Full campaign design','Motion graphics pack','Unlimited revisions','Press kit included','Print + digital files','Dedicated art director'],false,3);
  END IF;
END $$;
