/* ============================================================
   Siddham - Admin dashboard
   ============================================================ */

let pendingOtp = null;
let loginTimer = null;

// Simple CSV parser that supports quoted fields
function parseCsvLine(line) {
  const out = []; let cur = ''; let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) {
      if (ch === '"' && line[i+1] === '"') { cur += '"'; i++; }
      else if (ch === '"') { q = false; }
      else cur += ch;
    } else {
      if (ch === ',') { out.push(cur); cur = ''; }
      else if (ch === '"') q = true;
      else cur += ch;
    }
  }
  out.push(cur);
  return out;
}

function isLoggedIn() {
  const a = DB.get(DB.keys.auth, null);
  if (!a) return false;
  // 30 min session
  if (Date.now() - a.ts > 30 * 60 * 1000) { DB.remove(DB.keys.auth); return false; }
  return true;
}

let adminLoaded = false;
function showDashboard() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('dashboard').style.display = 'block';
  adminLoaded = false;
  loadAdminUI();
  adminLoaded = true;
}
/* Re-load lists only (no duplicate event listeners) when data.json sync lands */
function refreshAdminData() {
  loadStats();
  loadOrders();
  loadCategories();
  fillCatSelect();
  loadProducts();
  loadDistricts();
  loadSettings();
  loadBranding();
}
if (typeof onDataSync === 'function') {
  onDataSync(() => { if (adminLoaded) refreshAdminData(); });
}

function showLogin() {
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('dashboard').style.display = 'none';
  document.getElementById('step1').style.display = 'block';
  document.getElementById('step2').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', () => {
  if (isLoggedIn()) showDashboard(); else showLogin();

  // LOGIN
  document.getElementById('loginBtn').addEventListener('click', () => {
    const pwd = document.getElementById('pwd').value;
    const s = DB.get(DB.keys.settings, {});
    if (pwd !== s.password) { alert('Wrong password'); return; }

    if (s.otpEnabled) {
      pendingOtp = Math.floor(100000 + Math.random() * 900000).toString();
      document.getElementById('demoOtp').textContent = pendingOtp;
      document.getElementById('otpTarget').textContent = s.orderEmail || 'admin email';
      document.getElementById('step1').style.display = 'none';
      document.getElementById('step2').style.display = 'block';
      // In real deployment, POST pendingOtp to your email service (see hosting notes)
    } else {
      DB.set(DB.keys.auth, { ts: Date.now() });
      showDashboard();
    }
  });

  document.getElementById('verifyBtn').addEventListener('click', () => {
    if (document.getElementById('otp').value === pendingOtp) {
      DB.set(DB.keys.auth, { ts: Date.now() });
      showDashboard();
    } else alert('Invalid OTP');
  });

  document.getElementById('logoutBtn').addEventListener('click', () => {
    DB.remove(DB.keys.auth);
    location.reload();
  });

  // TABS
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(x => x.classList.remove('active'));
      document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      document.getElementById('tab-' + b.dataset.tab).classList.add('active');
    });
  });
});

function loadAdminUI() {
  loadStats();
  loadOrders();
  loadCategories();
  fillCatSelect();
  loadProducts();
  loadDistricts();
  loadSettings();
  loadBranding();
  wireForms();
}

/* ---------- CATEGORIES ---------- */
function makeCatId(nameEn, cats) {
  let id = (nameEn || 'category').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'category';
  const base = id;
  let n = 2;
  while (cats.some(c => c.id === id)) id = base + '-' + n++;
  return id;
}

/* Fill the product-form category dropdown from the managed list */
function fillCatSelect() {
  const sel = document.getElementById('pCat');
  if (!sel) return;
  const cur = sel.value;
  sel.innerHTML = '';
  getCategories().forEach(c => {
    const o = document.createElement('option');
    o.value = c.id;
    o.textContent = (c.nameSi || '') + (c.nameSi && c.nameEn ? ' / ' : '') + (c.nameEn || '');
    sel.appendChild(o);
  });
  if ([...sel.options].some(o => o.value === cur)) sel.value = cur;
}

