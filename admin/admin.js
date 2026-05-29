// ── Toast notification ────────────────────────────────────────
function toast(msg, type = '') {
  let t = document.getElementById('toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.className = 'toast ' + type;
  void t.offsetWidth;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ── Login (simple password check) ────────────────────────────
// Password stored in localStorage so admin can change it via UI
const ADMIN_PASSWORD = localStorage.getItem('cinemax_admin_pass') || 'CINEMAX';

async function doLogin() {
  const pass = document.getElementById('adminPass').value.trim();
  const err  = document.getElementById('loginError');
  const btn  = document.getElementById('loginBtn');
  if (!pass) return;

  btn.textContent = 'Logging in…';
  btn.disabled = true;

  if (pass !== ADMIN_PASSWORD) {
    err.textContent = 'Wrong password. Try again.';
    btn.textContent = 'Login';
    btn.disabled = false;
    return;
  }

  sessionStorage.setItem('cinemax_admin', '1');
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('dashboard').classList.remove('hidden');
  initDashboard();

}

document.getElementById('adminPass')?.addEventListener('keydown', e => {
  if (e.key === 'Enter') doLogin();
});
document.getElementById('loginBtn')?.addEventListener('click', doLogin);

// Check existing session on load
(function checkSession() {
  if (sessionStorage.getItem('cinemax_admin') === '1') {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
    initDashboard();
  }
})();

// ── Dashboard init ────────────────────────────────────────────
async function initDashboard() {
  setupSidebar();
  await loadSettings();
  await loadFonts();
  await loadContactInfoAdmin();
  await loadCategories();
  await loadClients();
  await loadTestimonials();
}

// ── Sidebar navigation ────────────────────────────────────────
function setupSidebar() {
  document.querySelectorAll('.sidebar-nav a').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      document.querySelectorAll('.sidebar-nav a').forEach(x => x.classList.remove('active'));
      document.querySelectorAll('.admin-panel').forEach(x => x.classList.remove('active'));
      a.classList.add('active');
      document.getElementById('panel-' + a.dataset.section).classList.add('active');
    });
  });
  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    sessionStorage.removeItem('cinemax_admin');
    location.reload();
  });
}

// ── SETTINGS PANEL ────────────────────────────────────────────
async function loadSettings() {
  const settings = await fetchSettings();
  const global = settings.find(s => s.section === 'global') || {};

  const fields = {
    'set-bg':      global.bg_color    || '#07070f',
    'set-accent':  global.accent_color || '#cc1a2e',
    'set-bg2':     global.bg_secondary || '#0d0d1a',
    'set-card':    global.card_color   || '#111120',
  };

  Object.entries(fields).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) {
      el.value = val;
      const preview = el.parentElement.querySelector('.color-preview-text');
      if (preview) preview.textContent = val;
      el.addEventListener('input', () => {
        if (preview) preview.textContent = el.value;
        document.documentElement.style.setProperty(el.dataset.var, el.value);
      });
    }
  });
}

async function saveSettings() {
  const payload = {
    section:      'global',
    bg_color:     document.getElementById('set-bg').value,
    accent_color: document.getElementById('set-accent').value,
    updated_at:   new Date().toISOString()
  };
  await db.from('site_settings').upsert(payload, { onConflict: 'section' });
  toast('Settings saved!', 'success');
}

// ── FONTS PANEL ───────────────────────────────────────────────
async function loadFonts() {
  const settings = await fetchSettings();
  settings.forEach(s => {
    const row = document.querySelector(`[data-font-section="${s.section}"]`);
    if (row && s.font_family) row.querySelector('.font-name-input').value = s.font_family;
  });
}

