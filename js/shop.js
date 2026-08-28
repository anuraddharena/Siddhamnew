/* ============================================================
   Siddham - product listing, cart, checkout
   ============================================================ */

let currentCat = 'all';

/* ---------- Cloud sync for comments & likes (jsonbin.io) ----------
   Configure in Admin → Settings: commentsBinId + commentsApiKey.
   Without a key everything stays local (per browser). */
function socialCfg() {
  const s = DB.get(DB.keys.settings, {});
  return {
    binId: (s.commentsBinId || '').trim(),
    key: (s.commentsApiKey || '').trim(),
    base: (s.jsonBinBase || 'https://api.jsonbin.io/v3').replace(/\/+$/, '')
  };
}
function socialRemote() {
  const c = socialCfg();
  if (!c.binId || !c.key || typeof fetch !== 'function') return null;
  return {
    get: () => fetch(`${c.base}/b/${c.binId}/latest`, { headers: { 'X-Master-Key': c.key } })
      .then(r => r.ok ? r.json() : null)
      .then(j => (j && (j.record || j)) || null),
    put: doc => fetch(`${c.base}/b/${c.binId}`, {
      method: 'PUT',
      headers: { 'X-Master-Key': c.key, 'Content-Type': 'application/json' },
      body: JSON.stringify(doc)
    }).then(r => r.ok)
  };
}
function socialDoc() {
  return { comments: DB.get(DB.keys.comments, {}), votes: DB.get(DB.keys.votes, {}) };
}
/* Merge a remote doc into local storage; returns true if anything changed */
function mergeSocialDoc(remote) {
  let changed = false;
  const rComments = remote.comments || {};
  const all = DB.get(DB.keys.comments, {});
  Object.keys(rComments).forEach(pid => {
    const cur = all[pid] || [];
    const seen = new Set(cur.map(c => c.ts + '|' + c.text));
    rComments[pid].forEach(c => {
      if (!c || !c.text) return;
      const sig = (c.ts || '') + '|' + c.text;
      if (!seen.has(sig)) { cur.push(c); seen.add(sig); changed = true; }
    });
    if (cur.length) all[pid] = cur;
  });
  if (changed) DB.set(DB.keys.comments, all);

  const rVotes = remote.votes || {};
  const lv = DB.get(DB.keys.votes, {});
  let vChanged = false;
  Object.keys(rVotes).forEach(pid => {
    if (!lv[pid]) { lv[pid] = rVotes[pid]; vChanged = true; }
  });
  if (vChanged) DB.set(DB.keys.votes, lv);
  return changed || vChanged;
}
let socialPushTimer = null;
function pushSocial() {
  const r = socialRemote();
  if (!r) return;
  r.put(socialDoc()).catch(() => {});
}
function schedulePush() {
  clearTimeout(socialPushTimer);
  socialPushTimer = setTimeout(pushSocial, 900);
}
/* On load: pull remote, merge, re-render, push merged back */
function syncSocial() {
  const r = socialRemote();
  if (!r) return Promise.resolve();
  return r.get()
    .then(remote => {
      let changed = false;
      if (remote) changed = mergeSocialDoc(remote);
      // push merged doc (also creates the bin record on first run)
      pushSocial();
      if (changed) {
        try { renderCatNav(); renderProducts(); renderCart(); } catch (e) {}
      }
    })
    .catch(() => {});
}

// per-product selected qty (not yet added to cart)
const selectedQty = {};

