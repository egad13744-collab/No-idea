import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  Download,
  Copy,
  Check,
  Sparkles,
  Monitor,
  ClipboardPaste,
} from 'lucide-react';
import { Lang } from '../../i18n/translations';
import { downloadBlob, fileToDataUrl, loadImageElement } from '../../utils/fileHelpers';

type WindowFrame = 'macos-dark' | 'macos-light' | 'browser' | 'none';
type AspectPreset = 'auto' | '16:9' | '4:3' | '1:1' | '2:1';

interface BackdropPreset {
  id: string;
  name: string;
  stops: [string, string, string];
  transparent?: boolean;
}

const BACKDROPS: BackdropPreset[] = [
  { id: 'emerald', name: 'Emerald Noir', stops: ['#052e2b', '#065f46', '#09090b'] },
  { id: 'carbon', name: 'Carbon Studio', stops: ['#27272a', '#18181b', '#09090b'] },
  { id: 'ocean', name: 'Nordic Sea', stops: ['#0f172a', '#1d4ed8', '#0ea5e9'] },
  { id: 'amber', name: 'Warm Sunset', stops: ['#7c2d12', '#ea580c', '#f59e0b'] },
  { id: 'rose', name: 'Coral Dusk', stops: ['#4c0519', '#be123c', '#fb7185'] },
  { id: 'snow', name: 'Clean Paper', stops: ['#f4f4f5', '#e4e4e7', '#d4d4d8'] },
  { id: 'transparent', name: 'Transparent', stops: ['#000000', '#000000', '#000000'], transparent: true },
];

function generateDemoScreenshotDataUrl(): string {
  const c = document.createElement('canvas');
  c.width = 960;
  c.height = 560;
  const ctx = c.getContext('2d')!;

  ctx.fillStyle = '#0c0e14';
  ctx.fillRect(0, 0, c.width, c.height);

  // Subtle grid
  ctx.strokeStyle = 'rgba(255,255,255,0.035)';
  ctx.lineWidth = 1;
  for (let x = 0; x < c.width; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, c.height);
    ctx.stroke();
  }
  for (let y = 0; y < c.height; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(c.width, y);
    ctx.stroke();
  }

  // Metric cards
  const cards = [
    { label: 'CLOUD UPLOADS', val: '0 Bytes', accent: '#10b981' },
    { label: 'SUBSCRIPTION FEE', val: '$0.00 / mo', accent: '#38bdf8' },
    { label: 'WATERMARKS', val: 'None', accent: '#f59e0b' },
  ];

  cards.forEach((card, i) => {
    const x = 48 + i * 296;
    const y = 48;
    ctx.fillStyle = '#151923';
    ctx.beginPath();
    ctx.roundRect(x, y, 272, 118, 16);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 12px monospace';
    ctx.fillText(card.label, x + 22, y + 38);

    ctx.fillStyle = card.accent;
    ctx.font = '700 30px system-ui, sans-serif';
    ctx.fillText(card.val, x + 22, y + 86);
  });

  // Code / Terminal snippet block
  ctx.fillStyle = '#141821';
  ctx.beginPath();
  ctx.roundRect(48, 198, 864, 314, 18);
  ctx.fill();
  ctx.strokeStyle = 'rgba(16,185,129,0.28)';
  ctx.stroke();

  const lines = [
    { t: '$ git clone https://github.com/egad13744-collab/No-idea.git', c: '#e2e8f0' },
    { t: '$ cd No-idea && npm install && npm run dev', c: '#94a3b8' },
    { t: '✓ Local PDF Engine initialized (0 network calls)', c: '#10b981' },
    { t: '✓ Static Never-Expiring QR Renderer ready', c: '#10b981' },
    { t: '✓ 2x Retina Screenshot Studio unlocked — $0 forever', c: '#38bdf8' },
  ];

  ctx.font = '500 18px ui-monospace, SFMono-Regular, Menlo, monospace';
  lines.forEach((ln, idx) => {
    ctx.fillStyle = ln.c;
    ctx.fillText(ln.t, 82, 260 + idx * 46);
  });

  return c.toDataURL('image/png');
}