function previewFont(btn) {
  const row = btn.closest('.font-row');
  const name = row.querySelector('.font-name-input').value.trim();
  if (!name) return;
  const url = `https://fonts.googleapis.com/css2?family=${name.replace(/ /g, '+')}:wght@400;600;700&display=swap`;
  let link = document.querySelector(`link[data-font="${name}"]`);
  if (!link) {
    link = document.createElement('link');
    link.rel = 'stylesheet';
    link.dataset.font = name;
    link.href = url;
    document.head.appendChild(link);
  }
  const preview = row.querySelector('.font-preview-text');
  if (preview) preview.style.fontFamily = `'${name}', sans-serif`;
  toast(`Previewing: ${name}`);
}

async function saveFont(btn) {
  const row     = btn.closest('.font-row');
  const section = row.dataset.fontSection;
  const name    = row.querySelector('.font-name-input').value.trim();
  if (!name) return;
  const url = `https://fonts.googleapis.com/css2?family=${name.replace(/ /g, '+')}:wght@400;600;700&display=swap`;
  await db.from('site_settings').upsert({
    section, font_family: name, google_fonts_url: url, updated_at: new Date().toISOString()
  }, { onConflict: 'section' });
  toast(`Font saved for ${section}!`, 'success');
}

async function uploadCustomFont(input, section) {
  const file = input.files[0];
  if (!file) return;
  const btn = input.closest('.font-row').querySelector('.btn-save');
  btn.textContent = 'Uploading…';
  btn.disabled = true;
  const ext  = file.name.split('.').pop().toLowerCase();
  const name = `font-${Date.now()}.${ext}`;
  const { data, error } = await db.storage.from(IMG_BUCKET).upload(`fonts/${name}`, file, { cacheControl: '31536000', upsert: false });
  if (error) { toast('Upload failed: ' + error.message); btn.textContent = 'Save'; btn.disabled = false; return; }
  const { data: urlData } = db.storage.from(IMG_BUCKET).getPublicUrl(`fonts/${name}`);
  const publicUrl = urlData.publicUrl;
  // Use filename without extension as font-family name
  const fontName = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
  const row = input.closest('.font-row');
  row.querySelector('.font-name-input').value = fontName;
  await db.from('site_settings').upsert({
    section, font_family: fontName, google_fonts_url: publicUrl, updated_at: new Date().toISOString()
  }, { onConflict: 'section' });
  btn.textContent = 'Save'; btn.disabled = false;
  toast(`Custom font uploaded & saved for ${section}!`, 'success');
}

// ── PORTFOLIO PANEL ───────────────────────────────────────────
let allCategories = [];

async function loadCategories() {
  allCategories = await fetchCategories();
  renderCategoryList();
}

function renderCategoryList() {
  const container = document.getElementById('category-list');
  if (!container) return;
  container.innerHTML = '';

  allCategories.forEach((cat, idx) => {
    const block = document.createElement('div');
    block.className = 'category-block';
    block.dataset.id = cat.id;
    // Use text name only — avoids emoji encoding bugs
    const safeName = cat.name.replace(/</g,'&lt;').replace(/>/g,'&gt;');
    block.innerHTML = `
      <div class="category-header" onclick="toggleCategory(this)">
        <div style="display:flex;gap:4px;flex-shrink:0" onclick="event.stopPropagation()">
          <button class="btn-sm" style="padding:2px 7px;font-size:0.75rem" onclick="moveCategory(${cat.id},-1)" title="Move up">▲</button>
          <button class="btn-sm" style="padding:2px 7px;font-size:0.75rem" onclick="moveCategory(${cat.id},1)" title="Move down">▼</button>
        </div>
        <span class="category-name" style="flex:1">${safeName}</span>
        <label class="toggle" onclick="event.stopPropagation()">
          <input type="checkbox" ${cat.enabled ? 'checked' : ''} onchange="toggleCatEnabled(${cat.id}, this.checked)">
          <span class="toggle-slider"></span>
        </label>
        <span class="chevron" style="pointer-events:none">▼</span>
      </div>
      <div class="category-body" id="cat-body-${cat.id}">
        <div class="item-list" id="items-${cat.id}"></div>
        <button class="btn-add" onclick="addItem(${cat.id}, '${cat.slug}')">+ Add Item</button>
      </div>`;
    container.appendChild(block);
    loadCategoryItems(cat.id, cat.slug);
  });
}

