/* ============================================================
   Siddham - shared data + storage helpers
   Data is stored in the browser via localStorage.
   ============================================================ */

const DB = {
  keys: {
    products: 'siddham_products',
    categories: 'siddham_categories',
    comments: 'siddham_comments',
    votes: 'siddham_votes',
    cart: 'siddham_cart',
    districts: 'siddham_districts',
    settings: 'siddham_settings',
    branding: 'siddham_branding',
    visits: 'siddham_visits',
    visitsByDay: 'siddham_visits_by_day',
    firstVisit: 'siddham_first',
    lang: 'siddham_lang',
    auth: 'siddham_auth',
  },
  get(k, def) {
    try {
      const v = localStorage.getItem(k);
      return v ? JSON.parse(v) : def;
    } catch { return def; }
  },
  set(k, v) { localStorage.setItem(k, JSON.stringify(v)); },
  remove(k) { localStorage.removeItem(k); }
};

/* ---------- Default products (18 items) ---------- */
const DEFAULT_PRODUCTS = [
  // SPICES  (weightG = net product weight in grams)
  { id: 1,  cat: 'spices', nameSi: 'කහ කුඩු',            nameEn: 'Turmeric Powder',      price: 320, unit: '100g',   weightG: 100, img: '', desc: 'Pure Sri Lankan turmeric' },
  { id: 2,  cat: 'spices', nameSi: 'මිරිස් කුඩු',         nameEn: 'Chilli Powder',        price: 480, unit: '100g',   weightG: 100, img: '', desc: 'Roasted red chilli powder' },
  { id: 3,  cat: 'spices', nameSi: 'තුනපහ',              nameEn: 'Curry Powder',         price: 350, unit: '100g',   weightG: 100, img: '', desc: 'Roasted curry powder' },
  { id: 4,  cat: 'spices', nameSi: 'ගම්මිරිස් කුඩු',      nameEn: 'Black Pepper Powder',  price: 520, unit: '50g',    weightG: 50,  img: '', desc: 'Freshly ground pepper' },
  // SPREADS
  { id: 5,  cat: 'spreads', nameSi: 'පොල් සම්බෝල',       nameEn: 'Coconut Sambol',       price: 380, unit: '200g',   weightG: 200, img: '', desc: 'Traditional pol sambol' },
  { id: 6,  cat: 'spreads', nameSi: 'කරවල සම්බෝල',      nameEn: 'Dry Fish Sambol',      price: 450, unit: '200g',   weightG: 200, img: '', desc: 'Spicy karawala sambol' },
  { id: 7,  cat: 'spreads', nameSi: 'ලූනු මිරිස්',         nameEn: 'Onion Chilli Paste',   price: 400, unit: '200g',   weightG: 200, img: '', desc: 'Lunu miris paste' },
  // SWEETMEATS (pcs — weight is approximate)
  { id: 8,  cat: 'sweetmeats', nameSi: 'කැවුම්',           nameEn: 'Kevum',                price: 250, unit: '10 pcs', weightG: 250, img: '', desc: 'Traditional oil cakes' },
  { id: 9,  cat: 'sweetmeats', nameSi: 'කොකිස්',           nameEn: 'Kokis',                price: 220, unit: '250g',   weightG: 250, img: '', desc: 'Crispy kokis' },
  { id: 10, cat: 'sweetmeats', nameSi: 'අළුවා',            nameEn: 'Aluwa',                price: 300, unit: '250g',   weightG: 250, img: '', desc: 'Semolina aluwa' },
  { id: 11, cat: 'sweetmeats', nameSi: 'මුං කැවුම්',        nameEn: 'Mung Kevum',           price: 350, unit: '10 pcs', weightG: 300, img: '', desc: 'Green gram sweets' },
  // COOKING ESSENTIALS
  { id: 12, cat: 'cooking', nameSi: 'පොල්තෙල්',           nameEn: 'Coconut Oil',          price: 750, unit: '750ml',  weightG: 750,  img: '', desc: 'Pure virgin coconut oil' },
  { id: 13, cat: 'cooking', nameSi: 'දේශීය කැකුළු හාල්',  nameEn: 'Traditional Rice',     price: 320, unit: '1kg',    weightG: 1000, img: '', desc: 'Kekulu rice' },
  { id: 14, cat: 'cooking', nameSi: 'රත්මල් බත්තල පිටි',   nameEn: 'Kurakkan Flour',       price: 280, unit: '500g',   weightG: 500,  img: '', desc: 'Finger millet flour' },
  // WHOLE SPICES
  { id: 15, cat: 'whole', nameSi: 'කුරුඳු',                nameEn: 'Cinnamon Sticks',      price: 550, unit: '100g',   weightG: 100, img: '', desc: 'Pure Ceylon cinnamon' },
  { id: 16, cat: 'whole', nameSi: 'ගම්මිරිස්',              nameEn: 'Black Pepper (whole)', price: 480, unit: '100g',   weightG: 100, img: '', desc: 'Whole black pepper' },
  { id: 17, cat: 'whole', nameSi: 'කරාබු නැටි',            nameEn: 'Cloves',               price: 620, unit: '50g',    weightG: 50,  img: '', desc: 'Aromatic cloves' },
  { id: 18, cat: 'whole', nameSi: 'එන්සාල්',                nameEn: 'Cardamom',             price: 780, unit: '50g',    weightG: 50,  img: '', desc: 'Green cardamom pods' },
];

