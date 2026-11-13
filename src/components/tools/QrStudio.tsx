import React, { useState, useEffect, useRef, useMemo } from 'react';
import QRCode from 'qrcode';
import {
  Globe,
  Wifi,
  MessageCircle,
  UserSquare2,
  AlignLeft,
  Download,
  Copy,
  Upload,
  Trash2,
  Check,
  ShieldCheck,
} from 'lucide-react';
import { Lang } from '../../i18n/translations';
import { downloadBlob, fileToDataUrl, loadImageElement } from '../../utils/fileHelpers';

type QrMode = 'url' | 'wifi' | 'whatsapp' | 'vcard' | 'text';
type DotStyle = 'rounded' | 'dots' | 'square';

function isFinderModule(r: number, c: number, size: number): boolean {
  const topLeft = r < 7 && c < 7;
  const topRight = r < 7 && c >= size - 7;
  const bottomLeft = r >= size - 7 && c < 7;
  return topLeft || topRight || bottomLeft;
}

export const QrStudio: React.FC<{ lang: Lang }> = ({ lang }) => {
  const isId = lang === 'id';
  const [mode, setMode] = useState<QrMode>('url');

  // Content fields
  const [urlVal, setUrlVal] = useState('https://github.com/egad13744-collab/No-idea');
  const [wifiSsid, setWifiSsid] = useState('Studio_Guest_5G');
  const [wifiPass, setWifiPass] = useState('freeforever2026');
  const [wifiEnc, setWifiEnc] = useState<'WPA' | 'WEP' | 'nopass'>('WPA');
  const [waPhone, setWaPhone] = useState('6281234567890');
  const [waMsg, setWaMsg] = useState('Halo! Saya scan dari QR Code.');
  const [vcName, setVcName] = useState('Egandika');
  const [vcOrg, setVcOrg] = useState('Open Source Contributor');
  const [vcPhone, setVcPhone] = useState('+6281234567890');
  const [vcEmail, setVcEmail] = useState('hello@example.com');
  const [textVal, setTextVal] = useState('100% Static & Permanent QR Code — Zero Subscriptions.');

  // Styling fields
  const [dotStyle, setDotStyle] = useState<DotStyle>('rounded');
  const [fgColor, setFgColor] = useState('#09090b');
  const [useGradient, setUseGradient] = useState(true);
  const [fgColor2, setFgColor2] = useState('#059669');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [transparentBg, setTransparentBg] = useState(false);
  const [badgeText, setBadgeText] = useState('SCAN ME');
  const [logoDataUrl, setLogoDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const payload = useMemo(() => {
    switch (mode) {
      case 'url':
        return urlVal.trim() || 'https://example.com';
      case 'wifi':
        return `WIFI:T:${wifiEnc};S:${wifiSsid};P:${wifiEnc === 'nopass' ? '' : wifiPass};;`;
      case 'whatsapp': {
        const cleanPhone = waPhone.replace(/[^\d]/g, '');
        const encoded = encodeURIComponent(waMsg);
        return `https://wa.me/${cleanPhone}${waMsg ? `?text=${encoded}` : ''}`;
      }
      case 'vcard':
        return [
          'BEGIN:VCARD',
          'VERSION:3.0',
          `FN:${vcName}`,
          `ORG:${vcOrg}`,
          `TEL:${vcPhone}`,
          `EMAIL:${vcEmail}`,
          'END:VCARD',
        ].join('\n');
      case 'text':
      default:
        return textVal || 'No-Idea QR';
    }
  }, [mode, urlVal, wifiSsid, wifiPass, wifiEnc, waPhone, waMsg, vcName, vcOrg, vcPhone, vcEmail, textVal]);

  // Render crisp high-res canvas preview (1024px internal, 2048px on export)
  const renderToCanvas = async (canvas: HTMLCanvasElement, resolution: number) => {
    const qr = QRCode.create(payload, {
      errorCorrectionLevel: logoDataUrl ? 'H' : 'Q',
    });
    const count = qr.modules.size;
    const marginModules = 3.2;
    const extraBottom = badgeText.trim() ? resolution * 0.13 : 0;
    canvas.width = resolution;
    canvas.height = Math.round(resolution + extraBottom);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background
    if (!transparentBg) {
      ctx.fillStyle = bgColor;
      const rBg = resolution * 0.055;
      ctx.beginPath();
      ctx.roundRect(0, 0, canvas.width, canvas.height, rBg);
      ctx.fill();
    }

    const cell = resolution / (count + marginModules * 2);
    const offset = marginModules * cell;

    let fillBrush: string | CanvasGradient = fgColor;
    if (useGradient) {
      const grad = ctx.createLinearGradient(offset, offset, resolution - offset, resolution - offset);
      grad.addColorStop(0, fgColor);
      grad.addColorStop(1, fgColor2);
      fillBrush = grad;
    }
    ctx.fillStyle = fillBrush;

    // Logo cutout bounds in module coords
    const logoRatio = logoDataUrl ? 0.22 : 0;
    const centerStart = count * (0.5 - logoRatio / 2) - 0.6;
    const centerEnd = count * (0.5 + logoRatio / 2) + 0.6;

    // Draw data modules
    for (let r = 0; r < count; r++) {
      for (let c = 0; c < count; c++) {
        if (!qr.modules.get(r, c)) continue;
        if (isFinderModule(r, c, count)) continue;
        if (
          logoDataUrl &&
          r >= centerStart &&
          r <= centerEnd &&
          c >= centerStart &&
          c <= centerEnd
        ) {
          continue;
        }

        const x = offset + c * cell;
        const y = offset + r * cell;

        if (dotStyle === 'dots') {
          ctx.beginPath();
          ctx.arc(x + cell / 2, y + cell / 2, cell * 0.44, 0, Math.PI * 2);
          ctx.fill();
        } else if (dotStyle === 'rounded') {
          ctx.beginPath();
          ctx.roundRect(x + cell * 0.05, y + cell * 0.05, cell * 0.9, cell * 0.9, cell * 0.34);
          ctx.fill();
        } else {
          ctx.fillRect(x, y, cell + 0.4, cell + 0.4);
        }
      }
    }

    // Draw 3 crisp Finder Patterns
    const drawFinder = (startR: number, startC: number) => {
      const fx = offset + startC * cell;
      const fy = offset + startR * cell;
      const outerSize = 7 * cell;
      const cornerR = dotStyle === 'square' ? 0 : cell * 1.4;

      ctx.strokeStyle = fillBrush;
      ctx.lineWidth = cell;
      ctx.beginPath();
      ctx.roundRect(fx + cell / 2, fy + cell / 2, outerSize - cell, outerSize - cell, cornerR);
      ctx.stroke();

      ctx.fillStyle = fillBrush;
      const innerCorner = dotStyle === 'square' ? 0 : cell * 0.75;
      ctx.beginPath();
      ctx.roundRect(fx + cell * 2, fy + cell * 2, cell * 3, cell * 3, innerCorner);
      ctx.fill();
    };

    drawFinder(0, 0);
    drawFinder(0, count - 7);
    drawFinder(count - 7, 0);

    // Draw center logo if uploaded
    if (logoDataUrl) {
      try {
        const img = await loadImageElement(logoDataUrl);
        const boxSize = resolution * 0.2;
        const bx = (resolution - boxSize) / 2;
        const by = (resolution - boxSize) / 2;

        ctx.fillStyle = transparentBg ? '#ffffff' : bgColor;
        ctx.beginPath();
        ctx.roundRect(bx - cell * 0.5, by - cell * 0.5, boxSize + cell, boxSize + cell, boxSize * 0.22);
        ctx.fill();

        ctx.save();
        ctx.beginPath();
        ctx.roundRect(bx, by, boxSize, boxSize, boxSize * 0.18);
        ctx.clip();
        ctx.drawImage(img, bx, by, boxSize, boxSize);
        ctx.restore();
      } catch {
        // Ignore broken image
      }
    }

    // Draw optional bottom badge
    if (badgeText.trim()) {
      const pillW = resolution * 0.62;
      const pillH = resolution * 0.088;
      const px = (resolution - pillW) / 2;
      const py = resolution - cell * 0.4;

      ctx.fillStyle = fillBrush;
      ctx.beginPath();
      ctx.roundRect(px, py, pillW, pillH, pillH / 2);
      ctx.fill();

      ctx.fillStyle = transparentBg ? '#ffffff' : bgColor;
      ctx.font = `700 ${Math.round(resolution * 0.042)}px Inter, system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(badgeText.trim().slice(0, 22), resolution / 2, py + pillH / 2 + 1);
    }
  };

  useEffect(() => {
    if (!canvasRef.current) return;
    renderToCanvas(canvasRef.current, 880);
  }, [
    payload,
    dotStyle,
    fgColor,
    useGradient,
    fgColor2,
    bgColor,
    transparentBg,
    badgeText,
    logoDataUrl,
  ]);

  const handleDownloadPng = async () => {
    const hiRes = document.createElement('canvas');
    await renderToCanvas(hiRes, 2048);
    hiRes.toBlob((b) => {
      if (b) downloadBlob(b, `qr-code-2048px.png`);
    }, 'image/png');
  };

  const handleDownloadSvg = () => {
    const qr = QRCode.create(payload, {
      errorCorrectionLevel: logoDataUrl ? 'H' : 'Q',
    });
    const count = qr.modules.size;
    const margin = 3.2;
    const size = 1000;
    const extraH = badgeText.trim() ? 130 : 0;
    const totalH = size + extraH;
    const cell = size / (count + margin * 2);
    const off = margin * cell;

    const logoRatio = logoDataUrl ? 0.22 : 0;
    const centerStart = count * (0.5 - logoRatio / 2) - 0.6;
    const centerEnd = count * (0.5 + logoRatio / 2) + 0.6;

    const parts: string[] = [];
    parts.push(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${totalH}" width="${size}" height="${totalH}">`
    );

    if (useGradient) {
      parts.push(
        `<defs><linearGradient id="qrGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${fgColor}"/><stop offset="100%" stop-color="${fgColor2}"/></linearGradient></defs>`
      );
    }

    const fillRef = useGradient ? 'url(#qrGrad)' : fgColor;

    if (!transparentBg) {
      parts.push(`<rect width="${size}" height="${totalH}" rx="54" fill="${bgColor}"/>`);
    }

    for (let r = 0; r < count; r++) {
      for (let c = 0; c < count; c++) {
        if (!qr.modules.get(r, c) || isFinderModule(r, c, count)) continue;
        if (
          logoDataUrl &&
          r >= centerStart &&
          r <= centerEnd &&
          c >= centerStart &&
          c <= centerEnd
        ) {
          continue;
        }
        const x = (off + c * cell).toFixed(2);
        const y = (off + r * cell).toFixed(2);
        if (dotStyle === 'dots') {
          const cx = (off + (c + 0.5) * cell).toFixed(2);
          const cy = (off + (r + 0.5) * cell).toFixed(2);
          parts.push(`<circle cx="${cx}" cy="${cy}" r="${(cell * 0.44).toFixed(2)}" fill="${fillRef}"/>`);
        } else if (dotStyle === 'rounded') {
          parts.push(
            `<rect x="${(off + c * cell + cell * 0.05).toFixed(2)}" y="${(
              off +
              r * cell +
              cell * 0.05
            ).toFixed(2)}" width="${(cell * 0.9).toFixed(2)}" height="${(cell * 0.9).toFixed(
              2
            )}" rx="${(cell * 0.34).toFixed(2)}" fill="${fillRef}"/>`
          );
        } else {
          parts.push(
            `<rect x="${x}" y="${y}" width="${(cell + 0.3).toFixed(2)}" height="${(
              cell + 0.3
            ).toFixed(2)}" fill="${fillRef}"/>`
          );
        }
      }
    }

    const svgFinder = (sr: number, sc: number) => {
      const fx = off + sc * cell;
      const fy = off + sr * cell;
      const outer = 7 * cell - cell;
      const rx = dotStyle === 'square' ? 0 : cell * 1.4;
      const irx = dotStyle === 'square' ? 0 : cell * 0.75;
      parts.push(
        `<rect x="${(fx + cell / 2).toFixed(2)}" y="${(fy + cell / 2).toFixed(
          2
        )}" width="${outer.toFixed(2)}" height="${outer.toFixed(2)}" rx="${rx.toFixed(
          2
        )}" fill="none" stroke="${fillRef}" stroke-width="${cell.toFixed(2)}"/>`
      );
      parts.push(
        `<rect x="${(fx + cell * 2).toFixed(2)}" y="${(fy + cell * 2).toFixed(
          2
        )}" width="${(cell * 3).toFixed(2)}" height="${(cell * 3).toFixed(
          2
        )}" rx="${irx.toFixed(2)}" fill="${fillRef}"/>`
      );
    };

    svgFinder(0, 0);
    svgFinder(0, count - 7);
    svgFinder(count - 7, 0);

    if (logoDataUrl) {
      const box = size * 0.2;
      const bx = (size - box) / 2;
      parts.push(
        `<rect x="${bx - 8}" y="${bx - 8}" width="${box + 16}" height="${box + 16}" rx="28" fill="${
          transparentBg ? '#ffffff' : bgColor
        }"/>`
      );
      parts.push(
        `<image href="${logoDataUrl}" x="${bx}" y="${bx}" width="${box}" height="${box}" preserveAspectRatio="xMidYMid slice"/>`
      );
    }

    if (badgeText.trim()) {
      parts.push(
        `<rect x="${size * 0.19}" y="${size - cell * 0.4}" width="${size * 0.62}" height="88" rx="44" fill="${fillRef}"/>`
      );
      parts.push(
        `<text x="${size / 2}" y="${size - cell * 0.4 + 58}" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-weight="700" font-size="42" fill="${
          transparentBg ? '#ffffff' : bgColor
        }">${badgeText
          .trim()
          .slice(0, 22)
          .replace(/[<>&"]/g, '')}</text>`
      );
    }

    parts.push('</svg>');
    const blob = new Blob([parts.join('')], { type: 'image/svg+xml' });
    downloadBlob(blob, 'qr-code-vector.svg');
  };

  const handleCopyPng = async () => {
    if (!canvasRef.current) return;
    canvasRef.current.toBlob(async (blob) => {
      if (!blob) return;
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Fallback download if clipboard permission denied
        downloadBlob(blob, 'qr-code.png');
      }
    });
  };

  const modes: Array<{ id: QrMode; label: string; icon: React.ReactNode }> = [
    { id: 'url', label: 'URL / Link', icon: <Globe className="w-4 h-4" /> },
    { id: 'wifi', label: 'Wi-Fi', icon: <Wifi className="w-4 h-4" /> },
    { id: 'whatsapp', label: 'WhatsApp', icon: <MessageCircle className="w-4 h-4" /> },
    { id: 'vcard', label: 'vCard', icon: <UserSquare2 className="w-4 h-4" /> },
    { id: 'text', label: isId ? 'Teks' : 'Text', icon: <AlignLeft className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800/80">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono text-emerald-600 dark:text-emerald-400 mb-1">
            <span className="line-through text-zinc-400">$15/mo Expiring QR Subscriptions</span>
            <span>→ Static · Never Expires Forever</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {isId ? 'QR Code Studio Permanen' : 'Never-Expiring Pro QR Studio'}
          </h1>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
          <ShieldCheck className="w-4 h-4" />
          {isId ? '100% QR Statis · Aktif Selamanya' : 'Direct Encoded · Zero Redirect Traps'}
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left Controls */}
        <div className="lg:col-span-7 space-y-5">
          {/* Type Picker */}
          <div className="flex flex-wrap gap-1.5 p-1.5 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            {modes.map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`flex-1 min-w-[92px] inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-medium transition cursor-pointer ${
                  mode === m.id
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                {m.icon}
                {m.label}
              </button>
            ))}
          </div>

          {/* Content Input Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-500">
              1 · {isId ? 'Isi Konten QR' : 'QR Content'}
            </h3>

            {mode === 'url' && (
              <div>
                <label className="block text-xs text-zinc-500 mb-1.5">Website / Link URL</label>
                <input
                  type="url"
                  value={urlVal}
                  onChange={(e) => setUrlVal(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm font-mono"
                />
              </div>
            )}

            {mode === 'wifi' && (
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">
                    {isId ? 'Nama Wi-Fi (SSID)' : 'Network Name (SSID)'}
                  </label>
                  <input
                    type="text"
                    value={wifiSsid}
                    onChange={(e) => setWifiSsid(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Password</label>
                  <input
                    type="text"
                    value={wifiPass}
                    onChange={(e) => setWifiPass(e.target.value)}
                    disabled={wifiEnc === 'nopass'}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm disabled:opacity-40"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs text-zinc-500 mb-1">Security</label>
                  <select
                    value={wifiEnc}
                    onChange={(e) => setWifiEnc(e.target.value as 'WPA' | 'WEP' | 'nopass')}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm"
                  >
                    <option value="WPA">WPA / WPA2 / WPA3</option>
                    <option value="WEP">WEP</option>
                    <option value="nopass">Open (No Password)</option>
                  </select>
                </div>
              </div>
            )}

            {mode === 'whatsapp' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">
                    {isId
                      ? 'Nomor WhatsApp (dengan kode negara, misal 62812...)'
                      : 'WhatsApp Number (with country code, e.g. 62812...)'}
                  </label>
                  <input
                    type="text"
                    value={waPhone}
                    onChange={(e) => setWaPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">
                    {isId ? 'Pesan Otomatis' : 'Pre-filled Message'}
                  </label>
                  <input
                    type="text"
                    value={waMsg}
                    onChange={(e) => setWaMsg(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm"
                  />
                </div>
              </div>
            )}

            {mode === 'vcard' && (
              <div className="grid sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={vcName}
                  onChange={(e) => setVcName(e.target.value)}
                  placeholder="Full Name"
                  className="px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm"
                />
                <input
                  type="text"
                  value={vcOrg}
                  onChange={(e) => setVcOrg(e.target.value)}
                  placeholder="Organization / Role"
                  className="px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm"
                />
                <input
                  type="text"
                  value={vcPhone}
                  onChange={(e) => setVcPhone(e.target.value)}
                  placeholder="Phone Number"
                  className="px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm"
                />
                <input
                  type="email"
                  value={vcEmail}
                  onChange={(e) => setVcEmail(e.target.value)}
                  placeholder="Email Address"
                  className="px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm"
                />
              </div>
            )}

            {mode === 'text' && (
              <textarea
                rows={3}
                value={textVal}
                onChange={(e) => setTextVal(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm"
              />
            )}
          </div>

          {/* Pro Customizer Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-500">
              2 · {isId ? 'Kustomisasi Desain Pro (Gratis)' : 'Pro Design & Branding (Unlocked)'}
            </h3>

            {/* Dot style */}
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'rounded', label: isId ? 'Sudut Halus' : 'Soft Rounded' },
                  { id: 'dots', label: isId ? 'Titik Bulat' : 'Circular Dots' },
                  { id: 'square', label: isId ? 'Klasik Tajam' : 'Crisp Square' },
                ] as const
              ).map((s) => (
                <button
                  key={s.id}
                  onClick={() => setDotStyle(s.id)}
                  className={`py-2 px-3 rounded-xl text-xs font-medium border transition cursor-pointer ${
                    dotStyle === s.id
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Colors */}
            <div className="grid sm:grid-cols-3 gap-3 pt-1">
              <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <span className="text-xs text-zinc-500">Primary</span>
                <input
                  type="color"
                  value={fgColor}
                  onChange={(e) => setFgColor(e.target.value)}
                  className="w-7 h-7 cursor-pointer bg-transparent"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <label className="text-xs text-zinc-500 flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useGradient}
                    onChange={(e) => setUseGradient(e.target.checked)}
                    className="accent-emerald-500"
                  />
                  Gradient
                </label>
                <input
                  type="color"
                  value={fgColor2}
                  disabled={!useGradient}
                  onChange={(e) => setFgColor2(e.target.value)}
                  className="w-7 h-7 cursor-pointer bg-transparent disabled:opacity-30"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <label className="text-xs text-zinc-500 flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!transparentBg}
                    onChange={(e) => setTransparentBg(!e.target.checked)}
                    className="accent-emerald-500"
                  />
                  BG
                </label>
                <input
                  type="color"
                  value={bgColor}
                  disabled={transparentBg}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-7 h-7 cursor-pointer bg-transparent disabled:opacity-30"
                />
              </div>
            </div>

            {/* Logo & Badge */}
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">
                  {isId ? 'Logo Tengah (Opsional)' : 'Center Logo (Optional)'}
                </label>
                <div className="flex items-center gap-2">
                  <label className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-emerald-500 text-xs font-medium cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-emerald-500" />
                    {logoDataUrl
                      ? isId
                        ? 'Ganti Logo'
                        : 'Change Logo'
                      : isId
                      ? 'Unggah Logo'
                      : 'Upload Logo'}
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
                  {logoDataUrl && (
                    <button
                      onClick={() => setLogoDataUrl('')}
                      className="p-2 rounded-xl text-red-500 hover:bg-red-500/10 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs text-zinc-500 mb-1">
                  {isId ? 'Teks Label Bawah (Kosongkan jika tanpa)' : 'Bottom Frame Badge'}
                </label>
                <input
                  type="text"
                  value={badgeText}
                  onChange={(e) => setBadgeText(e.target.value)}
                  placeholder="SCAN ME"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Live Preview & Export */}
        <div className="lg:col-span-5">
          <div className="sticky top-6 p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-5">
            <div className="p-6 rounded-2xl bg-checkerboard flex items-center justify-center border border-zinc-200/80 dark:border-zinc-800">
              <canvas
                ref={canvasRef}
                className="w-64 max-w-full h-auto drop-shadow-md rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={handleDownloadPng}
                className="py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                PNG (2048px)
              </button>

              <button
                onClick={handleDownloadSvg}
                className="py-2.5 px-4 rounded-xl bg-zinc-900 dark:bg-zinc-100 hover:opacity-90 text-white dark:text-zinc-900 font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Vector SVG
              </button>
            </div>

            <button
              onClick={handleCopyPng}
              className="w-full py-2 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/70 text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  {isId ? 'Tersalin ke Clipboard!' : 'Copied to Clipboard!'}
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  {isId ? 'Salin Gambar QR' : 'Copy QR Image'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
