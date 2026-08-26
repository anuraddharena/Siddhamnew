# 🌶️ Siddham - Complete Website Guide (සිංහල)

**The Heart of Home Cooking** - කුඩා කුළුබඩු ව්‍යාපාරය සඳහා සම්පූර්ණ e-commerce වෙබ්සයිට් එකක්.

---

## 📁 File Structure (ඔබට ලැබෙන files)

```
siddham/
├── index.html          ← මුල් පිටුව (Hero + Description + Entry button)
├── products.html       ← Products, Cart, Checkout
├── admin.html          ← Admin panel (login සමග)
├── css/style.css       ← Styling (phone + computer responsive)
├── js/
│   ├── data.js        ← Default products, districts, settings
│   ├── main.js        ← Language toggle, cart count, branding
│   ├── shop.js        ← Cart, checkout, WhatsApp / Email order
│   └── admin.js       ← Admin dashboard logic
├── assets/            ← Logo, hero image, placeholder
└── data/
    └── delivery_charges_sample.csv   ← ඔබට edit කරන්න පුළුවන් sample CSV
```

---

## ✅ Features (ඇතුළත් වූ සියලුම දේ)

| Feature | Location |
|---|---|
| 🏠 Half-page Hero + Logo + Description + Entry Button | index.html top |
| 🖼️ Bottom half - suitable spice image | index.html bottom |
| 🛍️ Product listing with 5 categories (Spices, Spreads, Sweetmeats, Cooking Essentials, Whole Spices) | products.html |
| 🛒 Cart with add / remove / quantity change | products.html |
| 📋 Checkout form (Name, Address, Phone, District, City) | Modal in products.html |
| 🚚 Auto delivery-charge based on district | JS - `shop.js` |
| 💵 "Cash on Delivery" notice shown | Cart + Checkout |
| 📱 WhatsApp order button (opens WhatsApp with full order) | Checkout |
| ✉️ Email order button (opens email with full order) | Checkout |
| 🗂️ Category list add / edit / delete / reorder | Admin → Categories tab |
| 💬 Item comments (latest + toggle to see all) | products.html |
| 👍👎 Item Like / Dislike with counts | products.html |
| 🟢 Sold green bar per item (auto-updates when order marked Delivered) | products.html |
| 🔐 Admin password protection | admin.html |
| 🔑 OTP verification (can be toggled on/off) | admin.html |
| ➕ Add / Edit / Delete products (with image upload) | Admin → Products tab |
| 📊 CSV import for delivery charges | Admin → Delivery tab |
| 🎨 Change logo, hero image, titles, taglines, description | Admin → Branding tab |
| 👁️ Visit counter | Admin → Stats tab |
| 🌏 Sinhala / English language toggle | Every page top |
| 📱 Phone + Computer responsive | CSS media queries |
| 🖼️ Placeholder image when no product image uploaded | Auto fallback |

---

## 🚀 A to Z: How to Use

### 1️⃣ Local Testing (Computer එකේ පරීක්ෂා කිරීම)

1. `siddham` folder එක ඔබේ desktop එකට copy කරගන්න.
2. `index.html` file එක **double-click** කරන්න.
3. Browser එකේ site එක open වේවි.

**⚠️ Important:** File එකෙන් directly open කරන විට image upload වැඩ නොකළ හැක. ඒ සඳහා local server එකක් run කරන්න:

**Python (already installed on most computers):**
```
cd siddham
python -m http.server 8000
```
ඉන්පසු browser එකේ open කරන්න: `http://localhost:8000`

**හෝ VS Code එකේ "Live Server" extension එක install කරලා index.html open කරන්න.**

---

### 2️⃣ Admin Panel එකට Login වීම

1. Browser address bar එකේ **`/admin`** හෝ **`/admin/`** type කරන්න.
   උදා: `https://your-site.netlify.app/admin`
   *(Admin button එකක් site එකේ පෙන්නෙන් නෑ — hidden.)*
2. **Default password:** `siddham123`
3. OTP enabled නම්, screen එකේ පෙන්වන 6-digit code එක type කරන්න.
   *(Real deployment එකකදී මෙය ඔබේ email එකට යවනවා - පහත Section 6 බලන්න)*
