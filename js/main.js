// Navbar scroll effect
const navbar = document.getElementById('navbar');
if (navbar) {
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  });
}

// Mobile nav toggle
const navToggle = document.getElementById('navToggle');
const navLinks  = document.querySelector('.nav-links');
if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
  document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => navLinks.classList.remove('open'));
  });
}

// Fade-in on scroll
const observer = new IntersectionObserver(
  entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
  { threshold: 0.1 }
);
document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

// Testimonial slider
(function () {
  const slider = document.getElementById('testimonialSlider');
  const dotsEl  = document.getElementById('testimonialDots');
  if (!slider || !dotsEl) return;

  const cards = Array.from(slider.querySelectorAll('.testimonial-card'));
  if (!cards.length) return;

  let current = 0;
  let timer;

  // Build dots
  cards.forEach((_, i) => {
    const d = document.createElement('button');
    d.className = 'dot' + (i === 0 ? ' active' : '');
    d.setAttribute('aria-label', 'Go to slide ' + (i + 1));
    d.addEventListener('click', () => goTo(i));
    dotsEl.appendChild(d);
  });

  function goTo(index) {
    current = (index + cards.length) % cards.length;
    const gap   = 24;
    const width = cards[0].offsetWidth + gap;
    slider.scrollTo({ left: width * current, behavior: 'smooth' });
    dotsEl.querySelectorAll('.dot').forEach((d, i) => d.classList.toggle('active', i === current));
  }

  function start() {
    clearInterval(timer);
    timer = setInterval(() => goTo(current + 1), 4000);
  }

  start();
  slider.addEventListener('mouseenter', () => clearInterval(timer));
  slider.addEventListener('mouseleave', start);
  slider.addEventListener('touchstart', () => clearInterval(timer), { passive: true });
  slider.addEventListener('touchend', start, { passive: true });
})();

// Pricing tabs
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.pricing-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    const panel = document.getElementById('tab-' + tab);
    if (panel) panel.classList.add('active');
  });
});

// ── Supabase dynamic loading ───────────────────────────────────
(async function loadFromSupabase() {
  if (typeof db === 'undefined') return;
  try {
    // Apply settings (colors, fonts)
    const settings = await fetchSettings();
    if (settings.length) applySettings(settings);

    // Portfolio category visibility
    const categories = await fetchCategories();
    if (categories.length) {
      const enabledMap = {};
      categories.forEach(c => enabledMap[c.slug] = c.enabled);
      document.querySelectorAll('.portfolio-card').forEach(card => {
        const href = card.getAttribute('href') || '';
        const slug = href.includes('music') ? 'music'
                   : href.includes('sfx')   ? 'sfx'
                   : href.includes('photo') ? 'photography'
                   : href.includes('publicity') ? 'design' : null;
        if (slug !== null && enabledMap[slug] === false) card.style.display = 'none';
      });
    }

    // Load clients from Supabase
    const clients = await fetchClients();
    if (clients.length) {
      function buildMarqueeRow(items) {
        return [...items, ...items].map(c => {
          if (c.logo_url) {
            return `<div class="client-logo"><img src="${c.logo_url}" alt="${c.name}" style="max-height:40px;max-width:130px;object-fit:contain"></div>`;
          }
          return `<div class="client-logo">${c.name}</div>`;
        }).join('');
      }
      const tracks = document.querySelectorAll('.marquee-track');
      if (tracks[0]) tracks[0].innerHTML = buildMarqueeRow(clients);
      if (tracks[1]) tracks[1].innerHTML = buildMarqueeRow([...clients].reverse());
    }

    // Load testimonials from Supabase
    const tData = await fetchTestimonials();
    if (tData.length) {
      const slider = document.getElementById('testimonialSlider');
      const dotsEl = document.getElementById('testimonialDots');
      if (slider) {
        slider.innerHTML = tData.map(t => `
          <div class="testimonial-card">
            <div class="t-profile">
              <div class="t-avatar">${t.avatar_initials || t.name.slice(0,2).toUpperCase()}</div>
              <div>
                <p class="t-name">${t.name}</p>
                <p class="t-role">${t.role || ''}</p>
              </div>
            </div>
            <p class="t-quote">"${t.quote}"</p>
            <div class="t-stars">${'★'.repeat(t.rating || 5)}</div>
          </div>`).join('');
        // Reinit dots
        if (dotsEl) {
          dotsEl.innerHTML = '';
          tData.forEach((_, i) => {
            const d = document.createElement('button');
            d.className = 'dot' + (i===0?' active':'');
            d.addEventListener('click', () => goTo(i));
            dotsEl.appendChild(d);
          });
        }
      }
    }
  } catch(e) { /* Supabase not configured — use static content */ }
})();

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});
