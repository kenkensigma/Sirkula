# Sirkula: Design Direction (DESIGN.md)

## Brand Identity & Purpose
- **Product**: Sirkula (Platform Kliring Ampas Tahu & Pakan Ternak Segar)
- **Role**: Menghubungkan pabrik tahu dengan peternak sapi/kambing untuk menyelamatkan ampas tahu segar dalam batas SLA 12 jam.
- **Audience**: Peternak rakyat, pengrajin tahu UMKM, dan kurir logistik lokal di Bali & sekitarnya.
- **Context**: Penggunaan lapangan di bawah sinar matahari pada perangkat mobile, membutuhkan keterbacaan tinggi, kontras kuat, dan estetika agro-industri yang fungsional tanpa ornamen AI generic.

## Dials
- **ENERGY: 2 (Balanced)** - Karakter agro-industri yang tegas dengan aksen fungsional; tidak kaku/steril dan tidak berlebihan.
- **RHYTHM: 2 (Structured with Intentional Breaks)** - Kartu pabrik konsisten dengan indikator zona kesegaran yang jelas dan lembar checkout yang terarah.
- **MOTION: 1 (Calm & Utilitarian)** - Transisi status yang bertujuan dan pembaruan hitungan mundur; tanpa animasi melayang atau efek paralaks yang tidak perlu.

## Color System (Premium Green & Pure White)
- **Primary Jewel Pine Green**: `#0A4D3C` (Hijau botol mewah / British racing green untuk tombol utama, sorotan merek, dan status aktif)
- **Deep Forest Dark**: `#04261C` (Hijau hutan sangat pekat untuk tipografi utama dan header, kontras > 15:1 terhadap putih)
- **Secondary Emerald Accent**: `#106950` (Aksen hijau sedang untuk hover dan transisi interaktif)
- **Muted Sage Green**: `#4A6359` (Teks sekunder dan label pendukung, kontras > 5.5:1 terhadap putih)
- **Pure White Surface**: `#FFFFFF` (Permukaan kartu, modal, popover, dan panel kontrol)
- **Tinted Soft Green**: `#F2F7F4` / `#F4F8F5` (Latar belakang lembut dan kontainer elemen aktif)
- **Subtle Sage Border**: `#DDE7E2` (Garis tepi halus dan elegan pengganti border abu-abu standar)
- **Alert & Warmth**: `#9A3412` / `#B45309` (Amber kedelai kontras tinggi untuk diskon dan SLA)

## Typography
- **Primary Typeface**: `Plus Jakarta Sans` via `next/font/google` (Modern, geometris elegan, keterbacaan tinggi di berbagai ukuran layar).
- **Body & Controls**: Ukuran fungsional minimal 12px (`text-xs`), menghilangkan teks terlalu kecil (sub-11px) untuk memenuhi standar aksesibilitas dan audit Impeccable.
- **Numbers & Metrics**: Monospace tabular untuk timer kesegaran 12 jam, volume karung, dan nominal rupiah.

## Impeccable Visual Quality Resolutions
- **AI Color Palette**: Menggantikan gradien neon Tailwind generic (`from-emerald-500 to-emerald-600`) dengan palet solid berkelas `#0A4D3C` dan putih bersih.
- **Undersized Functional Text**: Memperbesar badge status ("Kliring Ampas Tahu") dan label navigasi bawah dari 9-10px menjadi 12px (`text-xs font-semibold`).
- **Positioned Child Clipped by Overflow Container**: Memindahkan drawer lembar pabrik (`<aside>`) dari dalam kontainer `<main overflow-hidden>` ke struktur flex root sehingga tepi kiri kartu tidak terpotong.
- **Tiny Body Text**: Meningkatkan teks deskripsi dan subtitle dari 11px ke 12px dengan kontras warna `#4A6359`.
- **Nested Cards**: Menghilangkan efek kotak berlapis-lapis (double border & double shadow) pada daftar pabrik; menggantinya dengan kartu ubin datar (*flat tiles*) bergaris tepi `#E2EBE5`.
- **Low Contrast Text**: Mengganti teks putih 9px di atas badge oranye/hijau pada pin peta dengan kapsul putih berbingkai presisi dan teks gelap `#04261C` (rasio kontras 15.6:1, melebihi WCAG AAA).

## Identity Motifs
- **Freshness SLA Meter**: Bilah hitung mundur 12 jam dengan penanda Zona Hijau (0-8 jam) dan Zona Kuning (8-10.5 jam).
- **Mekanisme Escrow Transparan**: Peringatan pemeriksaan fisik bau dan suhu sebelum menunjukkan QR/PIN ke kurir.
- **Honest Metrics**: Menghindari klaim berlebihan atau badge palsu. Menampilkan data stok riil, radius radar 15 km, dan estimasi koefisien dampak lingkungan secara transparan.
