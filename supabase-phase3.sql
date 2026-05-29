-- ============================================================
-- PHASE 3: Contact Info + Pricing Plans tables
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Contact info (single row, id=1)
CREATE TABLE IF NOT EXISTS contact_info (
  id          int primary key default 1,
  email       text default 'hello@cinemax.in',
  whatsapp    text default '919999999999',
  location    text default 'Chennai, Tamil Nadu, India',
  instagram_url text default '',
  youtube_url   text default '',
  linkedin_url  text default '',
  hero_logo_url text default '',
  about_title   text default 'We Craft Cinematic Experiences',
  about_desc    text default 'Cinemax is a full-spectrum creative studio bringing stories to life through sound and vision.',
  about_image_url text default '',
  stat1_num   text default '100+',
  stat1_label text default 'Projects',
  stat2_num   text default '50+',
  stat2_label text default 'Clients',
  stat3_num   text default '5+',
  stat3_label text default 'Years'
);

-- Insert default row if not exists
INSERT INTO contact_info (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Pricing plans
CREATE TABLE IF NOT EXISTS pricing_plans (
  id          serial primary key,
  category    text not null,
  tier_name   text not null,
  price       text not null,
  unit        text default '',
  description text default '',
  features    jsonb default '[]',
  is_featured boolean default false,
  sort_order  int default 0
);

-- RLS
ALTER TABLE contact_info ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read contact_info" ON contact_info;
CREATE POLICY "Public read contact_info" ON contact_info FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anon write contact_info" ON contact_info;
CREATE POLICY "Anon write contact_info" ON contact_info FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE pricing_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read pricing_plans" ON pricing_plans;
CREATE POLICY "Public read pricing_plans" ON pricing_plans FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anon write pricing_plans" ON pricing_plans;
CREATE POLICY "Anon write pricing_plans" ON pricing_plans FOR ALL USING (true) WITH CHECK (true);

-- Seed default pricing data (using ::jsonb cast to avoid array-literal parse error)
INSERT INTO pricing_plans (category, tier_name, price, unit, description, features, is_featured, sort_order) VALUES
('music','Basic','5,000','/ track','Perfect for short films, reels, and single-track projects.','["1 original track","Basic mix & balance","2 revisions","WAV + MP3 delivery","5-day turnaround"]'::jsonb,false,1),
('music','Standard','15,000','/ project','Ideal for short films, web series, and branded content.','["3 original tracks","Full mix & mastering","5 revisions","Stems included","Sync-ready delivery","8-day turnaround"]'::jsonb,true,2),
('music','Premium','35,000','/ project','Full cinematic score for feature films and major campaigns.','["5+ original tracks","Full orchestral production","Unlimited revisions","All stems + license","Dolby Atmos mix","Priority support"]'::jsonb,false,3),
('sfx','Basic','3,000','/ pack','Quick custom SFX for short-form content.','["10 custom SFX","WAV format 48kHz","2 revisions per sound","3-day turnaround"]'::jsonb,false,1),
('sfx','Standard','8,000','/ pack','Comprehensive SFX for web series and ad films.','["30 custom SFX","Categorised library","WAV + AIFF formats","Unlimited revisions","5-day turnaround"]'::jsonb,true,2),
('sfx','Premium','20,000','/ project','Full-film SFX suite with integration support.','["100+ custom SFX","Fully licensed","Multi-format delivery","On-site integration support","Priority turnaround"]'::jsonb,false,3),
('photography','Basic','4,000','/ session','Ideal for social media content and quick product shoots.','["1-hour shoot","1 location","20 edited photos","HD digital delivery","3-day delivery"]'::jsonb,false,1),
('photography','Standard','10,000','/ session','Perfect for events, brand campaigns, and portraits.','["3-hour shoot","2 locations","60 edited photos","Advanced retouching","Print-ready files","5-day delivery"]'::jsonb,true,2),
('photography','Premium','25,000','/ day','Full-day commercial and film promotional shoots.','["Full-day shoot (8 hrs)","Multiple locations","150+ edited photos","Full retouching suite","Exclusive license","BTS footage bonus"]'::jsonb,false,3),
('design','Basic','3,500','/ project','Launch-ready visuals for small releases and events.','["Logo design","3 social media templates","2 revisions","PNG + PDF files","4-day turnaround"]'::jsonb,false,1),
('design','Standard','9,000','/ project','Full brand kit for films, albums, and brand launches.','["Full brand identity","Movie / album poster","10 social templates","5 revisions","Print-ready files","7-day turnaround"]'::jsonb,true,2),
('design','Premium','22,000','/ project','Complete publicity campaign for major theatrical releases.','["Full campaign design","Motion graphics pack","Unlimited revisions","Press kit included","Print + digital files","Dedicated art director"]'::jsonb,false,3)
ON CONFLICT DO NOTHING;
