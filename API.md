# RE-FLOW API Specification

> Status: rancangan kontrak MVP. Endpoint di bawah belum berarti sudah tersedia di aplikasi. Base path menggunakan `/api/v1`. Semua response JSON kecuali disebutkan lain.

## 1. Konvensi

### Success response
```json
{
  "data": {},
  "meta": {}
}
```

`meta` boleh dihilangkan bila tidak diperlukan. Untuk list, gunakan `meta.pagination`.

### Error response
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request tidak valid.",
    "details": {
      "field": "Penjelasan kesalahan"
    }
  }
}
```

### Aturan umum
- Semua endpoint kecuali endpoint publik dan auth memerlukan sesi Supabase yang valid.
- Role dan kepemilikan data harus diverifikasi di server.
- Gunakan ISO 8601 UTC untuk timestamp response.
- Harga disimpan sebagai integer rupiah (`amount_idr`), bukan floating point.
- Gunakan pagination pada daftar.
- Jangan kirim service-role key atau rahasia server ke browser.
- Endpoint pembayaran di MVP hanya memanipulasi saldo/ledger simulasi; tidak memindahkan uang sungguhan.

## 2. Authentication & profile

### `GET /api/v1/me`
Mengambil profil pengguna aktif.

**Auth:** wajib.

Response `200`:
```json
{
  "data": {
    "id": "uuid",
    "name": "Nama Pengguna",
    "role": "factory",
    "phone": null,
    "location": {
      "latitude": -8.65,
      "longitude": 115.21
    },
    "created_at": "2026-10-19T10:00:00Z"
  }
}
```

Role MVP: `factory`, `farmer`, `admin`.

### `PATCH /api/v1/me`
Memperbarui nama, nomor telepon, dan lokasi sendiri. Role tidak boleh diubah melalui endpoint ini.

Request:
```json
{
  "name": "Nama Baru",
  "phone": "08xxxxxxxxxx",
  "latitude": -8.65,
  "longitude": 115.21
}
```

Response `200`: profil terbaru. Validasi rentang koordinat dan format telepon.

## 3. Batch / listing ampas

### `GET /api/v1/batches`
Daftar batch yang bisa dilihat pengguna. Listing publik hanya menampilkan batch segar dan aktif; pemilik pabrik dapat melihat batch miliknya termasuk status nonaktif.

Query:
- `lat`, `lng`: titik pencarian (opsional jika profil punya koordinat)
- `radius_km`: default 15; MVP maksimum 15
- `status`: filter terbatas
- `page`, `limit`: pagination
- `sort`: `distance`, `freshness`, `newest`

Response `200`:
```json
{
  "data": [
    {
      "id": "uuid",
      "factory_id": "uuid",
      "factory_name": "Pabrik Contoh",
      "quantity_kg": 500,
      "available_kg": 500,
      "price_per_kg_idr": 850,
      "latitude": -8.65,
      "longitude": 115.21,
      "distance_km": 4.2,
      "prepared_at": "2026-10-19T08:00:00Z",
      "expires_at": "2026-10-19T20:00:00Z",
      "freshness_zone": "green",
      "status": "available"
    }
  ],
  "meta": {
    "pagination": { "page": 1, "limit": 20, "total": 1 }
  }
}
```

Jarak dihitung server dari koordinat yang tervalidasi. Jangan mempercayai nilai `distance_km` yang dikirim client.

### `POST /api/v1/batches`
Membuat batch ampas tahu.

**Auth:** role `factory`.

Request:
```json
{
  "quantity_kg": 500,
  "price_per_kg_idr": 850,
  "latitude": -8.65,
  "longitude": 115.21,
  "prepared_at": "2026-10-19T08:00:00Z",
  "description": "Ampas tahu segar"
}
```

Response `201`: batch baru. Server menentukan `expires_at`, `freshness_zone`, dan status awal. `prepared_at` tidak boleh berada di masa depan; batasi waktu mundur berdasarkan aturan produk yang ditetapkan.

### `GET /api/v1/batches/:batchId`
Detail batch. Pengguna harus berhak melihat batch tersebut.

### `PATCH /api/v1/batches/:batchId`
Pemilik pabrik dapat memperbarui harga/deskripsi/kuantitas hanya jika tidak ada reservasi/penjualan yang membuat perubahan tersebut tidak aman. Jangan mengubah jumlah total menjadi kurang dari jumlah yang sudah terjual atau direservasi.

### `POST /api/v1/batches/:batchId/deactivate`
Menonaktifkan listing milik pabrik. Tidak boleh membatalkan transaksi yang sudah dikonfirmasi secara diam-diam.

## 4. Orders / transactions

### `POST /api/v1/transactions`
Membuat transaksi dan melakukan reservasi stok secara atomik.

**Auth:** role `farmer`.

Request:
```json
{
  "batch_id": "uuid",
  "quantity_kg": 50,
  "idempotency_key": "random-unique-client-key"
}
```

Server menghitung total berdasarkan harga batch yang berlaku. Jangan menerima `total_amount_idr` dari client sebagai sumber kebenaran.

Response `201`:
```json
{
  "data": {
    "id": "uuid",
    "batch_id": "uuid",
    "farmer_id": "uuid",
    "factory_id": "uuid",
    "quantity_kg": 50,
    "unit_price_idr": 850,
    "total_amount_idr": 42500,
    "status": "awaiting_simulated_payment",
    "payment_mode": "simulation",
    "created_at": "2026-10-19T10:00:00Z"
  }
}
```

Gunakan transaksi database atau RPC untuk memeriksa stok, membuat transaksi, mengurangi `available_kg`, dan menyimpan idempotency key dalam satu operasi atomik.

### `GET /api/v1/transactions`
Daftar transaksi milik pengguna aktif; admin memiliki akses sesuai kebutuhan operasional.

Query: `status`, `page`, `limit`, `role_view` (dibatasi server).

### `GET /api/v1/transactions/:transactionId`
Detail transaksi bagi farmer, factory yang terlibat, atau admin.

### `POST /api/v1/transactions/:transactionId/pay-simulation`
Menandai pembayaran simulasi. Hanya farmer pemilik transaksi, hanya saat status `awaiting_simulated_payment`.

Request:
```json
{
  "payment_method": "simulated_balance"
}
```

Response `200`: status menjadi `paid_simulated` dan ledger simulasi tercatat. Endpoint tidak boleh memanggil payment gateway sungguhan.

### `POST /api/v1/transactions/:transactionId/mark-shipped`
Pabrik menandai pesanan telah dikirim.

**Auth:** factory terkait. Status harus `paid_simulated`.

### `POST /api/v1/transactions/:transactionId/confirm-received`
Peternak mengonfirmasi barang diterima. Status harus `shipped`. Response memberikan instruksi verifikasi serah-terima, bukan membuka saldo secara otomatis jika pemeriksaan PIN masih diwajibkan.

### `POST /api/v1/transactions/:transactionId/verify-pin`
Memverifikasi PIN serah-terima satu kali.

Request:
```json
{
  "pin": "123456"
}
```

PIN contoh hanya ilustrasi. PIN harus dibuat secara kriptografis aman, disimpan sebagai hash, memiliki batas percobaan, masa berlaku, dan tidak dicatat dalam log. Setelah sukses, tandai terpakai dan selesaikan transaksi/ledger simulasi sesuai state machine.

### `POST /api/v1/transactions/:transactionId/cancel`
Membatalkan transaksi hanya bila status masih mengizinkan. Server mengembalikan stok reservasi secara atomik dan mencatat alasan. Jangan mengizinkan salah satu pihak membatalkan transaksi selesai.

## 5. Impact dashboard

### `GET /api/v1/impact/summary`
Mengambil agregat dampak berdasarkan data transaksi/batch yang memenuhi definisi “selesai”. Jelaskan rentang tanggal dan asumsi kalkulasi.

Contoh:
```json
{
  "data": {
    "period": { "from": "2026-10-01", "to": "2026-10-31" },
    "diverted_from_waste_kg": 500,
    "estimated_co2e_avoided_kg": 868,
    "estimated_feed_savings_idr": 425000,
    "methodology": {
      "co2e_kg_per_kg_material": 1.736,
      "feed_savings_idr_per_kg": 850,
      "label": "estimasi berdasarkan koefisien asumsi; perlu validasi"
    }
  }
}
```

Koefisien 1.736 kg CO₂e per kg dan Rp850 per kg merupakan asumsi rancangan dari materi proyek, bukan hasil pengukuran terverifikasi. Jangan menggandakan batch yang sama dalam agregasi.

## 6. Admin MVP

### `GET /api/v1/admin/transactions`
Admin melihat daftar transaksi untuk moderasi/dukungan.

### `POST /api/v1/admin/transactions/:transactionId/refund-simulation`
Mencatat pengembalian saldo simulasi bila sesuai kebijakan dan status. Wajib idempotent dan membuat ledger reversal, bukan menghapus catatan lama.

### `GET /api/v1/admin/audit-logs`
Hanya admin yang berwenang; jangan pernah memasukkan PIN, token, atau secret ke log.

## 7. State machine transaksi

Status minimum yang disarankan:

```text
awaiting_simulated_payment
  ├── cancel ──> cancelled
  └── pay-simulation ──> paid_simulated
                           ├── cancel/refund policy ──> cancelled_refunded_simulated
                           └── mark-shipped ──> shipped
                                                  └── confirm-received ──> awaiting_handover_verification
                                                                                ├── verify-pin ──> completed
                                                                                └── expiry/dispute ──> needs_review
