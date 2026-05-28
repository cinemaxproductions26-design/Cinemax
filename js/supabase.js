// ============================================================
// SUPABASE CONFIG
// 1. Go to https://supabase.com/dashboard → your project → Settings → API
// 2. Copy "Project URL" and "anon public" key and paste below
// ============================================================
const SUPABASE_URL  = 'YOUR_SUPABASE_PROJECT_URL';
const SUPABASE_ANON = 'YOUR_SUPABASE_ANON_KEY';
const ADMIN_EMAIL   = 'admin@cinemax.in'; // used for admin login (hidden from UI)

let db;
try {
  db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
} catch(e) {
  console.warn('Supabase not initialised — using static content');
}

// ── Admin auth ────────────────────────────────────────────────
async function adminLogin(password) {
  const { data, error } = await db.auth.signInWithPassword({ email: ADMIN_EMAIL, password });
  return { data, error };
}
async function adminLogout()  { await db.auth.signOut(); }
async function adminSession() { const { data } = await db.auth.getSession(); return data.session; }

// ── Fetch helpers (public) ────────────────────────────────────
async function fetchSettings() {
  const { data } = await db.from('site_settings').select('*');
  return data || [];
}
async function fetchCategories() {
  const { data } = await db.from('portfolio_categories').select('*').order('sort_order');
  return data || [];
}
async function fetchItems(slug) {
  const { data } = await db.from('portfolio_items').select('*')
    .eq('category_slug', slug).eq('enabled', true).order('sort_order');
  return data || [];
}
async function fetchAlbums() {
  const { data } = await db.from('photo_albums').select('*')
    .eq('enabled', true).order('sort_order');
  return data || [];
}
async function fetchPhotos(albumId) {
  const { data } = await db.from('portfolio_items').select('*')
    .eq('category_slug', 'photography').eq('album_id', albumId)
    .eq('enabled', true).order('sort_order');
  return data || [];
}
async function fetchClients() {
  const { data } = await db.from('clients').select('*')
    .eq('enabled', true).order('sort_order');
  return data || [];
}
async function fetchTestimonials() {
  const { data } = await db.from('testimonials').select('*')
    .eq('enabled', true).order('sort_order');
  return data || [];
}

// ── Apply settings to CSS variables ──────────────────────────
function applySettings(settings) {
  const root = document.documentElement;
  const injected = new Set();
  settings.forEach(s => {
    if (s.bg_color)            root.style.setProperty('--bg-primary', s.bg_color);
    if (s.accent_color)        root.style.setProperty('--accent-red', s.accent_color);
    if (s.google_fonts_url && !injected.has(s.google_fonts_url)) {
      const l = document.createElement('link');
      l.rel = 'stylesheet'; l.href = s.google_fonts_url;
      document.head.appendChild(l);
      injected.add(s.google_fonts_url);
    }
    if (s.font_family) {
      const v = `'${s.font_family}', sans-serif`;
      if (s.section === 'heading' || s.section === 'global')
        root.style.setProperty('--font-heading', v);
      if (s.section === 'body' || s.section === 'global')
        root.style.setProperty('--font-body', v);
    }
  });
}
