# RE-FLOW Testing Plan

## 1. Test layers

- **Unit:** freshness calculation, Haversine, price calculation, state transition, validation.
- **Integration:** route handler + database/RPC + auth/RLS.
- **E2E:** perjalanan pengguna factory dan farmer di browser.
- **Security tests:** ownership, role escalation, replay, rate limit, RLS.
- **Manual demo checks:** peta, responsive layout, label simulasi, dan status transaksi.

Gunakan data seed khusus test; jangan menggunakan akun atau data produksi.

## 2. Unit test cases

### Freshness
- 0 jam → `green`.
- 8 jam tepat → `green`.
- >8 jam dan <=10.5 jam → `yellow`.
- 10.5–12 jam → mengikuti aturan produk yang diputuskan; test tidak boleh mengasumsikan aturan yang belum ditentukan.
- >=12 jam → expired/tidak eligible untuk katalog segar.
- `prepared_at` di masa depan → ditolak.
- Perhitungan menggunakan waktu server dan timezone-aware timestamp.

### Haversine
- Koordinat sama → jarak mendekati 0.
- Dua koordinat berbeda → hasil non-negatif.
- Latitude/longitude di luar rentang → validasi gagal.
- Radius filter maksimal 15 km untuk MVP.
- Uji titik di dalam, tepat di batas, dan di luar radius.

### Pricing
- Total = kuantitas × harga snapshot.
- Kuantitas negatif/nol ditolak.
- Harga negatif ditolak.
- Pembulatan dan tipe integer harus konsisten dengan kebijakan rupiah.
- Perubahan harga batch setelah order tidak mengubah total order yang sudah dibuat.

### State machine
- Aksi valid berhasil.
- Aksi pada status salah ditolak dengan `STATE_CONFLICT`.
- Transaksi `completed` tidak bisa dibatalkan.
- Transisi hanya dilakukan server-side.

## 3. Integration tests

- `GET /me` tanpa sesi → 401.
- Farmer tidak dapat membuat batch → 403.
- Factory dapat membuat batch dengan payload valid.
- User tidak dapat mengubah role melalui `PATCH /me`.
- User tidak dapat membaca transaksi milik pihak lain.
- Batch expired tidak dapat dipesan meski masih ada di cache/UI.
- Batch stok habis tidak dapat dipesan.
- `pay-simulation` hanya berjalan pada status yang benar.
- Ledger tidak terduplikasi ketika request payment diulang.
- PIN valid hanya dapat digunakan sekali.
- PIN salah menambah attempt counter dan akhirnya terkena lock/cooldown.
- Impact hanya menghitung transaksi sesuai definisi selesai dan tidak menduplikasi transaksi.

## 4. Concurrency / race tests

Penting: jalankan dua atau lebih request bersamaan ke batch yang stoknya terbatas.

Contoh: stok tersedia 50 kg, dua farmer masing-masing mencoba memesan 40 kg bersamaan.
- Hasil yang diharapkan: paling banyak satu order berhasil.
- Total reservasi tidak pernah lebih dari 50 kg.
- Tidak ada negative stock.
- Request yang gagal mendapat `INSUFFICIENT_STOCK` atau `STATE_CONFLICT`.
- Ulangi test untuk idempotency key yang sama dan berbeda.

## 5. Security tests

- Farmer mencoba mengirim `factory_id` milik akun lain.
- Client mencoba mengubah `status` menjadi `completed`.
- Client mencoba mengirim total harga lebih rendah dari hasil server.
- Farmer mencoba endpoint admin.
- Factory mencoba menandai shipped pada transaksi yang bukan miliknya.
- PIN benar di-replay setelah sudah digunakan.
- Banyak PIN salah memicu rate limit/cooldown.
- Service-role key tidak ada dalam bundle frontend/source map.
- RLS menolak query langsung yang tidak berhak.
- Error response tidak memuat stack trace, token, PIN, atau SQL detail.

## 6. E2E scenarios

### Factory
1. Daftar/login sebagai factory.
2. Lengkapi profil/lokasi.
3. Buat batch.
4. Pastikan batch muncul di marketplace dalam radius yang sesuai.
5. Buka transaksi yang dipesan farmer.
6. Tandai pesanan dikirim setelah pembayaran simulasi.

### Farmer
1. Daftar/login sebagai farmer.
2. Buka marketplace dan filter jarak.
3. Lihat detail batch dan freshness label.
4. Pesan kuantitas yang tersedia.
5. Jalankan pembayaran simulasi dan lihat label yang jelas.
6. Konfirmasi barang diterima.
7. Verifikasi PIN sesuai alur.
8. Lihat transaksi selesai dan ringkasan dampak estimasi.

### Expiry
1. Seed batch dengan `prepared_at` lebih dari 12 jam.
2. Pastikan tidak muncul sebagai pakan segar.
3. Pastikan create transaction ditolak oleh server.
4. Pastikan tidak ada klaim bahwa batch otomatis masuk proses maggot/kasgot pada MVP.

## 7. Acceptance checklist

- [ ] Auth dan role checks aktif.
- [ ] Batch CRUD dasar bekerja.
- [ ] Radius pencarian maksimal 15 km.
- [ ] Freshness dihitung server.
- [ ] Reservasi stok aman dari race condition.
- [ ] Simulated payment diberi label jelas dan idempotent.
- [ ] PIN one-time memiliki expiry, hash, dan batas percobaan.
- [ ] State machine ditegakkan.
- [ ] RLS diuji dengan beberapa role.
- [ ] Impact diberi label estimasi dan methodology.
- [ ] Responsive di mobile/desktop.
- [ ] Tidak ada integration partner yang ditampilkan sebagai sudah aktif bila belum.
