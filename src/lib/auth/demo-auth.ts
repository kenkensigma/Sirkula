import { cookies } from "next/headers";
import { ProfileRow, UserRole } from "@/types/database";

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

// Preserve demo users in memory across hot reloads in development
const globalForDemoAuth = globalThis as unknown as {
  __demoUsers?: Map<string, DemoStoredUser>;
};

export const demoUsers =
  globalForDemoAuth.__demoUsers ?? new Map<string, DemoStoredUser>();

if (process.env.NODE_ENV !== "production") {
  globalForDemoAuth.__demoUsers = demoUsers;
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

/**
 * Memeriksa apakah Supabase telah dikonfigurasi dengan URL & Anon Key yang valid
 */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) return false;
  if (url.includes("dummy.supabase.co") || anonKey === "dummy-anon-key") return false;

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
