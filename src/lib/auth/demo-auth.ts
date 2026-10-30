import { cookies } from "next/headers";
import fs from "fs";
import path from "path";
import { ProfileRow, TransactionRow, UserRole } from "@/types/database";

export const DEMO_SESSION_COOKIE = "sirkula_demo_session";

export interface DemoSessionData {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  created_at: string;
}

export interface DemoStoredUser {
  id: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  phone?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  created_at: string;
}

export interface DemoBatchWithFactory {
  id: string;
  factory_id: string;
  factory_name: string;
  quantity_kg: number;
  reserved_kg: number;
  sold_kg: number;
  price_per_kg_idr: number;
  latitude: number;
  longitude: number;
  prepared_at: string;
  expires_at: string;
  description: string | null;
  status: "available" | "paused" | "sold_out" | "expired" | "cancelled";
  created_at: string;
  updated_at: string;
}

// Preserve demo data in memory across hot reloads in development
const globalForDemoAuth = globalThis as unknown as {
  __demoUsers?: Map<string, DemoStoredUser>;
  __demoBatches?: Map<string, DemoBatchWithFactory>;
  __demoTransactions?: Map<string, TransactionRow>;
  __demoPins?: Map<string, string>;
};

export const demoUsers =
  globalForDemoAuth.__demoUsers ?? new Map<string, DemoStoredUser>();
export const demoBatches =
  globalForDemoAuth.__demoBatches ?? new Map<string, DemoBatchWithFactory>();
export const demoTransactions =
  globalForDemoAuth.__demoTransactions ?? new Map<string, TransactionRow>();
export const demoPins =
  globalForDemoAuth.__demoPins ?? new Map<string, string>();

if (process.env.NODE_ENV !== "production") {
  globalForDemoAuth.__demoUsers = demoUsers;
  globalForDemoAuth.__demoBatches = demoBatches;
  globalForDemoAuth.__demoTransactions = demoTransactions;
  globalForDemoAuth.__demoPins = demoPins;
}

// Seed initial demo accounts if not already seeded
if (demoUsers.size === 0) {
  demoUsers.set("peternak@sirkula.local", {
    id: "22222222-2222-2222-2222-222222222222",
    email: "peternak@sirkula.local",
    password: "password123",
    name: "Pak Wayan Peternak",
    role: "farmer",
    phone: "081987654321",
    latitude: -8.67,
    longitude: 115.22,
    created_at: "2026-10-21T00:00:00Z",
  });

  demoUsers.set("pabrik@sirkula.local", {
    id: "11111111-1111-1111-1111-111111111111",
    email: "pabrik@sirkula.local",
    password: "password123",
    name: "Pabrik Tahu Sumber Barokah",
    role: "factory",
    phone: "081234567890",
    latitude: -8.65,
    longitude: 115.21,
    created_at: "2026-10-21T00:00:00Z",
  });
}

