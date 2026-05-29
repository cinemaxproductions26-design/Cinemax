// ============================================================
// SUPABASE CONFIG
// 1. Go to https://supabase.com/dashboard → your project → Settings → API
// 2. Copy "Project URL" and "anon public" key and paste below
// ============================================================
const SUPABASE_URL  = 'https://hfrtfuawsvgkmdriuhay.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmcnRmdWF3c3Zna21kcml1aGF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5ODI1NDYsImV4cCI6MjA5NTU1ODU0Nn0.I5IRRL3x_A2Y36oHIi6DUlgYgf4CP4xYfld29U7ONP4';
const ADMIN_EMAIL   = 'cinemaxproductions26@gmail.com'; // admin login email

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
async function fetchContactInfo() {
  const { data } = await db.from('contact_info').select('*').eq('id', 1).single();
  return data || null;
}
async function fetchPricingPlans(category) {
  let q = db.from('pricing_plans').select('*').order('sort_order');
  if (category) q = q.eq('category', category);
  const { data } = await q;
  return data || [];
}

// ── Apply settings to CSS variables ──────────────────────────
function applySettings(settings) {
  const root = document.documentElement;
  const injected = new Set();
  settings.forEach(s => {
    if (s.bg_color)     root.style.setProperty('--bg-primary', s.bg_color);
    if (s.accent_color) root.style.setProperty('--accent-red', s.accent_color);

    if (s.font_family && s.google_fonts_url && !injected.has(s.google_fonts_url)) {
      const isCustomFile = s.google_fonts_url.includes('supabase') ||
                           s.google_fonts_url.match(/\.(ttf|woff2?|otf)(\?|$)/i);
      if (isCustomFile) {
        const fmt = /\.woff2(\?|$)/i.test(s.google_fonts_url) ? 'woff2'
                  : /\.woff(\?|$)/i.test(s.google_fonts_url)  ? 'woff'
                  : /\.ttf(\?|$)/i.test(s.google_fonts_url)   ? 'truetype'
                  : /\.otf(\?|$)/i.test(s.google_fonts_url)   ? 'opentype'
                  : 'woff2';
        const style = document.createElement('style');
        style.textContent = `@font-face { font-family: '${s.font_family}'; src: url('${s.google_fonts_url}') format('${fmt}'); font-display: swap; }`;
        document.head.appendChild(style);
      } else {
        // Google Fonts URL
        const l = document.createElement('link');
        l.rel = 'stylesheet'; l.href = s.google_fonts_url;
        document.head.appendChild(l);
      }
      injected.add(s.google_fonts_url);
    }

    if (s.font_family) {
      const v = `'${s.font_family}', sans-serif`;
      if (s.section === 'heading') root.style.setProperty('--font-heading', v);
      if (s.section === 'body')    root.style.setProperty('--font-body', v);
      if (s.section === 'nav')     root.style.setProperty('--font-nav', v);
    }
  });
}
