# RE-FLOW — Project Documentation

Dokumentasi teknis MVP **Platform Kliring Ampas Tahu** untuk membantu pabrik tahu menyalurkan ampas tahu segar kepada peternak/pembudidaya di sekitar lokasi.

## Dokumen

1. [`API.md`](./API.md) — kontrak endpoint, payload, status transaksi, dan format error.
2. [`DATABASE.md`](./DATABASE.md) — skema PostgreSQL, relasi, indeks, constraint, dan ERD.
3. [`SYSTEM.md`](./SYSTEM.md) — arsitektur aplikasi, struktur folder, pembagian tanggung jawab, dan alur utama.
4. [`SECURITY.md`](./SECURITY.md) — autentikasi, otorisasi, RLS, PIN/QR, rate limit, dan audit.
5. [`TESTING.md`](./TESTING.md) — strategi pengujian dan acceptance criteria.
6. [`IMPLEMENTATION.md`](./IMPLEMENTATION.md) — urutan pengerjaan, milestone, dan definisi selesai.

## Stack MVP

- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- Supabase Auth
- Supabase PostgreSQL
- Leaflet.js + OpenStreetMap
- Route Handlers / server-side business logic

Gunakan versi paket yang kompatibel dengan proyek saat implementasi. Dokumen ini adalah spesifikasi rancangan, bukan bukti bahwa fitur telah diimplementasikan.

## Batas MVP yang wajib dijaga

- Pembayaran/escrow **simulasi**, bukan uang sungguhan dan bukan layanan escrow berizin.
- Jarak pencarian menggunakan radius awal maksimal **15 km**.
- Batas kesegaran ampas menggunakan jam sejak batch dibuat/ditandai siap, dengan aturan waktu yang konsisten.
- Zona yang digunakan sebagai rancangan awal: hijau 0–8 jam, kuning >8–10,5 jam, dan batch segar tidak lagi ditampilkan mulai 12 jam. Rentang 10,5–12 jam harus ditentukan secara eksplisit oleh produk sebelum implementasi; jangan membuat asumsi diam-diam.
- Rencana integrasi bank/payment, KUR, kemasan segel QR khusus, dan clearinghouse maggot/kasgot merupakan **fase lanjutan**, bukan kemampuan MVP.
- Metrik dampak adalah estimasi berdasarkan koefisien asumsi dan perlu divalidasi; jangan menyajikannya sebagai hasil terukur.
- Jangan mengklaim “zero waste 100%” sebagai hasil aktual sebelum ada data operasional yang membuktikannya.

## Prinsip implementasi

1. Server memvalidasi semua aturan bisnis; jangan mengandalkan validasi frontend.
2. Reservasi stok dan perubahan status transaksi harus aman terhadap request bersamaan.
3. Uang, stok, waktu kedaluwarsa, dan dampak lingkungan harus dicatat dengan satuan yang eksplisit.
4. Semua status transaksi harus melalui transisi yang diizinkan.
5. Fitur yang belum dibuat harus ditampilkan sebagai simulasi, rencana, atau placeholder dengan label yang jelas.