// Seed initial demo batches if not already seeded
if (demoBatches.size === 0) {
  const now = Date.now();
  demoBatches.set("batch-101", {
    id: "batch-101",
    factory_id: "11111111-1111-1111-1111-111111111111",
    factory_name: "Pabrik Tahu Sumber Barokah",
    quantity_kg: 500,
    reserved_kg: 0,
    sold_kg: 100,
    price_per_kg_idr: 500,
    latitude: -8.6500,
    longitude: 115.2100,
    prepared_at: new Date(now - 2.5 * 3600 * 1000).toISOString(),
    expires_at: new Date(now + 9.5 * 3600 * 1000).toISOString(),
    description: "Ampas tahu putih super rebusan subuh, kadar air sedang.",
    status: "available",
    created_at: new Date(now - 2.5 * 3600 * 1000).toISOString(),
    updated_at: new Date(now - 2.5 * 3600 * 1000).toISOString(),
  });

  demoBatches.set("batch-102", {
    id: "batch-102",
    factory_id: "fac-2",
    factory_name: "Pabrik Tahu Pak Yan Sanur",
    quantity_kg: 300,
    reserved_kg: 0,
    sold_kg: 50,
    price_per_kg_idr: 600,
    latitude: -8.6800,
    longitude: 115.2600,
    prepared_at: new Date(now - 3.0 * 3600 * 1000).toISOString(),
    expires_at: new Date(now + 9.0 * 3600 * 1000).toISOString(),
    description: "Ampas tahu kuning kunyit alami, wangi dan padat.",
    status: "available",
    created_at: new Date(now - 3.0 * 3600 * 1000).toISOString(),
    updated_at: new Date(now - 3.0 * 3600 * 1000).toISOString(),
  });

  demoBatches.set("batch-103", {
    id: "batch-103",
    factory_id: "fac-3",
    factory_name: "Pabrik Tahu Sari Kedelai Ubung",
    quantity_kg: 600,
    reserved_kg: 0,
    sold_kg: 0,
    price_per_kg_idr: 460,
    latitude: -8.6300,
    longitude: 115.2000,
    prepared_at: new Date(now - 1.5 * 3600 * 1000).toISOString(),
    expires_at: new Date(now + 10.5 * 3600 * 1000).toISOString(),
    description: "Ampas tahu segar rebusan pertama jam 04:30 WITA.",
    status: "available",
    created_at: new Date(now - 1.5 * 3600 * 1000).toISOString(),
    updated_at: new Date(now - 1.5 * 3600 * 1000).toISOString(),
  });

  demoBatches.set("batch-104", {
    id: "batch-104",
    factory_id: "fac-4",
    factory_name: "Pabrik Tahu Lestari Gianyar",
    quantity_kg: 450,
    reserved_kg: 0,
    sold_kg: 100,
    price_per_kg_idr: 540,
    latitude: -8.5500,
    longitude: 115.3200,
    prepared_at: new Date(now - 8.5 * 3600 * 1000).toISOString(),
    expires_at: new Date(now + 3.5 * 3600 * 1000).toISOString(),
    description: "Ampas kedelai super batch subuh, cocok untuk pakan fermentasi.",
    status: "available",
    created_at: new Date(now - 8.5 * 3600 * 1000).toISOString(),
    updated_at: new Date(now - 8.5 * 3600 * 1000).toISOString(),
  });
}

// Seed initial demo transactions
if (demoTransactions.size === 0) {
  demoTransactions.set("tx-demo-1", {
    id: "tx-demo-1",
    batch_id: "batch-101",
    farmer_id: "22222222-2222-2222-2222-222222222222",
    factory_id: "11111111-1111-1111-1111-111111111111",
    quantity_kg: 150,
    unit_price_idr: 500,
    total_amount_idr: 91000,
    status: "paid_simulated",
    payment_mode: "simulation",
    idempotency_key: "idem-demo-1",
    cancel_reason: null,
    created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    completed_at: null,
  });
  demoPins.set("tx-demo-1", "847291");
}

const DEMO_STORAGE_FILE = path.join(process.cwd(), ".demo-storage.json");

/**
 * Menyimpan data demo ke file JSON lokal agar tidak hilang saat server restart
 */
export function persistDemoData() {
  try {
    const payload = {
      users: Array.from(demoUsers.values()),
      transactions: Array.from(demoTransactions.values()),
      pins: Object.fromEntries(demoPins.entries()),
    };
    fs.writeFileSync(DEMO_STORAGE_FILE, JSON.stringify(payload, null, 2), "utf-8");
  } catch {
    // Abaikan jika lingkungan tidak memiliki izin tulis file
  }
}

/**
 * Memulihkan data demo dari file JSON lokal
 */