4. **⚠️ පළමු login එකෙන් පසු Settings → Change Password වෙතින් password එක වෙනස් කරගන්න!**

---

### 3️⃣ නව Product එකක් Add කිරීම

1. Admin → **Products** tab
2. Form එක පුරවන්න:
   - Name (Sinhala + English)
   - Category (Spices/Spreads/Sweetmeats/Cooking/Whole)
   - Price (Rs.)
   - Unit (100g / 250ml / 10pcs)
   - Image (upload)
3. **"Add Product"** click කරන්න.
4. Products page එකේ automatically පෙනේවි.

**Edit / Delete:** ලැයිස්තුවේ Edit / Delete buttons භාවිතා කරන්න.

---

### 🗂️ Category List වෙනස් කිරීම (Admin → Categories)

Products පිටුවේ පෙන්වන category list එක සම්පූර්ණයෙන්ම admin එකෙන් පාලනය කරන්න පුළුවන්:

- **Add** — Sinhala + English නම් දාලා "Add Category".
- **Edit** — Category එක ළඟ Edit → නම් වෙනස් කරන්න.
- **Delete** — Category එක ළඟ Delete (එහි products තියෙනවා නම් delete කරන්න බෑ — මුලින් products ටික අනිත් category එකකට මාරු කරන්න).
- **Reorder** — ↑ ↓ buttons වලින් පිළිවෙල වෙනස් කරන්න.

Product form එකේ Category dropdown එකත් මේ list එකෙන්ම පිරේ.

> 💡 Category list එක `localStorage` (`siddham_categories`) එකේ save වේ. Browser cache හෝ data reset කළොත් default කැටගරි 5 ආයේ load වේවි.

---

### 💬 Comments / 👍👎 Votes / 🟢 Sold bar (products page)

- **Comments** — සෑම item එකක් යටම comment කරන්න පුළුවන්. Default වශයෙන් පෙන්වන්නේ **අන්තිම comment** එක පමණයි. `සියලු අදහස් (n)` arrow එක click කළොත් සේරම open වේ.
  - Comments save වන්නේ `localStorage` (`siddham_comments`) එකේ — ඒ browser එකේ පමණයි (static site limitation).
- **Like / Dislike** — එක් click එකකින් like හෝ dislike එකක් දාන්න පුළුවන්; ආයේ click කළොත් අයින් වේ. ගණන් buttons යට පොඩි අකුරින් පෙන්වයි. (`siddham_votes`)
- **Sold green bar** — වැඩිම විකුණුම් ඇති item එක 100% ලෙස ගෙන අනෙක් ඒවා අදාළ ප්‍රමාණයෙන් green bar එකකින් පෙන්වයි.
  - **Admin → Products → Sold count** එකෙන් අතින් වෙනස් කරන්න පුළුවන්.
  - Order එකක් **Delivered** කරන විට එහි items වල sold ගණන **auto +** වේ (එක් order එකක් දෙවරක් ගණන් නොවේ).

---

### 4️⃣ Delivery Charges Setup (CSV import)

**CSV Format (columns must match):**

| From Branch | To District | To City | Charge for 1st kg | Charge per additional 1kg |
|---|---|---|---|---|
| Mattegoda | Colombo | Nugegoda | 200 | 40 |
| Mattegoda | Kandy   | Kandy    | 450 | 80 |

**Formula:** `Total delivery = 1st_kg_charge + (weight − 1) × additional_kg_charge`

**විකල්ප 1 - CSV upload:**
1. Admin → **Delivery** tab
2. **"Download Sample CSV"** click කරලා sample file එක download කරන්න.
3. Excel එකෙන් open කරලා ඔබේ charges edit කරන්න (5 columns).
4. Save as CSV.
5. Import Mode තෝරන්න:
   - **Replace all** — පරණ දේවල් ඉවත් කර නව list එක install කරන්න
   - **Add / Update** — නව රෝ එකතු කරන්න (එකම district+city එකක් නම් update වෙනවා)
6. **"Import CSV"** click කරන්න.

