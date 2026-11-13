import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  Layers,
  Scissors,
  PenTool,
  Image as ImageIcon,
  Upload,
  ArrowUp,
  ArrowDown,
  Trash2,
  RotateCw,
  Download,
  Sparkles,
  CheckCircle2,
  Stamp,
  Archive,
} from 'lucide-react';
import { Lang } from '../../i18n/translations';
import {
  PdfPagePreview,
  getPdfPageCount,
  renderPdfThumbnails,
  renderSinglePdfPage,
  mergePdfBuffers,
  extractAndRotatePages,
  splitEachPageToZip,
  embedSignatureOnPdf,
  addWatermarkToPdf,
  convertImagesToPdf,
  exportPdfPagesAsImagesZip,
  createSamplePdf,
} from '../../utils/pdfEngine';
import {
  formatBytes,
  downloadUint8Array,
  downloadBlob,
} from '../../utils/fileHelpers';

interface MergeItem {
  id: string;
  name: string;
  size: number;
  pages: number;
  bytes: Uint8Array;
}

type PdfSubTab = 'merge' | 'split' | 'sign' | 'convert';

export const PdfStudio: React.FC<{ lang: Lang }> = ({ lang }) => {
  const isId = lang === 'id';
  const [subTab, setSubTab] = useState<PdfSubTab>('merge');
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [mergeList, setMergeList] = useState<MergeItem[]>([]);

  const [splitBytes, setSplitBytes] = useState<Uint8Array | null>(null);
  const [splitName, setSplitName] = useState<string>('document');
  const [pages, setPages] = useState<PdfPagePreview[]>([]);

  const [signBytes, setSignBytes] = useState<Uint8Array | null>(null);
  const [signName, setSignName] = useState<string>('contract');
  const [signTotalPages, setSignTotalPages] = useState<number>(0);
  const [signPageIdx, setSignPageIdx] = useState<number>(0);
  const [signPageImg, setSignPageImg] = useState<string>('');
  const [sigMode, setSigMode] = useState<'draw' | 'type'>('draw');
  const [sigColor, setSigColor] = useState<string>('#0f172a');
  const [typedSig, setTypedSig] = useState<string>('Egandika');
  const [sigDataUrl, setSigDataUrl] = useState<string>('');
  const [sigPos, setSigPos] = useState<{ x: number; y: number }>({ x: 0.12, y: 0.72 });
  const [sigWidthRatio, setSigWidthRatio] = useState<number>(0.28);
  const [stampText, setStampText] = useState<string>(
    `Signed ${new Date().toISOString().slice(0, 10)}`
  );
  const sigCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const previewBoxRef = useRef<HTMLDivElement | null>(null);

  const [imgFiles, setImgFiles] = useState<File[]>([]);
  const [imgPageMode, setImgPageMode] = useState<'a4' | 'fit'>('a4');
  const [wmBytes, setWmBytes] = useState<Uint8Array | null>(null);
  const [wmName, setWmName] = useState<string>('document');
  const [wmText, setWmText] = useState<string>('CONFIDENTIAL');
  const [wmOpacity, setWmOpacity] = useState<number>(0.22);
  const [wmColor, setWmColor] = useState<string>('#ef4444');
  const [wmDiagonal, setWmDiagonal] = useState<boolean>(true);
  const [pdfImgFormat, setPdfImgFormat] = useState<'png' | 'jpeg'>('png');

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  // Keep typed signature synchronized when in type mode
  useEffect(() => {
    if (sigMode !== 'type') return;
    const c = document.createElement('canvas');
    c.width = 520;
    c.height = 170;
    const ctx = c.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.fillStyle = sigColor;
      ctx.font = 'italic 600 62px Georgia, "Times New Roman", serif';
      ctx.textBaseline = 'middle';
      ctx.fillText(typedSig || 'Signature', 24, 88);
    }
    setSigDataUrl(c.toDataURL('image/png'));
  }, [sigMode, typedSig, sigColor]);

  // Render active sign page preview whenever signBytes or signPageIdx changes
  useEffect(() => {
    if (!signBytes) return;
    let cancelled = false;
    renderSinglePdfPage(signBytes, signPageIdx, 1.3).then((res) => {
      if (!cancelled) setSignPageImg(res.dataUrl);
    });
    return () => {
      cancelled = true;
    };
  }, [signBytes, signPageIdx]);

  const handleAddMergeFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setBusy(true);
    try {
      const added: MergeItem[] = [];
      for (const f of Array.from(fileList)) {
        const ab = await f.arrayBuffer();
        const bytes = new Uint8Array(ab);
        const count = await getPdfPageCount(bytes);
        added.push({
          id: `${f.name}-${Date.now()}-${Math.random()}`,
          name: f.name,
          size: bytes.byteLength,
          pages: count,
          bytes,
        });
      }
      setMergeList((prev) => [...prev, ...added]);
    } catch {
      notify(isId ? 'Gagal membaca salah satu file PDF.' : 'Could not read one of the PDF files.');
    } finally {
      setBusy(false);
    }
  };

  const loadSampleMerge = async () => {
    setBusy(true);
    try {
      const pdfA = await createSamplePdf('contract');
      const pdfB = await createSamplePdf('report');
      setMergeList([
        {
          id: 'sample-a',
          name: '01-Service-Agreement.pdf',
          size: pdfA.byteLength,
          pages: 3,
          bytes: pdfA,
        },
        {
          id: 'sample-b',
          name: '02-Benchmark-Appendix.pdf',
          size: pdfB.byteLength,
          pages: 2,
          bytes: pdfB,
        },
      ]);
      notify(isId ? '2 PDF contoh siap digabung!' : 'Loaded 2 sample PDFs ready to merge!');
    } finally {
      setBusy(false);
    }
  };

  const runMerge = async () => {
    if (mergeList.length === 0) return;
    setBusy(true);
    try {
      const merged = await mergePdfBuffers(mergeList.map((m) => m.bytes));
      downloadUint8Array(merged, 'merged-document.pdf');
      notify(isId ? 'PDF berhasil digabung & diunduh!' : 'Merged PDF downloaded!');
    } finally {
      setBusy(false);
    }
  };

  const loadSplitPdf = async (bytes: Uint8Array, name: string) => {
    setBusy(true);
    try {
      setSplitBytes(bytes);
      setSplitName(name.replace(/\.pdf$/i, ''));
      const thumbs = await renderPdfThumbnails(bytes, 0.48);
      setPages(thumbs);
    } finally {
      setBusy(false);
    }
  };

  const handleSplitUpload = async (file: File | undefined) => {
    if (!file) return;
    const bytes = new Uint8Array(await file.arrayBuffer());
    await loadSplitPdf(bytes, file.name);
  };

  const handleExportSelectedPdf = async () => {
    if (!splitBytes) return;
    const chosen = pages.filter((p) => p.selected);
    if (chosen.length === 0) return;
    setBusy(true);
    try {
      const out = await extractAndRotatePages(
        splitBytes,
        chosen.map((p) => ({ pageIndex: p.pageIndex, rotation: p.rotation }))
      );
      downloadUint8Array(out, `${splitName}-extracted.pdf`);
      notify(isId ? 'Halaman terpilih berhasil diunduh!' : 'Extracted PDF downloaded!');
    } finally {
      setBusy(false);
    }
  };

  const handleSplitZip = async () => {
    if (!splitBytes) return;
    const chosen = pages.filter((p) => p.selected);
    if (chosen.length === 0) return;
    setBusy(true);
    try {
      const zipBlob = await splitEachPageToZip(
        splitBytes,
        chosen.map((p) => ({ pageIndex: p.pageIndex, rotation: p.rotation })),
        splitName
      );
      downloadBlob(zipBlob, `${splitName}-split-pages.zip`);
      notify(isId ? 'ZIP halaman PDF berhasil diunduh!' : 'Split pages ZIP downloaded!');
    } finally {
      setBusy(false);
    }
  };

  const loadSignDocument = async (bytes: Uint8Array, name: string) => {
    setBusy(true);
    try {
      const total = await getPdfPageCount(bytes);
      setSignBytes(bytes);
      setSignName(name.replace(/\.pdf$/i, ''));
      setSignTotalPages(total);
      setSignPageIdx(total - 1); // Jump to signature page by default
    } finally {
      setBusy(false);
    }
  };

  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = sigCanvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const startDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCanvasCoords(e);
    ctx.strokeStyle = sigColor;
    ctx.lineWidth = 4.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const moveDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !sigCanvasRef.current) return;
    const ctx = sigCanvasRef.current.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCanvasCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const endDraw = () => {
    if (!isDrawingRef.current || !sigCanvasRef.current) return;
    isDrawingRef.current = false;
    setSigDataUrl(sigCanvasRef.current.toDataURL('image/png'));
  };

  const clearDrawnSig = () => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    setSigDataUrl('');
  };

  const handlePlaceClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!previewBoxRef.current) return;
    const rect = previewBoxRef.current.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / rect.width;
    const clickY = (e.clientY - rect.top) / rect.height;
    setSigPos({
      x: Math.max(0.02, Math.min(1 - sigWidthRatio - 0.02, clickX - sigWidthRatio / 2)),
      y: Math.max(0.02, Math.min(0.9, clickY - 0.04)),
    });
  };

  const applySignatureAndDownload = async () => {
    if (!signBytes || !sigDataUrl) {
      notify(
        isId
          ? 'Buat tanda tangan terlebih dahulu di panel kiri!'
          : 'Draw or type your signature first!'
      );
      return;
    }
    setBusy(true);
    try {
      const signed = await embedSignatureOnPdf(signBytes, {
        pageIndex: signPageIdx,
        xRatio: sigPos.x,
        yRatio: sigPos.y,
        widthRatio: sigWidthRatio,
        signaturePngDataUrl: sigDataUrl,
        stampText,
      });
      downloadUint8Array(signed, `${signName}-signed.pdf`);
      notify(isId ? 'PDF bertanda tangan berhasil diunduh!' : 'Signed PDF downloaded!');
    } finally {
      setBusy(false);
    }
  };

  const handleImagesToPdf = async () => {
    if (imgFiles.length === 0) return;
    setBusy(true);
    try {
      const pdfBytes = await convertImagesToPdf(imgFiles, imgPageMode);
      downloadUint8Array(pdfBytes, 'images-compiled.pdf');
      notify(isId ? 'Gambar berhasil dijadikan PDF!' : 'Images compiled into PDF!');
    } finally {
      setBusy(false);
    }
  };

  const handleWatermarkDownload = async () => {
    if (!wmBytes || !wmText.trim()) return;
    setBusy(true);
    try {
      const out = await addWatermarkToPdf(wmBytes, wmText.trim(), {
        opacity: wmOpacity,
        colorHex: wmColor,
        diagonal: wmDiagonal,
        fontSize: 46,
      });
      downloadUint8Array(out, `${wmName}-watermarked.pdf`);
      notify(isId ? 'PDF dengan watermark diunduh!' : 'Watermarked PDF downloaded!');
    } finally {
      setBusy(false);
    }
  };

  const handlePdfToImages = async () => {
    if (!wmBytes) return;
    setBusy(true);
    try {
      const zip = await exportPdfPagesAsImagesZip(wmBytes, pdfImgFormat, 2.0, wmName);
      downloadBlob(zip, `${wmName}-${pdfImgFormat}-pages.zip`);
      notify(isId ? 'Semua halaman diekspor ke ZIP gambar!' : 'Exported all PDF pages as ZIP!');
    } finally {
      setBusy(false);
    }
  };

  const tabs: Array<{ id: PdfSubTab; label: string; icon: React.ReactNode }> = [
    {
      id: 'merge',
      label: isId ? 'Gabung PDF' : 'Merge PDFs',
      icon: <Layers className="w-4 h-4" />,
    },
    {
      id: 'split',
      label: isId ? 'Pisah & Putar Halaman' : 'Split & Rotate',
      icon: <Scissors className="w-4 h-4" />,
    },
    {
      id: 'sign',
      label: isId ? 'Tanda Tangan PDF' : 'Sign & Stamp',
      icon: <PenTool className="w-4 h-4" />,
    },
    {
      id: 'convert',
      label: isId ? 'Gambar ↔ PDF & Watermark' : 'Convert & Watermark',
      icon: <ImageIcon className="w-4 h-4" />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800/80">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono text-emerald-600 dark:text-emerald-400 mb-1">
            <span className="line-through text-zinc-400">$19/mo Acrobat / Smallpdf Pro</span>
            <span>→ $0 · 100% Local Engine</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            PDF Studio
          </h1>
        </div>

        {/* Sub-navigation */}
        <div className="flex flex-wrap gap-1.5 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setSubTab(t.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                subTab === t.id
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {toast && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-sm font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* TAB 1: MERGE */}
      {subTab === 'merge' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <label className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-800 hover:border-emerald-500/60 bg-zinc-50/60 dark:bg-zinc-900/40 transition cursor-pointer text-center">
              <Upload className="w-8 h-8 text-emerald-500 mb-2.5" />
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {isId
                  ? 'Klik atau tarik beberapa file PDF ke sini'
                  : 'Drop multiple PDF files here or click to browse'}
              </span>
              <span className="text-xs text-zinc-500 mt-1">
                {isId
                  ? 'Tanpa batas jumlah file atau halaman · Diproses di memori browser'
                  : 'Unlimited files & pages · Processed strictly inside browser RAM'}
              </span>
              <input
                type="file"
                accept="application/pdf"
                multiple
                className="hidden"
                onChange={(e) => handleAddMergeFiles(e.target.files)}
              />
            </label>

            {mergeList.length === 0 ? (
              <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-100/70 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800">
                <span className="text-xs text-zinc-600 dark:text-zinc-400">
                  {isId
                    ? 'Belum punya file PDF buat dites sekarang?'
                    : "Don't have two PDFs handy right now?"}
                </span>
                <button
                  onClick={loadSampleMerge}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:opacity-90 transition cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {isId ? 'Muat 2 PDF Contoh' : 'Load 2 Sample PDFs'}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {mergeList.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 h-6 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-mono text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <FileText className="w-4 h-4 text-zinc-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                          {item.name}
                        </p>
                        <p className="text-xs font-mono text-zinc-500">
                          {item.pages} {item.pages === 1 ? 'page' : 'pages'} ·{' '}
                          {formatBytes(item.size)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => {
                          if (idx === 0) return;
                          const copy = [...mergeList];
                          [copy[idx - 1], copy[idx]] = [copy[idx], copy[idx - 1]];
                          setMergeList(copy);
                        }}
                        disabled={idx === 0}
                        className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 cursor-pointer"
                        title="Move up"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (idx === mergeList.length - 1) return;
                          const copy = [...mergeList];
                          [copy[idx + 1], copy[idx]] = [copy[idx], copy[idx + 1]];
                          setMergeList(copy);
                        }}
                        disabled={idx === mergeList.length - 1}
                        className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 cursor-pointer"
                        title="Move down"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() =>
                          setMergeList((prev) => prev.filter((x) => x.id !== item.id))
                        }
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 cursor-pointer"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 h-fit space-y-4">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {isId ? 'Ringkasan Penggabungan' : 'Merge Summary'}
            </h3>
            <div className="space-y-2 text-xs font-mono text-zinc-600 dark:text-zinc-400">
              <div className="flex justify-between">
                <span>{isId ? 'Total File' : 'Files Queued'}</span>
                <span className="text-zinc-900 dark:text-zinc-100">{mergeList.length}</span>
              </div>
              <div className="flex justify-between">
                <span>{isId ? 'Total Halaman' : 'Output Pages'}</span>
                <span className="text-zinc-900 dark:text-zinc-100">
                  {mergeList.reduce((acc, x) => acc + x.pages, 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{isId ? 'Total Ukuran' : 'Input Size'}</span>
                <span className="text-zinc-900 dark:text-zinc-100">
                  {formatBytes(mergeList.reduce((acc, x) => acc + x.size, 0))}
                </span>
              </div>
            </div>

            <button
              onClick={runMerge}
              disabled={mergeList.length === 0 || busy}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-zinc-950 font-semibold text-sm flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              {busy
                ? isId
                  ? 'Menggabungkan...'
                  : 'Merging...'
                : isId
                ? 'Gabung & Unduh PDF'
                : 'Merge & Download PDF'}
            </button>

            {mergeList.length > 0 && (
              <button
                onClick={() => setMergeList([])}
                className="w-full py-2 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 cursor-pointer"
              >
                {isId ? 'Kosongkan daftar' : 'Clear all files'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SPLIT & ROTATE */}
      {subTab === 'split' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <div className="flex flex-wrap items-center gap-2.5">
              <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs cursor-pointer transition">
                <Upload className="w-3.5 h-3.5" />
                {isId ? 'Pilih File PDF' : 'Upload PDF'}
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => handleSplitUpload(e.target.files?.[0])}
                />
              </label>

              <button
                onClick={async () => {
                  const sample = await createSamplePdf('contract');
                  await loadSplitPdf(sample, 'Sample-Agreement.pdf');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-medium hover:opacity-90 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                {isId ? 'Muat Contoh 3 Halaman' : 'Load 3-Page Sample'}
              </button>
            </div>

            {pages.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() =>
                    setPages((prev) => prev.map((p) => ({ ...p, selected: true })))
                  }
                  className="px-2.5 py-1.5 rounded-lg text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 cursor-pointer"
                >
                  {isId ? 'Pilih Semua' : 'Select All'}
                </button>
                <button
                  onClick={() =>
                    setPages((prev) => prev.map((p) => ({ ...p, selected: !p.selected })))
                  }
                  className="px-2.5 py-1.5 rounded-lg text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 cursor-pointer"
                >
                  {isId ? 'Balik Pilihan' : 'Invert'}
                </button>
                <button
                  onClick={handleExportSelectedPdf}
                  disabled={busy || pages.every((p) => !p.selected)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-zinc-950 font-semibold text-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  {isId ? 'Unduh Jadi 1 PDF' : 'Extract to 1 PDF'}
                </button>
                <button
                  onClick={handleSplitZip}
                  disabled={busy || pages.every((p) => !p.selected)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 disabled:opacity-40 font-semibold text-xs cursor-pointer"
                >
                  <Archive className="w-3.5 h-3.5" />
                  {isId ? 'Pisah per Halaman (.ZIP)' : 'Split Separate (.ZIP)'}
                </button>
              </div>
            )}
          </div>

          {pages.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {pages.map((p, idx) => (
                <div
                  key={p.pageIndex}
                  className={`group relative rounded-xl p-3 border transition ${
                    p.selected
                      ? 'bg-white dark:bg-zinc-900 border-emerald-500 ring-1 ring-emerald-500/40'
                      : 'bg-zinc-100/60 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800 opacity-60'
                  }`}
                >
                  <div
                    onClick={() =>
                      setPages((prev) =>
                        prev.map((item, i) =>
                          i === idx ? { ...item, selected: !item.selected } : item
                        )
                      )
                    }
                    className="aspect-[1/1.38] flex items-center justify-center bg-zinc-100 dark:bg-zinc-950 rounded-lg overflow-hidden cursor-pointer mb-2.5"
                  >
                    <img
                      src={p.dataUrl}
                      alt={`Page ${p.pageNumber}`}
                      style={{ transform: `rotate(${p.rotation}deg)` }}
                      className="max-h-full max-w-full object-contain transition-transform duration-200"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-700 dark:text-zinc-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={p.selected}
                        onChange={() =>
                          setPages((prev) =>
                            prev.map((item, i) =>
                              i === idx ? { ...item, selected: !item.selected } : item
                            )
                          )
                        }
                        className="accent-emerald-500"
                      />
                      Page {p.pageNumber}
                    </label>
                    <button
                      onClick={() =>
                        setPages((prev) =>
                          prev.map((item, i) =>
                            i === idx
                              ? { ...item, rotation: (item.rotation + 90) % 360 }
                              : item
                          )
                        )
                      }
                      className="p-1 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 cursor-pointer"
                      title="Rotate 90°"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 text-sm text-zinc-500">
              {isId
                ? 'Unggah PDF atau klik "Muat Contoh 3 Halaman" untuk memilih, memutar, dan memisahkan halaman secara visual.'
                : 'Upload any PDF or click "Load 3-Page Sample" to visually toggle, rotate, and extract pages.'}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SIGN & STAMP */}
      {subTab === 'sign' && (
        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            {/* Step 1: Load PDF */}
            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">
                  1 · {isId ? 'Dokumen PDF' : 'Target PDF'}
                </span>
                <button
                  onClick={async () => {
                    const sample = await createSamplePdf('contract');
                    await loadSignDocument(sample, 'Freelance-Contract.pdf');
                  }}
                  className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {isId ? 'Pakai Kontrak Contoh' : 'Load Sample Contract'}
                </button>
              </div>

              <label className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-emerald-500 text-xs font-medium text-zinc-700 dark:text-zinc-200 cursor-pointer">
                <Upload className="w-4 h-4 text-emerald-500" />
                {signBytes
                  ? `${signName}.pdf (${signTotalPages} pages)`
                  : isId
                  ? 'Unggah PDF yang ingin ditandatangani'
                  : 'Upload PDF to Sign'}
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      const b = new Uint8Array(await f.arrayBuffer());
                      await loadSignDocument(b, f.name);
                    }
                  }}
                />
              </label>
            </div>

            {/* Step 2: Create Signature */}
            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">
                  2 · {isId ? 'Buat Tanda Tangan' : 'Your Signature'}
                </span>
                <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg text-xs">
                  <button
                    onClick={() => setSigMode('draw')}
                    className={`px-2.5 py-1 rounded-md cursor-pointer ${
                      sigMode === 'draw'
                        ? 'bg-white dark:bg-zinc-700 font-medium text-zinc-900 dark:text-white'
                        : 'text-zinc-500'
                    }`}
                  >
                    {isId ? 'Gambar' : 'Draw'}
                  </button>
                  <button
                    onClick={() => setSigMode('type')}
                    className={`px-2.5 py-1 rounded-md cursor-pointer ${
                      sigMode === 'type'
                        ? 'bg-white dark:bg-zinc-700 font-medium text-zinc-900 dark:text-white'
                        : 'text-zinc-500'
                    }`}
                  >
                    {isId ? 'Ketik' : 'Type'}
                  </button>
                </div>
              </div>

              {/* Ink color */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500">{isId ? 'Warna Tinta:' : 'Ink Color:'}</span>
                <div className="flex gap-2">
                  {[
                    { label: 'Ink Black', hex: '#0f172a' },
                    { label: 'Royal Blue', hex: '#1d4ed8' },
                    { label: 'Emerald', hex: '#047857' },
                  ].map((ink) => (
                    <button
                      key={ink.hex}
                      onClick={() => setSigColor(ink.hex)}
                      style={{ backgroundColor: ink.hex }}
                      className={`w-5 h-5 rounded-full cursor-pointer ${
                        sigColor === ink.hex ? 'ring-2 ring-offset-2 ring-emerald-500' : ''
                      }`}
                      title={ink.label}
                    />
                  ))}
                </div>
              </div>

              {sigMode === 'draw' ? (
                <div className="space-y-2">
                  <canvas
                    ref={sigCanvasRef}
                    width={520}
                    height={170}
                    onPointerDown={startDraw}
                    onPointerMove={moveDraw}
                    onPointerUp={endDraw}
                    onPointerLeave={endDraw}
                    className="w-full h-32 rounded-xl bg-zinc-50 border border-zinc-200 dark:border-zinc-700 touch-none cursor-crosshair"
                  />
                  <div className="flex justify-between items-center text-xs text-zinc-500">
                    <span>{isId ? 'Coret tanda tangan di kotak putih' : 'Draw inside pad above'}</span>
                    <button
                      onClick={clearDrawnSig}
                      className="text-red-500 hover:underline cursor-pointer"
                    >
                      {isId ? 'Hapus Coretan' : 'Clear Pad'}
                    </button>
                  </div>
                </div>
              ) : (
                <input
                  type="text"
                  value={typedSig}
                  onChange={(e) => setTypedSig(e.target.value)}
                  placeholder="Type your name..."
                  className="w-full px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-100"
                />
              )}
            </div>

            {/* Step 3: Size & Stamp */}
            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-500">
                    {isId ? 'Ukuran Tanda Tangan' : 'Signature Width'}
                  </span>
                  <span className="font-mono">{Math.round(sigWidthRatio * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0.14}
                  max={0.48}
                  step={0.02}
                  value={sigWidthRatio}
                  onChange={(e) => setSigWidthRatio(parseFloat(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-500 mb-1">
                  {isId ? 'Stempel Tanggal / Catatan (Opsional)' : 'Optional Stamp Line'}
                </label>
                <input
                  type="text"
                  value={stampText}
                  onChange={(e) => setStampText(e.target.value)}
                  placeholder="Signed 2026-11-13"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs font-mono"
                />
              </div>

              <button
                onClick={applySignatureAndDownload}
                disabled={!signBytes || !sigDataUrl || busy}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-zinc-950 font-semibold text-sm flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                {isId ? 'Tempel & Unduh PDF Bertanda Tangan' : 'Sign & Download PDF'}
              </button>
            </div>
          </div>

          {/* Live PDF Page Placement */}
          <div className="lg:col-span-7 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col">
            {signBytes && signPageImg ? (
              <>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-zinc-500">
                    {isId
                      ? 'Klik di mana saja pada halaman untuk memindahkan posisi tanda tangan:'
                      : 'Click anywhere on the page below to position your signature:'}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs font-mono">
                    <button
                      disabled={signPageIdx <= 0}
                      onClick={() => setSignPageIdx((p) => Math.max(0, p - 1))}
                      className="px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 disabled:opacity-40 cursor-pointer"
                    >
                      Prev
                    </button>
                    <span>
                      {signPageIdx + 1} / {signTotalPages}
                    </span>
                    <button
                      disabled={signPageIdx >= signTotalPages - 1}
                      onClick={() =>
                        setSignPageIdx((p) => Math.min(signTotalPages - 1, p + 1))
                      }
                      className="px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 disabled:opacity-40 cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                </div>

                <div className="flex-1 flex items-center justify-center bg-zinc-100 dark:bg-zinc-950 rounded-xl p-4 overflow-auto">
                  <div
                    ref={previewBoxRef}
                    onClick={handlePlaceClick}
                    className="relative inline-block shadow-lg cursor-crosshair select-none max-w-full"
                  >
                    <img
                      src={signPageImg}
                      alt="PDF Page Preview"
                      className="max-h-[560px] w-auto block rounded-xs"
                    />
                    {sigDataUrl && (
                      <div
                        style={{
                          left: `${sigPos.x * 100}%`,
                          top: `${sigPos.y * 100}%`,
                          width: `${sigWidthRatio * 100}%`,
                        }}
                        className="absolute pointer-events-none border border-dashed border-emerald-500 bg-emerald-500/5 p-1 rounded"
                      >
                        <img src={sigDataUrl} alt="Signature" className="w-full h-auto" />
                        {stampText && (
                          <div className="text-[9px] font-mono text-zinc-700 truncate">
                            {stampText}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 min-h-[360px] flex flex-col items-center justify-center text-center p-8 text-zinc-500">
                <PenTool className="w-9 h-9 text-emerald-500/70 mb-3" />
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 mb-1">
                  {isId ? 'Belum ada dokumen yang dibuka' : 'No PDF loaded for signing yet'}
                </p>
                <p className="text-xs max-w-sm mb-4">
                  {isId
                    ? 'Unggah kontrak/formulir PDF kamu atau muat contoh kontrak untuk mencoba tanda tangan bebas watermark.'
                    : 'Upload any contract or form, or load our 3-page sample agreement to test instant local e-signing.'}
                </p>
                <button
                  onClick={async () => {
                    const sample = await createSamplePdf('contract');
                    await loadSignDocument(sample, 'Freelance-Contract.pdf');
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-zinc-950 font-semibold text-xs cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {isId ? 'Buka Kontrak Contoh' : 'Load Sample Contract'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: IMAGES <-> PDF & WATERMARK */}
      {subTab === 'convert' && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Card A: Images -> PDF */}
          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4">
            <div className="flex items-center gap-2.5">
              <ImageIcon className="w-5 h-5 text-emerald-500" />
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {isId ? 'Gambar (JPG / PNG / WebP) → PDF' : 'Images (JPG / PNG / WebP) → PDF'}
                </h3>
                <p className="text-xs text-zinc-500">
                  {isId
                    ? 'Gabungkan foto scan dokumen/kwitansi menjadi 1 PDF rapi'
                    : 'Compile receipts, scans, or slides into a clean multi-page PDF'}
                </p>
              </div>
            </div>

            <label className="flex flex-col items-center justify-center p-6 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-emerald-500 cursor-pointer text-center">
              <Upload className="w-6 h-6 text-emerald-500 mb-1.5" />
              <span className="text-xs font-medium">
                {imgFiles.length > 0
                  ? `${imgFiles.length} image(s) selected`
                  : isId
                  ? 'Pilih satu atau banyak gambar'
                  : 'Select one or multiple images'}
              </span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                className="hidden"
                onChange={(e) => setImgFiles(Array.from(e.target.files || []))}
              />
            </label>

            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500">{isId ? 'Ukuran Halaman:' : 'Page Layout:'}</span>
              <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
                <button
                  onClick={() => setImgPageMode('a4')}
                  className={`px-2.5 py-1 rounded cursor-pointer ${
                    imgPageMode === 'a4'
                      ? 'bg-white dark:bg-zinc-700 font-medium'
                      : 'text-zinc-500'
                  }`}
                >
                  A4 Margin
                </button>
                <button
                  onClick={() => setImgPageMode('fit')}
                  className={`px-2.5 py-1 rounded cursor-pointer ${
                    imgPageMode === 'fit'
                      ? 'bg-white dark:bg-zinc-700 font-medium'
                      : 'text-zinc-500'
                  }`}
                >
                  Exact Fit
                </button>
              </div>
            </div>

            <button
              onClick={handleImagesToPdf}
              disabled={imgFiles.length === 0 || busy}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-zinc-950 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              {isId ? 'Konversi Gambar ke PDF' : 'Build & Download PDF'}
            </button>
          </div>

          {/* Card B: Watermark & PDF -> Images */}
          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Stamp className="w-5 h-5 text-emerald-500" />
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {isId ? 'Watermark & PDF → Gambar HD' : 'Watermark & PDF → HD Images'}
                  </h3>
                  <p className="text-xs text-zinc-500">
                    {isId ? 'Beri cap teks atau ekspor tiap halaman jadi PNG/JPG' : 'Stamp text across pages or export 2x PNG/JPG ZIP'}
                  </p>
                </div>
              </div>
              <button
                onClick={async () => {
                  const s = await createSamplePdf('report');
                  setWmBytes(s);
                  setWmName('Sample-Report');
                  notify(isId ? 'PDF contoh siap diproses!' : 'Sample PDF loaded!');
                }}
                className="text-xs text-emerald-500 hover:underline cursor-pointer"
              >
                {isId ? ' Contoh' : 'Sample'}
              </button>
            </div>

            <label className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-emerald-500 text-xs font-medium cursor-pointer">
              <Upload className="w-4 h-4 text-emerald-500" />
              {wmBytes ? `${wmName}.pdf ready` : isId ? 'Pilih File PDF' : 'Select PDF File'}
              <input
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    setWmBytes(new Uint8Array(await f.arrayBuffer()));
                    setWmName(f.name.replace(/\.pdf$/i, ''));
                  }
                }}
              />
            </label>

            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                value={wmText}
                onChange={(e) => setWmText(e.target.value)}
                placeholder="CONFIDENTIAL"
                className="col-span-2 px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs font-mono"
              />
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                <input
                  type="color"
                  value={wmColor}
                  onChange={(e) => setWmColor(e.target.value)}
                  className="w-6 h-6 bg-transparent cursor-pointer"
                />
                <label className="text-[11px] flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={wmDiagonal}
                    onChange={(e) => setWmDiagonal(e.target.checked)}
                    className="accent-emerald-500"
                  />
                  Diag
                </label>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="text-zinc-500 shrink-0">Opacity:</span>
              <input
                type="range"
                min={0.08}
                max={0.65}
                step={0.02}
                value={wmOpacity}
                onChange={(e) => setWmOpacity(parseFloat(e.target.value))}
                className="w-full accent-emerald-500"
              />
              <span className="font-mono w-10 text-right">{Math.round(wmOpacity * 100)}%</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                onClick={handleWatermarkDownload}
                disabled={!wmBytes || busy}
                className="py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-zinc-950 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Stamp className="w-3.5 h-3.5" />
                {isId ? 'Unduh Watermark' : 'Stamp PDF'}
              </button>

              <div className="flex gap-1">
                <select
                  value={pdfImgFormat}
                  onChange={(e) => setPdfImgFormat(e.target.value as 'png' | 'jpeg')}
                  className="px-2 rounded-l-xl bg-zinc-100 dark:bg-zinc-800 text-xs font-mono border-r border-zinc-300 dark:border-zinc-700"
                >
                  <option value="png">PNG</option>
                  <option value="jpeg">JPG</option>
                </select>
                <button
                  onClick={handlePdfToImages}
                  disabled={!wmBytes || busy}
                  className="flex-1 py-2.5 px-2.5 rounded-r-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 disabled:opacity-40 font-semibold text-xs flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Archive className="w-3.5 h-3.5" />
                  ZIP
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