function loadCategories() {
  const cats = getCategories();
  const products = DB.get(DB.keys.products, []);
  const list = document.getElementById('catList');
  list.innerHTML = '';
  cats.forEach((c, i) => {
    const n = products.filter(p => p.cat === c.id).length;
    const div = document.createElement('div');
    div.className = 'admin-prod-card';
    div.innerHTML = `
      <div style="flex:1">
        <b>${c.nameSi || ''}</b>${c.nameSi && c.nameEn ? ' / ' : ''}${c.nameEn || ''}<br>
        <small>Products: ${n}</small>
        <div class="actions">
          <button class="cat-up" data-i="${i}" ${i === 0 ? 'disabled' : ''}>↑</button>
          <button class="cat-down" data-i="${i}" ${i === cats.length - 1 ? 'disabled' : ''}>↓</button>
          <button class="cat-edit" data-id="${c.id}">Edit</button>
          <button class="cat-del" data-id="${c.id}">Delete</button>
        </div>
      </div>`;
    list.appendChild(div);
  });
  list.querySelectorAll('.cat-up').forEach(b => b.addEventListener('click', () => moveCat(parseInt(b.dataset.i), -1)));
  list.querySelectorAll('.cat-down').forEach(b => b.addEventListener('click', () => moveCat(parseInt(b.dataset.i), 1)));
  list.querySelectorAll('.cat-edit').forEach(b => b.addEventListener('click', () => editCategory(b.dataset.id)));
  list.querySelectorAll('.cat-del').forEach(b => b.addEventListener('click', () => deleteCategory(b.dataset.id)));
}

function moveCat(i, dir) {
  const cats = getCategories();
  const j = i + dir;
  if (j < 0 || j >= cats.length) return;
  [cats[i], cats[j]] = [cats[j], cats[i]];
  DB.set(DB.keys.categories, cats);
  loadCategories();
}

function editCategory(id) {
  const c = getCategories().find(x => x.id === id);
  if (!c) return;
  document.getElementById('catEditId').value = c.id;
  document.getElementById('cNameSi').value = c.nameSi || '';
  document.getElementById('cNameEn').value = c.nameEn || '';
  document.getElementById('saveCatBtn').textContent = 'Update Category';
  document.getElementById('cancelCatEditBtn').style.display = 'inline-block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteCategory(id) {
  const products = DB.get(DB.keys.products, []);
  const n = products.filter(p => p.cat === id).length;
  if (n > 0) {
    alert(`Cannot delete: ${n} product(s) are still in this category. Move them to another category first.`);
    return;
  }
  if (!confirm('Delete this category?')) return;
  const cats = getCategories().filter(c => c.id !== id);
  DB.set(DB.keys.categories, cats);
  loadCategories();
  fillCatSelect();
}