**විකල්ප 2 - Manual:**
- Branch / District / City / 1st kg / Additional kg fill කරලා "Add / Update".

**Checkout එකේදී:**
- Customer District තෝරයි → City options එන්නේ ඒ district එකට අදාළ ඒවා පමණයි.
- Weight (kg) type කලාම delivery charge auto calculate වෙනවා.

**සියලුම 25 Sri Lankan districts + main cities දැනටමත් load වී ඇත.**

---

### 5️⃣ WhatsApp / Email / Social Setup

Admin → **Settings** tab:
- **WhatsApp Number:** country code සමග, + හෝ spaces නොමැතිව. උදා: `94777317208`
- **Order Notification Email:** ඔබට orders යවන gmail address එක
- **Facebook Page URL:** ඔබේ FB page එකේ complete URL
- **Instagram Profile URL:** ඔබේ IG profile එකේ complete URL
- **Enable OTP:** Yes/No

Home page එකේ footer එකේ 📞 📧 📘 📷 icons click කලාම හරි link එකට යනවා.

### 📦 Auto Weight + Delivery Charges

- Cart එකේ items add කලාම **weight (g/kg) auto calculate වෙනවා**
- Checkout එකේදී district + city තෝරන විට delivery charge auto set වෙනවා
- **⚠️ Special notices** — Cart එකේ contents අනුව auto දිස්වේ:
  - **PCS items ඇතුළත් නම්** (කැවුම්, මුං කැවුම් වගේ): "රසකැවිලි ඇතුළු... බර අනුමාන වශයෙන් සකසා ඇති බැවින්..." notice
  - **PCS items නැත්නම්** (කුඩු වගේ පමණයි): "බර පමණක්... ඇසුරුම් බර සමග... සුළු වෙනසක්..." notice

### 🧾 Invoice PDF (Admin Only — Package එකට එකතු කරන්න)

**Customer ට invoice දෙන්නේ නෑ. Order ලැබෙන්න කලින් invoice දීමට අවශ්‍ය නැත.**

**වැඩ කරන ආකාරය:**
1. Customer WhatsApp/Email button click කරලා order එක confirm කරයි
2. Order එක **automatically Admin → Orders tab** එකට save වේ
3. Admin (ඔබ) login වී:
   - Orders tab එකේ order එක බලාගන්න පුළුවන්
   - **📄 Download Invoice PDF** click කරලා PDF එක print කරන්න
   - Print කරපු invoice එක **package එකට එකතු කරලා customer ට delivery කරන්න**
   - Status වෙනස් කරන්න (Pending → Packed → Delivered)

**Invoice PDF එකට ඇතුළත්:**
- Order ID (SDM + timestamp)
- Customer details (Bill To), Siddham details (From)
- Items table (name Si+En, size, qty, price, total)
- Subtotal / Weight / Delivery / **GRAND TOTAL**
- Cash on Delivery badge
- Delivery notice (pcs items ඇත/නැත අනුව auto)
- **QR Code** — scan කලාම order summary
- **Barcode** (CODE128) — Order ID scanning සදහා

**Order Management Features (Admin → Orders):**
- Pending count badge tab එකේ පෙනේ
- Filter by status (Pending / Packed / Delivered / Cancelled)
- Search by name / phone / order ID
- WhatsApp customer directly button
- Clear all orders button

### 📊 Visitor Calculator

Admin → **Stats** tab:
- Today / This Week / This Month / Avg per Day cards
- **Custom date range calculator** — From/To dates තෝරලා period එකකට visits ගණන් කරන්න
- Preset options: Last 7 / 30 / 90 / 365 days

---

### 6️⃣ 🌐 FREE Hosting (Website එක Internet එකට දැමීම)

**වඩාත්ම පහසු ක්‍රමය: Netlify Drop**

1. https://app.netlify.com/drop යන්න
2. `siddham` folder එක drag-and-drop කරන්න
3. ✅ එකවරම live URL එකක් ලැබේ (උදා: `https://siddham-abc.netlify.app`)
4. Free forever. No credit card.
5. Custom domain (siddham.lk වැනි) සදහා Netlify dashboard එකේ Settings → Domain management.