async function moveCategory(id, direction) {
  const idx = allCategories.findIndex(c => c.id === id);
  const swapIdx = idx + direction;
  if (swapIdx < 0 || swapIdx >= allCategories.length) return;
  // Swap sort_order values
  const a = allCategories[idx];
  const b = allCategories[swapIdx];
  await Promise.all([
    db.from('portfolio_categories').update({ sort_order: b.sort_order }).eq('id', a.id),
    db.from('portfolio_categories').update({ sort_order: a.sort_order }).eq('id', b.id)
  ]);
  // Re-sort locally and re-render
  [allCategories[idx], allCategories[swapIdx]] = [allCategories[swapIdx], allCategories[idx]];
  renderCategoryList();
}

function toggleCategory(header) {
  header.closest('.category-block').classList.toggle('open');
}

async function toggleCatEnabled(id, enabled) {
  await db.from('portfolio_categories').update({ enabled }).eq('id', id);
  toast(enabled ? 'Category enabled' : 'Category disabled', 'success');
}

async function loadCategoryItems(catId, slug) {
  const { data } = await db.from('portfolio_items').select('*')
    .eq('category_slug', slug).order('sort_order');
  const list = document.getElementById('items-' + catId);
  if (!list) return;
  list.innerHTML = '';
  (data || []).forEach(item => renderItemRow(list, item, slug));
}

function renderItemRow(container, item, slug) {
  const div = document.createElement('div');
  div.className = 'item-row';
  div.dataset.id = item.id;

  const isMusic   = slug === 'music';
  const isSFX     = slug === 'sfx';
  const isPhoto   = slug === 'photography';

  let extraFields = '';
  if (isMusic) {
    extraFields = `<input class="admin-input" placeholder="Spotify Track/Album URL" value="${item.media_url||''}" data-field="media_url" style="flex:2">`;
  } else if (isSFX) {
    extraFields = `
      <input class="admin-input" placeholder="YouTube URL" value="${item.media_url||''}" data-field="media_url" style="flex:2">
      <select class="admin-select" data-field="orientation">
        <option value="horizontal" ${item.orientation==='horizontal'?'selected':''}>16:9</option>
        <option value="vertical"   ${item.orientation==='vertical'?'selected':''}>9:16</option>
      </select>`;
  } else if (isPhoto) {
    extraFields = `<input class="admin-input" placeholder="Image URL" value="${item.media_url||''}" data-field="media_url" style="flex:2">`;
  } else {
    extraFields = `<input class="admin-input" placeholder="Image URL" value="${item.media_url||''}" data-field="media_url" style="flex:2">`;
  }

  div.innerHTML = `
    <input class="admin-input" placeholder="Title" value="${item.title||''}" data-field="title" style="flex:1.5">
    ${extraFields}
    <label class="toggle">
      <input type="checkbox" ${item.enabled?'checked':''}>
      <span class="toggle-slider"></span>
    </label>
    <button class="btn-sm" onclick="saveItem(this, ${item.id})">Save</button>
    <button class="btn-del" onclick="deleteItem(this, ${item.id})">✕</button>`;
  container.appendChild(div);
}

async function saveItem(btn, id) {
  const row = btn.closest('.item-row');
  const payload = { updated_at: new Date().toISOString() };
  row.querySelectorAll('[data-field]').forEach(el => {
    payload[el.dataset.field] = el.value;
  });
  payload.enabled = row.querySelector('input[type=checkbox]').checked;
  await db.from('portfolio_items').update(payload).eq('id', id);
  toast('Item saved!', 'success');
}

