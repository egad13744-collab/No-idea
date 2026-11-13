# No-Idea

Awalnya repo ini cuma dinamain `No-idea` karena memang belum kepikiran mau bikin apa. Akhirnya dipakai buat nampung kumpulan web tools harian yang di internet sering dipasangi paywall, watermark, atau kuota harian padahal harusnya bisa jalan gratis langsung di browser.

Semua proses file (PDF, QR, gambar, invoice) dieksekusi lokal di sisi client (browser). Tidak ada backend dan tidak ada file yang dikirim ke server mana pun.

## Fitur yang Tersedia

1. **PDF Tools**
   - Merge / gabung banyak file PDF sekaligus
   - Split, putar halaman (`90°`), dan ekstrak halaman tertentu jadi PDF baru atau `.zip`
   - Tanda tangan langsung di atas halaman PDF (bisa coret sendiri atau ketik) + stempel tanggal
   - Ubah kumpulan gambar (`JPG/PNG/WebP`) jadi PDF, ekspor halaman PDF ke gambar HD, dan tambah watermark

2. **Static QR Generator**
   - Buat QR code statis yang tidak bakal mati/expired (beda sama layanan dynamic QR trial 14 hari)
   - Preset untuk Link URL, Wi-Fi, WhatsApp, vCard, dan teks biasa
   - Kustomisasi warna/gradasi, bentuk titik, pasang logo di tengah, dan download format `PNG` (2048px) atau vektor `SVG`

3. **Screenshot Frame / Mockup**
   - Paste langsung dari clipboard (`Ctrl+V`) atau pilih file gambar
   - Pilihan frame macOS (Dark/Light), Browser URL bar, atau polos dengan background gradasi dan export `2x PNG` tanpa watermark

4. **Invoice PDF Maker**
   - Editor invoice dengan live preview ukuran A4 dan export langsung ke file PDF
   - Support mata uang `IDR (Rp)`, `USD`, `EUR`, `SGD`, `MYR`, `GBP`, hitung otomatis pajak (`PPN`/`VAT`) & diskon, simpan data pengirim di `localStorage`, plus QR pembayaran

5. **Batch Image Compressor & EXIF Cleaner**
   - Kompres dan convert banyak gambar sekaligus ke `WebP`, `JPEG`, atau `PNG`
   - Otomatis menghapus metadata kamera & lokasi GPS (`EXIF`) saat diproses ulang di canvas, hasil bisa diunduh satuan atau langsung `.zip`

Tersedia toggle bahasa **Indonesia (`ID`) / English (`EN`)** dan **Dark / Light mode** di pojok kanan atas.

## Cara Menjalankan di Lokal

Pastikan sudah install Node.js (`v18` ke atas):

```bash
git clone https://github.com/egad13744-collab/No-idea.git
cd No-idea
npm install
npm run dev
```

Untuk build versi produksi (static files di folder `dist/`):

```bash
npm run build
```

## Tech Stack

- React + TypeScript + Vite
- Tailwind CSS
- `pdf-lib` & `pdfjs-dist`
- `qrcode` & `jszip`

## Kontribusi

Kalau punya ide tool lain yang sering berbayar tapi sebenarnya bisa dibikin client-side gratis, silakan buka Issue atau kirim Pull Request. Lihat panduan singkatnya di [CONTRIBUTING.md](./CONTRIBUTING.md).

## Author

- **Nama**: Egandika ([@egad13744-collab](https://github.com/egad13744-collab))
- **Discord**: `@egandika`

## Lisensi

Dirilis di bawah lisensi [MIT](./LICENSE). Bebas dipakai dan dimodifikasi.