/* ---------- Default categories (editable from admin) ---------- */
const DEFAULT_CATEGORIES = [
  { id: 'spices',     nameSi: 'කුළුබඩු',               nameEn: 'Spices' },
  { id: 'spreads',    nameSi: 'Spreads',                nameEn: 'Spreads' },
  { id: 'sweetmeats', nameSi: 'රසකැවිලි',              nameEn: 'Sweetmeats' },
  { id: 'cooking',    nameSi: 'පිසින්නට අවශ්‍ය දේ',     nameEn: 'Cooking Essentials' },
  { id: 'whole',      nameSi: 'සම්පූර්ණ කුළුබඩු',      nameEn: 'Whole Spices' },
];

/* Get category list (never empty - falls back to defaults) */
function getCategories() {
  const c = DB.get(DB.keys.categories, null);
  if (!c || !Array.isArray(c) || c.length === 0) return DEFAULT_CATEGORIES.slice();
  return c;
}

/* Get display name of a category in current language */
function catName(catId, lang) {
  const c = getCategories().find(x => x.id === catId);
  if (!c) return catId;
  return lang === 'si' ? (c.nameSi || c.nameEn || catId) : (c.nameEn || c.nameSi || catId);
}

/* Seed demo sold-counts (admin can change any time via Products form) */
const DEMO_SOLD = { 1: 42, 2: 35, 3: 28, 4: 31, 5: 18, 6: 12, 7: 15, 8: 26, 9: 22, 10: 19, 11: 16, 12: 24, 13: 20, 14: 14, 15: 38, 16: 29, 17: 21, 18: 17 };
DEFAULT_PRODUCTS.forEach(p => { p.sold = DEMO_SOLD[p.id] || 0; });

/* Seed demo stock counts (0 = out of stock; admin can change any time) */
const DEMO_STOCK = { 1: 40, 2: 35, 3: 25, 4: 30, 5: 20, 6: 12, 7: 16, 8: 28, 9: 22, 10: 19, 11: 14, 12: 24, 13: 30, 14: 18, 15: 38, 16: 26, 17: 0, 18: 15 };
DEFAULT_PRODUCTS.forEach(p => { p.stock = DEMO_STOCK[p.id] !== undefined ? DEMO_STOCK[p.id] : 50; });

