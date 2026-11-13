import React, { useState, useEffect, useMemo } from 'react';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import QRCode from 'qrcode';
import {
  Plus,
  Trash2,
  Download,
  Upload,
  Save,
  CheckCircle2,
  Receipt,
} from 'lucide-react';
import { Lang } from '../../i18n/translations';
import { downloadUint8Array, fileToDataUrl, hexToRgbNormalized, loadImageElement } from '../../utils/fileHelpers';

interface LineItem {
  id: string;
  description: string;
  qty: number;
  rate: number;
}

interface CurrencySpec {
  code: string;
  symbol: string;
  locale: string;
  decimals: number;
}

const CURRENCIES: CurrencySpec[] = [
  { code: 'IDR', symbol: 'Rp ', locale: 'id-ID', decimals: 0 },
  { code: 'USD', symbol: '$', locale: 'en-US', decimals: 2 },
  { code: 'EUR', symbol: 'EUR ', locale: 'de-DE', decimals: 2 },
  { code: 'SGD', symbol: 'S$', locale: 'en-SG', decimals: 2 },
  { code: 'MYR', symbol: 'RM ', locale: 'ms-MY', decimals: 2 },
  { code: 'GBP', symbol: 'GBP ', locale: 'en-GB', decimals: 2 },
];

function safeAscii(str: string): string {
  // Keep WinAnsi-compatible printable characters for pdf-lib StandardFonts
  return str.replace(/[^\x20-\x7E\xA0-\xFF]/g, '');
}

const STORAGE_KEY = 'no_idea_invoice_sender_v1';