async function deleteItem(btn, id) {
  if (!confirm('Delete this item?')) return;
  await db.from('portfolio_items').delete().eq('id', id);
  btn.closest('.item-row').remove();
  toast('Item deleted');
}

async function addItem(catId, slug) {
  const { data } = await db.from('portfolio_items')
    .insert({ category_slug: slug, title: 'New Item', enabled: true, sort_order: 999 })
    .select().single();
  if (data) {
    const list = document.getElementById('items-' + catId);
    renderItemRow(list, data, slug);
    toast('Item added', 'success');
  }
}

// Add new category
async function addCategory() {
  const name = prompt('Category name:');
  if (!name) return;
  const slug = name.toLowerCase().replace(/\s+/g, '-');
  const { data } = await db.from('portfolio_categories')
    .insert({ name, slug, icon: '📁', enabled: true, sort_order: allCategories.length + 1 })
    .select().single();
  if (data) { allCategories.push(data); renderCategoryList(); toast('Category added', 'success'); }
}

// ── PHOTO ALBUMS ──────────────────────────────────────────────
async function loadAlbums() {
  const albums = await fetchAlbums();
  const container = document.getElementById('album-list');
  if (!container) return;
  container.innerHTML = '';
  albums.forEach(album => {
    const div = document.createElement('div');
    div.className = 'item-row';
    div.dataset.id = album.id;
    div.innerHTML = `
      <input class="admin-input" value="${album.title||''}" placeholder="Album title" data-field="title" style="flex:1.5">
      <input class="admin-input" value="${album.cover_url||''}" placeholder="Cover image URL" data-field="cover_url" style="flex:2">
      <label class="toggle">
        <input type="checkbox" ${album.enabled?'checked':''}>
        <span class="toggle-slider"></span>
      </label>
      <button class="btn-sm" onclick="saveAlbum(this, ${album.id})">Save</button>
      <button class="btn-del" onclick="deleteAlbum(this, ${album.id})">✕</button>`;
    container.appendChild(div);
  });
}

async function saveAlbum(btn, id) {
  const row = btn.closest('.item-row');
  const payload = { enabled: row.querySelector('input[type=checkbox]').checked, updated_at: new Date().toISOString() };
  row.querySelectorAll('[data-field]').forEach(el => payload[el.dataset.field] = el.value);
  await db.from('photo_albums').update(payload).eq('id', id);
  toast('Album saved!', 'success');
}

async function deleteAlbum(btn, id) {
  if (!confirm('Delete album?')) return;
  await db.from('photo_albums').delete().eq('id', id);
  btn.closest('.item-row').remove();
  toast('Album deleted');
}

async function addAlbum() {
  const { data } = await db.from('photo_albums')
    .insert({ title: 'New Album', enabled: true, sort_order: 999 }).select().single();
  if (data) { loadAlbums(); toast('Album added', 'success'); }
}

// ── CLIENTS PANEL ─────────────────────────────────────────────
async function loadClients() {
  const clients = await fetchClients();
  renderClients(clients);
}

function renderClients(clients) {
  const container = document.getElementById('clients-list');
  if (!container) return;
  container.innerHTML = '';
  clients.forEach(c => {
    const div = document.createElement('div');
    div.className = 'item-row';
    div.dataset.id = c.id;
    div.innerHTML = `
      <input class="admin-input" value="${c.name||''}" placeholder="Client name" data-field="name" style="flex:1">
      <input class="admin-input" value="${c.logo_url||''}" placeholder="Logo URL (or leave blank for text)" data-field="logo_url" style="flex:2">
      <input class="admin-input" value="${c.website_url||''}" placeholder="Website URL" data-field="website_url" style="flex:1.5">
      <label class="toggle">
        <input type="checkbox" ${c.enabled?'checked':''}>
        <span class="toggle-slider"></span>
      </label>
      <button class="btn-sm" onclick="saveClient(this, ${c.id})">Save</button>
      <button class="btn-del" onclick="deleteClient(this, ${c.id})">✕</button>`;
    container.appendChild(div);
  });
}

