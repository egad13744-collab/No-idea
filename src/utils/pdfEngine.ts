import {
  PDFDocument,
  StandardFonts,
  rgb,
  degrees,
} from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import JSZip from 'jszip';
import { hexToRgbNormalized, loadImageElement, fileToDataUrl } from './fileHelpers';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export interface PdfPagePreview {
  pageIndex: number; // 0-based original page index
  pageNumber: number; // 1-based display number
  dataUrl: string;
  width: number;
  height: number;
  rotation: number; // extra rotation in degrees (0, 90, 180, 270)
  selected: boolean;
}

export async function getPdfPageCount(bytes: Uint8Array): Promise<number> {
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  return doc.getPageCount();
}

export async function renderPdfThumbnails(
  bytes: Uint8Array,
  scale = 0.45
): Promise<PdfPagePreview[]> {
  // Always pass a fresh copy because pdf.js transfers the buffer to its worker
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);

  const loadingTask = pdfjsLib.getDocument({ data: copy });
  const pdf = await loadingTask.promise;
  const previews: PdfPagePreview[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = Math.max(1, Math.floor(viewport.width));
    canvas.height = Math.max(1, Math.floor(viewport.height));

    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, viewport }).promise;
    }

    previews.push({
      pageIndex: i - 1,
      pageNumber: i,
      dataUrl: canvas.toDataURL('image/jpeg', 0.85),
      width: viewport.width / scale,
      height: viewport.height / scale,
      rotation: 0,
      selected: true,
    });
  }

  return previews;
}

export async function renderSinglePdfPage(
  bytes: Uint8Array,
  pageIndex: number,
  scale = 1.35
): Promise<{ dataUrl: string; width: number; height: number }> {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);

  const pdf = await pdfjsLib.getDocument({ data: copy }).promise;
  const safePage = Math.min(Math.max(1, pageIndex + 1), pdf.numPages);
  const page = await pdf.getPage(safePage);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport }).promise;
  }

  return {
    dataUrl: canvas.toDataURL('image/png'),
    width: viewport.width / scale,
    height: viewport.height / scale,
  };
}

export async function mergePdfBuffers(buffers: Uint8Array[]): Promise<Uint8Array> {
  const merged = await PDFDocument.create();
  for (const buf of buffers) {
    const src = await PDFDocument.load(buf, { ignoreEncryption: true });
    const copied = await merged.copyPages(src, src.getPageIndices());
    copied.forEach((p) => merged.addPage(p));
  }
  return merged.save();
}

export async function extractAndRotatePages(
  bytes: Uint8Array,
  specs: Array<{ pageIndex: number; rotation: number }>
): Promise<Uint8Array> {
  const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const out = await PDFDocument.create();

  for (const spec of specs) {
    const [copiedPage] = await out.copyPages(src, [spec.pageIndex]);
    if (spec.rotation !== 0) {
      const current = copiedPage.getRotation().angle;
      copiedPage.setRotation(degrees((current + spec.rotation) % 360));
    }
    out.addPage(copiedPage);
  }

  return out.save();
}

export async function splitEachPageToZip(
  bytes: Uint8Array,
  specs: Array<{ pageIndex: number; rotation: number }>,
  baseName: string
): Promise<Blob> {
  const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const zip = new JSZip();

  for (let i = 0; i < specs.length; i++) {
    const spec = specs[i];
    const single = await PDFDocument.create();
    const [copiedPage] = await single.copyPages(src, [spec.pageIndex]);
    if (spec.rotation !== 0) {
      const current = copiedPage.getRotation().angle;
      copiedPage.setRotation(degrees((current + spec.rotation) % 360));
    }
    single.addPage(copiedPage);
    const saved = await single.save();
    zip.file(`${baseName}-page-${spec.pageIndex + 1}.pdf`, saved);
  }

  return zip.generateAsync({ type: 'blob' });
}

export interface SignaturePlacement {
  pageIndex: number;
  xRatio: number; // 0..1 from left
  yRatio: number; // 0..1 from top in visual coords
  widthRatio: number; // 0..1 of page width
  signaturePngDataUrl: string;
  stampText?: string;
}