/* Build the category filter bar from admin-managed list */
function renderCatNav() {
  const nav = document.getElementById('catNav');
  if (!nav) return;
  const lang = DB.get(DB.keys.lang, 'si');
  const cats = getCategories();

  // If the selected category no longer exists, fall back to "All"
  if (currentCat !== 'all' && !cats.some(c => c.id === currentCat)) {
    currentCat = 'all';
    renderProducts();
  }

  nav.innerHTML = '';
  const mk = (id, si, en) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'cat-btn' + (currentCat === id ? ' active' : '');
    b.dataset.cat = id;
    b.dataset.si = si;
    b.dataset.en = en;
    b.textContent = lang === 'si' ? si : en;
    b.addEventListener('click', () => {
      nav.querySelectorAll('.cat-btn').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      currentCat = id;
      renderProducts();
    });
    nav.appendChild(b);
  };
  mk('all', 'සියල්ල', 'All');
  cats.forEach(c => mk(c.id, c.nameSi || c.nameEn, c.nameEn || c.nameSi, false));
}

/* Social section builder: sold bar + votes + comments for one product card */
function itemSocialHTML(p, lang, maxSold) {
  const votes = getVotes(p.id);
  const my = votes.my;
  const sold = p.sold || 0;
  const pct = maxSold > 0 ? Math.max(3, Math.round(sold / maxSold * 100)) : 0;
  const soldText = lang === 'si' ? `විකුණුම් ${sold}` : `${sold} sold`;
  const soldLabel = lang === 'si' ? 'විකුණා ඇති ප්‍රමාණය' : 'Total sold';
  const cmts = getComments(p.id);
  const last = cmts[cmts.length - 1];
  const gc = lang === 'si' ? 'අමුත්තා' : 'Guest';
  const noC = lang === 'si' ? 'තවම අදහස් නැත' : 'No comments yet';
  const allC = lang === 'si' ? 'සියලු අදහස්' : 'All comments';
  const latest = lang === 'si' ? 'අලුත්ම' : 'Latest';

  let latestHTML;
  if (last) {
    latestHTML = `
      <div class="comment-item">
        <span class="c-name">${esc(last.name || gc)}</span>
        <span class="c-time">${fmtDT(last.ts)}</span>
        <div class="c-text">${esc(last.text)}</div>
      </div>`;
  } else {
    latestHTML = `<div class="c-empty">${noC} 💬</div>`;
  }

  return `
    <div class="sold-bar-wrap" title="${soldLabel}">
      <div class="sold-bar" style="width:${pct}%"></div>
      <span class="sold-label">${soldText}</span>
    </div>
    <div class="vote-row">
      <button type="button" class="vote-btn like${my === 'like' ? ' on' : ''}" data-vote="like" data-id="${p.id}">
        <span class="v-ico">👍</span><span class="v-n" id="like-n-${p.id}">${votes.likes}</span>
      </button>
      <button type="button" class="vote-btn dislike${my === 'dislike' ? ' on' : ''}" data-vote="dislike" data-id="${p.id}">
        <span class="v-ico">👎</span><span class="v-n" id="dislike-n-${p.id}">${votes.dislikes}</span>
      </button>
    </div>
    <div class="comment-box">
      <div class="comment-head">
        <span>💬 ${lang === 'si' ? 'අදහස්' : 'Comments'}</span>
        <button type="button" class="comments-toggle" data-id="${p.id}">
          <span class="ct-label">${allC} (${cmts.length})</span> <span class="ct-arrow">⌄</span>
        </button>
      </div>
      <div class="comment-latest-title">${latest}:</div>
      <div class="comment-latest" id="c-latest-${p.id}">${latestHTML}</div>
      <div class="comments-all" id="c-all-${p.id}">
        ${cmts.map(c => `
          <div class="comment-item">
            <span class="c-name">${esc(c.name || gc)}</span>
            <span class="c-time">${fmtDT(c.ts)}</span>
            <div class="c-text">${esc(c.text)}</div>
          </div>`).join('') || `<div class="c-empty">${noC} 💬</div>`}
      </div>
      <form class="comment-form" data-id="${p.id}">
        <input type="text" class="c-name-in" placeholder="${lang === 'si' ? 'නම (අමුත්තා)' : 'Name (guest)'}" maxlength="40">
        <input type="text" class="c-text-in" placeholder="${lang === 'si' ? 'ඔබේ අදහස ලියන්න...' : 'Write a comment...'}" maxlength="300" required>
        <button type="submit" class="c-send">➤</button>
      </form>
    </div>`;
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}
function fmtDT(ts) {
  const d = new Date(ts);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function renderProducts() {
  const grid = document.getElementById('productGrid');
  const lang = DB.get(DB.keys.lang, 'si');
  const products = DB.get(DB.keys.products, []);
  const list = currentCat === 'all' ? products : products.filter(p => p.cat === currentCat);
  const maxSold = Math.max(1, ...products.map(q => q.sold || 0));
  grid.innerHTML = '';
  if (list.length === 0) {
    const msg = lang === 'si' ? 'මෙම කාණ්ඩයේ නිෂ්පාදන තවම නැත.' : 'No products in this category yet.';
    grid.innerHTML = `<p style="grid-column:1/-1;text-align:center;padding:40px;color:#888">${msg}</p>`;
    return;
  }
  list.forEach(p => {
    if (!(p.id in selectedQty)) selectedQty[p.id] = 1;
    const name = lang === 'si' ? p.nameSi : p.nameEn;
    const img = p.img || PLACEHOLDER;
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <img src="${img}" alt="${name}" onerror="this.src=PLACEHOLDER">
      <div class="product-info">
        <h3>${name}</h3>
        <div class="unit">${p.unit || ''}</div>
        <div class="price">Rs. ${p.price}</div>
        <div class="qty-select">
          <button type="button" class="qty-btn" data-act="dec" data-id="${p.id}">−</button>
          <span class="qty-num" id="qty-${p.id}">${selectedQty[p.id]}</span>
          <button type="button" class="qty-btn" data-act="inc" data-id="${p.id}">+</button>
        </div>
        <button class="add-cart-btn" data-id="${p.id}">
          🛒 ${lang === 'si' ? 'කරත්තයට එකතු කරන්න' : 'Add to Cart'}
        </button>
        ${itemSocialHTML(p, lang, maxSold)}
      </div>`;
    grid.appendChild(card);
    wireItemSocial(card, p.id);
  });
  grid.querySelectorAll('.qty-btn').forEach(b => {
    b.addEventListener('click', () => {
      const id = parseInt(b.dataset.id);
      if (b.dataset.act === 'inc') selectedQty[id]++;
      else if (selectedQty[id] > 1) selectedQty[id]--;
      document.getElementById('qty-' + id).textContent = selectedQty[id];
    });
  });
  grid.querySelectorAll('.add-cart-btn').forEach(b => {
    b.addEventListener('click', () => addToCart(parseInt(b.dataset.id)));
  });
}

/* Wire votes + comments inside one card */
function wireItemSocial(card, pid) {
  card.querySelectorAll('.vote-btn').forEach(b => {
    b.addEventListener('click', () => {
      const v = voteProduct(pid, b.dataset.vote);
      document.getElementById('like-n-' + pid).textContent = v.likes;
      document.getElementById('dislike-n-' + pid).textContent = v.dislikes;
      card.querySelectorAll('.vote-btn').forEach(x => x.classList.remove('on'));
      if (v.my) card.querySelector(`.vote-btn[data-vote="${v.my}"]`).classList.add('on');
      schedulePush();
    });
  });

  const toggle = card.querySelector('.comments-toggle');
  if (toggle) toggle.addEventListener('click', () => {
    const all = card.querySelector('.comments-all');
    const open = all.style.display === 'block';
    all.style.display = open ? 'none' : 'block';
    toggle.querySelector('.ct-arrow').textContent = open ? '⌄' : '⌃';
    const lang = DB.get(DB.keys.lang, 'si');
    const n = getComments(pid).length;
    toggle.querySelector('.ct-label').textContent =
      `${lang === 'si' ? 'සියලු අදහස්' : 'All comments'} (${n})`;
  });

  const form = card.querySelector('.comment-form');
  if (form) form.addEventListener('submit', e => {
    e.preventDefault();
    const textIn = form.querySelector('.c-text-in');
    const nameIn = form.querySelector('.c-name-in');
    if (!textIn.value.trim()) return;
    const lang = DB.get(DB.keys.lang, 'si');
    addComment(pid, nameIn.value, textIn.value);
    textIn.value = '';
    // refresh just this card's comment area
    const p = (DB.get(DB.keys.products, [])).find(x => x.id === pid);
    if (!p) return;
    const cmts = getComments(pid);
    const gc = lang === 'si' ? 'අමුත්තා' : 'Guest';
    const latestHTML = `
      <div class="comment-item">
        <span class="c-name">${esc(cmts[cmts.length-1].name || gc)}</span>
        <span class="c-time">${fmtDT(cmts[cmts.length-1].ts)}</span>
        <div class="c-text">${esc(cmts[cmts.length-1].text)}</div>
      </div>`;
    card.querySelector('#c-latest-' + pid).innerHTML = latestHTML;
    card.querySelector('#c-all-' + pid).innerHTML = cmts.map(c => `
      <div class="comment-item">
        <span class="c-name">${esc(c.name || gc)}</span>
        <span class="c-time">${fmtDT(c.ts)}</span>
        <div class="c-text">${esc(c.text)}</div>
      </div>`).join('');
    const cl = card.querySelector('.ct-label');
    if (cl) cl.textContent = `${lang === 'si' ? 'සියලු අදහස්' : 'All comments'} (${cmts.length})`;
    schedulePush();
  });
}

function showToast(msg) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast'; t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => t.classList.remove('show'), 1800);
}

function addToCart(id) {
  const qty = selectedQty[id] || 1;
  const cart = DB.get(DB.keys.cart, []);
  const existing = cart.find(i => i.id === id);
  if (existing) existing.qty += qty;
  else cart.push({ id, qty });
  DB.set(DB.keys.cart, cart);
  updateCartCount();
  // reset local qty back to 1
  selectedQty[id] = 1;
  const el = document.getElementById('qty-' + id);
  if (el) el.textContent = 1;
  // toast feedback — DO NOT open cart drawer
  const lang = DB.get(DB.keys.lang, 'si');
  showToast(lang === 'si' ? `✓ කරත්තයට එකතු කලා (${qty})` : `✓ Added to cart (${qty})`);
  renderCart(); // keep cart contents fresh in the background
}

function removeFromCart(id) {
  let cart = DB.get(DB.keys.cart, []);
  cart = cart.filter(i => i.id !== id);
  DB.set(DB.keys.cart, cart);
  updateCartCount();
  renderCart();
}

function changeQty(id, delta) {
  const cart = DB.get(DB.keys.cart, []);
  const it = cart.find(i => i.id === id);
  if (!it) return;
  it.qty += delta;
  if (it.qty <= 0) return removeFromCart(id);
  DB.set(DB.keys.cart, cart);
  updateCartCount();
  renderCart();
}

function renderCart() {
  const cart = DB.get(DB.keys.cart, []);
  const products = DB.get(DB.keys.products, []);
  const lang = DB.get(DB.keys.lang, 'si');
  const list = document.getElementById('cartItems');
  list.innerHTML = '';
  let subtotal = 0;
  if (cart.length === 0) {
    list.innerHTML = `<p style="text-align:center;padding:30px;color:#888">${lang==='si'?'කරත්තය හිස්‍ය':'Cart is empty'}</p>`;
  }
  cart.forEach(it => {
    const p = products.find(x => x.id === it.id);
    if (!p) return;
    const name = lang === 'si' ? p.nameSi : p.nameEn;
    subtotal += p.price * it.qty;
    const el = document.createElement('div');
    el.className = 'cart-item';
    el.innerHTML = `
      <img src="${p.img || PLACEHOLDER}" onerror="this.src=PLACEHOLDER">
      <div class="info">
        <h4>${name}</h4>
        <div style="color:#666;font-size:12px">Rs. ${p.price} × ${it.qty} = <b>Rs. ${p.price*it.qty}</b></div>
        <div class="qty-ctrl">
          <button data-act="dec" data-id="${p.id}">−</button>
          <span>${it.qty}</span>
          <button data-act="inc" data-id="${p.id}">+</button>
        </div>
      </div>
      <button class="remove-btn" data-act="rm" data-id="${p.id}" title="Remove">🗑️</button>`;
    list.appendChild(el);
  });
  list.querySelectorAll('button[data-act]').forEach(b => {
    b.addEventListener('click', () => {
      const id = parseInt(b.dataset.id);
      if (b.dataset.act === 'inc') changeQty(id, 1);
      else if (b.dataset.act === 'dec') changeQty(id, -1);
      else removeFromCart(id);
    });
  });
  document.getElementById('subtotal').textContent = subtotal;
  document.getElementById('total').textContent = subtotal;
  document.getElementById('deliveryRow').style.display = 'none';

  // Auto weight display
  const totG = cartTotalWeightG(cart, products);
  const kg = gramsToKgCeil(totG);
  const wg = document.getElementById('cartWeightG');
  const wk = document.getElementById('cartWeightKg');
  if (wg) wg.textContent = totG;
  if (wk) wk.textContent = kg;
  renderNotice(document.getElementById('cartNotice'), cart, products);
}

/* ---------- Special delivery notices ---------- */
function renderNotice(box, cart, products) {
  if (!box) return;
  const lang = DB.get(DB.keys.lang, 'si');
  const hasPcs = cartHasPcsItem(cart, products);
  if (cart.length === 0) { box.className = 'notice'; box.innerHTML = ''; return; }
  if (hasPcs) {
    box.className = 'notice pcs show';
    box.innerHTML = `
      <span class="notice-title">${lang==='si'?'⚠️ ප්‍රවාහන ගාස්තු පිළිබඳ විශේෂ දැනුම්දීම':'⚠️ Delivery Charge Notice'}</span>
      ${lang==='si'
        ? 'රසකැවිලි ඇතුළු ඒවැනි අනෙකුත් ද්‍රව්‍යවල බර <b>අනුමාන වශයෙන්</b> සකසා ඇති බැවින්, ප්‍රවාහන ගාස්තු <b>වෙනස් විය හැකි</b> බව කරුණාවෙන් සලකන්න.'
        : 'The weight of sweetmeats and similar items is set <b>approximately</b>, so delivery charges may vary slightly. Kindly note this.'}
    `;
  } else {
    box.className = 'notice small show';
    box.innerHTML = `
      <span class="notice-title">${lang==='si'?'ℹ️ ප්‍රවාහන ගාස්තු පිළිබඳ දැනුම්දීම':'ℹ️ Delivery Note'}</span>
      ${lang==='si'
        ? 'මෙහි සඳහන් වන්නේ භාණ්ඩවල <b>බර පමණක්</b> වන බැවින්, ඇසුරුම් බර සමග ප්‍රවාහන ගාස්තුවේ <b>සුළු වෙනසක්</b> විය හැකි බව කරුණාවෙන් සලකන්න.'
        : 'The listed weight is <b>only the product weight</b>. Including packaging, delivery charges may vary <b>slightly</b>. Kindly note this.'}
    `;
  }
}

function openCart() {
  document.getElementById('cartDrawer').classList.add('open');
  document.getElementById('overlay').classList.add('open');
}
function closeCart() {
  document.getElementById('cartDrawer').classList.remove('open');
  document.getElementById('overlay').classList.remove('open');
}

/* ---------- Checkout ---------- */
function openCheckout() {
  const cart = DB.get(DB.keys.cart, []);
  if (cart.length === 0) { alert('Your cart is empty!'); return; }

  // populate districts
  const lang = DB.get(DB.keys.lang, 'si');
  const sel = document.getElementById('districtSel');
  const first = lang === 'si' ? '-- දිස්ත්‍රික්කය තෝරන්න --' : '-- Select District --';
  sel.innerHTML = `<option value="">${first}</option>`;
  getDistricts().forEach(d => {
    sel.innerHTML += `<option value="${d}">${d}</option>`;
  });

  // reset city
  const csel = document.getElementById('citySel');
  const cfirst = lang === 'si' ? '-- පළමුව දිස්ත්‍රික්කය තෝරන්න --' : '-- Select District first --';
  csel.innerHTML = `<option value="">${cfirst}</option>`;

  updateCheckoutTotals();
  document.getElementById('checkoutModal').classList.add('open');
}
function closeCheckout() {
  document.getElementById('checkoutModal').classList.remove('open');
}

function populateCities() {
  const d = document.getElementById('districtSel').value;
  const csel = document.getElementById('citySel');
  const lang = DB.get(DB.keys.lang, 'si');
  csel.innerHTML = `<option value="">${lang==='si'?'-- නගරය තෝරන්න --':'-- Select City --'}</option>`;
  if (!d) return;
  getCitiesFor(d).forEach(c => {
    csel.innerHTML += `<option value="${c}">${c}</option>`;
  });
  updateCheckoutTotals();
}

function updateCheckoutTotals() {
  const cart = DB.get(DB.keys.cart, []);
  const products = DB.get(DB.keys.products, []);
  let sub = 0;
  cart.forEach(it => {
    const p = products.find(x => x.id === it.id);
    if (p) sub += p.price * it.qty;
  });
  const d = document.getElementById('districtSel').value;
  const c = document.getElementById('citySel').value;
  const totG = cartTotalWeightG(cart, products);
  const kg = gramsToKgCeil(totG);
  document.getElementById('weightIn').value = `${totG} g  (${kg} kg)`;
  const row = (d && c) ? findRate(d, c) : null;
  const charge = row ? computeCharge(row, kg) : 0;
  document.getElementById('chargeShow').textContent = charge;
  document.getElementById('finalTotal').textContent = sub + charge;
  renderNotice(document.getElementById('deliveryNotice'), cart, products);
}

function makeOrderId() {
  const d = new Date();
  const pad = n => String(n).padStart(2,'0');
  return `SDM${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function buildOrder(formData) {
  const cart = DB.get(DB.keys.cart, []);
  const products = DB.get(DB.keys.products, []);
  const totG = cartTotalWeightG(cart, products);
  const kg = gramsToKgCeil(totG);
  let sub = 0;
  const items = cart.map(it => {
    const p = products.find(x => x.id === it.id);
    if (!p) return null;
    const total = p.price * it.qty;
    sub += total;
    return { id: p.id, name: p.nameEn, nameSi: p.nameSi, unit: p.unit || '', qty: it.qty, price: p.price, total };
  }).filter(Boolean);
  const row = findRate(formData.district, formData.city);
  const charge = row ? computeCharge(row, kg) : 0;
  return {
    orderId: makeOrderId(),
    date: new Date(),
    customer: formData,
    items, subtotal: sub, weightG: totG, weightKg: kg, delivery: charge, total: sub + charge,
    hasPcs: cartHasPcsItem(cart, products)
  };
}

function buildOrderMessage(order) {
  const f = order.customer;
  let msg = `*🛒 New Order - Siddham*\n`;
  msg += `Order ID: *${order.orderId}*\n\n`;
  msg += `👤 *Name:* ${f.name}\n`;
  msg += `📞 *Phone:* ${f.phone}\n`;
  msg += `📍 *Address:* ${f.address}\n`;
  msg += `🏙️ *District:* ${f.district}\n`;
  msg += `🏘️ *City:* ${f.city}\n`;
  msg += `⚖️ *Weight:* ${order.weightG} g (${order.weightKg} kg)\n\n`;
  msg += `*🌶️ Items:*\n`;
  order.items.forEach(it => {
    msg += `• ${it.name} (${it.unit}) × ${it.qty} = Rs. ${it.total}\n`;
  });
  msg += `\n💰 *Subtotal:* Rs. ${order.subtotal}`;
  msg += `\n🚚 *Delivery:* Rs. ${order.delivery}`;
  msg += `\n💵 *Total:* Rs. ${order.total}`;
  msg += `\n\n💵 *Payment:* Cash on Delivery`;
  if (order.hasPcs) {
    msg += `\n\n⚠️ Note: Includes pcs-based items. Weight is approximate; delivery may vary slightly.`;
  } else {
    msg += `\n\nℹ️ Note: Listed weight is product-only; packaging may cause slight delivery variation.`;
  }
  if (f.notes) msg += `\n\n📝 *Notes:* ${f.notes}`;
  msg += `\n\n📅 ${order.date.toLocaleString()}`;
  return msg;
}

/* Save order to localStorage so admin can view / generate invoice later */
function saveOrder(order) {
  const orders = DB.get('siddham_orders', []) || [];
  const stored = {
    ...order,
    date: order.date.toISOString(),
    status: 'pending'
  };
  orders.unshift(stored); // newest first
  DB.set('siddham_orders', orders);
}

function submitViaWhatsApp(formData) {
  const s = DB.get(DB.keys.settings, {});
  const order = buildOrder(formData);
  saveOrder(order);
  const msg = buildOrderMessage(order);
  const url = `https://wa.me/${s.waNumber}?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
  clearCartAfterOrder();
}

function submitViaEmail(formData) {
  const s = DB.get(DB.keys.settings, {});
  const order = buildOrder(formData);
  saveOrder(order);
  const subject = `New Order ${order.orderId} - Siddham`;
  const body = buildOrderMessage(order).replace(/\*/g, '');
  const url = `mailto:${s.orderEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = url;
  clearCartAfterOrder();
}

function clearCartAfterOrder() {
  setTimeout(() => {
    if (confirm('Was your order sent successfully? Click OK to clear the cart.')) {
      DB.set(DB.keys.cart, []);
      updateCartCount();
      renderCart();
      closeCheckout();
      closeCart();
    }
  }, 1500);
}

/* ---------- Wire everything ---------- */
document.addEventListener('DOMContentLoaded', () => {
  renderCatNav();
  renderProducts();
  renderCart();
  syncSocial(); // pull comments/likes from cloud (if configured)

  // Data.json sync finished → re-render with fresh data
  if (typeof onDataSync === 'function') {
    onDataSync(() => { renderCatNav(); renderProducts(); renderCart(); });
  }

  // Re-render everything when the language is switched (main.js handler runs first)
  const lb = document.getElementById('langBtn');
  if (lb) lb.addEventListener('click', () => { renderCatNav(); renderProducts(); renderCart(); });

  document.getElementById('cartBtn').addEventListener('click', () => { openCart(); renderCart(); });
  document.getElementById('closeCart').addEventListener('click', closeCart);
  document.getElementById('overlay').addEventListener('click', closeCart);

  document.getElementById('checkoutBtn').addEventListener('click', openCheckout);
  document.getElementById('closeModal').addEventListener('click', closeCheckout);

  document.getElementById('districtSel').addEventListener('change', populateCities);
  document.getElementById('citySel').addEventListener('change', updateCheckoutTotals);
  document.getElementById('weightIn').addEventListener('input', updateCheckoutTotals);

  document.getElementById('orderForm').addEventListener('submit', e => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.target));
    submitViaWhatsApp(fd);
  });

  document.getElementById('emailBtn').addEventListener('click', () => {
    const form = document.getElementById('orderForm');
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const fd = Object.fromEntries(new FormData(form));
    submitViaEmail(fd);
  });

  // re-render when language changes
  const orig = document.getElementById('langBtn').onclick;
  document.getElementById('langBtn').addEventListener('click', () => {
    setTimeout(() => { renderProducts(); renderCart(); }, 50);
  });
});