async function saveClient(btn, id) {
  const row = btn.closest('.item-row');
  const payload = { enabled: row.querySelector('input[type=checkbox]').checked };
  row.querySelectorAll('[data-field]').forEach(el => payload[el.dataset.field] = el.value);
  await db.from('clients').update(payload).eq('id', id);
  toast('Client saved!', 'success');
}

async function deleteClient(btn, id) {
  if (!confirm('Delete client?')) return;
  await db.from('clients').delete().eq('id', id);
  btn.closest('.item-row').remove();
  toast('Client deleted');
}

async function addClient() {
  const { data } = await db.from('clients')
    .insert({ name: 'New Client', enabled: true, sort_order: 999 }).select().single();
  if (data) { loadClients(); toast('Client added', 'success'); }
}

// ── TESTIMONIALS PANEL ────────────────────────────────────────
async function loadTestimonials() {
  const items = await fetchTestimonials();
  renderTestimonialsAdmin(items);
}

function renderTestimonialsAdmin(items) {
  const container = document.getElementById('testimonials-list');
  if (!container) return;
  container.innerHTML = '';
  items.forEach(t => {
    const div = document.createElement('div');
    div.className = 'admin-card';
    div.dataset.id = t.id;
    div.innerHTML = `
      <div class="form-row">
        <input class="admin-input" value="${t.name||''}" placeholder="Name" data-field="name">
        <input class="admin-input" value="${t.role||''}" placeholder="Role" data-field="role">
        <input class="admin-input" value="${t.avatar_initials||''}" placeholder="Initials (e.g. AK)" data-field="avatar_initials" style="min-width:80px;max-width:80px">
        <label class="toggle"><input type="checkbox" ${t.enabled?'checked':''}><span class="toggle-slider"></span></label>
      </div>
      <textarea class="admin-textarea" data-field="quote" placeholder="Testimonial quote">${t.quote||''}</textarea>
      <div class="form-row" style="margin-top:8px">
        <button class="btn-save" onclick="saveTestimonial(this, ${t.id})">Save</button>
        <button class="btn-del" onclick="deleteTestimonial(this, ${t.id})">Delete</button>
      </div>`;
    container.appendChild(div);
  });
}

async function saveTestimonial(btn, id) {
  const card = btn.closest('.admin-card');
  const payload = { enabled: card.querySelector('input[type=checkbox]').checked };
  card.querySelectorAll('[data-field]').forEach(el => payload[el.dataset.field] = el.value);
  await db.from('testimonials').update(payload).eq('id', id);
  toast('Testimonial saved!', 'success');
}

async function deleteTestimonial(btn, id) {
  if (!confirm('Delete testimonial?')) return;
  await db.from('testimonials').delete().eq('id', id);
  btn.closest('.admin-card').remove();
  toast('Deleted');
}

async function addTestimonial() {
  const { data } = await db.from('testimonials')
    .insert({ name: 'New Person', role: '', quote: '', avatar_initials: 'NP', enabled: true, sort_order: 999 })
    .select().single();
  if (data) { loadTestimonials(); toast('Testimonial added', 'success'); }
}

// ── IMAGE MANAGER (Supabase Storage) ─────────────────────────
const IMG_BUCKET = 'Cinemax-images'; // Supabase Storage bucket name