export const ScreenshotStudio: React.FC<{ lang: Lang }> = ({ lang }) => {
  const isId = lang === 'id';
  const [imgSrc, setImgSrc] = useState<string>(() => generateDemoScreenshotDataUrl());
  const [frame, setFrame] = useState<WindowFrame>('macos-dark');
  const [browserUrl, setBrowserUrl] = useState('github.com/egad13744-collab/No-idea');
  const [backdropId, setBackdropId] = useState<string>('emerald');
  const [padding, setPadding] = useState<number>(68);
  const [radius, setRadius] = useState<number>(18);
  const [shadow, setShadow] = useState<number>(0.55);
  const [aspect, setAspect] = useState<AspectPreset>('auto');
  const [caption, setCaption] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Paste from clipboard anywhere in Screenshot Studio
  useEffect(() => {
    const onPaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const blob = item.getAsFile();
          if (blob) {
            const url = await fileToDataUrl(blob);
            setImgSrc(url);
          }
        }
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, []);

  const renderMockup = async (targetCanvas: HTMLCanvasElement, scaleMultiplier = 1) => {
    if (!imgSrc) return;
    const img = await loadImageElement(imgSrc);
    const imgW = img.naturalWidth || img.width;
    const imgH = img.naturalHeight || img.height;

    const headerH = frame === 'none' ? 0 : frame === 'browser' ? 46 : 38;
    const winW = imgW;
    const winH = imgH + headerH;

    let canvasW = winW + padding * 2;
    let canvasH = winH + padding * 2;

    if (aspect !== 'auto') {
      const ratios: Record<Exclude<AspectPreset, 'auto'>, number> = {
        '16:9': 16 / 9,
        '4:3': 4 / 3,
        '1:1': 1,
        '2:1': 2,
      };
      const targetR = ratios[aspect];
      const currentR = canvasW / canvasH;
      if (currentR < targetR) {
        canvasW = Math.round(canvasH * targetR);
      } else {
        canvasH = Math.round(canvasW / targetR);
      }
    }

    targetCanvas.width = Math.round(canvasW * scaleMultiplier);
    targetCanvas.height = Math.round(canvasH * scaleMultiplier);

    const ctx = targetCanvas.getContext('2d');
    if (!ctx) return;
    ctx.save();
    ctx.scale(scaleMultiplier, scaleMultiplier);
    ctx.clearRect(0, 0, canvasW, canvasH);

    // Draw backdrop
    const preset = BACKDROPS.find((b) => b.id === backdropId) || BACKDROPS[0];
    if (!preset.transparent) {
      const grad = ctx.createLinearGradient(0, 0, canvasW, canvasH);
      grad.addColorStop(0, preset.stops[0]);
      grad.addColorStop(0.52, preset.stops[1]);
      grad.addColorStop(1, preset.stops[2]);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvasW, canvasH);
    }

    const wx = (canvasW - winW) / 2;
    const wy = (canvasH - winH) / 2;

    // Drop shadow
    if (shadow > 0) {
      ctx.save();
      ctx.shadowColor = `rgba(0, 0, 0, ${shadow * 0.72})`;
      ctx.shadowBlur = 45 * shadow + 12;
      ctx.shadowOffsetY = 22 * shadow;
      ctx.fillStyle = frame === 'macos-light' ? '#f8fafc' : '#09090b';
      ctx.beginPath();
      ctx.roundRect(wx, wy, winW, winH, radius);
      ctx.fill();
      ctx.restore();
    }

    // Clip rounded window container
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(wx, wy, winW, winH, radius);
    ctx.clip();

    // Window header chrome
    if (frame !== 'none') {
      const isLight = frame === 'macos-light';
      ctx.fillStyle = isLight ? '#f1f5f9' : '#18181b';
      ctx.fillRect(wx, wy, winW, headerH);

      // Traffic lights
      const dots = ['#ef4444', '#f59e0b', '#10b981'];
      dots.forEach((col, i) => {
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(wx + 22 + i * 20, wy + headerH / 2, 6, 0, Math.PI * 2);
        ctx.fill();
      });

      if (frame === 'browser') {
        const pillW = Math.min(winW * 0.56, 440);
        const pillH = 26;
        const px = wx + (winW - pillW) / 2;
        const py = wy + (headerH - pillH) / 2;
        ctx.fillStyle = '#27272a';
        ctx.beginPath();
        ctx.roundRect(px, py, pillW, pillH, 8);
        ctx.fill();

        ctx.fillStyle = '#a1a1aa';
        ctx.font = '500 12px ui-monospace, SFMono-Regular, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(browserUrl, wx + winW / 2, wy + headerH / 2 + 0.5);
      }
    }

    // Screenshot image
    ctx.drawImage(img, wx, wy + headerH, imgW, imgH);

    // Subtle inner border
    ctx.strokeStyle = 'rgba(255,255,255,0.14)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(wx + 0.75, wy + 0.75, winW - 1.5, winH - 1.5, radius);
    ctx.stroke();

    ctx.restore();

    // Optional user caption (never forced!)
    if (caption.trim()) {
      ctx.fillStyle = backdropId === 'snow' ? 'rgba(24,24,27,0.7)' : 'rgba(255,255,255,0.78)';
      ctx.font = '500 14px Inter, system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(caption.trim(), canvasW - 24, canvasH - 18);
    }

    ctx.restore();
  };

  useEffect(() => {
    if (!canvasRef.current) return;
    renderMockup(canvasRef.current, 1);
  }, [imgSrc, frame, browserUrl, backdropId, padding, radius, shadow, aspect, caption]);

  const handleDownloadRetina = async () => {
    const offscreen = document.createElement('canvas');
    await renderMockup(offscreen, 2);
    offscreen.toBlob((blob) => {
      if (blob) downloadBlob(blob, 'screenshot-mockup-2x.png');
    }, 'image/png');
  };

  const handleCopyImage = async () => {
    if (!canvasRef.current) return;
    canvasRef.current.toBlob(async (blob) => {
      if (!blob) return;
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        downloadBlob(blob, 'screenshot-mockup.png');
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800/80">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono text-emerald-600 dark:text-emerald-400 mb-1">
            <span className="line-through text-zinc-400">$10/mo Watermarked Mockup Tools</span>
            <span>→ 2x Retina · Zero Watermarks</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Screenshot Mockup Studio
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500">
            <ClipboardPaste className="w-3.5 h-3.5 text-emerald-500" />
            {isId ? 'Bisa langsung Ctrl+V screenshot!' : 'Tip: Press Ctrl+V / ⌘V to paste!'}
          </span>
          <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs cursor-pointer transition">
            <Upload className="w-3.5 h-3.5" />
            {isId ? 'Pilih Gambar' : 'Upload Image'}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) setImgSrc(await fileToDataUrl(f));
              }}
            />
          </label>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Live Stage */}
        <div className="lg:col-span-8 space-y-3">
          <div className="p-4 sm:p-6 rounded-2xl bg-checkerboard border border-zinc-200 dark:border-zinc-800 flex items-center justify-center min-h-[380px] overflow-hidden">
            <canvas
              ref={canvasRef}
              className="max-w-full max-h-[540px] w-auto h-auto rounded-lg shadow-sm"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={() => setImgSrc(generateDemoScreenshotDataUrl())}
              className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              {isId ? 'Reset ke Gambar Demo' : 'Reset Demo Screenshot'}
            </button>

            <div className="flex items-center gap-2.5">
              <button
                onClick={handleCopyImage}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    {isId ? 'Tersalin!' : 'Copied!'}
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    {isId ? 'Salin Gambar' : 'Copy PNG'}
                  </>
                )}
              </button>
              <button
                onClick={handleDownloadRetina}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs cursor-pointer"
              >
                <Download className="w-4 h-4" />
                {isId ? 'Unduh 2x Retina PNG' : 'Export 2x Retina PNG'}
              </button>
            </div>
          </div>
        </div>

        {/* Controls Panel */}
        <div className="lg:col-span-4 space-y-4">
          {/* Backdrop */}
          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
            <span className="block text-xs font-mono uppercase tracking-wider text-zinc-500">
              {isId ? 'Latar Studio' : 'Studio Backdrop'}
            </span>
            <div className="grid grid-cols-4 gap-2">
              {BACKDROPS.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setBackdropId(b.id)}
                  title={b.name}
                  style={
                    b.transparent
                      ? undefined
                      : {
                          background: `linear-gradient(135deg, ${b.stops[0]}, ${b.stops[1]}, ${b.stops[2]})`,
                        }
                  }
                  className={`h-9 rounded-xl border transition cursor-pointer ${
                    b.transparent ? 'bg-checkerboard' : ''
                  } ${
                    backdropId === b.id
                      ? 'ring-2 ring-emerald-500 border-white'
                      : 'border-zinc-300 dark:border-zinc-700'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Window Frame */}
          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
            <span className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-zinc-500">
              <Monitor className="w-3.5 h-3.5" />
              {isId ? 'Bingkai Jendela' : 'Window Chrome'}
            </span>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              {(
                [
                  { id: 'macos-dark', label: 'macOS Dark' },
                  { id: 'macos-light', label: 'macOS Light' },
                  { id: 'browser', label: 'Browser URL' },
                  { id: 'none', label: isId ? 'Tanpa Bingkai' : 'Frameless' },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFrame(f.id)}
                  className={`py-2 px-2.5 rounded-xl border font-medium transition cursor-pointer ${
                    frame === f.id
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {frame === 'browser' && (
              <input
                type="text"
                value={browserUrl}
                onChange={(e) => setBrowserUrl(e.target.value)}
                placeholder="example.com"
                className="w-full px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs font-mono"
              />
            )}
          </div>

          {/* Sliders & Aspect */}
          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3.5">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-500">Padding</span>
                <span className="font-mono">{padding}px</span>
              </div>
              <input
                type="range"
                min={0}
                max={140}
                value={padding}
                onChange={(e) => setPadding(Number(e.target.value))}
                className="w-full accent-emerald-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-500">Corner Radius</span>
                <span className="font-mono">{radius}px</span>
              </div>
              <input
                type="range"
                min={0}
                max={34}
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="w-full accent-emerald-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-500">Shadow Depth</span>
                <span className="font-mono">{Math.round(shadow * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={shadow}
                onChange={(e) => setShadow(Number(e.target.value))}
                className="w-full accent-emerald-500"
              />
            </div>

            <div>
              <span className="block text-xs text-zinc-500 mb-1.5">Aspect Ratio</span>
              <div className="grid grid-cols-5 gap-1 text-[11px] font-mono">
                {(['auto', '16:9', '4:3', '1:1', '2:1'] as const).map((a) => (
                  <button
                    key={a}
                    onClick={() => setAspect(a)}
                    className={`py-1.5 rounded-lg border cursor-pointer ${
                      aspect === a
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500 font-semibold'
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-500'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-zinc-500 mb-1">
                {isId ? 'Caption Pojok Kanan (Opsional)' : 'Optional Corner Signature'}
              </label>
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder={isId ? 'Kosong = Tanpa teks apapun' : 'Leave blank for zero text'}
                className="w-full px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
