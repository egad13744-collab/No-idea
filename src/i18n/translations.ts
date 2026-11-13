export type Lang = 'en' | 'id';

export type ToolId = 'overview' | 'pdf' | 'qr' | 'screenshot' | 'invoice' | 'image';

export const TRANSLATIONS = {
  en: {
    brandSubtitle: 'Local Web Utilities',
    privacyBadge: '100% Local · No Uploads',
    searchPlaceholder: 'Search tools (PDF, QR, Invoice, Compress, Sign...)',
    savedPerMonth: 'Free alternative to ~$68/mo of paid tools',
    nav: {
      overview: 'All Tools',
      pdf: 'PDF Tools',
      qr: 'QR Generator',
      screenshot: 'Screenshot Frame',
      invoice: 'Invoice Maker',
      image: 'Image Compressor',
    },
    hero: {
      eyebrow: 'OPEN SOURCE · MIT LICENSE',
      title: 'Simple everyday tools that should have been free in the first place.',
      subtitle:
        'No watermarks, no daily file limits, no expiring QR links, and no server uploads. Everything runs locally inside your browser.',
      openGithub: 'GitHub Repo',
      createdBy: 'Built by',
    },
    toolCards: {
      pdf: {
        title: 'PDF Tools (Merge, Split, Sign & Convert)',
        desc: 'Merge PDFs, rotate or extract pages, draw and place signatures, add watermarks, or convert images to PDF.',
        replaces: 'Alternative to paid PDF & eSign tools',
        usualPrice: '$19/mo',
      },
      qr: {
        title: 'Static QR Code Generator',
        desc: 'Create permanent QR codes with center logos, custom dot styles, Wi-Fi/vCard/WhatsApp presets, SVG and 2048px PNG export.',
        replaces: 'No 14-day trial expiration',
        usualPrice: '$15/mo',
      },
      screenshot: {
        title: 'Screenshot Mockup & Frame',
        desc: 'Wrap raw screenshots in clean macOS or browser frames with custom backgrounds, shadows, and 2x PNG export.',
        replaces: 'No corner watermarks',
        usualPrice: '$10/mo',
      },
      invoice: {
        title: 'PDF Invoice & Receipt Maker',
        desc: 'Write multi-currency invoices with your logo, tax/discounts, payment QR code, and direct PDF download.',
        replaces: 'No monthly invoice quota',
        usualPrice: '$15/mo',
      },
      image: {
        title: 'Batch Image Compressor & EXIF Cleaner',
        desc: 'Compress and convert PNG, JPG, and WebP images in bulk, strip EXIF/GPS metadata, and download as a ZIP.',
        replaces: 'No 20-file or 5MB limits',
        usualPrice: '$9/mo',
      },
    },
    common: {
      freeForever: 'FREE',
      loadSample: 'Try Sample',
      download: 'Download',
      reset: 'Reset',
      copied: 'Copied!',
      copy: 'Copy',
      processing: 'Processing...',
      openTool: 'Open',
      authorLabel: 'Author',
      discordLabel: 'Discord',
    },
  },
  id: {
    brandSubtitle: 'Web Tools Lokal',
    privacyBadge: '100% Lokal · Tanpa Upload',
    searchPlaceholder: 'Cari tools (PDF, QR, Invoice, Kompres Foto, Tanda Tangan...)',
    savedPerMonth: 'Alternatif gratis tools berbayar',
    nav: {
      overview: 'Semua Tools',
      pdf: 'PDF Tools',
      qr: 'QR Generator',
      screenshot: 'Frame Screenshot',
      invoice: 'Buat Invoice',
      image: 'Kompres Gambar',
    },
    hero: {
      eyebrow: 'OPEN SOURCE · LISENSI MIT',
      title: 'Kumpulan tools harian simpel yang dari awal memang seharusnya gratis.',
      subtitle:
        'Tanpa watermark, tanpa kuota harian, tanpa QR expired 14 hari, dan tanpa upload file ke server. Semua jalan langsung di browser kamu.',
      openGithub: 'GitHub Repo',
      createdBy: 'Dibuat oleh',
    },
    toolCards: {
      pdf: {
        title: 'PDF Tools (Gabung, Pisah, Tanda Tangan & Konversi)',
        desc: 'Gabungkan PDF, putar atau ambil halaman tertentu, tanda tangan langsung di PDF, pasang watermark, dan ubah gambar ke PDF.',
        replaces: 'Tanpa kuota harian & tanpa watermark',
        usualPrice: '$19/bln',
      },
      qr: {
        title: 'Generator QR Code Permanen',
        desc: 'Buat QR code statis dengan logo di tengah, kustomisasi warna/titik, preset Wi-Fi/vCard/WhatsApp, ekspor SVG & PNG 2048px.',
        replaces: 'Aktif selamanya tanpa langganan',
        usualPrice: '$15/bln',
      },
      screenshot: {
        title: 'Frame & Mockup Screenshot',
        desc: 'Rapikan screenshot dengan bingkai macOS atau Browser, latar gradasi, bayangan halus, dan ekspor 2x PNG tanpa watermark.',
        replaces: 'Bisa langsung paste (Ctrl+V)',
        usualPrice: '$10/bln',
      },
      invoice: {
        title: 'Pembuat Invoice & Nota PDF',
        desc: 'Buat invoice berbagai mata uang (IDR, USD, dll) lengkap dengan logo, pajak/diskon, QR pembayaran, dan unduh PDF.',
        replaces: 'Tanpa perlu daftar akun',
        usualPrice: '$15/bln',
      },
      image: {
        title: 'Kompres Gambar Massal & Hapus EXIF',
        desc: 'Kompres dan ubah format banyak foto PNG, JPG, WebP sekaligus, bersihkan data lokasi GPS/EXIF, lalu unduh jadi ZIP.',
        replaces: 'Tanpa batas ukuran atau jumlah foto',
        usualPrice: '$9/bln',
      },
    },
    common: {
      freeForever: 'GRATIS',
      loadSample: 'Coba Contoh',
      download: 'Unduh',
      reset: 'Reset',
      copied: 'Tersalin!',
      copy: 'Salin',
      processing: 'Memproses...',
      openTool: 'Buka',
      authorLabel: 'Pembuat',
      discordLabel: 'Discord',
    },
  },
} as const;