export async function embedSignatureOnPdf(
  bytes: Uint8Array,
  placement: SignaturePlacement
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const pages = doc.getPages();
  const page = pages[placement.pageIndex];
  if (!page) throw new Error('Invalid page index');

  const { width: pageW, height: pageH } = page.getSize();
  const pngImage = await doc.embedPng(placement.signaturePngDataUrl);
  const aspect = pngImage.height / pngImage.width;

  const drawW = pageW * placement.widthRatio;
  const drawH = drawW * aspect;
  const pdfX = pageW * placement.xRatio;
  // Convert top-origin visual Y to bottom-origin PDF Y
  const pdfY = pageH - pageH * placement.yRatio - drawH;

  page.drawImage(pngImage, {
    x: Math.max(0, Math.min(pageW - drawW, pdfX)),
    y: Math.max(0, Math.min(pageH - drawH, pdfY)),
    width: drawW,
    height: drawH,
  });

  if (placement.stampText && placement.stampText.trim()) {
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const fontSize = Math.max(8, Math.min(11, pageW * 0.016));
    page.drawText(placement.stampText.trim(), {
      x: Math.max(4, Math.min(pageW - drawW, pdfX)),
      y: Math.max(6, pdfY - fontSize - 3),
      size: fontSize,
      font,
      color: rgb(0.18, 0.22, 0.28),
    });
  }

  return doc.save();
}

export async function addWatermarkToPdf(
  bytes: Uint8Array,
  text: string,
  options: { opacity: number; colorHex: string; diagonal: boolean; fontSize: number }
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const c = hexToRgbNormalized(options.colorHex);

  for (const page of doc.getPages()) {
    const { width, height } = page.getSize();
    const size = options.fontSize;
    const textWidth = font.widthOfTextAtSize(text, size);

    if (options.diagonal) {
      page.drawText(text, {
        x: width / 2 - textWidth * 0.35,
        y: height / 2 - textWidth * 0.2,
        size,
        font,
        color: rgb(c.r, c.g, c.b),
        opacity: options.opacity,
        rotate: degrees(38),
      });
    } else {
      page.drawText(text, {
        x: Math.max(20, (width - textWidth) / 2),
        y: 28,
        size: Math.min(size, 24),
        font,
        color: rgb(c.r, c.g, c.b),
        opacity: options.opacity,
      });
    }
  }

  return doc.save();
}

export async function convertImagesToPdf(
  files: File[],
  mode: 'a4' | 'fit' = 'a4'
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();

  for (const file of files) {
    const dataUrl = await fileToDataUrl(file);
    const imgEl = await loadImageElement(dataUrl);

    // Render onto canvas to normalize WebP/PNG/JPEG cleanly
    const canvas = document.createElement('canvas');
    canvas.width = imgEl.naturalWidth || imgEl.width;
    canvas.height = imgEl.naturalHeight || imgEl.height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(imgEl, 0, 0);
    }

    const jpgDataUrl = canvas.toDataURL('image/jpeg', 0.92);
    const embedded = await doc.embedJpg(jpgDataUrl);

    if (mode === 'fit') {
      const page = doc.addPage([embedded.width, embedded.height]);
      page.drawImage(embedded, {
        x: 0,
        y: 0,
        width: embedded.width,
        height: embedded.height,
      });
    } else {
      const a4W = 595.28;
      const a4H = 841.89;
      const isLandscape = embedded.width > embedded.height * 1.15;
      const pageW = isLandscape ? a4H : a4W;
      const pageH = isLandscape ? a4W : a4H;
      const margin = 28;
      const availW = pageW - margin * 2;
      const availH = pageH - margin * 2;
      const scale = Math.min(availW / embedded.width, availH / embedded.height);
      const drawW = embedded.width * scale;
      const drawH = embedded.height * scale;

      const page = doc.addPage([pageW, pageH]);
      page.drawImage(embedded, {
        x: (pageW - drawW) / 2,
        y: (pageH - drawH) / 2,
        width: drawW,
        height: drawH,
      });
    }
  }

  return doc.save();
}

export async function exportPdfPagesAsImagesZip(
  bytes: Uint8Array,
  format: 'png' | 'jpeg' = 'png',
  scale = 2.0,
  baseName = 'document'
): Promise<Blob> {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);

  const pdf = await pdfjsLib.getDocument({ data: copy }).promise;
  const zip = new JSZip();

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, viewport }).promise;
    }

    const mime = format === 'png' ? 'image/png' : 'image/jpeg';
    const ext = format === 'png' ? 'png' : 'jpg';
    const blob: Blob = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b || new Blob()), mime, 0.92)
    );
    zip.file(`${baseName}-page-${String(i).padStart(2, '0')}.${ext}`, blob);
  }

  return zip.generateAsync({ type: 'blob' });
}