/* ---------- ORDERS ---------- */
function loadOrders() {
  const orders = DB.get('siddham_orders', []) || [];
  const filter = document.getElementById('ordFilter').value;
  const search = document.getElementById('ordSearch').value.trim().toLowerCase();
  const box = document.getElementById('ordersList');
  box.innerHTML = '';

  // Update pending badge
  const pending = orders.filter(o => (o.status || 'pending') === 'pending').length;
  const badge = document.getElementById('pendingBadge');
  if (badge) { badge.textContent = pending; badge.style.display = pending ? 'inline-flex' : 'none'; }

  let list = orders.slice();
  if (filter !== 'all') list = list.filter(o => (o.status || 'pending') === filter);
  if (search) {
    list = list.filter(o =>
      o.orderId.toLowerCase().includes(search) ||
      (o.customer.name || '').toLowerCase().includes(search) ||
      (o.customer.phone || '').toLowerCase().includes(search)
    );
  }

  if (list.length === 0) {
    box.innerHTML = `<p style="padding:30px;text-align:center;color:#888">No orders found.</p>`;
    return;
  }

  list.forEach(o => {
    const d = new Date(o.date);
    const status = o.status || 'pending';
    const card = document.createElement('div');
    card.className = 'order-card ' + status;
    card.innerHTML = `
      <div class="order-head">
        <div>
          <span class="ord-id">${o.orderId}</span>
          <span class="ord-status ${status}">${status.toUpperCase()}</span>
        </div>
        <div class="ord-total">Rs. ${o.total.toLocaleString()}</div>
      </div>
      <div class="order-body">
        <div>
          <p><b>👤 ${o.customer.name}</b></p>
          <p>📞 <a href="tel:${o.customer.phone}">${o.customer.phone}</a></p>
          <p>📍 ${o.customer.address}</p>
          <p>🏙️ ${o.customer.city}, ${o.customer.district}</p>
          ${o.customer.notes ? `<p>📝 <i>${o.customer.notes}</i></p>` : ''}
        </div>
        <div>
          <p><b>⚖️ Weight:</b> ${o.weightG}g (${o.weightKg}kg)</p>
          <p><b>🚚 Delivery:</b> Rs. ${o.delivery.toLocaleString()}</p>
          <p><b>📅 ${d.toLocaleString()}</b></p>
          <p><b>Items (${o.items.length}):</b></p>
          <ul class="ord-items">
            ${o.items.map(it => `<li>${it.name} × ${it.qty} — Rs. ${it.total.toLocaleString()}</li>`).join('')}
          </ul>
        </div>
      </div>
      <div class="order-actions">
        <button class="primary-btn ord-inv" data-id="${o.orderId}">📄 Download Invoice PDF</button>
        <button class="wa-btn ord-wa" data-id="${o.orderId}">📱 WhatsApp Customer</button>
        <select class="ord-status-sel" data-id="${o.orderId}">
          <option value="pending"   ${status==='pending'?'selected':''}>Pending</option>
          <option value="packed"    ${status==='packed'?'selected':''}>Packed</option>
          <option value="delivered" ${status==='delivered'?'selected':''}>Delivered</option>
          <option value="cancelled" ${status==='cancelled'?'selected':''}>Cancelled</option>
        </select>
        <button class="del-btn ord-del" data-id="${o.orderId}">Delete</button>
      </div>`;
    box.appendChild(card);
  });

  // Wire buttons
  box.querySelectorAll('.ord-inv').forEach(b => b.addEventListener('click', () => {
    const o = findOrder(b.dataset.id);
    if (o) generateInvoicePDF(hydrate(o), true);
  }));
  box.querySelectorAll('.ord-wa').forEach(b => b.addEventListener('click', () => {
    const o = findOrder(b.dataset.id);
    if (!o) return;
    const s = DB.get(DB.keys.settings, {});
    const phone = o.customer.phone.replace(/\D/g,'');
    const num = phone.startsWith('0') ? '94' + phone.slice(1) : phone;
    const msg = `Hi ${o.customer.name}, your Siddham order ${o.orderId} (Rs. ${o.total}) is confirmed. Thank you! 🌶️`;
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, '_blank');
  }));
  box.querySelectorAll('.ord-status-sel').forEach(sel => sel.addEventListener('change', () => {
    const all = DB.get('siddham_orders', []);
    const o = all.find(x => x.orderId === sel.dataset.id);
    if (o) {
      // Auto-count sales when an order becomes Delivered (counted once)
      if (sel.value === 'delivered' && o.status !== 'delivered' && !o.soldCounted) {
        const products = DB.get(DB.keys.products, []);
        o.items.forEach(it => {
          const p = products.find(x => x.id === it.id || x.name === it.name);
          if (p) p.sold = (p.sold || 0) + it.qty;
        });
        DB.set(DB.keys.products, products);
        o.soldCounted = true;
      }
      o.status = sel.value;
      DB.set('siddham_orders', all);
      loadOrders();
      loadStats();
    }
  }));
  box.querySelectorAll('.ord-del').forEach(b => b.addEventListener('click', () => {
    if (!confirm('Delete this order?')) return;
    let all = DB.get('siddham_orders', []);
    all = all.filter(o => o.orderId !== b.dataset.id);
    DB.set('siddham_orders', all);
    loadOrders();
  }));
}

function findOrder(id) {
  return (DB.get('siddham_orders', []) || []).find(o => o.orderId === id);
}
// Convert stored order (with ISO date) back to what generateInvoicePDF expects
function hydrate(o) {
  return { ...o, date: new Date(o.date) };
}

