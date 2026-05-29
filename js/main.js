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
      if (clients.length <= 4) {
        // Few clients — show centered static layout instead of marquee
        const section = document.getElementById('clients');
        const wraps = section ? section.querySelectorAll('.marquee-wrap') : [];
        wraps.forEach(w => w.style.display = 'none');
        const centered = document.createElement('div');
        centered.className = 'clients-centered';
        clients.forEach(c => {
          const div = document.createElement('div');
          div.className = 'client-logo';
          div.innerHTML = c.logo_url
            ? `<img src="${c.logo_url}" alt="${c.name}" style="max-height:40px;max-width:130px;object-fit:contain">`
            : c.name;
          centered.appendChild(div);
        });
        if (section) section.querySelector('.container').after(centered);
      } else {
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
    // ── Contact info + Hero logo + About section ──
    const info = await fetchContactInfo();
    if (info) {
      // Hero logo
      if (info.hero_logo_url) {
        const logo = document.getElementById('hero-logo-img');
        if (logo) { logo.src = info.hero_logo_url; logo.style.display = 'block'; }
      }
      // About
      const setEl = (id, val) => { const el = document.getElementById(id); if (el && val) el.textContent = val; };
      setEl('about-title',  info.about_title);
      setEl('about-desc',   info.about_description);
      setEl('stat1-num',    info.stat1_num);  setEl('stat1-label', info.stat1_label);
      setEl('stat2-num',    info.stat2_num);  setEl('stat2-label', info.stat2_label);
      setEl('stat3-num',    info.stat3_num);  setEl('stat3-label', info.stat3_label);
      if (info.about_image_url) {
        const img = document.getElementById('about-image');
        if (img) { img.src = info.about_image_url; img.style.opacity = '1'; }
      }
      // Contact section
      const cEmail = document.getElementById('contact-email');
      if (cEmail && info.email) { cEmail.textContent = info.email; cEmail.href = 'mailto:' + info.email; }
      const cWa = document.getElementById('contact-whatsapp');
      if (cWa && info.whatsapp) {
        const num = info.whatsapp.replace(/\D/g,'');
        cWa.href = 'https://wa.me/' + num;
        cWa.textContent = '+' + num;
      }
      const cLoc = document.getElementById('contact-location');
      if (cLoc && info.location) cLoc.textContent = info.location;
      const cInsta = document.getElementById('contact-instagram');
      if (cInsta) { if (info.instagram_url) { cInsta.href = info.instagram_url; cInsta.style.display=''; } else cInsta.style.display='none'; }
      const cYt = document.getElementById('contact-youtube');
      if (cYt) { if (info.youtube_url) { cYt.href = info.youtube_url; cYt.style.display=''; } else cYt.style.display='none'; }
      const cLi = document.getElementById('contact-linkedin');
      if (cLi) { if (info.linkedin_url) { cLi.href = info.linkedin_url; cLi.style.display=''; } else cLi.style.display='none'; }
      // Update all WhatsApp links site-wide
      if (info.whatsapp) {
        const waNum = info.whatsapp.replace(/\D/g,'');
        document.querySelectorAll('a[href*="wa.me"]').forEach(a => {
          const url = new URL(a.href);
          const text = url.searchParams.get('text') || '';
          a.href = 'https://wa.me/' + waNum + (text ? '?text=' + encodeURIComponent(text) : '');
        });
      }
    }

    // ── Pricing from Supabase ──
    const plans = await fetchPricingPlans();
    const pricingDynamic = document.getElementById('pricing-dynamic');
    const pricingStatic  = document.getElementById('pricing-static');
    if (plans.length && pricingDynamic) {
      const tabMap = { music:'music', sfx:'sfx', photography:'photo', design:'design' };
      const cats = ['music','sfx','photography','design'];
      let html = '';
      cats.forEach((cat, idx) => {
        const tabId = tabMap[cat];
        const catPlans = plans.filter(p => p.category === cat).sort((a,b) => a.sort_order - b.sort_order);
        if (!catPlans.length) return;
        html += `<div class="pricing-panel${idx===0?' active':''}" id="dyn-tab-${tabId}">
          <div class="pricing-cards">`;
        catPlans.forEach(p => {
          html += `<div class="pricing-card${p.is_featured?' featured':''}">
            ${p.is_featured ? '<p class="pricing-badge">Most Popular</p>' : ''}
            <p class="pricing-tier">${p.tier_name}</p>
            <p class="pricing-price">${p.price} <span>${p.unit||''}</span></p>
            <p class="pricing-desc">${p.description||''}</p>
            <ul class="pricing-features">
              ${(p.features||[]).map(f=>`<li>${f}</li>`).join('')}
            </ul>
            <a href="#contact" class="btn ${p.is_featured?'btn-red':'btn-outline'}">Get Quote →</a>
          </div>`;
        });
        html += `</div></div>`;
      });
      pricingDynamic.innerHTML = html;
      if (pricingStatic) pricingStatic.style.display = 'none';
      // Re-wire tab buttons to dynamic panels
      document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
          document.querySelectorAll('#pricing-dynamic .pricing-panel').forEach(p => p.classList.remove('active'));
          btn.classList.add('active');
          const panel = document.getElementById('dyn-tab-' + btn.dataset.tab);
          if (panel) panel.classList.add('active');
        });
      });
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
