export interface FactoryBatch {
  id: string;
  itemName: string;
  itemType: "ampas_tahu_putih" | "ampas_tahu_kuning" | "ampas_kedelai_super";
  itemSubtitle: string;
  preparedAtHoursAgo: number; // in hours ago
  totalSacks: number;
  availableSacks: number;
  weightPerSackKg: number;
  pricePerSackIdr: number;
  pricePerKgIdr: number;
  discountPercent?: number;
  freshnessZone: "green" | "yellow" | "expired";
  qualityNotes: string;
  proteinContent: string;
  moistureContent: string;
  temperatureStatus: string;
}

export interface FactoryLocation {
  id: string;
  name: string;
  district: string;
  address: string;
  latitude: number;
  longitude: number;
  verified: boolean;
  rating: number;
  reviewsCount: number;
  phone: string;
  operatingHours: string;
  activeBatch: FactoryBatch;
  sellerPhoto?: string;
}

export const USER_FARMER_LOCATION = {
  name: "Kandang Peternak Sapi Pak Wayan",
  role: "Peternak Rakyat",
  latitude: -8.6700,
  longitude: 115.2200,
  address: "Jl. Hayam Wuruk, Denpasar Timur, Bali",
  maxRadiusKm: 15,
};

export const MOCK_FACTORIES: FactoryLocation[] = [
  {
    id: "fac-1",
    name: "Pabrik Tahu Sumber Barokah",
    district: "Denpasar Barat",
    address: "Jl. Gunung Agung No. 88, Denpasar",
    latitude: -8.6500,
    longitude: 115.2100,
    verified: true,
    rating: 4.9,
    reviewsCount: 142,
    phone: "0812-3456-7890",
    operatingHours: "04:30 - 13:00 WITA",
    activeBatch: {
      id: "batch-101",
      itemName: "Ampas Tahu Segar Rebusan 1",
      itemType: "ampas_tahu_putih",
      itemSubtitle: "Kualitas Grade A • Press Hangat & Padat",
      preparedAtHoursAgo: 2.2, // ~2 hours 12 min ago -> GREEN
      totalSacks: 30,
      availableSacks: 22,
      weightPerSackKg: 50,
      pricePerSackIdr: 42500,
      pricePerKgIdr: 850,
      freshnessZone: "green",
      qualityNotes: "Baru selesai pres subuh tadi, aroma kedelai murni, tidak asam, tekstur lembut bergizi tinggi.",
      proteinContent: "26.4%",
      moistureContent: "81%",
      temperatureStatus: "Masih hangat (suhu ~38°C)",
    },
  },
  {
    id: "fac-2",
    name: "Sentra Tofu Lestari Sanur",
    district: "Denpasar Selatan",
    address: "Jl. Bypass Ngurah Rai No. 42, Sanur Kauh",
    latitude: -8.6850,
    longitude: 115.2450,
    verified: true,
    rating: 4.8,
    reviewsCount: 89,
    phone: "0819-8765-4321",
    operatingHours: "05:00 - 14:00 WITA",
    activeBatch: {
      id: "batch-102",
      itemName: "Ampas Tahu Kedelai Super",
      itemType: "ampas_kedelai_super",
      itemSubtitle: "Kadar Protein Tinggi • Khusus Penggemukan Sapi & Kambing",
      preparedAtHoursAgo: 4.5, // 4.5 hours ago -> GREEN
      totalSacks: 25,
      availableSacks: 16,
      weightPerSackKg: 50,
      pricePerSackIdr: 40000,
      pricePerKgIdr: 800,
      freshnessZone: "green",
      qualityNotes: "Disaring bersih dengan saringan kain halus, kadar air terkontrol, aman untuk lambung ternak.",
      proteinContent: "27.1%",
      moistureContent: "79%",
      temperatureStatus: "Suhu ruang optimal (bersih higienis)",
    },
  },
  {
    id: "fac-3",
    name: "Pabrik Tahu Rezeki Abadi",
    district: "Denpasar Utara",
    address: "Jl. Cokroaminoto No. 177, Ubung Kaja",
    latitude: -8.6310,
    longitude: 115.2010,
    verified: true,
    rating: 4.7,
    reviewsCount: 64,
    phone: "0821-4567-9801",
    operatingHours: "04:00 - 12:30 WITA",
    activeBatch: {
      id: "batch-103",
      itemName: "Ampas Tahu Putih (Diskon Cepat 15%)",
      itemType: "ampas_tahu_putih",
      itemSubtitle: "SLA Menjelang Batas • Wajib Jemput / Kirim Cepat",
      preparedAtHoursAgo: 9.1, // 9.1 hours ago -> YELLOW (Flash sale)
      totalSacks: 20,
      availableSacks: 8,
      weightPerSackKg: 50,
      pricePerSackIdr: 36000, // discounted from 42500
      pricePerKgIdr: 720,
      discountPercent: 15,
      freshnessZone: "yellow",
      qualityNotes: "Kondisi masih segar layak pakan segera hari ini. Diskon kilat otomatis 15% sebelum batas 12 jam.",
      proteinContent: "25.0%",
      moistureContent: "83%",
      temperatureStatus: "Wajib dikonsumsi ternak < 3 jam lagi",
    },
  },
  {
    id: "fac-4",
    name: "UD Sari Kedelai Merta",
    district: "Sukawati, Gianyar",
    address: "Jl. Raya Batubulan No. 15, Batubulan",
    latitude: -8.6180,
    longitude: 115.2750,
    verified: false,
    rating: 4.6,
    reviewsCount: 38,
    phone: "0878-1122-3344",
    operatingHours: "06:00 - 15:00 WITA",
    activeBatch: {
      id: "batch-104",
      itemName: "Ampas Tahu Organik Murni",
      itemType: "ampas_tahu_putih",
      itemSubtitle: "Kedelai Non-GMO • Tekstur Lembut & Wangi",
      preparedAtHoursAgo: 1.5, // 1.5 hours ago -> GREEN
      totalSacks: 40,
      availableSacks: 35,
      weightPerSackKg: 50,
      pricePerSackIdr: 45000,
      pricePerKgIdr: 900,
      freshnessZone: "green",
      qualityNotes: "Ampas hasil olahan tahu sutra pagi, warna putih susu bersih, sangat disukai ternak babi & kambing.",
      proteinContent: "26.8%",
      moistureContent: "80%",
      temperatureStatus: "Hangat segar produksi pagi",
    },
  },
  {
    id: "fac-5",
    name: "Koperasi Tahu Tempe Kuta",
    district: "Kuta, Badung",
    address: "Jl. Raya Tuban No. 50, Tuban",
    latitude: -8.7290,
    longitude: 115.1780,
    verified: true,
    rating: 4.8,
    reviewsCount: 115,
    phone: "0813-7766-5544",
    operatingHours: "05:00 - 16:00 WITA",
    activeBatch: {
      id: "batch-105",
      itemName: "Ampas Tahu Press Subuh",
      itemType: "ampas_tahu_putih",
      itemSubtitle: "Kapasitas Besar UMKM Kuta",
      preparedAtHoursAgo: 6.0, // 6 hours ago -> GREEN
      totalSacks: 50,
      availableSacks: 28,
      weightPerSackKg: 50,
      pricePerSackIdr: 41000,
      pricePerKgIdr: 820,
      freshnessZone: "green",
      qualityNotes: "Hasil rebusan kedelai kualitas super, kadar serat tinggi dan mudah dicampur bekatul / pakan konsentrat.",
      proteinContent: "25.9%",
      moistureContent: "82%",
      temperatureStatus: "Segar siap angkut",
    },
  },
];
