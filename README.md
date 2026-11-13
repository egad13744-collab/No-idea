<div align="center">

# No-Idea

**"No idea why basic everyday tools require a $15/month subscription."**  
*100% Free, Local-First, Open-Source Alternatives to Paywalled Web Utilities.*

[![License: MIT](https://img.shields.io/badge/License-MIT-10b981.svg?style=flat-square)](./LICENSE)
[![Privacy: 100% Client-Side](https://img.shields.io/badge/Privacy-0_Bytes_Uploaded-0ea5e9?style=flat-square)](#privacy-by-architecture)
[![Author: Egandika](https://img.shields.io/badge/Author-Egandika-18181b?style=flat-square&logo=github)](https://github.com/egad13744-collab)
[![Discord: @egandika](https://img.shields.io/badge/Discord-%40egandika-5865F2?style=flat-square&logo=discord&logoColor=white)](#author--contact)

**English** · [Bahasa Indonesia](#-tentang-project-bahasa-indonesia) · [Features](#what-paywalls-does-this-replace) · [Quickstart](#getting-started) · [Contributing](./CONTRIBUTING.md)

</div>

---

## Why `No-Idea` Exists

Across the web, simple 10-second tasks — merging two PDFs, placing a signature on a contract, downloading a QR code that doesn't expire after 14 days, framing a screenshot without a watermark, or generating a clean invoice — have been locked behind **$10–$20/month subscriptions**, daily task quotas, and cloud file uploads.

**No-Idea** bundles **5 studio-grade everyday utilities** into a single fast, zero-backend web app that runs **100% inside your browser**. Disconnect your Wi-Fi after opening the page and every tool continues to work.

---

## What Paywalls Does This Replace?

| Studio Tool | What Commercial Sites Do | Typical Paywall | **No-Idea (Open Source)** |
| :--- | :--- | :---: | :---: |
| **1. PDF Studio** | Uploads private contracts to cloud servers; limits to 2 tasks/day or locks e-signing | ~$19 / mo | **$0 · Unlimited Merge, Split, Rotate, e-Sign, Watermark & PDF↔Image** |
| **2. Never-Expiring QR Pro** | Uses redirect links that disable your printed QR code after a 14-day "free trial" | ~$15 / mo | **$0 · 100% Static QR, Custom Dots/Colors, Center Logo, 2048px PNG + Vector SVG** |
| **3. Screenshot Mockup Studio** | Stamps watermarks in the corner or locks 2x Retina exports | ~$10 / mo | **$0 · macOS/Browser Frames, Gradients, `Ctrl+V` Paste & 2x Retina Export** |
| **4. Invoice & Receipt PDF Maker** | Caps you at 3 invoices or requires account registration | ~$15 / mo | **$0 · Multi-Currency (`IDR`, `USD`, `EUR`, etc.), Logo, Tax/Discount & Payment QR** |
| **5. Batch Image & EXIF Cleaner** | Caps at 20 images or 5 MB per file; uploads photos with GPS metadata | ~$9 / mo | **$0 · Unlimited WebP/JPG/PNG Compression, Auto EXIF/GPS Strip & `.ZIP` Export** |
| **Total Saved** | | **~$68 / month** | **$0.00 Forever (MIT)** |

---

## Included Studios

### 1. PDF Studio (`pdf-lib` + `pdf.js`)
- **Merge PDFs**: Combine unlimited PDF files, reorder with 1 click, and export immediately.
- **Visual Split, Rotate & Extract**: Preview thumbnails of every page, rotate individual pages `90°`, extract selected pages into a single PDF, or split them into separate PDFs bundled in a `.zip`.
- **Sign & Stamp PDF**: Draw a smooth ink signature (or type a script signature), click anywhere on the live PDF preview to place and resize it, add an optional date/verification stamp, and download.
- **Images ↔ PDF & Watermark**: Compile JPG/PNG/WebP scans into A4 or exact-fit PDFs, export PDF pages to 2x Retina PNG/JPG archives, or stamp custom diagonal watermarks.

### 2. Never-Expiring Pro QR Studio
- **5 Smart Payloads**: Website URL, **Wi-Fi Auto-Connect**, **WhatsApp Direct Chat**, **vCard Contact**, and Plain Text.
- **Pro Branding Unlocked**: Soft rounded modules, circular dots, or crisp squares; gradient foregrounds; transparent backgrounds; **custom center logo upload** (automatically switches Reed-Solomon error correction to `Level H` 30% for reliable scanning); and crisp **Vector SVG** + **2048px PNG** downloads.

### 3. Screenshot Beautifier & Mockup Studio
- Paste directly from your clipboard (`Ctrl+V` / `⌘V`) or upload any image.
- Choose **macOS Dark**, **macOS Light**, **Browser URL Bar**, or **Frameless** styles over curated studio gradients or transparent backgrounds.
- Export clean **2x Retina PNGs** with zero forced watermarks.

### 4. Instant PDF Invoice & Receipt Maker
- Side-by-side live A4 paper preview + true vector PDF generation.
- Supports `IDR (Rp)`, `USD ($)`, `EUR`, `SGD`, `MYR`, and `GBP` with automatic line-item math, discounts, customizable tax labels (`PPN`, `VAT`, `GST`), local browser profile saving, and an **embedded scannable Payment QR code**.

### 5. Batch Image Optimizer & EXIF Privacy Scrubber
- Batch convert & compress unlimited `PNG`, `JPEG`, and `WebP` files simultaneously.
- Automatically strips hidden camera `EXIF` and `GPS` location metadata during local canvas re-encoding, and exports all optimized images in a single `.zip`.

---

## 🇮🇩 Tentang Project (Bahasa Indonesia)

**No-Idea** adalah kumpulan tools harian *open-source* yang biasanya dikunci di balik langganan berbayar (*paywall*), batas kuota harian, atau *watermark* — kini **100% gratis selamanya**, tanpa login, dan berjalan **100% lokal di browser kamu** (file sama sekali tidak pernah di-upload ke server mana pun).

Aplikasi ini mendukung **2 Bahasa (`ID` Bahasa Indonesia & `EN` English)** serta **Dark / Light Mode** langsung dari bagian atas layar.

---

## Privacy by Architecture

- **Zero Backend, Zero Analytics, Zero Cloud Uploads**: Every document, signature, invoice, and photo is processed strictly in your device's RAM using Web APIs, HTML5 Canvas, `pdf-lib`, and `pdf.js`.
- **Verifiable**: Open your browser's DevTools → **Network** tab while merging a PDF, signing a contract, or compressing photos — **0 bytes** leave your machine.

---

## Getting Started

### Prerequisites
- **Node.js** `v18+` (recommended `v20+` or `v22+`)
- **npm** `v9+`

### Run Locally

```bash
# 1. Clone the repository
git clone https://github.com/egad13744-collab/No-idea.git
cd No-idea

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

### Build for Production / Static Hosting

```bash
npm run build
npm run preview
```

The static output in `dist/` can be hosted for free on **GitHub Pages** (workflow pre-configured in `.github/workflows/deploy.yml`), Cloudflare Pages, Vercel, or Netlify — or opened locally offline.

---

## Tech Stack

- **UI & State**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 (Dark & Light Studio Theme)
- **PDF Manipulation & Vector Generation**: `pdf-lib` + `pdfjs-dist`
- **QR Matrix Engine**: `qrcode` (Custom Canvas + Vector SVG renderer)
- **Archive Bundling**: `jszip`

---

## Author & Contact

Built and maintained for the open-source community by:

- **Name**: **Egandika**
- **GitHub**: [@egad13744-collab](https://github.com/egad13744-collab)
- **Discord USN**: **`@egandika`**
- **Website**: [zepphy.wisp.uno](https://zepphy.wisp.uno)

Have an idea for another overpriced everyday tool we should make free & open-source? Open an issue, submit a PR (see [CONTRIBUTING.md](./CONTRIBUTING.md)), or reach out on Discord!

---

## License

Released under the [MIT License](./LICENSE) © 2026 **Egandika**. Free for personal and commercial use forever.
