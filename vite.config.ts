import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    allowedHosts: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'pdf-engine': ['pdf-lib', 'pdfjs-dist'],
          'utilities': ['qrcode', 'jszip'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['pdf-lib', 'qrcode', 'jszip'],
  },
});