function loadDemoData() {
  try {
    if (fs.existsSync(DEMO_STORAGE_FILE)) {
      const raw = fs.readFileSync(DEMO_STORAGE_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.users)) {
        for (const u of parsed.users) {
          demoUsers.set(u.email, u);
        }
      }
      if (Array.isArray(parsed.transactions)) {
        for (const tx of parsed.transactions) {
          demoTransactions.set(tx.id, tx);
        }
      }
      if (parsed.pins && typeof parsed.pins === "object") {
        for (const [k, v] of Object.entries(parsed.pins)) {
          demoPins.set(k, v as string);
        }
      }
    }
  } catch {
    // Abaikan kegagalan parsing
  }
}

// Muat data demo tersimpan saat inisialisasi
loadDemoData();

/**
 * Memeriksa apakah Supabase telah dikonfigurasi dengan URL & Anon Key yang valid
 */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) return false;
  if (
    url.includes("dummy.supabase.co") ||
    anonKey === "dummy-anon-key" ||
    url.includes("...") ||
    url.includes("placeholder")
  ) {
    return false;
  }

  return true;
}

/**
 * Mengambil data sesi demo dari cookie
 */
export function getDemoSession(): DemoSessionData | null {
  try {
    const cookieStore = cookies();
    const cookie = cookieStore.get(DEMO_SESSION_COOKIE);
    if (!cookie?.value) return null;
    return JSON.parse(cookie.value) as DemoSessionData;
  } catch {
    return null;
  }
}

/**
 * Menyimpan sesi demo ke HTTP cookie
 */
export function setDemoSession(data: DemoSessionData) {
  try {
    const cookieStore = cookies();
    cookieStore.set(DEMO_SESSION_COOKIE, JSON.stringify(data), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 hari
    });
  } catch {
    // Abaikan jika dipanggil di luar konteks response yang mendukung manipulasi header
  }
}

/**
 * Menghapus cookie sesi demo
 */
export function clearDemoSession() {
  try {
    const cookieStore = cookies();
    cookieStore.delete(DEMO_SESSION_COOKIE);
  } catch {
    // Abaikan jika dipanggil di luar konteks response
  }
}

/**
 * Mendaftarkan akun baru di penyimpanan demo lokal
 */
export function registerDemoUser(input: {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  phone?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}): {
  user?: { id: string; email: string };
  profile?: ProfileRow;
  error?: string;
} {
  const normalizedEmail = input.email.toLowerCase().trim();

  if (demoUsers.has(normalizedEmail)) {
    return {
      error: "Email ini sudah terdaftar. Silakan masuk atau gunakan email lain.",
    };
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const newStoredUser: DemoStoredUser = {
    id,
    email: normalizedEmail,
    password: input.password,
    name: input.name,
    role: input.role,
    phone: input.phone ?? null,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    created_at: now,
  };

  demoUsers.set(normalizedEmail, newStoredUser);
  persistDemoData();

  const profile: ProfileRow = {
    id,
    name: input.name,
    role: input.role,
    phone: input.phone ?? null,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    created_at: now,
    updated_at: now,
  };

  return {
    user: { id, email: normalizedEmail },
    profile,
  };
}

/**
 * Memverifikasi kredensial login demo
 */
export function verifyDemoLogin(
  email: string,
  password: string
): {
  user?: { id: string; email: string };
  profile?: ProfileRow;
  error?: string;
} {
  const normalizedEmail = email.toLowerCase().trim();
  const existing = demoUsers.get(normalizedEmail);

  if (!existing) {
    return {
      error: "Akun dengan email ini belum terdaftar. Silakan buat akun terlebih dahulu.",
    };
  }

  if (existing.password !== password) {
    return {
      error: "Email atau kata sandi yang Anda masukkan salah.",
    };
  }

  const profile: ProfileRow = {
    id: existing.id,
    name: existing.name,
    role: existing.role,
    phone: existing.phone ?? null,
    latitude: existing.latitude ?? null,
    longitude: existing.longitude ?? null,
    created_at: existing.created_at,
    updated_at: existing.created_at,
  };

  return {
    user: { id: existing.id, email: existing.email },
    profile,
  };
}