export const InvoiceStudio: React.FC<{ lang: Lang }> = ({ lang }) => {
  const isId = lang === 'id';

  const [currencyCode, setCurrencyCode] = useState<string>(isId ? 'IDR' : 'USD');
  const [accentHex, setAccentHex] = useState<string>('#10b981');
  const [statusBadge, setStatusBadge] = useState<'UNPAID' | 'PAID' | 'QUOTE'>('UNPAID');
  const [invoiceNumber, setInvoiceNumber] = useState<string>('INV-2026-0042');
  const [issueDate, setIssueDate] = useState<string>('2026-11-13');
  const [dueDate, setDueDate] = useState<string>('2026-11-27');

  const [senderName, setSenderName] = useState<string>('Egandika');
  const [senderDetails, setSenderDetails] = useState<string>(
    'East Java, Indonesia\negad13744@gmail.com'
  );
  const [clientName, setClientName] = useState<string>('PT Nusantara Digital');
  const [clientDetails, setClientDetails] = useState<string>(
    'Jl. Sudirman No. 88\nfinance@nusantara.co.id'
  );
  const [logoDataUrl, setLogoDataUrl] = useState<string>('');

  const [items, setItems] = useState<LineItem[]>([
    {
      id: '1',
      description: 'Full-Stack Web Application Architecture & UI',
      qty: 1,
      rate: isId ? 4500000 : 1200,
    },
    {
      id: '2',
      description: 'Performance Optimization & Open-Source Setup',
      qty: 2,
      rate: isId ? 1250000 : 350,
    },
  ]);

  const [taxLabel, setTaxLabel] = useState<string>(isId ? 'PPN' : 'Tax / VAT');
  const [taxRate, setTaxRate] = useState<number>(11);
  const [discountRate, setDiscountRate] = useState<number>(0);
  const [notes, setNotes] = useState<string>(
    'Bank BCA 123-456-7890 a/n Egandika\nThank you for your business!'
  );
  const [paymentQrLink, setPaymentQrLink] = useState<string>(
    'https://github.com/egad13744-collab/No-idea'
  );
  const [qrPreviewUrl, setQrPreviewUrl] = useState<string>('');
  const [savedNotice, setSavedNotice] = useState(false);

  // Load saved sender profile on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.senderName) setSenderName(parsed.senderName);
        if (parsed.senderDetails) setSenderDetails(parsed.senderDetails);
        if (parsed.notes) setNotes(parsed.notes);
        if (parsed.logoDataUrl) setLogoDataUrl(parsed.logoDataUrl);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  // Generate QR preview whenever paymentQrLink changes
  useEffect(() => {
    if (!paymentQrLink.trim()) {
      setQrPreviewUrl('');
      return;
    }
    QRCode.toDataURL(paymentQrLink.trim(), {
      width: 240,
      margin: 1,
      color: { dark: '#09090b', light: '#ffffff' },
    })
      .then(setQrPreviewUrl)
      .catch(() => setQrPreviewUrl(''));
  }, [paymentQrLink]);

  const currency = useMemo(
    () => CURRENCIES.find((c) => c.code === currencyCode) || CURRENCIES[0],
    [currencyCode]
  );

  const fmtMoney = (val: number) => {
    const formatted = new Intl.NumberFormat(currency.locale, {
      minimumFractionDigits: currency.decimals,
      maximumFractionDigits: currency.decimals,
    }).format(val);
    return `${currency.symbol}${formatted}`;
  };

  const subtotal = useMemo(
    () => items.reduce((acc, item) => acc + item.qty * item.rate, 0),
    [items]
  );
  const discountAmt = (subtotal * discountRate) / 100;
  const taxable = Math.max(0, subtotal - discountAmt);
  const taxAmt = (taxable * taxRate) / 100;
  const grandTotal = taxable + taxAmt;

  const saveProfile = () => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ senderName, senderDetails, notes, logoDataUrl })
      );
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 2400);
    } catch {
      // ignore
    }
  };

  const exportVectorPdf = async () => {
    const doc = await PDFDocument.create();
    const page = doc.addPage([595.28, 841.89]); // A4
    const { width, height } = page.getSize();
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
    const fontReg = await doc.embedFont(StandardFonts.Helvetica);
    const acc = hexToRgbNormalized(accentHex);

    // Top accent bar
    page.drawRectangle({
      x: 0,
      y: height - 10,
      width,
      height: 10,
      color: rgb(acc.r, acc.g, acc.b),
    });

    let topY = height - 56;

    // Optional Logo
    let senderX = 48;
    if (logoDataUrl) {
      try {
        const imgEl = await loadImageElement(logoDataUrl);
        const c = document.createElement('canvas');
        c.width = imgEl.naturalWidth || 120;
        c.height = imgEl.naturalHeight || 120;
        const ctx = c.getContext('2d');
        ctx?.drawImage(imgEl, 0, 0);
        const pngData = c.toDataURL('image/png');
        const embeddedLogo = await doc.embedPng(pngData);
        const logoH = 42;
        const logoW = Math.min(110, (embeddedLogo.width / embeddedLogo.height) * logoH);
        page.drawImage(embeddedLogo, {
          x: 48,
          y: topY - 26,
          width: logoW,
          height: logoH,
        });
        senderX = 48 + logoW + 14;
      } catch {
        // ignore logo error
      }
    }

    // Sender Header
    page.drawText(safeAscii(senderName || 'Sender'), {
      x: senderX,
      y: topY,
      size: 15,
      font: fontBold,
      color: rgb(0.07, 0.09, 0.12),
    });

    const senderLines = safeAscii(senderDetails).split('\n').slice(0, 3);
    senderLines.forEach((ln, idx) => {
      page.drawText(ln, {
        x: senderX,
        y: topY - 16 - idx * 13,
        size: 9.5,
        font: fontReg,
        color: rgb(0.4, 0.44, 0.5),
      });
    });

    // Right side INVOICE title & status
    const docTitle = statusBadge === 'QUOTE' ? 'QUOTATION' : 'INVOICE';
    const titleW = fontBold.widthOfTextAtSize(docTitle, 22);
    page.drawText(docTitle, {
      x: width - 48 - titleW,
      y: topY,
      size: 22,
      font: fontBold,
      color: rgb(acc.r, acc.g, acc.b),
    });

    const metaLines = [
      `No: ${safeAscii(invoiceNumber)}`,
      `Issued: ${safeAscii(issueDate)}`,
      `Due: ${safeAscii(dueDate)}`,
      `Status: ${statusBadge}`,
    ];
    metaLines.forEach((m, idx) => {
      const mw = fontReg.widthOfTextAtSize(m, 9.5);
      page.drawText(m, {
        x: width - 48 - mw,
        y: topY - 20 - idx * 13,
        size: 9.5,
        font: fontReg,
        color: rgb(0.32, 0.36, 0.42),
      });
    });

    // Bill To section
    const billY = height - 158;
    page.drawText('BILL TO', {
      x: 48,
      y: billY,
      size: 8.5,
      font: fontBold,
      color: rgb(0.45, 0.49, 0.56),
    });
    page.drawText(safeAscii(clientName || 'Client'), {
      x: 48,
      y: billY - 16,
      size: 12,
      font: fontBold,
      color: rgb(0.08, 0.1, 0.14),
    });
    safeAscii(clientDetails)
      .split('\n')
      .slice(0, 3)
      .forEach((ln, idx) => {
        page.drawText(ln, {
          x: 48,
          y: billY - 31 - idx * 13,
          size: 9.5,
          font: fontReg,
          color: rgb(0.38, 0.42, 0.48),
        });
      });

    // Table Header
    let tableY = height - 246;
    page.drawRectangle({
      x: 48,
      y: tableY - 6,
      width: width - 96,
      height: 24,
      color: rgb(0.95, 0.96, 0.98),
    });

    page.drawText('DESCRIPTION', { x: 58, y: tableY + 2, size: 8.5, font: fontBold, color: rgb(0.3, 0.34, 0.4) });
    page.drawText('QTY', { x: 340, y: tableY + 2, size: 8.5, font: fontBold, color: rgb(0.3, 0.34, 0.4) });
    page.drawText('RATE', { x: 395, y: tableY + 2, size: 8.5, font: fontBold, color: rgb(0.3, 0.34, 0.4) });
    page.drawText('AMOUNT', { x: 485, y: tableY + 2, size: 8.5, font: fontBold, color: rgb(0.3, 0.34, 0.4) });

    let rowY = tableY - 26;
    items.slice(0, 12).forEach((it) => {
      const desc = safeAscii(it.description || '-').slice(0, 52);
      const amtStr = safeAscii(fmtMoney(it.qty * it.rate));
      const rateStr = safeAscii(fmtMoney(it.rate));

      page.drawText(desc, { x: 58, y: rowY, size: 10, font: fontReg, color: rgb(0.12, 0.14, 0.18) });
      page.drawText(String(it.qty), { x: 342, y: rowY, size: 10, font: fontReg, color: rgb(0.25, 0.28, 0.34) });
      page.drawText(rateStr, { x: 395, y: rowY, size: 10, font: fontReg, color: rgb(0.25, 0.28, 0.34) });
      page.drawText(amtStr, { x: 485, y: rowY, size: 10, font: fontBold, color: rgb(0.1, 0.12, 0.16) });

      page.drawLine({
        start: { x: 48, y: rowY - 9 },
        end: { x: width - 48, y: rowY - 9 },
        thickness: 0.6,
        color: rgb(0.9, 0.91, 0.93),
      });
      rowY -= 24;
    });

    // Totals block
    let totY = rowY - 14;
    const drawSummaryRow = (label: string, val: string, bold = false) => {
      page.drawText(safeAscii(label), {
        x: 365,
        y: totY,
        size: bold ? 11.5 : 9.5,
        font: bold ? fontBold : fontReg,
        color: bold ? rgb(0.06, 0.08, 0.12) : rgb(0.4, 0.44, 0.5),
      });
      const vw = (bold ? fontBold : fontReg).widthOfTextAtSize(safeAscii(val), bold ? 11.5 : 9.5);
      page.drawText(safeAscii(val), {
        x: width - 48 - vw,
        y: totY,
        size: bold ? 11.5 : 9.5,
        font: bold ? fontBold : fontReg,
        color: bold ? rgb(acc.r, acc.g, acc.b) : rgb(0.15, 0.18, 0.22),
      });
      totY -= bold ? 22 : 17;
    };

    drawSummaryRow('Subtotal', fmtMoney(subtotal));
    if (discountRate > 0) {
      drawSummaryRow(`Discount (${discountRate}%)`, `-${fmtMoney(discountAmt)}`);
    }
    if (taxRate > 0) {
      drawSummaryRow(`${taxLabel} (${taxRate}%)`, fmtMoney(taxAmt));
    }
    drawSummaryRow('TOTAL DUE', fmtMoney(grandTotal), true);

    // Bottom Notes & Payment QR
    const footerY = 148;
    if (notes.trim()) {
      page.drawText('PAYMENT DETAILS & NOTES', {
        x: 48,
        y: footerY,
        size: 8.5,
        font: fontBold,
        color: rgb(0.45, 0.49, 0.56),
      });
      safeAscii(notes)
        .split('\n')
        .slice(0, 4)
        .forEach((ln, idx) => {
          page.drawText(ln, {
            x: 48,
            y: footerY - 15 - idx * 13,
            size: 9.5,
            font: fontReg,
            color: rgb(0.28, 0.32, 0.38),
          });
        });
    }

    if (qrPreviewUrl) {
      try {
        const embeddedQr = await doc.embedPng(qrPreviewUrl);
        page.drawImage(embeddedQr, {
          x: width - 48 - 76,
          y: footerY - 64,
          width: 76,
          height: 76,
        });
        page.drawText('Scan to Pay', {
          x: width - 48 - 64,
          y: footerY - 75,
          size: 8,
          font: fontReg,
          color: rgb(0.45, 0.49, 0.56),
        });
      } catch {
        // ignore QR embed error
      }
    }

    const saved = await doc.save();
    downloadUint8Array(saved, `${safeAscii(invoiceNumber || 'invoice')}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800/80">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono text-emerald-600 dark:text-emerald-400 mb-1">
            <span className="line-through text-zinc-400">$15/mo Invoice Quota Paywalls</span>
            <span>→ Unlimited Vector PDFs · Local Storage</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {isId ? 'Pembuat Invoice & Kwitansi PDF' : 'Instant PDF Invoice & Receipt Maker'}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={saveProfile}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-medium hover:bg-zinc-200/70 dark:hover:bg-zinc-800 cursor-pointer"
          >
            {savedNotice ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                {isId ? 'Profil Tersimpan!' : 'Profile Saved!'}
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5 text-emerald-500" />
                {isId ? 'Simpan Profil Usaha' : 'Save Sender Profile'}
              </>
            )}
          </button>

          <button
            onClick={exportVectorPdf}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs cursor-pointer transition"
          >
            <Download className="w-4 h-4" />
            {isId ? 'Unduh PDF Invoice' : 'Download PDF Invoice'}
          </button>
        </div>
      </div>

      <div className="grid xl:grid-cols-12 gap-6">
        {/* Form Editor */}
        <div className="xl:col-span-6 space-y-4">
          {/* Meta & Currency */}
          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 grid sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Invoice #</label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-500 mb-1">Currency</label>
              <select
                value={currencyCode}
                onChange={(e) => setCurrencyCode(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs font-mono"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} ({c.symbol.trim()})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs text-zinc-500 mb-1">Status</label>
                <select
                  value={statusBadge}
                  onChange={(e) => setStatusBadge(e.target.value as 'UNPAID' | 'PAID' | 'QUOTE')}
                  className="w-full px-2.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs font-mono"
                >
                  <option value="UNPAID">UNPAID</option>
                  <option value="PAID">PAID</option>
                  <option value="QUOTE">QUOTE</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Brand</label>
                <input
                  type="color"
                  value={accentHex}
                  onChange={(e) => setAccentHex(e.target.value)}
                  className="w-9 h-9 rounded cursor-pointer bg-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-zinc-500 mb-1">
                {isId ? 'Tanggal Terbit' : 'Issue Date'}
              </label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-500 mb-1">
                {isId ? 'Jatuh Tempo' : 'Due Date'}
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-500 mb-1">Logo</label>
              <label className="flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-emerald-500 text-xs cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-emerald-500" />
                {logoDataUrl ? 'Change' : 'Upload'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (f) setLogoDataUrl(await fileToDataUrl(f));
                  }}
                />
              </label>
            </div>
          </div>

          {/* Sender & Client */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2.5">
              <span className="text-xs font-mono uppercase text-zinc-500">
                {isId ? 'Dari (Pengirim)' : 'From (Seller)'}
              </span>
              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="Your Business / Name"
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs font-medium"
              />
              <textarea
                rows={2}
                value={senderDetails}
                onChange={(e) => setSenderDetails(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs"
              />
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2.5">
              <span className="text-xs font-mono uppercase text-zinc-500">
                {isId ? 'Tagihan Kepada (Klien)' : 'Bill To (Client)'}
              </span>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Client Name"
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs font-medium"
              />
              <textarea
                rows={2}
                value={clientDetails}
                onChange={(e) => setClientDetails(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs"
              />
            </div>
          </div>

          {/* Line Items */}
          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase text-zinc-500">
                {isId ? 'Daftar Item / Jasa' : 'Line Items'}
              </span>
              <button
                onClick={() =>
                  setItems((prev) => [
                    ...prev,
                    {
                      id: String(Date.now()),
                      description: 'Additional Service',
                      qty: 1,
                      rate: isId ? 500000 : 150,
                    },
                  ])
                }
                className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                {isId ? 'Tambah Baris' : 'Add Item'}
              </button>
            </div>

            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) =>
                      setItems((prev) =>
                        prev.map((x, i) =>
                          i === idx ? { ...x, description: e.target.value } : x
                        )
                      )
                    }
                    placeholder="Description"
                    className="col-span-6 px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs"
                  />
                  <input
                    type="number"
                    min={1}
                    value={item.qty}
                    onChange={(e) =>
                      setItems((prev) =>
                        prev.map((x, i) =>
                          i === idx ? { ...x, qty: Math.max(0, Number(e.target.value)) } : x
                        )
                      )
                    }
                    className="col-span-2 px-2 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs font-mono"
                  />
                  <input
                    type="number"
                    min={0}
                    value={item.rate}
                    onChange={(e) =>
                      setItems((prev) =>
                        prev.map((x, i) =>
                          i === idx ? { ...x, rate: Math.max(0, Number(e.target.value)) } : x
                        )
                      )
                    }
                    className="col-span-3 px-2 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs font-mono"
                  />
                  <button
                    onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))}
                    disabled={items.length <= 1}
                    className="col-span-1 flex justify-center text-red-500 disabled:opacity-30 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <div>
                <label className="block text-[11px] text-zinc-500 mb-1">Tax Label</label>
                <input
                  type="text"
                  value={taxLabel}
                  onChange={(e) => setTaxLabel(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] text-zinc-500 mb-1">Tax (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={taxRate}
                  onChange={(e) => setTaxRate(Math.max(0, Number(e.target.value)))}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] text-zinc-500 mb-1">Discount (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={discountRate}
                  onChange={(e) => setDiscountRate(Math.max(0, Number(e.target.value)))}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Notes & Payment QR */}
          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-500 mb-1">
                {isId ? 'Rekening / Catatan Pembayaran' : 'Bank / Payment Notes'}
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">
                {isId ? 'Link QR Pembayaran (Kosongkan jika tanpa)' : 'Payment QR Link (Optional)'}
              </label>
              <input
                type="text"
                value={paymentQrLink}
                onChange={(e) => setPaymentQrLink(e.target.value)}
                placeholder="https://paypal.me/... or payment link"
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs font-mono"
              />
              <p className="text-[11px] text-zinc-500 mt-1.5">
                {isId
                  ? 'QR code otomatis dicetak di pojok kanan bawah PDF.'
                  : 'Automatically embeds a crisp scannable QR on the PDF.'}
              </p>
            </div>
          </div>
        </div>

        {/* Live Paper Preview */}
        <div className="xl:col-span-6">
          <div className="sticky top-6 rounded-2xl bg-white text-zinc-900 shadow-xl border border-zinc-200 overflow-hidden">
            <div style={{ backgroundColor: accentHex }} className="h-2.5 w-full" />

            <div className="p-6 sm:p-8 space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  {logoDataUrl ? (
                    <img
                      src={logoDataUrl}
                      alt="Logo"
                      className="h-11 w-auto object-contain rounded"
                    />
                  ) : (
                    <div
                      style={{ backgroundColor: `${accentHex}1a`, color: accentHex }}
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    >
                      <Receipt className="w-5 h-5" />
                    </div>
                  )}
                  <div>
                    <h2 className="font-bold text-base text-zinc-900">{senderName}</h2>
                    <p className="text-xs text-zinc-500 whitespace-pre-line">{senderDetails}</p>
                  </div>
                </div>

                <div className="text-right">
                  <div
                    style={{ color: accentHex }}
                    className="text-xl font-extrabold tracking-tight"
                  >
                    {statusBadge === 'QUOTE' ? 'QUOTATION' : 'INVOICE'}
                  </div>
                  <p className="text-xs font-mono text-zinc-600 mt-0.5">{invoiceNumber}</p>
                  <span
                    className={`inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                      statusBadge === 'PAID'
                        ? 'bg-emerald-100 text-emerald-700'
                        : statusBadge === 'QUOTE'
                        ? 'bg-sky-100 text-sky-700'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {statusBadge}
                  </span>
                </div>
              </div>

              {/* Client & Dates */}
              <div className="flex flex-wrap justify-between gap-4 pt-3 border-t border-zinc-100 text-xs">
                <div>
                  <span className="text-[10px] font-mono uppercase text-zinc-400">Bill To</span>
                  <p className="font-semibold text-zinc-900 mt-0.5">{clientName}</p>
                  <p className="text-zinc-500 whitespace-pre-line">{clientDetails}</p>
                </div>
                <div className="text-right font-mono text-zinc-600 space-y-1">
                  <div>Issued: {issueDate}</div>
                  <div>Due: {dueDate}</div>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-zinc-100 text-zinc-600 text-left font-mono text-[11px]">
                      <th className="py-2 px-3 rounded-l-lg">DESCRIPTION</th>
                      <th className="py-2 px-2 text-center">QTY</th>
                      <th className="py-2 px-2 text-right">RATE</th>
                      <th className="py-2 px-3 text-right rounded-r-lg">AMOUNT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {items.map((it) => (
                      <tr key={it.id}>
                        <td className="py-2.5 px-3 font-medium text-zinc-800">
                          {it.description}
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono text-zinc-600">
                          {it.qty}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono text-zinc-600">
                          {fmtMoney(it.rate)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-zinc-900">
                          {fmtMoney(it.qty * it.rate)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-64 space-y-1.5 text-xs">
                  <div className="flex justify-between text-zinc-500">
                    <span>Subtotal</span>
                    <span className="font-mono">{fmtMoney(subtotal)}</span>
                  </div>
                  {discountRate > 0 && (
                    <div className="flex justify-between text-zinc-500">
                      <span>Discount ({discountRate}%)</span>
                      <span className="font-mono">-{fmtMoney(discountAmt)}</span>
                    </div>
                  )}
                  {taxRate > 0 && (
                    <div className="flex justify-between text-zinc-500">
                      <span>
                        {taxLabel} ({taxRate}%)
                      </span>
                      <span className="font-mono">{fmtMoney(taxAmt)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-zinc-200 text-sm font-bold">
                    <span>Total Due</span>
                    <span style={{ color: accentHex }} className="font-mono">
                      {fmtMoney(grandTotal)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-zinc-100 flex items-end justify-between gap-4">
                <div className="text-xs text-zinc-500 whitespace-pre-line max-w-xs">
                  <span className="block text-[10px] font-mono uppercase text-zinc-400 mb-0.5">
                    Payment Info
                  </span>
                  {notes}
                </div>
                {qrPreviewUrl && (
                  <div className="text-center shrink-0">
                    <img src={qrPreviewUrl} alt="Payment QR" className="w-16 h-16 mx-auto" />
                    <span className="text-[10px] font-mono text-zinc-400">Scan to Pay</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