```

Transisi harus diterapkan di server/database, bukan sekadar mengubah field status dari frontend. Definisikan kebijakan dispute/refund sebelum implementasi transaksi nyata.

## 8. Error codes

| HTTP | Code | Kapan |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Payload tidak valid |
| 401 | `UNAUTHENTICATED` | Sesi tidak valid |
| 403 | `FORBIDDEN` | Role/ownership tidak sesuai |
| 404 | `NOT_FOUND` | Resource tidak ada atau tidak boleh diungkap |
| 409 | `STATE_CONFLICT` | Status tidak mendukung aksi |
| 409 | `INSUFFICIENT_STOCK` | Stok tidak cukup |
| 409 | `IDEMPOTENCY_CONFLICT` | Key sama dipakai untuk payload berbeda |
| 410 | `BATCH_EXPIRED` | Batch tidak lagi eligible |
| 422 | `PIN_INVALID` | PIN salah atau kedaluwarsa |
| 429 | `RATE_LIMITED` | Terlalu banyak request |
| 500 | `INTERNAL_ERROR` | Kesalahan tak terduga |

## 9. Fitur di luar MVP

Jangan implementasikan sebagai fitur nyata pada MVP kecuali scope resmi berubah:
- Integrasi Open API/SNAP BI atau payment gateway nyata.
- Koneksi KUR/perbankan.
- Barcode/QR segel fisik anti-rusak per karung.
- Clearinghouse otomatis untuk BSF maggot dan kasgot.
- Pembayaran/escrow uang sungguhan.

Endpoint untuk fitur-fitur tersebut perlu spesifikasi terpisah setelah partner, kebijakan, dan proses operasional terverifikasi.