/* ---------- STATS ---------- */
function todayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function sumDays(byDay, days) {
  let total = 0;
  const today = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    total += byDay[todayKey(d)] || 0;
  }
  return total;
}
function loadStats() {
  const v = DB.get(DB.keys.visits, 0);
  const p = DB.get(DB.keys.products, []).length;
  const d = (DB.get(DB.keys.districts, []) || []).length;
  const fv = DB.get(DB.keys.firstVisit, '');
  const byDay = DB.get(DB.keys.visitsByDay, {}) || {};
  document.getElementById('visitCount').textContent = v;
  document.getElementById('s1').textContent = v;
  document.getElementById('s2').textContent = p;
  document.getElementById('s3').textContent = d;
  document.getElementById('s4').textContent = fv ? new Date(fv).toLocaleDateString() : '-';
  document.getElementById('s5').textContent = byDay[todayKey()] || 0;
  document.getElementById('s6').textContent = sumDays(byDay, 7);
  document.getElementById('s7').textContent = sumDays(byDay, 30);
  if (fv) {
    const days = Math.max(1, Math.ceil((Date.now() - new Date(fv)) / 86400000));
    document.getElementById('s8').textContent = (v / days).toFixed(1);
  }
}

/* Visitor Calculator */
function visitorCalc() {
  const from = document.getElementById('vcFrom').value;
  const to = document.getElementById('vcTo').value;
  if (!from || !to) { alert('Pick From and To dates'); return; }
  const byDay = DB.get(DB.keys.visitsByDay, {}) || {};
  const start = new Date(from), end = new Date(to);
  if (end < start) { alert('To date must be after From date'); return; }
  let total = 0, days = 0, peak = 0, peakDay = '-';
  const d = new Date(start);
  while (d <= end) {
    const k = todayKey(d);
    const c = byDay[k] || 0;
    total += c; days++;
    if (c > peak) { peak = c; peakDay = k; }
    d.setDate(d.getDate() + 1);
  }
  document.getElementById('vcResult').style.display = 'grid';
  document.getElementById('vcTotal').textContent = total;
  document.getElementById('vcDays').textContent = days;
  document.getElementById('vcAvg').textContent = (total / days).toFixed(1);
  document.getElementById('vcMax').textContent = peak + (peak > 0 ? ` (${peakDay})` : '');
}

/* ---------- PRODUCTS ---------- */
function loadProducts() {
  const products = DB.get(DB.keys.products, []);
  const list = document.getElementById('adminProductList');
  list.innerHTML = '';
  products.forEach(p => {
    const div = document.createElement('div');
    div.className = 'admin-prod-card';
    div.innerHTML = `
      <img src="${p.img || PLACEHOLDER}" onerror="this.src=PLACEHOLDER">
      <div style="flex:1">
        <b>${p.nameSi}</b> / ${p.nameEn}<br>
        <small>${catName(p.cat, 'si')} • ${p.unit || ''}</small><br>
        <span style="color:#a5811a;font-weight:bold">Rs. ${p.price}</span>
        <small style="color:#27ae60;font-weight:700">🟢 Sold: ${p.sold || 0}</small>
        <div class="actions">
          <button class="edit-btn" data-id="${p.id}">Edit</button>
          <button class="del-btn" data-id="${p.id}">Delete</button>
        </div>
      </div>`;
    list.appendChild(div);
  });
  list.querySelectorAll('.edit-btn').forEach(b => b.addEventListener('click', () => editProduct(parseInt(b.dataset.id))));
  list.querySelectorAll('.del-btn').forEach(b => b.addEventListener('click', () => deleteProduct(parseInt(b.dataset.id))));
}

function editProduct(id) {
  const products = DB.get(DB.keys.products, []);
  const p = products.find(x => x.id === id);
  if (!p) return;
  document.getElementById('editId').value = p.id;
  document.getElementById('pNameSi').value = p.nameSi;
  document.getElementById('pNameEn').value = p.nameEn;
  document.getElementById('pCat').value = p.cat;
  document.getElementById('pPrice').value = p.price;
  document.getElementById('pUnit').value = p.unit || '';
  document.getElementById('pWeightG').value = p.weightG || '';
  document.getElementById('pSold').value = p.sold || 0;
  document.getElementById('pDesc').value = p.desc || '';
  document.getElementById('saveProductBtn').textContent = 'Update Product';
  document.getElementById('cancelEditBtn').style.display = 'inline-block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteProduct(id) {
  if (!confirm('Delete this product?')) return;
  let products = DB.get(DB.keys.products, []);
  products = products.filter(p => p.id !== id);
  DB.set(DB.keys.products, products);
  loadProducts();
  loadStats();
}

