# LISDES Watch — Sandbox PA Logic v1.1

Paket ini adalah salinan terpisah untuk trial-and-error PA Logic Baseline v1.1. Bukan deployment produksi.

**Jangan jalankan deployment ke Worker `lisdes-watch` dari folder ini.** Perintah deploy/create-db/secret sengaja dinonaktifkan dan Wrangler memakai nama Worker serta placeholder D1 khusus sandbox.

## Uji lokal

```bash
npm install
npm run check
npm run test:pa-v11
npm test
npm run build
npm run dev
```

Buka URL localhost yang ditampilkan Wrangler. Buka menu `Simulasi HOR2 v1.1`. Input simulasi A-S1 hanya berada di memori browser dan tidak masuk ke database D1.

Untuk panduan logic, skenario asumsi, dan batasan hasil, baca `SANDBOX_README.md`.
