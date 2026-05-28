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
  const row = btn.closest('.font-row');
  const section = row.dataset.fontSection;
  const name    = row.querySelector('.font-name-input').value.trim();
  if (!name) return;
  const url = `https://fonts.googleapis.com/css2?family=${name.replace(/ /g, '+')}:wght@400;600;700&display=swap`;
  await db.from('site_settings').upsert({
    section,
    font_family: name,
    google_fonts_url: url,
    updated_at: new Date().toISOString()
  }, { onConflict: 'section' });
  toast(`Font saved for ${section}!`, 'success');
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

  allCategories.forEach(cat => {
    const block = document.createElement('div');
    block.className = 'category-block';
    block.dataset.id = cat.id;
    block.innerHTML = `
      <div class="category-header" onclick="toggleCategory(this)">
        <span class="category-icon">${cat.icon || '📁'}</span>
        <span class="category-name">${cat.name}</span>
        <label class="toggle" onclick="event.stopPropagation()">
          <input type="checkbox" ${cat.enabled ? 'checked' : ''} onchange="toggleCatEnabled(${cat.id}, this.checked)">
          <span class="toggle-slider"></span>
        </label>
        <span class="chevron">▼</span>
      </div>
      <div class="category-body" id="cat-body-${cat.id}">
        <div class="item-list" id="items-${cat.id}"></div>
        <button class="btn-add" onclick="addItem(${cat.id}, '${cat.slug}')">+ Add Item</button>
      </div>`;
    container.appendChild(block);
    loadCategoryItems(cat.id, cat.slug);
  });
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
