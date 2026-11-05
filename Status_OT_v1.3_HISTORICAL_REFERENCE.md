# LISDES Watch — referensi historis pengembangan dan pengujian OT v1.3

> **Catatan sandbox:** Dokumen ini mencatat kondisi rilis OT v1.3 pada 23 Oktober 2026. URL di bawah adalah URL produksi yang lama, bukan target sandbox ini. Salinan PA Logic v1.1 tidak dideploy dan konfigurasi sandbox tidak menunjuk ke Worker/D1 produksi.

Tanggal pembaruan: 23 Oktober 2026 (WIT).
Website: https://lisdes-watch.alkhair-lisdes.workers.dev/
Aturan keputusan: v0.1, provisional. Semua hasil OT adalah simulasi terkontrol, bukan hasil operasional PLN.

## Hasil yang tersedia

16 kasus sesuai berdasarkan konfirmasi pengguna: OT-01–OT-10, OT-17, OT-18, OT-21, OT-22, OT-24, OT-25. Konfirmasi tersebut berasal dari penggunaan versi sebelumnya. Screenshot tambahan tidak diwajibkan sesuai instruksi pengguna.

14 kasus lain lulus pemeriksaan otomatis pada kode OT v1.3: OT-11–OT-16, OT-19, OT-20, OT-23, OT-26–OT-30. Bukti rinci terdapat di `tests/operational-results.json` dan skrip yang dapat dijalankan ulang. Pengujian mencakup logika, render komponen React, validasi data, serta API lokal dengan SQLite. Pengujian lokal bukan pengujian persistensi pada database produksi.

Website publik juga diperiksa melalui browser pada 23 Oktober 2026. Menu Simulasi terkontrol menampilkan WF-C → WF-B → WF-A; WF-A P1/HOLD/YES, WF-B P2/CONDITIONAL GO/NO, WF-C P3/GO/NO; waiting 4 → 0 hari dan selesai H13 → H9.

UAT pemahaman operator dan sign-off mentor belum dilakukan. Workbook memisahkan PASS pengguna dari PASS (AUTO), sehingga tidak menyatakan kesiapan pilot operasional secara prematur. Tidak perlu mengulang seluruh 30 kasus manual.

## Perubahan website

1. Kolom target/proyeksi lead time, rencana mulai H-ke, dan material siap H-ke.
2. Lead time ratio = proyeksi ÷ target; target nol/kosong menghasilkan data belum lengkap. LTR >1 sampai 1,25 adalah WARNING. LTR >1,25 atau material siap setelah rencana mulai memicu contingency YES. Pemicu positif yang sudah diketahui tetap tampil bila input lain belum lengkap.
3. Waiting prediktif = MAX(0, hari material siap − hari rencana mulai), terpisah dari waiting kumulatif yang diinput PIC.
4. Urutan rekomendasi GO → CONDITIONAL GO → HOLD. HOLD bukan izin memulai pekerjaan. Kategori tidak lengkap/review tidak diberi urutan pelaksanaan. Jika gate sama, urutan memakai nama proyek; belum ada optimasi kapasitas/rute lapangan.
5. Kelebihan material menampilkan REVIEW REQUIRED dan tetap ditolak saat simpan sampai jumlah dikoreksi. Angka negatif tetap ditolak.
6. Tampilan current mengikuti snapshot bertanggal terbaru; laporan mundur tidak menggantikannya. Riwayat tanggal berbeda dipertahankan. Penyimpanan ulang pada tanggal yang sama tetap mengganti snapshot tanggal itu; jejak input keputusan sebelumnya dipertahankan.
7. Jejak keputusan memuat waktu WIT, tanggal laporan, pemicu, hasil, PIC sebagai owner, versi aturan, dan referensi salinan input. Ini catatan penelusuran aplikasi, bukan persetujuan elektronik atau audit yang tahan manipulasi. Data lama tidak dibuatkan bukti keputusan secara retroaktif.
8. Menu Simulasi terkontrol memakai dataset tetap dari matriks OT dan tidak menulis database. Ekspor CSV di menu tersebut memakai WF-A/B/C. CSV proyek admin memakai label DATA ADMIN karena data tersimpan juga dapat berupa simulasi.
9. Data material yang tidak lengkap tidak diberi status umum Terkendali. Aset versi sebelumnya dipertahankan untuk kompatibilitas refresh selama pembaruan; halaman utama meminta revalidasi cache.

## Cara penggunaan fitur baru

- Buka website, refresh, dan periksa footer OT v1.3 (Keputusan & Riwayat).
- Pilih Simulasi terkontrol untuk mempresentasikan contoh WF-A/B/C tanpa input ulang.
- Untuk proyek sendiri, buka Perbarui laporan lalu isi bagian Perencanaan logistik. Gunakan H1 yang sama bagi hari mulai dan hari material siap. Kosongkan data yang belum diketahui.
- Simpan laporan untuk membentuk Jejak keputusan. Buka detail catatannya untuk melihat salinan input yang menghasilkan rekomendasi.
- Buka Monitoring proyek untuk melihat urutan rekomendasi dari proyek yang lolos filter.
- Gunakan Tindak lanjut untuk menetapkan tindakan, PIC, tenggat, dan catatan hasil. Keputusan transportasi atau mobilisasi tetap memerlukan penilaian penanggung jawab.

## Asumsi simulasi OT-30

Satu tim melaksanakan A selama 5 hari, B selama 1 hari, dan C selama 3 hari. Material A siap H5, B H4, C H1. Seluruh prasyarat diasumsikan terpenuhi pada hari tersebut, perpindahan tidak menambah waktu, dan rencana mulai dapat diubah setelah persetujuan. Durasi A5/B1/C3 merupakan asumsi ilustratif yang dinyatakan terbuka untuk mereproduksi skenario matriks, bukan data durasi lapangan.

Urutan A-B-C menghasilkan idle 4 hari dan selesai H13. Urutan C-B-A menghasilkan idle 0 hari dan selesai H9. Ini perbandingan skenario, bukan klaim saving aktual.

## Kode dan pemeriksaan

Kode utama: `app/dashboard.tsx` (tampilan), `lib/model.ts` (aturan/data), `worker/index.ts` (API). Tampilan dapat diubah tanpa mengubah ambang keputusan.

Jalankan `npm ci`, `npm run check`, `npm test`, `npm run test:priority`, `npm run test:gate`, `npm run test:operational`, dan `npm run build` bila mengubah aturan atau alur penyimpanan. Pengujian tidak perlu diulang seluruhnya untuk perubahan teks/tampilan kecil.

Kunci admin tidak disertakan dalam paket. Deployment mempertahankan secret ADMIN_KEY dan binding D1 yang ada; tidak memigrasikan atau menulis ulang data proyek produksi.

## Status dokumen PA

Matriks pengujian diperbarui dengan sumber bukti dan batas interpretasi di atas. Naskah PA serta PPT tanggal 19 Oktober belum ditulis ulang dalam paket ini; angka simulasi baru harus dicantumkan sebagai skenario terkontrol dengan asumsi dan jenis bukti yang jelas saat revisi berikutnya.