/* ---------- Default delivery rates (new structure) ----------
   Each entry: { branch, district, city, firstKg, additionalKg }
   Charge formula: firstKg + (weight-1) * additionalKg
------------------------------------------------------------- */
const DEFAULT_DISTRICTS = [
  { branch: 'Mattegoda', district: 'Colombo',      city: 'Colombo',      firstKg: 250, addKg: 50 },
  { branch: 'Mattegoda', district: 'Colombo',      city: 'Nugegoda',     firstKg: 200, addKg: 40 },
  { branch: 'Mattegoda', district: 'Colombo',      city: 'Maharagama',   firstKg: 200, addKg: 40 },
  { branch: 'Mattegoda', district: 'Colombo',      city: 'Homagama',     firstKg: 180, addKg: 40 },
  { branch: 'Mattegoda', district: 'Gampaha',      city: 'Gampaha',      firstKg: 300, addKg: 60 },
  { branch: 'Mattegoda', district: 'Gampaha',      city: 'Kadawatha',    firstKg: 280, addKg: 60 },
  { branch: 'Mattegoda', district: 'Gampaha',      city: 'Negombo',      firstKg: 320, addKg: 60 },
  { branch: 'Mattegoda', district: 'Kalutara',     city: 'Kalutara',     firstKg: 350, addKg: 70 },
  { branch: 'Mattegoda', district: 'Kalutara',     city: 'Panadura',     firstKg: 300, addKg: 60 },
  { branch: 'Mattegoda', district: 'Kandy',        city: 'Kandy',        firstKg: 450, addKg: 80 },
  { branch: 'Mattegoda', district: 'Kandy',        city: 'Peradeniya',   firstKg: 450, addKg: 80 },
  { branch: 'Mattegoda', district: 'Matale',       city: 'Matale',       firstKg: 500, addKg: 90 },
  { branch: 'Mattegoda', district: 'Matale',       city: 'Dambulla',     firstKg: 520, addKg: 90 },
  { branch: 'Mattegoda', district: 'Nuwara Eliya', city: 'Nuwara Eliya', firstKg: 550, addKg: 100 },
  { branch: 'Mattegoda', district: 'Galle',        city: 'Galle',        firstKg: 500, addKg: 90 },
  { branch: 'Mattegoda', district: 'Galle',        city: 'Hikkaduwa',    firstKg: 480, addKg: 90 },
  { branch: 'Mattegoda', district: 'Matara',       city: 'Matara',       firstKg: 550, addKg: 100 },
  { branch: 'Mattegoda', district: 'Hambantota',   city: 'Hambantota',   firstKg: 600, addKg: 100 },
  { branch: 'Mattegoda', district: 'Hambantota',   city: 'Tissamaharama',firstKg: 650, addKg: 110 },
  { branch: 'Mattegoda', district: 'Jaffna',       city: 'Jaffna',       firstKg: 800, addKg: 150 },
  { branch: 'Mattegoda', district: 'Kilinochchi',  city: 'Kilinochchi',  firstKg: 800, addKg: 150 },
  { branch: 'Mattegoda', district: 'Mannar',       city: 'Mannar',       firstKg: 800, addKg: 150 },
  { branch: 'Mattegoda', district: 'Vavuniya',     city: 'Vavuniya',     firstKg: 750, addKg: 140 },
  { branch: 'Mattegoda', district: 'Mullaitivu',   city: 'Mullaitivu',   firstKg: 850, addKg: 160 },
  { branch: 'Mattegoda', district: 'Batticaloa',   city: 'Batticaloa',   firstKg: 700, addKg: 130 },
  { branch: 'Mattegoda', district: 'Ampara',       city: 'Ampara',       firstKg: 700, addKg: 130 },
  { branch: 'Mattegoda', district: 'Trincomalee',  city: 'Trincomalee',  firstKg: 700, addKg: 130 },
  { branch: 'Mattegoda', district: 'Kurunegala',   city: 'Kurunegala',   firstKg: 400, addKg: 80 },
  { branch: 'Mattegoda', district: 'Puttalam',     city: 'Puttalam',     firstKg: 500, addKg: 90 },
  { branch: 'Mattegoda', district: 'Anuradhapura', city: 'Anuradhapura', firstKg: 600, addKg: 110 },
  { branch: 'Mattegoda', district: 'Polonnaruwa',  city: 'Polonnaruwa',  firstKg: 650, addKg: 120 },
  { branch: 'Mattegoda', district: 'Badulla',      city: 'Badulla',      firstKg: 600, addKg: 110 },
  { branch: 'Mattegoda', district: 'Monaragala',   city: 'Monaragala',   firstKg: 700, addKg: 130 },
  { branch: 'Mattegoda', district: 'Ratnapura',    city: 'Ratnapura',    firstKg: 450, addKg: 90 },
  { branch: 'Mattegoda', district: 'Kegalle',      city: 'Kegalle',      firstKg: 400, addKg: 80 },
];

/* Compute charge given a rate row + total kg */
function computeCharge(row, kg) {
  const w = Math.max(1, parseInt(kg) || 1);
  return row.firstKg + (w - 1) * row.addKg;
}

/* Get list of districts from rates */
function getDistricts() {
  const rates = DB.get(DB.keys.districts, []);
  return [...new Set(rates.map(r => r.district))].sort();
}

