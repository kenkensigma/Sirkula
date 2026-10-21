# RE-FLOW Security Checklist

## 1. Threat model singkat

Risiko utama MVP:
- User mengakses transaksi/batch milik pihak lain.
- Farmer memesan stok melebihi jumlah tersedia akibat request bersamaan.
- Client memalsukan harga, total, status, role, jarak, atau freshness.
- Pembayaran simulasi dicatat berulang.
- PIN serah-terima ditebak, bocor, atau digunakan ulang.
- Kebocoran service-role key atau informasi sensitif di log.
- RLS terlalu longgar.
- Dashboard dampak dimanipulasi dengan menulis data sendiri.

## 2. Authentication & authorization

- Validasi sesi Supabase pada server setiap endpoint terlindungi.
- Ambil user ID dari sesi, jangan percaya `user_id` dari body.
- Role hanya ditetapkan melalui proses server/admin tepercaya.
- Periksa ownership pada setiap resource: farmer, factory terkait, atau admin.
- Jangan menganggap menyembunyikan tombol UI sebagai kontrol keamanan.
- Kembalikan `404` bila pengungkapan keberadaan resource dapat menimbulkan kebocoran.
- Uji akses lintas akun dan lintas role.

## 3. Supabase RLS

- Aktifkan RLS untuk tabel yang dapat diakses melalui API Data Supabase.
- Tulis policy per tabel dan per operasi `SELECT`, `INSERT`, `UPDATE`, `DELETE`.
- `profiles`: user hanya boleh mengubah field aman miliknya; role tidak dapat diubah sendiri.
- `batches`: factory hanya dapat mengubah listing sendiri.
- `transactions`: pihak terkait dapat membaca transaksi, tetapi tidak dapat mengubah status secara bebas.
- `ledger_entries`, PIN verification, dan audit log: jangan beri akses write langsung dari browser.
- Uji policy dengan akun farmer, factory, dan admin yang terpisah.
- Service-role key hanya di server dan tidak pernah dikirim ke browser.

## 4. Business logic integrity

- Hitung harga total di server dari harga snapshot database.
- Reservasi stok dengan transaksi database/RPC atomik.
- Validasi freshness dan expiry saat create transaction, bukan hanya saat marketplace dibuka.
- Terapkan state machine di server; jangan terima `status` arbitrary dari client.
- Gunakan idempotency untuk create order, payment simulation, refund, dan release ledger.
- Pastikan perubahan stok dan transaksi rollback bersama bila gagal.
- Jangan menghapus ledger untuk “membetulkan” pembayaran; buat reversal entry.
- Catat siapa melakukan aksi dan kapan.

## 5. PIN / QR handover

- PIN acak, satu kali, punya expiry.
- Simpan hash PIN, bukan plaintext.
- Jangan mengirim hash atau PIN lama di response.
- Batasi percobaan per transaksi dan per user/IP; lakukan cooldown/lock setelah ambang.
- Gunakan perbandingan yang aman dan konsumsi PIN secara atomik.
- Tandai `consumed_at` hanya satu kali.
- Jangan mencatat PIN ke application logs, analytics, URL, atau error message.
- Jangan gunakan PIN demo yang statis di production.
- QR fisik anti-rusak merupakan fase lanjutan; PIN MVP bukan bukti adanya kemasan tersegel.

## 6. Rate limiting & abuse prevention

Terapkan rate limit pada:
- Login/register sesuai mekanisme provider.
- Create transaction.
- Payment simulation.
- PIN verification.
- Admin actions.
- Endpoint pencarian bila dapat disalahgunakan.

Tambahkan validasi ukuran body, pagination limit, input enum, string length, dan koordinat. Rate limit perlu penyimpanan bersama yang sesuai bila aplikasi berjalan di beberapa instance.

## 7. Idempotency

- Wajibkan idempotency key untuk pembuatan transaksi dan aksi finansial simulasi.
- Simpan key dengan unique constraint.
- Simpan hash request untuk mendeteksi key sama dengan payload berbeda.
- Pengulangan request yang sama mengembalikan hasil sebelumnya.
- Refund/reversal dan ledger harus memiliki reference key unik.

## 8. Privacy & logging

- Minimalkan data pribadi yang disimpan.
- Jangan mencatat password, auth token, service-role key, PIN, atau credential.
- Jangan menaruh data sensitif pada URL/query string.
- Lindungi endpoint admin dan audit log.
- Batasi retention log sesuai kebutuhan dan kebijakan organisasi.
- Tampilkan estimasi dampak sebagai estimasi, bukan klaim ilmiah yang terverifikasi.

## 9. Deployment checklist

- [ ] Secrets tersimpan pada environment hosting, bukan repository.
- [ ] RLS aktif dan diuji.
- [ ] Migration ditinjau dan diuji di staging.
- [ ] Tidak ada endpoint simulasi yang terhubung ke payment gateway nyata.
- [ ] HTTPS aktif.
- [ ] Error response tidak membocorkan stack trace.
- [ ] Rate limit aktif pada endpoint sensitif.
- [ ] Backup dan prosedur pemulihan dipahami.
- [ ] Admin memakai akun terpisah dan akses minimum.
- [ ] Data demo diberi label dan tidak tercampur dengan data operasional.