async function loadImageGallery() {
  const gallery = document.getElementById('imgGallery');
  if (!gallery) return;
  gallery.innerHTML = '<p style="color:var(--muted);font-size:0.82rem">Loading...</p>';
  try {
    const { data, error } = await db.storage.from(IMG_BUCKET).list('', { sortBy: { column: 'created_at', order: 'desc' } });
    if (error) { gallery.innerHTML = `<p style="color:#ff6b6b">Error: ${error.message}<br><small>Make sure bucket "${IMG_BUCKET}" exists in Supabase Storage</small></p>`; return; }
    if (!data || !data.length) { gallery.innerHTML = '<p style="color:var(--muted);font-size:0.82rem">No images yet — upload some above!</p>'; return; }
    gallery.innerHTML = '';
    data.filter(f => f.name && !f.name.endsWith('/')).forEach(file => {
      const { data: urlData } = db.storage.from(IMG_BUCKET).getPublicUrl(file.name);
      const url = urlData?.publicUrl || '';
      const div = document.createElement('div');
      div.className = 'img-thumb';
      div.innerHTML = `
        <img src="${url}" alt="${file.name}" loading="lazy">
        <button class="img-thumb-del" onclick="deleteImage('${file.name}', this)" title="Delete">✕</button>
        <button class="img-thumb-copy" onclick="copyImgUrl('${url}', this)">Copy URL</button>`;
      gallery.appendChild(div);
    });
  } catch(e) { gallery.innerHTML = `<p style="color:#ff6b6b">Storage not configured. Create bucket "${IMG_BUCKET}" in Supabase.</p>`; }
}

