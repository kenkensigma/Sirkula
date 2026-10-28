import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient, SupabaseClient, User } from "@supabase/supabase-js";
import { Database, ProfileRow } from "@/types/database";
import { ApiError } from "@/lib/errors/api-error";
import { ProfileRepository } from "@/lib/repositories/profile.repository";
import { getDemoSession } from "@/lib/auth/demo-auth";

export interface AuthenticatedContext {
  user: User;
  profile: ProfileRow;
  supabase: SupabaseClient<Database>;
}

/**
 * Mengautentikasi request saat ini dan memuat user beserta profilnya.
 * Mendukung autentikasi via Supabase session cookie (SSR), Demo session cookie, maupun Authorization Bearer token.
 * Melempar ApiError UNAUTHENTICATED (401) jika belum login/sesi kedaluwarsa.
 * Melempar ApiError NOT_FOUND (404) jika user auth ada namun profil database belum ditemukan.
 */
export async function requireUser(req?: Request): Promise<AuthenticatedContext> {
  // 1. Periksa sesi demo terlebih dahulu
  const demoSession = getDemoSession();
  if (demoSession) {
    const profile: ProfileRow = {
      id: demoSession.id,
      name: demoSession.name,
      role: demoSession.role,
      phone: demoSession.phone ?? null,
      latitude: demoSession.latitude ?? null,
      longitude: demoSession.longitude ?? null,
      created_at: demoSession.created_at,
      updated_at: demoSession.created_at,
    };
    const user = {
      id: demoSession.id,
      email: demoSession.email,
      app_metadata: {},
      user_metadata: { name: demoSession.name, role: demoSession.role },
      aud: "authenticated",
      created_at: demoSession.created_at,
    } as User;

    return {
      user,
      profile,
      supabase: createServerClient(),
    };
  }

  // Check for local development session cookie first
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = cookies();
    const localSessionRaw = cookieStore.get("sirkula_session")?.value;
    if (localSessionRaw) {
      try {
        const parsed = JSON.parse(localSessionRaw);
        if (parsed && parsed.id) {
          const profile: ProfileRow = {
            id: parsed.id,
            name: parsed.name || "Pengguna Sirkula",
            role: parsed.role || "farmer",
            phone: parsed.phone || null,
            latitude: -8.67,
            longitude: 115.22,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          const localUser: User = {
            id: parsed.id,
            app_metadata: {},
            user_metadata: { name: parsed.name, role: parsed.role },
            aud: "authenticated",
            created_at: new Date().toISOString(),
            email: parsed.email || "",
          };
          const supabase = createServerClient();
          return { user: localUser, profile, supabase };
        }
      } catch {
        // Fall back to standard flow
      }
    }
  } catch {
    // In test environment or context without cookies
  }

  const authHeader = req?.headers?.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : null;

  let supabase: SupabaseClient<Database>;
  let user: User | null = null;

  if (bearerToken) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dummy.supabase.co";
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "dummy-anon-key";
    supabase = createSupabaseClient<Database>(url, anonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${bearerToken}`,
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data, error } = await supabase.auth.getUser(bearerToken);
    if (error || !data?.user) {
      throw new ApiError("UNAUTHENTICATED", "Sesi autentikasi tidak valid atau telah kedaluwarsa.");
    }
    user = data.user;
  } else {
    supabase = createServerClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) {
      throw new ApiError("UNAUTHENTICATED", "Sesi autentikasi tidak valid atau belum login.");
    }
    user = data.user;
  }

  const profile = await ProfileRepository.getById(supabase, user.id);
  if (!profile) {
    throw new ApiError("NOT_FOUND", "Profil pengguna tidak ditemukan.");
  }

  return { user, profile, supabase };
}
