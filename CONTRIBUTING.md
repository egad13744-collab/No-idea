# Contributing

Kontribusi terbuka buat siapa saja yang mau ikut nambahin atau benerin fitur di repo ini.

## Aturan Dasar

1. **100% Client-Side**: Jangan tambahkan fitur yang mewajibkan upload file user ke server luar atau butuh API key berbayar.
2. **Gratis & Tanpa Watermark**: Semua hasil export harus bersih tanpa paksaan watermark.
3. **Support Bahasa ID & EN**: Tambahkan teks UI ke `src/i18n/translations.ts` untuk Bahasa Indonesia dan Bahasa Inggris.

## Cara Kirim Pull Request

1. Fork repo ini dan buat branch baru (`git checkout -b feat/nama-fitur`)
2. Tambahkan komponen baru di `src/components/tools/`
3. Pastikan tidak ada error saat build:
   ```bash
   npm run build
   ```
4. Push branch kamu dan buka Pull Request ke `main`.
