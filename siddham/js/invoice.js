/* ============================================================
   Siddham - Invoice PDF generator (with QR + Barcode)
   Requires: jsPDF, jspdf-autotable, qrcode, JsBarcode  (CDN)
   ============================================================ */

async function makeQrDataURL(text) {
  return new Promise((res, rej) => {
    QRCode.toDataURL(text, { margin: 1, width: 180 }, (err, url) => {
      if (err) rej(err); else res(url);
    });
  });
}

function makeBarcodeDataURL(text) {
  const canvas = document.createElement('canvas');
  JsBarcode(canvas, text, {
    format: 'CODE128', width: 2, height: 50,
    displayValue: true, fontSize: 12, margin: 0
  });
  return canvas.toDataURL('image/png');
}

async function generateInvoicePDF(order, autoSave = true) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const M = 15; // margin
  const settings = DB.get(DB.keys.settings, {});
  const branding = DB.get(DB.keys.branding, {});
  const lang = DB.get(DB.keys.lang, 'si');

  // ---------- Header band ----------
  doc.setFillColor(26, 22, 19);
  doc.rect(0, 0, W, 32, 'F');

  // Logo (embed if available, else text)
  const logo = branding.logo || (location.pathname.includes('/admin/') ? '../assets/logo.jpg' : 'assets/logo.jpg');
  try {
    const img = await loadImage(logo);
    doc.addImage(img, 'JPEG', M, 5, 22, 22);
  } catch (e) { /* skip */ }

  doc.setTextColor(201, 162, 39);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('SIDDHAM', M + 26, 15);
  doc.setFontSize(9);
  doc.setTextColor(232, 201, 106);
  doc.setFont('helvetica', 'normal');
  doc.text('THE HEART OF HOME COOKING', M + 26, 21);

  // Invoice label
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', W - M, 15, { align: 'right' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(232, 201, 106);
  doc.text(`Order ID: ${order.orderId}`, W - M, 21, { align: 'right' });
  doc.text(order.date.toLocaleString(), W - M, 26, { align: 'right' });

  // ---------- From / To ----------
  let y = 42;
  doc.setTextColor(26, 22, 19);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
  doc.text('FROM', M, y);
  doc.text('BILL TO', W / 2, y);
  y += 5;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  const from = [
    'Siddham Manufactures & Distributors',
    '10B, 106/4 NHS, Mattegoda, Sri Lanka',
    'Tel: +' + (settings.waNumber || '94777317208'),
    settings.orderEmail || 'siddhamproducts24@gmail.com'
  ];
  from.forEach((l, i) => doc.text(l, M, y + i * 4.5));

  const c = order.customer;
  const to = [
    c.name || '',
    c.address || '',
    `${c.city || ''}, ${c.district || ''}`,
    'Tel: ' + (c.phone || ''),
  ];
  to.forEach((l, i) => doc.text(l, W / 2, y + i * 4.5));

  // ---------- Items table ----------
  y = y + 25;
  const rows = order.items.map((it, i) => [
    i + 1,
    it.name + (it.nameSi ? '  ('+it.nameSi+')' : ''),
    it.unit,
    it.qty,
    'Rs. ' + it.price.toLocaleString(),
    'Rs. ' + it.total.toLocaleString()
  ]);

  doc.autoTable({
    startY: y,
    head: [['#', 'Item', 'Size', 'Qty', 'Price', 'Total']],
    body: rows,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [201, 162, 39], textColor: [255,255,255], fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      3: { halign: 'center' },
      4: { halign: 'right' },
      5: { halign: 'right', fontStyle: 'bold' }
    },
    margin: { left: M, right: M }
  });

  // ---------- Totals ----------
  let ty = doc.lastAutoTable.finalY + 6;
  const boxX = W - M - 75;
  doc.setDrawColor(220);
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  const rightVal = (label, val, bold=false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.text(label, boxX, ty);
    doc.text(val, W - M, ty, { align: 'right' });
    ty += 6;
  };
  rightVal('Subtotal:', 'Rs. ' + order.subtotal.toLocaleString());
  rightVal(`Weight (${order.weightG} g):`, `${order.weightKg} kg`);
  rightVal('Delivery:', 'Rs. ' + order.delivery.toLocaleString());

  // Grand total band
  doc.setFillColor(26, 22, 19);
  doc.rect(boxX - 4, ty - 5, W - M - boxX + 4, 10, 'F');
  doc.setTextColor(232, 201, 106);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('GRAND TOTAL', boxX, ty + 1.5);
  doc.text('Rs. ' + order.total.toLocaleString(), W - M, ty + 1.5, { align: 'right' });
  ty += 12;

  // Payment method
  doc.setFillColor(232, 249, 232);
  doc.rect(boxX - 4, ty - 4, W - M - boxX + 4, 9, 'F');
  doc.setTextColor(30, 100, 30);
  doc.setFontSize(10);
  doc.text('💵 Payment: Cash on Delivery', boxX, ty + 2);
  ty += 12;

  // ---------- Delivery notice ----------
  doc.setTextColor(150, 100, 0);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'italic');
  const noticeText = order.hasPcs
    ? 'Note: This order contains pcs-based items (sweetmeats, etc.). The listed weight is approximate; delivery charges may vary slightly.'
    : 'Note: The listed weight represents the product weight only. Including packaging, delivery charges may vary slightly.';
  const wrapped = doc.splitTextToSize(noticeText, W - 2*M);
  doc.text(wrapped, M, ty);
  ty += wrapped.length * 4 + 5;

  // ---------- QR + Barcode ----------
  try {
    const qrText = [
      `Siddham Order`,
      `ID: ${order.orderId}`,
      `Total: Rs. ${order.total}`,
      `Customer: ${c.name}`,
      `Phone: ${c.phone}`,
      `${c.city}, ${c.district}`
    ].join('\n');
    const qr = await makeQrDataURL(qrText);
    doc.addImage(qr, 'PNG', M, ty, 32, 32);
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(120);
    doc.text('Scan for order details', M, ty + 36);
  } catch (e) { console.warn('QR failed', e); }

  try {
    const bc = makeBarcodeDataURL(order.orderId);
    doc.addImage(bc, 'PNG', M + 55, ty + 2, 90, 25);
  } catch (e) { console.warn('Barcode failed', e); }

  // ---------- Footer ----------
  const fy = doc.internal.pageSize.getHeight() - 15;
  doc.setDrawColor(200);
  doc.line(M, fy - 4, W - M, fy - 4);
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text('Thank you for shopping with Siddham! 🌶️', W / 2, fy, { align: 'center' });
  doc.setFontSize(7.5);
  doc.text(`For inquiries: +${settings.waNumber} | ${settings.orderEmail}`, W / 2, fy + 4, { align: 'center' });

  const filename = `Siddham_Invoice_${order.orderId}.pdf`;
  if (autoSave) doc.save(filename);
  return doc;
}

function loadImage(src) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}
