# RE-FLOW Implementation Roadmap

## 1. Prioritas MVP

Bangun satu alur transaksi yang benar dan aman terlebih dahulu. Jangan mulai dari integrasi bank, QR segel fisik, atau clearinghouse yang merupakan fase lanjutan.

## 2. Phase 0 — Project foundation

- [ ] Buat Next.js 14 App Router + TypeScript.
- [ ] Pasang Tailwind CSS dan struktur komponen.
- [ ] Siapkan Supabase project dan environment variables.
- [ ] Buat migration awal dan seed data demo.
- [ ] Buat typed Supabase clients untuk browser/server.
- [ ] Siapkan linting, formatting, dan test runner.
- [ ] Buat layout responsif dan state loading/error/empty.

**Done when:** aplikasi berjalan lokal, migration dapat diterapkan dari nol, secrets tidak ada di Git.

## 3. Phase 1 — Auth & profile

- [ ] Integrasi Supabase Auth.
- [ ] Halaman login/register.
- [ ] Buat profile setelah sign-up dengan role yang tervalidasi.
- [ ] Implementasikan `GET/PATCH /me`.
- [ ] Role dan field privileged tidak dapat diubah oleh user.
- [ ] Buat policy RLS dan tes lintas role.

**Done when:** farmer dan factory dapat login dan hanya mengakses data yang berhak mereka lihat.

## 4. Phase 2 — Batch marketplace

- [ ] Factory dapat membuat, melihat, mengubah, dan menonaktifkan batch.
- [ ] Validasi quantity, harga, koordinat, dan `prepared_at`.
- [ ] Backend menghitung expiry/freshness.
- [ ] Marketplace menampilkan harga, jumlah tersedia, pabrik, zona freshness, dan waktu persiapan.
- [ ] Leaflet/OpenStreetMap untuk peta.
- [ ] Haversine dan filter radius maksimum 15 km.
- [ ] Expired batch tidak dapat dipesan.

**Done when:** batch valid terlihat sesuai radius dan batch expired tidak bisa dibeli melalui API.

## 5. Phase 3 — Transaction core

- [ ] Buat endpoint create transaction.
- [ ] Implementasikan idempotency.
- [ ] Reservasi stok secara atomik melalui RPC/transactional database operation.
- [ ] Snapshot harga dan total.
- [ ] Daftar/detail transaksi untuk pihak terkait.
- [ ] Implementasikan state machine.
- [ ] Tambahkan audit log pada aksi sensitif.

**Done when:** test concurrency membuktikan stok tidak oversold dan user tidak bisa mengubah status secara bebas.

## 6. Phase 4 — Simulated payment & handover

- [ ] UI pembayaran diberi label **SIMULASI — tidak memindahkan uang sungguhan**.
- [ ] Ledger simulasi append-only.
- [ ] Payment request idempotent.
- [ ] Factory menandai shipped.
- [ ] Farmer mengonfirmasi penerimaan.
- [ ] PIN acak, hashed, expiry, rate limit, dan one-time consume.
- [ ] Selesaikan transaksi hanya setelah kondisi serah-terima terpenuhi.
- [ ] Simulasikan refund/reversal sesuai kebijakan yang disetujui.

**Done when:** demo transaksi end-to-end berhasil dan tidak ada bahasa UI yang mengesankan escrow uang sungguhan.

## 7. Phase 5 — Impact & polish

- [ ] Dashboard dampak dari transaksi yang memenuhi definisi selesai.
- [ ] Tampilkan asumsi/metodologi perhitungan.
- [ ] Tampilkan `estimated` pada metrik CO₂e dan penghematan.
- [ ] Uji aksesibilitas dasar dan responsive layout.
- [ ] Tambahkan loading, error, empty, dan success states.
- [ ] Jalankan unit, integration, security, concurrency, dan E2E tests.
- [ ] Tinjau copywriting agar klaim tidak berlebihan.

**Done when:** angka dashboard bisa ditelusuri ke data sumber dan label estimasi mudah dipahami.

## 8. Definition of Done per fitur

Sebuah fitur dianggap selesai jika:
1. UI dan API bekerja untuk jalur sukses.
2. Validasi gagal memiliki pesan/error yang tepat.
3. Authorization/ownership diuji.
4. State transition dan concurrency dipikirkan untuk operasi kritis.
5. Data persisten tersimpan dengan constraints yang sesuai.
6. Test terkait lulus.
7. Tidak membocorkan secret atau data pribadi.
8. Ada loading, empty, dan error state.
9. Dokumen diperbarui bila kontrak API/skema berubah.

## 9. Prioritas setelah MVP (bukan scope MVP)

### Q2 — Payment/banking exploration
Riset kebutuhan legal, teknis, partner, biaya, dan kelayakan Open API/SNAP BI/payment gateway. Jangan mengiklankan integrasi aktif sebelum ada perjanjian dan implementasi nyata. KUR adalah kemungkinan kemitraan, bukan fitur yang dijamin.

### Q3 — Sealed packaging exploration
Riset standar karung, biaya, proses pengemasan, traceability, dan uji segel QR/barcode one-time. QR digital biasa tidak otomatis menjadi segel anti-rusak.

### Q4 — Secondary clearinghouse exploration
Riset mitra BSF maggot/kasgot, keamanan bahan, transportasi, pencatatan volume, dan pengelolaan batch yang sudah tidak memenuhi syarat pakan segar. Target pengurangan limbah perlu dibuktikan dengan data; jangan klaim zero waste 100% sebelum terukur.

## 10. Recommended build order

1. DATABASE.md dan migration.
2. SYSTEM.md foundation + auth.
3. Batch APIs dan marketplace.
4. Transaction atomic reservation.
5. Simulated payment + handover.
6. Impact dashboard.
7. SECURITY.md review.
8. TESTING.md suite.
9. Deployment/staging and demo rehearsal.
