import React, { useState } from 'react';
import JSZip from 'jszip';
import {
  Upload,
  Download,
  Archive,
  Trash2,
  Shield,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { Lang } from '../../i18n/translations';
import { formatBytes, downloadBlob, fileToDataUrl, loadImageElement } from '../../utils/fileHelpers';

type OutputMime = 'image/webp' | 'image/jpeg' | 'image/png';

interface ProcessedImageItem {
  id: string;
  originalName: string;
  originalSize: number;
  outputName: string;
  outputSize: number;
  width: number;
  height: number;
  blob: Blob;
  previewUrl: string;
}

async function createSampleImageFile(index: number, title: string, colors: [string, string]): Promise<File> {
  const c = document.createElement('canvas');
  c.width = 1600;
  c.height = 1060;
  const ctx = c.getContext('2d')!;

  const g = ctx.createLinearGradient(0, 0, c.width, c.height);
  g.addColorStop(0, colors[0]);
  g.addColorStop(1, colors[1]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, c.width, c.height);

  // Decorative geometric shapes so compression ratio is realistic
  for (let i = 0; i < 18; i++) {
    ctx.fillStyle = `rgba(255,255,255,${0.04 + (i % 5) * 0.03})`;
    ctx.beginPath();
    ctx.arc(160 + i * 82, 220 + ((i * 137) % 620), 60 + (i % 4) * 45, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#ffffff';
  ctx.font = '700 68px system-ui, sans-serif';
  ctx.fillText(title, 110, 510);
  ctx.font = '500 32px monospace';
  ctx.fillStyle = 'rgba(255,255,255,0.82)';
  ctx.fillText('1600x1060 Uncompressed PNG Sample -> Ready for WebP/JPEG Optimization', 110, 575);

  const blob: Blob = await new Promise((resolve) =>
    c.toBlob((b) => resolve(b || new Blob()), 'image/png')
  );
  return new File([blob], `sample-photo-0${index}.png`, { type: 'image/png' });
}

export const ImageBatchStudio: React.FC<{ lang: Lang }> = ({ lang }) => {
  const isId = lang === 'id';
  const [sourceFiles, setSourceFiles] = useState<File[]>([]);
  const [results, setResults] = useState<ProcessedImageItem[]>([]);
  const [outputMime, setOutputMime] = useState<OutputMime>('image/webp');
  const [quality, setQuality] = useState<number>(0.8);
  const [maxWidth, setMaxWidth] = useState<number>(0); // 0 = keep original
  const [processing, setProcessing] = useState(false);

  const runBatchProcess = async (
    files: File[],
    mime: OutputMime,
    qual: number,
    maxW: number
  ) => {
    if (files.length === 0) {
      setResults([]);
      return;
    }
    setProcessing(true);
    try {
      const extMap: Record<OutputMime, string> = {
        'image/webp': 'webp',
        'image/jpeg': 'jpg',
        'image/png': 'png',
      };
      const out: ProcessedImageItem[] = [];

      for (const f of files) {
        const srcUrl = await fileToDataUrl(f);
        const img = await loadImageElement(srcUrl);
        let w = img.naturalWidth || img.width;
        let h = img.naturalHeight || img.height;

        if (maxW > 0 && w > maxW) {
          const ratio = maxW / w;
          w = maxW;
          h = Math.round(h * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          if (mime === 'image/jpeg') {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, w, h);
          }
          ctx.drawImage(img, 0, 0, w, h);
        }

        const blob: Blob = await new Promise((resolve) =>
          canvas.toBlob((b) => resolve(b || new Blob()), mime, qual)
        );
        const base = f.name.replace(/\.[^.]+$/, '');
        const outName = `${base}.${extMap[mime]}`;

        out.push({
          id: `${f.name}-${f.size}-${Math.random()}`,
          originalName: f.name,
          originalSize: f.size,
          outputName: outName,
          outputSize: blob.size,
          width: w,
          height: h,
          blob,
          previewUrl: URL.createObjectURL(blob),
        });
      }

      setResults(out);
    } finally {
      setProcessing(false);
    }
  };

  const handleFilesAdded = async (incoming: File[]) => {
    if (incoming.length === 0) return;
    const next = [...sourceFiles, ...incoming];
    setSourceFiles(next);
    await runBatchProcess(next, outputMime, quality, maxWidth);
  };

  const handleLoadSamples = async () => {
    setProcessing(true);
    const s1 = await createSampleImageFile(1, 'Mountain Horizon RAW', ['#064e3b', '#0f766e']);
    const s2 = await createSampleImageFile(2, 'Product Launch Shot', ['#1e1b4b', '#4338ca']);
    const s3 = await createSampleImageFile(3, 'Sunset Studio Frame', ['#7c2d12', '#ea580c']);
    const list = [s1, s2, s3];
    setSourceFiles(list);
    await runBatchProcess(list, outputMime, quality, maxWidth);
  };

  const handleReprocess = () => {
    runBatchProcess(sourceFiles, outputMime, quality, maxWidth);
  };

  const handleDownloadZip = async () => {
    if (results.length === 0) return;
    const zip = new JSZip();
    results.forEach((r) => {
      zip.file(r.outputName, r.blob);
    });
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(zipBlob, 'optimized-images-clean-exif.zip');
  };

  const totalOrig = results.reduce((a, b) => a + b.originalSize, 0);
  const totalOut = results.reduce((a, b) => a + b.outputSize, 0);
  const savedBytes = Math.max(0, totalOrig - totalOut);
  const savedPct = totalOrig > 0 ? Math.round(((totalOrig - totalOut) / totalOrig) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800/80">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono text-emerald-600 dark:text-emerald-400 mb-1">
            <span className="line-through text-zinc-400">$9/mo TinyPNG 20-File & 5MB Limits</span>
            <span>→ Unlimited Batch · EXIF/GPS Stripped</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {isId
              ? 'Kompresor Gambar Massal & Pembersih EXIF'
              : 'Batch Image Optimizer & EXIF Scrubber'}
          </h1>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
          <Shield className="w-4 h-4" />
          {isId ? 'Otomatis Hapus Lokasi GPS & EXIF' : 'Auto-Strips GPS & Camera Metadata'}
        </div>
      </div>

      {/* Settings Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 grid sm:grid-cols-4 gap-4 items-end">
        <div>
          <label className="block text-xs text-zinc-500 mb-1">
            {isId ? 'Format Output' : 'Output Format'}
          </label>
          <select
            value={outputMime}
            onChange={(e) => {
              const next = e.target.value as OutputMime;
              setOutputMime(next);
              runBatchProcess(sourceFiles, next, quality, maxWidth);
            }}
            className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs font-mono"
          >
            <option value="image/webp">WebP (Best Compression)</option>
            <option value="image/jpeg">JPEG (Universal)</option>
            <option value="image/png">PNG (Lossless Clean EXIF)</option>
          </select>
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-zinc-500">{isId ? 'Kualitas' : 'Quality'}</span>
            <span className="font-mono">{Math.round(quality * 100)}%</span>
          </div>
          <input
            type="range"
            min={0.15}
            max={0.98}
            step={0.03}
            disabled={outputMime === 'image/png'}
            value={quality}
            onChange={(e) => setQuality(parseFloat(e.target.value))}
            onMouseUp={handleReprocess}
            onTouchEnd={handleReprocess}
            className="w-full accent-emerald-500 disabled:opacity-30"
          />
        </div>

        <div>
          <label className="block text-xs text-zinc-500 mb-1">
            {isId ? 'Batas Lebar Maksimal' : 'Max Width Resize'}
          </label>
          <select
            value={maxWidth}
            onChange={(e) => {
              const nextW = Number(e.target.value);
              setMaxWidth(nextW);
              runBatchProcess(sourceFiles, outputMime, quality, nextW);
            }}
            className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs font-mono"
          >
            <option value={0}>{isId ? 'Ukuran Asli' : 'Original Dimensions'}</option>
            <option value={1920}>1920px (Full HD)</option>
            <option value={1280}>1280px (Web HD)</option>
            <option value={800}>800px (Compact)</option>
          </select>
        </div>

        <button
          onClick={handleReprocess}
          disabled={sourceFiles.length === 0 || processing}
          className="py-2 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-40 text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${processing ? 'animate-spin' : ''}`} />
          {isId ? 'Terapkan Ulang' : 'Re-Optimize'}
        </button>
      </div>

      {/* Dropzone */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <label className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-800 hover:border-emerald-500/70 bg-zinc-50/60 dark:bg-zinc-900/40 cursor-pointer text-center transition">
            <Upload className="w-8 h-8 text-emerald-500 mb-2" />
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {isId
                ? 'Tarik banyak foto PNG / JPG / WebP sekaligus ke sini'
                : 'Drop unlimited PNG, JPG, or WebP images here'}
            </span>
            <span className="text-xs text-zinc-500 mt-1">
              {isId
                ? 'Tanpa batas 5MB atau 20 file · Semua diproses offline di browser'
                : 'Zero file count or MB caps · Processed strictly on your device'}
            </span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              className="hidden"
              onChange={(e) => handleFilesAdded(Array.from(e.target.files || []))}
            />
          </label>

          {results.length === 0 ? (
            <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-100/70 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800">
              <span className="text-xs text-zinc-500">
                {isId
                  ? 'Ingin langsung lihat seberapa jauh ukuran file mengecil?'
                  : 'Want to test instant WebP compression right now?'}
              </span>
              <button
                onClick={handleLoadSamples}
                disabled={processing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-medium cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {isId ? 'Muat 3 Foto Contoh' : 'Load 3 Sample Photos'}
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {results.map((item) => {
                const diffPct = Math.round(
                  ((item.originalSize - item.outputSize) / item.originalSize) * 100
                );
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={item.previewUrl}
                        alt={item.outputName}
                        className="w-12 h-12 rounded-lg object-cover bg-zinc-100 dark:bg-zinc-800 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                          {item.outputName}
                        </p>
                        <p className="text-xs font-mono text-zinc-500">
                          {formatBytes(item.originalSize)} →{' '}
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            {formatBytes(item.outputSize)}
                          </span>{' '}
                          ({item.width}×{item.height}px)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded-md text-xs font-mono font-semibold ${
                          diffPct >= 0
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {diffPct >= 0 ? `-${diffPct}%` : `+${Math.abs(diffPct)}%`}
                      </span>
                      <button
                        onClick={() => downloadBlob(item.blob, item.outputName)}
                        className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-emerald-500 hover:text-zinc-950 transition cursor-pointer"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Batch Summary Sidebar */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 h-fit space-y-4">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {isId ? 'Statistik Penghematan' : 'Batch Savings'}
          </h3>

          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
            <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {savedPct > 0 ? `-${savedPct}%` : '0%'}
            </div>
            <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
              {isId ? 'Dihemat:' : 'Total Saved:'} {formatBytes(savedBytes)}
            </div>
          </div>

          <div className="space-y-1.5 text-xs font-mono text-zinc-500">
            <div className="flex justify-between">
              <span>{isId ? 'Jumlah Gambar' : 'Images'}</span>
              <span className="text-zinc-900 dark:text-zinc-100">{results.length}</span>
            </div>
            <div className="flex justify-between">
              <span>{isId ? 'Ukuran Awal' : 'Before'}</span>
              <span className="text-zinc-900 dark:text-zinc-100">{formatBytes(totalOrig)}</span>
            </div>
            <div className="flex justify-between">
              <span>{isId ? 'Ukuran Akhir' : 'After'}</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                {formatBytes(totalOut)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>EXIF / GPS</span>
              <span className="text-emerald-600 dark:text-emerald-400">Cleaned ✓</span>
            </div>
          </div>

          <button
            onClick={handleDownloadZip}
            disabled={results.length === 0 || processing}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-zinc-950 font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Archive className="w-4 h-4" />
            {isId ? 'Unduh Semua (.ZIP)' : 'Download All (.ZIP)'}
          </button>

          {results.length > 0 && (
            <button
              onClick={() => {
                setSourceFiles([]);
                setResults([]);
              }}
              className="w-full py-1.5 text-xs text-zinc-500 hover:text-red-500 flex items-center justify-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {isId ? 'Bersihkan Semua' : 'Clear Batch'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