/* Get list of cities for a district */
function getCitiesFor(district) {
  const rates = DB.get(DB.keys.districts, []);
  return rates.filter(r => r.district === district).map(r => r.city).sort();
}

/* Find rate row */
function findRate(district, city) {
  const rates = DB.get(DB.keys.districts, []);
  return rates.find(r => r.district === district && r.city === city);
}

const DEFAULT_SETTINGS = {
  password: 'siddham123',
  waNumber: '94777317208',
  orderEmail: 'siddhamproducts24@gmail.com',
  otpEnabled: 1,
  facebookUrl: 'https://www.facebook.com/',
  instagramUrl: 'https://www.instagram.com/',
  /* Cloud sync for comments & likes (jsonbin.io) — leave empty to stay local-only */
  commentsBinId: '',
  commentsApiKey: '',
  jsonBinBase: '',
};

/* Cart weight helpers — auto calculate kg from cart contents */
function cartTotalWeightG(cart, products) {
  let g = 0;
  cart.forEach(it => {
    const p = products.find(x => x.id === it.id);
    if (p) g += (p.weightG || 0) * it.qty;
  });
  return g;
}
function gramsToKgCeil(g) { return Math.max(1, Math.ceil(g / 1000)); }

/* Detect whether cart contains any "pcs"-based items (approx weight) */
function cartHasPcsItem(cart, products) {
  return cart.some(it => {
    const p = products.find(x => x.id === it.id);
    return p && /pcs|piece|ක/i.test(p.unit || '');
  });
}

/* ---------- Item comments (per product) ----------
   Stored: siddham_comments = { [productId]: [ {name, text, ts} ] } */
function getComments(pid) {
  const all = DB.get(DB.keys.comments, {});
  return all[pid] || [];
}
function addComment(pid, name, text) {
  const all = DB.get(DB.keys.comments, {});
  all[pid] = all[pid] || [];
  all[pid].push({ name: (name || '').trim(), text: (text || '').trim(), ts: Date.now() });
  DB.set(DB.keys.comments, all);
  return all[pid];
}

/* ---------- Item likes / dislikes (per product) ----------
   Stored: siddham_votes = { [productId]: { likes, dislikes, my } }
   'my' remembers this browser's own vote (toggle allowed) */
function getVotes(pid) {
  const all = DB.get(DB.keys.votes, {});
  return all[pid] || { likes: 0, dislikes: 0, my: null };
}
function voteProduct(pid, type) {
  const all = DB.get(DB.keys.votes, {});
  const v = all[pid] || { likes: 0, dislikes: 0, my: null };
  const k = t => t === 'like' ? 'likes' : 'dislikes';
  if (v.my === type) {
    // un-vote
    v[k(type)] = Math.max(0, v[k(type)] - 1);
    v.my = null;
  } else {
    if (v.my) v[k(v.my)] = Math.max(0, (v[k(v.my)] || 0) - 1);
    v[k(type)] = (v[k(type)] || 0) + 1;
    v.my = type;
  }
  all[pid] = v;
  DB.set(DB.keys.votes, all);
  return v;
}

const DEFAULT_BRANDING = {
  logo: '',
  hero: '',
  titleSi: 'සිද්ධාම්',
  titleEn: 'SIDDHAM',
  tagSi: 'මුළුතැන්ගෙයි හදවත',
  tagEn: 'The Heart of Home Cooking',
  descSi: 'අපගේ ස්වභාවික කුළුබඩු, spreads, රසකැවිලි සහ ගෙදර පිසින්නට අවශ්‍ය සියලුම දේ එකම තැනකින්. පිරිසිදු, නැවුම්, සහ ගුණාත්මක.',
  descEn: 'Natural spices, spreads, sweetmeats and every essential you need for home cooking - all in one place. Pure, fresh and premium quality.',
};

/* ---------- Initialisation (runs once) ---------- */
// asset base: works from root pages AND /admin/ subfolder
window.ASSET_BASE = location.pathname.includes('/admin/') ? '../' : '';
window.PLACEHOLDER = window.ASSET_BASE + 'assets/placeholder.jpg';

