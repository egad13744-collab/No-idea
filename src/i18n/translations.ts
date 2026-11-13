export type Lang = 'en' | 'id';

export type ToolId = 'overview' | 'pdf' | 'qr' | 'screenshot' | 'invoice' | 'image';

export const TRANSLATIONS = {
  en: {
    brandSubtitle: 'Free Forever Utility Suite',
    privacyBadge: '100% Local · 0 Bytes Uploaded',
    searchPlaceholder: 'Filter tools (PDF, QR, Invoice, Compress, Sign...)',
    savedPerMonth: 'Replaces ~$68/mo of SaaS paywalls',
    nav: {
      overview: 'All Tools',
      pdf: 'PDF Studio',
      qr: 'QR Code Pro',
      screenshot: 'Screenshot Mockup',
      invoice: 'Invoice PDF Maker',
      image: 'Batch Image & EXIF',
    },
    hero: {
      eyebrow: 'OPEN SOURCE · MIT LICENSE · ZERO PAYWALLS',
      title: 'Tools people get charged subscriptions for — completely free.',
      subtitle:
        'No watermarks, no "2 free tasks per day" limits, no expiring QR links, and no cloud uploads. Everything runs locally inside your browser.',
      openGithub: 'Star on GitHub',
      createdBy: 'Created by',
    },
    toolCards: {
      pdf: {
        title: 'PDF Studio (Merge, Split, Sign & Convert)',
        desc: 'Combine PDFs, reorder/rotate/extract pages visually, draw & place signatures, add watermarks, or convert images ↔ PDF.',
        replaces: 'Replaces $12–$20/mo PDF & eSign paywalls',
        usualPrice: '$19/mo',
      },
      qr: {
        title: 'Never-Expiring Pro QR Studio',
        desc: 'Generate static custom QR codes with center logos, rounded dots, Wi-Fi/vCard/WhatsApp presets, and crisp SVG + 2048px PNG exports.',
        replaces: 'Replaces $15/mo "expired trial" QR traps',
        usualPrice: '$15/mo',
      },
      screenshot: {
        title: 'Screenshot Beautifier & Mockup',
        desc: 'Turn raw screenshots into clean macOS/Browser mockups with studio gradients, custom shadows, aspect presets, and 2x Retina export.',
        replaces: 'Replaces $10/mo watermarked mockup apps',
        usualPrice: '$10/mo',
      },
      invoice: {
        title: 'Instant PDF Invoice & Receipt Maker',
        desc: 'Create professional multi-currency invoices with your logo, tax/discounts, payment QR code, and 1-click vector PDF export.',
        replaces: 'Replaces $15/mo invoice quota limits',
        usualPrice: '$15/mo',
      },
      image: {
        title: 'Batch Image Optimizer & EXIF Scrubber',
        desc: 'Compress & convert unlimited PNG, JPG, and WebP files at once, strip GPS/camera EXIF metadata, and download all as a ZIP.',
        replaces: 'Replaces $9/mo batch size & file caps',
        usualPrice: '$9/mo',
      },
    },
    common: {
      freeForever: '$0 FOREVER',
      loadSample: 'Load Sample',
      download: 'Download',
      reset: 'Reset',
      copied: 'Copied!',
      copy: 'Copy',
      processing: 'Processing locally...',
      openTool: 'Open Studio',
      authorLabel: 'Maintainer',
      discordLabel: 'Discord',
    },
  },
  id: {
    brandSubtitle: 'Suite Tools Gratis Selamanya',
    privacyBadge: '100% Lokal · Tanpa Upload Server',
    searchPlaceholder: 'Cari tools (PDF, QR, Invoice, Kompres Foto, Tanda Tangan...)',
    savedPerMonth: 'Hemat ~$68/bln dari langganan berbayar',
    nav: {
      overview: 'Semua Tools',
      pdf: 'PDF Studio',
      qr: 'QR Code Pro',
      screenshot: 'Mockup Screenshot',
      invoice: 'Pembuat Invoice PDF',
      image: 'Kompres Foto & EXIF',
    },
    hero: {
      eyebrow: 'OPEN SOURCE · LISENSI MIT · TANPA PAYWALL',
      title: 'Tools harian yang biasanya berbayar — di sini 100% gratis.',
      subtitle:
        'Tanpa watermark, tanpa batas "2 file per hari", tanpa jebakan QR expired 14 hari, dan tanpa upload file ke server luar. Semua diproses langsung di browser kamu.',
      openGithub: 'Beri Star di GitHub',
      createdBy: 'Dibuat oleh',
    },
    toolCards: {
      pdf: {
        title: 'PDF Studio (Gabung, Pisah, Tanda Tangan & Konversi)',
        desc: 'Gabungkan PDF, urutkan/putar/ambil halaman secara visual, tanda tangan digital langsung di PDF, watermark, dan konversi Gambar ↔ PDF.',
        replaces: 'Pengganti langganan PDF & eSign $12–$20/bln',
        usualPrice: '$19/bln',
      },
      qr: {
        title: 'QR Code Pro Tanpa Masa Aktif (Permanen)',
        desc: 'Buat QR code kustom dengan logo di tengah, titik bulat, preset Wi-Fi/vCard/WhatsApp, dan download vektor SVG + PNG 2048px tajam.',
        replaces: 'Pengganti jebakan QR berbayar $15/bln',
        usualPrice: '$15/bln',
      },
      screenshot: {
        title: 'Screenshot Beautifier & Mockup Studio',
        desc: 'Ubah tangkapan layar biasa jadi mockup jendela macOS/Browser rapi dengan background gradasi, bayangan halus, dan ekspor 2x Retina tanpa watermark.',
        replaces: 'Pengganti aplikasi mockup berbayar $10/bln',
        usualPrice: '$10/bln',
      },
      invoice: {
        title: 'Pembuat Invoice & Kwitansi PDF Instan',
        desc: 'Buat invoice profesional berbagai mata uang (Rp IDR, USD, dll) lengkap dengan logo, pajak/diskon, QR pembayaran, dan ekspor PDF tajam.',
        replaces: 'Pengganti web invoice berkuota $15/bln',
        usualPrice: '$15/bln',
      },
      image: {
        title: 'Kompresor Gambar Massal & Pembersih EXIF',
        desc: 'Kompres & ubah format banyak foto PNG, JPG, WebP sekaligus tanpa batas kuota, hapus metadata lokasi GPS/EXIF, dan unduh sebagai ZIP.',
        replaces: 'Pengganti limit kompresi berbayar $9/bln',
        usualPrice: '$9/bln',
      },
    },
    common: {
      freeForever: 'GRATIS SELAMANYA',
      loadSample: 'Coba Contoh',
      download: 'Unduh',
      reset: 'Reset',
      copied: 'Tersalin!',
      copy: 'Salin',
      processing: 'Memproses di browser...',
      openTool: 'Buka Tool',
      authorLabel: 'Pembuat',
      discordLabel: 'Discord',
    },
  },
} as const;