function fileToDataURL(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

/* ---------- DELIVERY RATES (new structure) ---------- */
function loadDistricts() {
  const rates = DB.get(DB.keys.districts, []);
  const tbody = document.querySelector('#districtTable tbody');
  tbody.innerHTML = '';
  rates.forEach((r, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${r.branch}</td>
      <td>${r.district}</td>
      <td>${r.city}</td>
      <td>Rs. ${r.firstKg}</td>
      <td>Rs. ${r.addKg}</td>
      <td><button class="del-btn" data-i="${i}">Delete</button></td>`;
    tbody.appendChild(tr);
  });
  tbody.querySelectorAll('.del-btn').forEach(b => b.addEventListener('click', () => {
    const arr = DB.get(DB.keys.districts, []);
    arr.splice(parseInt(b.dataset.i), 1);
    DB.set(DB.keys.districts, arr);
    loadDistricts();
  }));
}

/* ---------- SETTINGS ---------- */
function loadSettings() {
  const s = DB.get(DB.keys.settings, {});
  document.getElementById('waNumber').value = s.waNumber || '';
  document.getElementById('orderEmail').value = s.orderEmail || '';
  document.getElementById('facebookUrl').value = s.facebookUrl || '';
  document.getElementById('instagramUrl').value = s.instagramUrl || '';
  document.getElementById('otpEnabled').value = s.otpEnabled ? '1' : '0';
  document.getElementById('commentsBinId').value = s.commentsBinId || '';
  document.getElementById('commentsApiKey').value = s.commentsApiKey || '';
}

/* Build the data.json object for publishing (password is NEVER exported) */
function exportDataJson() {
  const s = DB.get(DB.keys.settings, {});
  const pub = Object.assign({}, s);
  delete pub.password;
  return {
    version: Date.now(),
    exportedAt: new Date().toISOString(),
    products: DB.get(DB.keys.products, []),
    categories: getCategories(),
    districts: DB.get(DB.keys.districts, []),
    settings: pub,
    branding: DB.get(DB.keys.branding, {})
  };
}
function downloadDataJson() {
  const j = exportDataJson();
  const blob = new Blob([JSON.stringify(j, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'site-data.json';
  a.click();
  alert('✓ Downloaded!\n\nGitHub repo → data/site-data.json replace කරන්න. ඊට පස්සේ site එකේ හැම කෙනෙක්ටම අලුත් data පේනවා.');
}

/* ---------- BRANDING ---------- */
function loadBranding() {
  const b = DB.get(DB.keys.branding, {});
  document.getElementById('titleSi').value = b.titleSi || '';
  document.getElementById('titleEn').value = b.titleEn || '';
  document.getElementById('tagSi').value = b.tagSi || '';
  document.getElementById('tagEn').value = b.tagEn || '';
  document.getElementById('descSi').value = b.descSi || '';
  document.getElementById('descEn').value = b.descEn || '';
  if (b.logo) document.getElementById('logoPrev').src = b.logo;
  if (b.hero) document.getElementById('heroPrev').src = b.hero;
}

/* ---------- WIRE FORMS ---------- */
function wireForms() {
  // Add / update product
  document.getElementById('addProductForm').addEventListener('submit', async e => {
    e.preventDefault();
    const products = DB.get(DB.keys.products, []);
    const id = document.getElementById('editId').value;
    const file = document.getElementById('pImg').files[0];
    let img = '';
    if (file) img = await fileToDataURL(file);

    const weightG = parseInt(document.getElementById('pWeightG').value) || 100;
    const sold = Math.max(0, parseInt(document.getElementById('pSold').value) || 0);
    if (id) {
      const p = products.find(x => x.id === parseInt(id));
      Object.assign(p, {
        nameSi: document.getElementById('pNameSi').value,
        nameEn: document.getElementById('pNameEn').value,
        cat: document.getElementById('pCat').value,
        price: parseInt(document.getElementById('pPrice').value),
        unit: document.getElementById('pUnit').value,
        weightG,
        sold,
        desc: document.getElementById('pDesc').value,
      });
      if (img) p.img = img;
    } else {
      const newId = Math.max(0, ...products.map(p => p.id)) + 1;
      products.push({
        id: newId,
        nameSi: document.getElementById('pNameSi').value,
        nameEn: document.getElementById('pNameEn').value,
        cat: document.getElementById('pCat').value,
        price: parseInt(document.getElementById('pPrice').value),
        unit: document.getElementById('pUnit').value,
        weightG,
        sold,
        desc: document.getElementById('pDesc').value,
        img
      });
    }
    DB.set(DB.keys.products, products);
    e.target.reset();
    document.getElementById('editId').value = '';
    document.getElementById('saveProductBtn').textContent = 'Add Product';
    document.getElementById('cancelEditBtn').style.display = 'none';
    loadProducts();
    loadStats();
    alert('Saved!');
  });

  document.getElementById('cancelEditBtn').addEventListener('click', () => {
    document.getElementById('addProductForm').reset();
    document.getElementById('editId').value = '';
    document.getElementById('saveProductBtn').textContent = 'Add Product';
    document.getElementById('cancelEditBtn').style.display = 'none';
  });

  // Add / update category
  document.getElementById('catForm').addEventListener('submit', e => {
    e.preventDefault();
    const cats = getCategories();
    const si = document.getElementById('cNameSi').value.trim();
    const en = document.getElementById('cNameEn').value.trim();
    const editId = document.getElementById('catEditId').value;
    if (editId) {
      const c = cats.find(x => x.id === editId);
      if (c) { c.nameSi = si; c.nameEn = en; }
    } else {
      cats.push({ id: makeCatId(en, cats), nameSi: si, nameEn: en });
    }
    DB.set(DB.keys.categories, cats);
    document.getElementById('catForm').reset();
    document.getElementById('catEditId').value = '';
    document.getElementById('saveCatBtn').textContent = 'Add Category';
    document.getElementById('cancelCatEditBtn').style.display = 'none';
    loadCategories();
    fillCatSelect();
    alert('Saved!');
  });

  document.getElementById('cancelCatEditBtn').addEventListener('click', () => {
    document.getElementById('catForm').reset();
    document.getElementById('catEditId').value = '';
    document.getElementById('saveCatBtn').textContent = 'Add Category';
    document.getElementById('cancelCatEditBtn').style.display = 'none';
  });

  // CSV import — new columns:
  // From Branch, To District, To City, Charge for 1st kg, Charge per additional 1kg
  document.getElementById('csvBtn').addEventListener('click', () => {
    const file = document.getElementById('csvFile').files[0];
    if (!file) { alert('Choose a CSV file first'); return; }
    const mode = document.getElementById('csvMode').value; // replace / append
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result;
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      if (!lines.length) { alert('CSV is empty'); return; }

      // Detect header
      let start = 0;
      const head = lines[0].toLowerCase();
      if (head.includes('branch') || head.includes('district') || head.includes('kg')) start = 1;

      let arr = mode === 'replace' ? [] : DB.get(DB.keys.districts, []);
      let count = 0, errors = 0;
      for (let i = start; i < lines.length; i++) {
        const parts = parseCsvLine(lines[i]);
        if (parts.length < 5) { errors++; continue; }
        const [branch, district, city, first, add] = parts.map(x => x.trim());
        const f = parseInt(first), a = parseInt(add);
        if (!district || !city || isNaN(f) || isNaN(a)) { errors++; continue; }
        // remove any existing row with same district+city (to update)
        arr = arr.filter(r => !(r.district === district && r.city === city));
        arr.push({ branch: branch || 'Mattegoda', district, city, firstKg: f, addKg: a });
        count++;
      }
      DB.set(DB.keys.districts, arr);
      loadDistricts();
      alert(`✓ Imported ${count} row(s).${errors ? ' Skipped ' + errors + ' invalid row(s).' : ''}`);
    };
    reader.readAsText(file);
  });

  document.getElementById('csvSample').addEventListener('click', () => {
    const rows = ['From Branch,To District,To City,Charge for 1st kg,Charge per additional 1kg'];
    DEFAULT_DISTRICTS.forEach(r => {
      rows.push(`${r.branch},${r.district},${r.city},${r.firstKg},${r.addKg}`);
    });
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'siddham_delivery_charges.csv';
    a.click();
  });

  document.getElementById('addDistBtn').addEventListener('click', () => {
    const branch = document.getElementById('newBranch').value.trim() || 'Mattegoda';
    const district = document.getElementById('newDistrict').value.trim();
    const city = document.getElementById('newCity').value.trim();
    const first = parseInt(document.getElementById('newFirst').value);
    const add = parseInt(document.getElementById('newAdd').value);
    if (!district || !city || isNaN(first) || isNaN(add)) { alert('Fill all fields'); return; }
    let arr = DB.get(DB.keys.districts, []);
    arr = arr.filter(r => !(r.district === district && r.city === city));
    arr.push({ branch, district, city, firstKg: first, addKg: add });
    DB.set(DB.keys.districts, arr);
    ['newBranch','newDistrict','newCity','newFirst','newAdd'].forEach(id => document.getElementById(id).value = '');
    loadDistricts();
  });

  // Settings
  document.getElementById('changePwdBtn').addEventListener('click', () => {
    const pwd = document.getElementById('newPwd').value;
    if (pwd.length < 6) { alert('Password must be at least 6 characters'); return; }
    const s = DB.get(DB.keys.settings, {});
    s.password = pwd;
    DB.set(DB.keys.settings, s);
    document.getElementById('newPwd').value = '';
    alert('Password updated');
  });

  document.getElementById('saveSettingsBtn').addEventListener('click', () => {
    const s = DB.get(DB.keys.settings, {});
    s.waNumber = document.getElementById('waNumber').value.replace(/\D/g, '');
    s.orderEmail = document.getElementById('orderEmail').value.trim();
    s.facebookUrl = document.getElementById('facebookUrl').value.trim();
    s.instagramUrl = document.getElementById('instagramUrl').value.trim();
    s.otpEnabled = parseInt(document.getElementById('otpEnabled').value);
    s.commentsBinId = document.getElementById('commentsBinId').value.trim();
    s.commentsApiKey = document.getElementById('commentsApiKey').value.trim();
    DB.set(DB.keys.settings, s);
    alert('Settings saved');
  });

  document.getElementById('exportJsonBtn').addEventListener('click', downloadDataJson);

  // Orders tab
  document.getElementById('ordFilter').addEventListener('change', loadOrders);
  document.getElementById('ordSearch').addEventListener('input', loadOrders);
  document.getElementById('clearOrdersBtn').addEventListener('click', () => {
    if (!confirm('Delete ALL orders permanently?')) return;
    DB.set('siddham_orders', []);
    loadOrders();
  });

  // Visitor Calculator
  document.getElementById('vcCalc').addEventListener('click', visitorCalc);
  document.getElementById('vcPreset').addEventListener('change', e => {
    const n = parseInt(e.target.value);
    if (!n) return;
    const to = new Date();
    const from = new Date(); from.setDate(to.getDate() - n + 1);
    document.getElementById('vcTo').value = todayKey(to);
    document.getElementById('vcFrom').value = todayKey(from);
    visitorCalc();
  });

  document.getElementById('resetVisits').addEventListener('click', () => {
    if (confirm('Reset visit counter to 0?')) {
      DB.set(DB.keys.visits, 0);
      loadStats();
    }
  });

  document.getElementById('clearAll').addEventListener('click', () => {
    if (confirm('This will delete ALL products, districts, settings, and branding. Continue?')) {
      Object.values(DB.keys).forEach(k => DB.remove(k));
      alert('All data cleared. Reloading...');
      location.reload();
    }
  });

  // Branding
  document.getElementById('logoUp').addEventListener('change', async e => {
    if (!e.target.files[0]) return;
    const url = await fileToDataURL(e.target.files[0]);
    document.getElementById('logoPrev').src = url;
    document.getElementById('logoPrev').dataset.new = url;
  });
  document.getElementById('heroUp').addEventListener('change', async e => {
    if (!e.target.files[0]) return;
    const url = await fileToDataURL(e.target.files[0]);
    document.getElementById('heroPrev').src = url;
    document.getElementById('heroPrev').dataset.new = url;
  });

  document.getElementById('saveBrandBtn').addEventListener('click', () => {
    const b = DB.get(DB.keys.branding, {});
    b.titleSi = document.getElementById('titleSi').value;
    b.titleEn = document.getElementById('titleEn').value;
    b.tagSi = document.getElementById('tagSi').value;
    b.tagEn = document.getElementById('tagEn').value;
    b.descSi = document.getElementById('descSi').value;
    b.descEn = document.getElementById('descEn').value;
    const newLogo = document.getElementById('logoPrev').dataset.new;
    const newHero = document.getElementById('heroPrev').dataset.new;
    if (newLogo) b.logo = newLogo;
    if (newHero) b.hero = newHero;
    DB.set(DB.keys.branding, b);
    alert('Branding saved');
  });
}