async function handleImageUpload(files) {
  if (!files || !files.length) return;
  const progress = document.getElementById('imgProgress');
  const bar = document.getElementById('imgProgressBar');
  if (progress) progress.style.display = 'block';
  let done = 0;
  for (const file of Array.from(files)) {
    const ext = file.name.split('.').pop();
    const name = `${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
    const { error } = await db.storage.from(IMG_BUCKET).upload(name, file, { cacheControl: '3600', upsert: false });
    done++;
    if (bar) bar.style.width = (done / files.length * 100) + '%';
    if (error) toast('Upload failed: ' + error.message);
    else toast('Uploaded: ' + file.name, 'success');
  }
  setTimeout(() => { if (progress) progress.style.display = 'none'; if (bar) bar.style.width = '0'; }, 1500);
  loadImageGallery();
}

async function deleteImage(name, btn) {
  if (!confirm('Delete this image? This cannot be undone.')) return;
  const { error } = await db.storage.from(IMG_BUCKET).remove([name]);
  if (error) toast('Delete failed: ' + error.message);
  else { btn.closest('.img-thumb').remove(); toast('Image deleted'); }
}

function copyImgUrl(url, btn) {
  navigator.clipboard.writeText(url).then(() => {
    const orig = btn.textContent;
    btn.textContent = '✓ Copied!';
    setTimeout(() => { btn.textContent = orig; }, 1500);
  });
}

// ── CONTACT INFO & ABOUT & HERO ──────────────────────────────
async function loadContactInfoAdmin() {
  try {
    const info = await fetchContactInfo();
    if (!info) return;
    const set = (id, val) => { const el = document.getElementById(id); if (el && val !== null && val !== undefined) el.value = val; };
    set('ci-email',      info.email);
    set('ci-whatsapp',   info.whatsapp);
    set('ci-location',   info.location);
    set('ci-instagram',  info.instagram_url);
    set('ci-youtube',    info.youtube_url);
    set('ci-linkedin',   info.linkedin_url);
    set('ci-hero-logo',  info.hero_logo_url);
    set('ci-about-title', info.about_title);
    set('ci-about-desc',  info.about_desc);
    set('ci-about-image', info.about_image_url);
    set('ci-stat1-num',   info.stat1_num);   set('ci-stat1-label', info.stat1_label);
    set('ci-stat2-num',   info.stat2_num);   set('ci-stat2-label', info.stat2_label);
    set('ci-stat3-num',   info.stat3_num);   set('ci-stat3-label', info.stat3_label);
  } catch(e) {}
}

async function saveContactInfo() {
  const get = id => { const el = document.getElementById(id); return el ? el.value : null; };
  const payload = {
    id: 1,
    email:              get('ci-email'),
    whatsapp:           get('ci-whatsapp'),
    location:           get('ci-location'),
    instagram_url:      get('ci-instagram'),
    youtube_url:        get('ci-youtube'),
    linkedin_url:       get('ci-linkedin'),
    hero_logo_url:      get('ci-hero-logo'),
    about_title:        get('ci-about-title'),
    about_desc:         get('ci-about-desc'),
    about_image_url:    get('ci-about-image'),
    stat1_num:          get('ci-stat1-num'),   stat1_label: get('ci-stat1-label'),
    stat2_num:          get('ci-stat2-num'),   stat2_label: get('ci-stat2-label'),
    stat3_num:          get('ci-stat3-num'),   stat3_label: get('ci-stat3-label'),
    updated_at:         new Date().toISOString()
  };
  // Remove null values
  Object.keys(payload).forEach(k => { if (payload[k] === null) delete payload[k]; });
  const { error } = await db.from('contact_info').upsert(payload, { onConflict: 'id' });
  if (error) toast('Error: ' + error.message);
  else toast('Saved! Refresh the live site to see changes.', 'success');
}

// ── PRICING EDITOR ────────────────────────────────────────────
let pricingData = [];

async function loadPricingEditor() {
  try {
    pricingData = await fetchPricingPlans();
  } catch(e) { pricingData = []; }
  renderPricingEditor('music');
}

function renderPricingEditor(cat) {
  const container = document.getElementById('pricing-editor-content');
  if (!container) return;
  const cats = ['music','sfx','photography','design'];
  let html = '';
  cats.forEach(c => {
    const plans = pricingData.filter(p => p.category === c).sort((a,b) => a.sort_order - b.sort_order);
    html += `<div class="pricing-cat-panel${c===cat?' active':''}" id="pcat-${c}">`;
    if (!plans.length) {
      html += `<div class="admin-card" style="text-align:center;color:var(--muted)">No plans yet — <button class="btn-save" onclick="addPricingPlan('${c}')">+ Add Plan</button></div>`;
    } else {
      plans.forEach(p => { html += renderPlanCard(p); });
      html += `<button class="btn-sm" style="margin-top:8px" onclick="addPricingPlan('${c}')">+ Add Plan</button>`;
    }
    html += `</div>`;
  });
  container.innerHTML = html;
}

function renderPlanCard(p) {
  const feats = (p.features || []).map((f,i) => `
    <div class="feature-item">
      <input class="admin-input" value="${f}" placeholder="Feature ${i+1}" data-feat="${i}">
      <button class="btn-del" style="padding:4px 8px" onclick="removeFeature(this,${p.id})">✕</button>
    </div>`).join('');
  return `<div class="plan-card${p.is_featured?' is-featured':''}" data-plan-id="${p.id}">
    <div class="plan-header">
      <span class="plan-title">${p.tier_name}</span>
      <label class="featured-toggle">
        <input type="checkbox" ${p.is_featured?'checked':''} onchange="toggleFeatured(this,${p.id})">
        ⭐ Most Popular
      </label>
    </div>
    <div class="plan-fields">
      <div>
        <label class="form-label" style="margin-bottom:4px;display:block">Tier Name</label>
        <input class="admin-input" value="${p.tier_name||''}" placeholder="Basic" data-field="tier_name">
      </div>
      <div>
        <label class="form-label" style="margin-bottom:4px;display:block">Price</label>
        <input class="admin-input" value="${p.price||''}" placeholder="₹5,000" data-field="price">
      </div>
      <div>
        <label class="form-label" style="margin-bottom:4px;display:block">Unit</label>
        <input class="admin-input" value="${p.unit||''}" placeholder="/ track" data-field="unit">
      </div>
      <div>
        <label class="form-label" style="margin-bottom:4px;display:block">Sort Order</label>
        <input class="admin-input" value="${p.sort_order||0}" type="number" data-field="sort_order">
      </div>
      <textarea class="admin-textarea" placeholder="Short description..." data-field="description" rows="2">${p.description||''}</textarea>
      <div class="features-list">
        <label class="form-label" style="margin-bottom:6px;display:block">Features (✓ list)</label>
        <div class="features-inputs" id="feats-${p.id}">${feats}</div>
        <button class="add-feature-btn" onclick="addFeatureInput(${p.id})">+ Add Feature</button>
      </div>
    </div>
    <div style="display:flex;gap:8px;margin-top:12px">
      <button class="btn-save" onclick="savePlanCard(this,${p.id})">Save</button>
      <button class="btn-del" onclick="deletePlan(this,${p.id})">Delete</button>
    </div>
  </div>`;
}

async function savePlanCard(btn, id) {
  const card = btn.closest('.plan-card');
  const get = field => { const el = card.querySelector(`[data-field="${field}"]`); return el ? el.value : ''; };
  // Collect features
  const features = Array.from(card.querySelectorAll('.features-inputs input')).map(i => i.value).filter(v => v.trim());
  const payload = {
    tier_name:   get('tier_name'),
    price:       get('price'),
    unit:        get('unit'),
    description: get('description'),
    sort_order:  parseInt(get('sort_order')) || 0,
    features
  };
  const { error } = await db.from('pricing_plans').update(payload).eq('id', id);
  if (error) toast('Error: ' + error.message);
  else { toast('Plan saved!', 'success'); loadPricingEditor(); }
}

async function toggleFeatured(checkbox, id) {
  const card = checkbox.closest('.plan-card');
  card.classList.toggle('is-featured', checkbox.checked);
  await db.from('pricing_plans').update({ is_featured: checkbox.checked }).eq('id', id);
  toast(checkbox.checked ? '⭐ Set as Most Popular' : 'Removed Most Popular', 'success');
}

async function addPricingPlan(cat) {
  const { data } = await db.from('pricing_plans')
    .insert({ category: cat, tier_name: 'New Plan', price: '₹0', unit: '', description: '', features: [], is_featured: false, sort_order: 999 })
    .select().single();
  if (data) { pricingData.push(data); renderPricingEditor(cat); toast('Plan added', 'success'); }
}

async function deletePlan(btn, id) {
  if (!confirm('Delete this pricing plan?')) return;
  await db.from('pricing_plans').delete().eq('id', id);
  pricingData = pricingData.filter(p => p.id !== id);
  const cat = btn.closest('.pricing-cat-panel')?.id?.replace('pcat-','') || 'music';
  renderPricingEditor(cat);
  toast('Deleted');
}

function addFeatureInput(planId) {
  const container = document.getElementById('feats-' + planId);
  if (!container) return;
  const idx = container.querySelectorAll('.feature-item').length;
  const div = document.createElement('div');
  div.className = 'feature-item';
  div.innerHTML = `<input class="admin-input" placeholder="New feature" data-feat="${idx}">
    <button class="btn-del" style="padding:4px 8px" onclick="this.parentElement.remove()">✕</button>`;
  container.appendChild(div);
}

function removeFeature(btn) {
  btn.closest('.feature-item').remove();
}

// ── PASSWORD CHANGE ───────────────────────────────────────────
function changePassword() {
  const np  = document.getElementById('new-password').value;
  const cp  = document.getElementById('confirm-password').value;
  const err = document.getElementById('pass-error');
  if (!np || np.length < 6) { err.textContent = 'Password must be at least 6 characters.'; return; }
  if (np !== cp)             { err.textContent = 'Passwords do not match.'; return; }
  // Store new password in localStorage (persists on this device)
  localStorage.setItem('cinemax_admin_pass', np);
  err.textContent = '';
  toast('Password updated! Use the new password next time you log in.', 'success');
  document.getElementById('new-password').value   = '';
  document.getElementById('confirm-password').value = '';
}