**විකල්ප ක්‍රම:**
- **GitHub Pages** (free): GitHub account එකක් හදලා repo එකට upload → Settings → Pages → Enable.
- **Cloudflare Pages** (free): pages.cloudflare.com → Upload folder.
- **Vercel** (free): vercel.com → Import → Deploy.

**⚠️ Notes:**
- මෙම site එක **static site** එකකි, එනිසා products/settings data browser එකේ **localStorage** එකේ save වේ. එනම්, Admin විදිහට එකතු කරන products, ඒම browser එකේ පමණයි පෙනෙන්නේ.
- Real හැම customer කෙනෙකුටම එක product list එකක්ම පෙන්වන්න ඕන නම්, backend එකක් අවශ්‍යයි (Firebase Free plan හෝ Google Sheets). ඒ ගැන දැනගන්න ඕන නම් මට කියන්න—පසුව upgrade කර දෙන්නම්.

**දැනට හොදම ක්‍රමය:** Netlify drop කරලා, admin browser එකෙන් products upload කරන්න. Customer visits කිරීමට එක browser එකකින් products load වෙන්නේ නැති නම්, **`js/data.js`** file එකේ `DEFAULT_PRODUCTS` array එකේ products එකතු කරලා redeploy කරන්න.

---

### 7️⃣ Real OTP Email එකකට යවන ක්‍රමය (Optional Upgrade)

දැනට OTP screen එකේ පෙන්වයි (demo). Real email එකට යවන්න:

1. https://www.emailjs.com/ (free tier: 200 emails/month) හෝ https://formspree.io/ register වන්න.
2. Service ID, Template ID, Public Key ලබාගන්න.
3. `admin.html` head එකට මේ script එක එක් කරන්න:
   ```html
   <script src="https://cdn.emailjs.com/dist/email.min.js"></script>
   ```
4. `js/admin.js` file එකේ `loginBtn` click handler එකේ, `pendingOtp = ...` line එකට පසුව මේක එක් කරන්න:
   ```js
   emailjs.init('YOUR_PUBLIC_KEY');
   emailjs.send('SERVICE_ID','TEMPLATE_ID',{ otp: pendingOtp, to_email: s.orderEmail });
   ```

---

### 8️⃣ Logo/Text වෙනස් කිරීම

Admin → **Branding** tab:
- New logo upload
- Hero image upload
- Site title, tagline, description වෙනස් කිරීම (Sinhala + English දෙකම)
- "Save Branding" click

සියලුම pages වල automatically update වේ.

---

### 9️⃣ Visit Count බැලීම

Admin → **Stats** tab හෝ dashboard header එකේ 👁️ Visits badge එක.
Reset කිරීම: **Settings → "Reset Visit Counter"**

---

## 🎨 Colour Scheme

Logo එකේ gold colour එකට ගැලපෙන:
- Primary: `#c9a227` (gold)
- Dark: `#a5811a`
- Background: `#fdf8ec` (cream)

`css/style.css` එකේ `:root` selector එකේ එකට වෙනස් කරන්න.

---

## ❓ Common Issues

| Issue | Solution |
|---|---|
| Image එක save වෙන්නේ නෑ | Local server run කරන්න (double-click නොකර) |
| WhatsApp button එක වැඩ නෑ | Settings → WhatsApp Number correct කරන්න (94...) |
| Products එකවරම disappear | Browser cache clear කලා. `data.js` එකේ default නැවත load වේවි |
| Password අමතක උනා | Browser DevTools → Application → LocalStorage → Delete `siddham_settings` → default `siddham123` නැවත වැඩ කරයි |
| Site එක mobile එකේ පෙන්නෙ නෑ | Cache clear කරන්න |

---

## 📞 Support

මම දැන් ඔබට basic complete site එක දුන්නා. පසුව අවශ්‍ය නම්:
- ✅ Firebase backend එකක් සමග real-time multi-user support
- ✅ Real OTP via email/SMS
- ✅ Payment gateway integration
- ✅ Custom domain setup

මට කියන්න, එකින් එක upgrade කරදෙන්නම්. 🌟