function initDB() {
  if (!DB.get(DB.keys.products)) DB.set(DB.keys.products, DEFAULT_PRODUCTS);
  // migrate: make sure every product has sold counter + stock count
  const prods = DB.get(DB.keys.products, []);
  if (prods.length && (prods.some(p => p.sold === undefined) || prods.some(p => p.stock === undefined))) {
    prods.forEach(p => {
      if (p.sold === undefined) p.sold = DEMO_SOLD[p.id] || 0;
      if (p.stock === undefined) p.stock = DEMO_STOCK[p.id] !== undefined ? DEMO_STOCK[p.id] : 50;
    });
    DB.set(DB.keys.products, prods);
  }
  if (!DB.get(DB.keys.categories)) DB.set(DB.keys.categories, DEFAULT_CATEGORIES);
  // Districts must be an array of {branch,district,city,firstKg,addKg}
  const existingD = DB.get(DB.keys.districts);
  if (!existingD || !Array.isArray(existingD)) DB.set(DB.keys.districts, DEFAULT_DISTRICTS);
  if (!DB.get(DB.keys.settings)) DB.set(DB.keys.settings, DEFAULT_SETTINGS);
  if (!DB.get(DB.keys.branding)) DB.set(DB.keys.branding, DEFAULT_BRANDING);
  if (!DB.get(DB.keys.cart)) DB.set(DB.keys.cart, []);
  if (!DB.get(DB.keys.lang)) DB.set(DB.keys.lang, 'si');
  if (!DB.get(DB.keys.firstVisit)) DB.set(DB.keys.firstVisit, new Date().toISOString());
}
initDB();

/* ---------- Visit counter (only counts real visits, not admin) ---------- */
function bumpVisit() {
  if (location.pathname.includes('/admin')) return;
  const key = 'siddham_visited_session';
  if (sessionStorage.getItem(key)) return;
  sessionStorage.setItem(key, '1');
  const n = (DB.get(DB.keys.visits, 0) || 0) + 1;
  DB.set(DB.keys.visits, n);
  // record per-day count
  const byDay = DB.get(DB.keys.visitsByDay, {}) || {};
  const d = new Date();
  const key2 = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  byDay[key2] = (byDay[key2] || 0) + 1;
  DB.set(DB.keys.visitsByDay, byDay);
}
bumpVisit();

/* ============================================================
   data/site-data.json sync (GitHub "publish" file)
   ------------------------------------------------------------
   - If a data/site-data.json exists next to the site, its data
     overrides the code defaults (applied once per version).
   - Admin → Settings → "Download data.json" creates this file;
     upload it to the GitHub repo to publish news/changes to all
     visitors. Old localStorage data is kept unless version changes.
   ============================================================ */
const DATA_FILE_VERSION_KEY = 'siddham_data_version';

const dataSyncCbs = [];
let dataSynced = false;
function onDataSync(fn) {
  if (dataSynced) { try { fn(); } catch (e) {} }
  else dataSyncCbs.push(fn);
}
function fireDataSync() {
  dataSynced = true;
  dataSyncCbs.splice(0).forEach(fn => { try { fn(); } catch (e) {} });
}
function getDataFileUrl() {
  return (window.ASSET_BASE || '') + 'data/site-data.json';
}
function syncFromDataJson() {
  if (typeof fetch !== 'function') { fireDataSync(); return; }
  fetch(getDataFileUrl())
    .then(r => r.ok ? r.json() : null)
    .catch(() => null)
    .then(j => {
      if (j && typeof j === 'object') {
        const ver = j.version || 1;
        const cur = DB.get(DATA_FILE_VERSION_KEY, null);
        if (cur === null || cur !== ver) {
          if (Array.isArray(j.products) && j.products.length) DB.set(DB.keys.products, j.products);
          if (Array.isArray(j.categories) && j.categories.length) DB.set(DB.keys.categories, j.categories);
          if (Array.isArray(j.districts) && j.districts.length) DB.set(DB.keys.districts, j.districts);
          if (j.settings) {
            const local = DB.get(DB.keys.settings, {});
            const merged = Object.assign({}, DEFAULT_SETTINGS, j.settings);
            if (local.password) merged.password = local.password; // never override password from file
            DB.set(DB.keys.settings, merged);
          }
          if (j.branding) DB.set(DB.keys.branding, Object.assign({}, DEFAULT_BRANDING, j.branding));
          DB.set(DATA_FILE_VERSION_KEY, ver);
        }
      }
    })
    .finally(fireDataSync);
}
syncFromDataJson();
