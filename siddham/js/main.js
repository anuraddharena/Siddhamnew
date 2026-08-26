/* ============================================================
   Siddham - shared UI (language toggle, cart count, branding)
   ============================================================ */

// ---------- Apply branding to any page ----------
function applyBranding() {
  const b = DB.get(DB.keys.branding, {});
  // Logo
  document.querySelectorAll('img.logo-img, img.header-logo, img.login-logo, img.brand-logo, img.crest-logo, img.crest-logo-big, img.footer-logo, #siteLogo, #heroLogo').forEach(img => {
    if (b.logo) img.src = b.logo;
  });
  // Hero image
  document.querySelectorAll('img.hero-img, img.banner-img').forEach(img => {
    if (b.hero) img.src = b.hero;
  });
  // Titles / descriptions (only on index page)
  const t = document.querySelector('.site-title');
  if (t) { t.dataset.si = b.titleSi; t.dataset.en = b.titleEn; }
  const tg = document.querySelector('.tagline');
  if (tg) { tg.dataset.si = b.tagSi; tg.dataset.en = b.tagEn; }
  const d = document.querySelector('.description');
  if (d) { d.dataset.si = b.descSi; d.dataset.en = b.descEn; }
}

// ---------- Language switching ----------
function applyLang() {
  const lang = DB.get(DB.keys.lang, 'si');
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-si]').forEach(el => {
    el.textContent = el.dataset[lang] || el.textContent;
  });
  const btn = document.getElementById('langBtn');
  if (btn) btn.textContent = lang === 'si' ? 'English' : 'සිංහල';
}

function toggleLang() {
  const cur = DB.get(DB.keys.lang, 'si');
  DB.set(DB.keys.lang, cur === 'si' ? 'en' : 'si');
  applyLang();
}

// ---------- Cart count ----------
function updateCartCount() {
  const cart = DB.get(DB.keys.cart, []);
  const n = cart.reduce((s, i) => s + i.qty, 0);
  document.querySelectorAll('#cartCount').forEach(el => el.textContent = n);
}

// ---------- Boot ----------
document.addEventListener('DOMContentLoaded', () => {
  applyBranding();
  applyLang();
  updateCartCount();

  const lb = document.getElementById('langBtn');
  if (lb) lb.addEventListener('click', toggleLang);

  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  // Update footer contact links from settings
  const s = DB.get(DB.keys.settings, {});
  const fp = document.getElementById('footPhone');
  const fe = document.getElementById('footEmail');
  const ffb = document.getElementById('footFb');
  const fig = document.getElementById('footIg');
  if (fp && s.waNumber) { fp.textContent = '+' + s.waNumber; fp.href = 'tel:+' + s.waNumber; }
  if (fe && s.orderEmail) { fe.textContent = s.orderEmail; fe.href = 'mailto:' + s.orderEmail; }
  if (ffb && s.facebookUrl) { ffb.href = s.facebookUrl; }
  if (fig && s.instagramUrl) { fig.href = s.instagramUrl; }
});