export async function createSamplePdf(variant: 'contract' | 'report'): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontReg = await doc.embedFont(StandardFonts.Helvetica);

  const pagesContent =
    variant === 'contract'
      ? [
          {
            title: 'FREELANCE SERVICE AGREEMENT',
            subtitle: 'Sample Multi-Page Document · Generated Locally by No-Idea',
            lines: [
              '1. SCOPE OF WORK',
              'The Contractor agrees to design, build, and deliver open-source web utilities',
              'with zero paywalls, zero hidden subscriptions, and 100% client-side privacy.',
              '',
              '2. TIMELINE & DELIVERABLES',
              '- Milestone 1: Architecture & Local Browser Engine (Completed)',
              '- Milestone 2: PDF Studio, QR Generator, Invoice & Mockup Suite',
              '- Milestone 3: Open-Source Release under MIT License',
              '',
              '3. INTELLECTUAL PROPERTY',
              'All source code remains freely inspectable, modifiable, and self-hostable.',
            ],
            showSignBox: true,
          },
          {
            title: 'SCHEDULE A - TECHNICAL SPECIFICATIONS',
            subtitle: 'Page 2 of 3 · Client-Side Processing Verification',
            lines: [
              'PRIVACY GUARANTEE:',
              'Unlike commercial cloud PDF portals that upload sensitive contracts to',
              'third-party servers and charge $15-$20/month to unlock e-signatures,',
              'every byte of this PDF stays inside your own browser memory.',
              '',
              'Try rotating, splitting, watermarking, or signing Page 1 or Page 3!',
            ],
            showSignBox: false,
          },
          {
            title: 'AUTHORIZATION & SIGNATURE PAGE',
            subtitle: 'Page 3 of 3 · Ready for E-Signature Placement',
            lines: [
              'By signing below, both parties acknowledge and accept the terms outlined',
              'in this sample agreement.',
              '',
              'Client Representative: Alex Rivera',
              'Contractor: Egandika',
              '',
              'Place your digital signature anywhere in the box below:',
            ],
            showSignBox: true,
          },
        ]
      : [
          {
            title: 'Q4 PRODUCT BENCHMARK BRIEF',
            subtitle: 'Sample Deck · Merge or Extract Pages Instantly',
            lines: [
              'EXECUTIVE SUMMARY',
              '- Zero server latency because files never leave the device.',
              '- Unlimited PDF merges, splits, and high-DPI page renders.',
              '- Built for students, freelancers, and developers worldwide.',
            ],
            showSignBox: false,
          },
          {
            title: 'APPENDIX - COST COMPARISON',
            subtitle: 'Page 2 of 2 · SaaS Subscriptions Saved',
            lines: [
              '- PDF Editor & Signer: $19/mo -> $0',
              '- Dynamic QR Generator: $15/mo -> $0',
              '- Screenshot Beautifier: $10/mo -> $0',
              '- Invoice PDF Builder: $15/mo -> $0',
              '- Batch Image Compressor: $9/mo -> $0',
            ],
            showSignBox: false,
          },
        ];

  pagesContent.forEach((item, idx) => {
    const page = doc.addPage([595.28, 841.89]);
    const { width, height } = page.getSize();

    // Header accent bar
    page.drawRectangle({
      x: 0,
      y: height - 12,
      width,
      height: 12,
      color: variant === 'contract' ? rgb(0.06, 0.72, 0.5) : rgb(0.15, 0.39, 0.92),
    });

    page.drawText(item.title, {
      x: 52,
      y: height - 68,
      size: 20,
      font: fontBold,
      color: rgb(0.08, 0.1, 0.14),
    });

    page.drawText(item.subtitle, {
      x: 52,
      y: height - 90,
      size: 10.5,
      font: fontReg,
      color: rgb(0.42, 0.46, 0.52),
    });

    page.drawLine({
      start: { x: 52, y: height - 106 },
      end: { x: width - 52, y: height - 106 },
      thickness: 1,
      color: rgb(0.86, 0.88, 0.91),
    });

    let cursorY = height - 142;
    for (const line of item.lines) {
      if (!line) {
        cursorY -= 14;
        continue;
      }
      const isHeading = line === line.toUpperCase() && line.length > 4;
      page.drawText(line, {
        x: 52,
        y: cursorY,
        size: isHeading ? 11.5 : 11,
        font: isHeading ? fontBold : fontReg,
        color: isHeading ? rgb(0.1, 0.12, 0.16) : rgb(0.22, 0.25, 0.3),
      });
      cursorY -= 22;
    }

    if (item.showSignBox) {
      page.drawRectangle({
        x: 52,
        y: 120,
        width: 250,
        height: 92,
        borderColor: rgb(0.65, 0.7, 0.78),
        borderWidth: 1,
        color: rgb(0.97, 0.98, 0.99),
      });
      page.drawText('Authorized Signature Here', {
        x: 64,
        y: 194,
        size: 9.5,
        font: fontReg,
        color: rgb(0.48, 0.52, 0.58),
      });
    }

    page.drawText(`Page ${idx + 1} of ${pagesContent.length}  •  Generated locally with No-Idea`, {
      x: 52,
      y: 36,
      size: 9,
      font: fontReg,
      color: rgb(0.55, 0.58, 0.64),
    });
  });

  return doc.save();
}
