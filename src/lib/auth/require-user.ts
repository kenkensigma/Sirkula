import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient, SupabaseClient, User } from "@supabase/supabase-js";
import { Database, ProfileRow } from "@/types/database";
import { ApiError } from "@/lib/errors/api-error";
import { ProfileRepository } from "@/lib/repositories/profile.repository";

export interface AuthenticatedContext {
  user: User;
  profile: ProfileRow;
  supabase: SupabaseClient<Database>;
}

/**
 * Mengautentikasi request saat ini dan memuat user beserta profilnya.
 * Mendukung autentikasi via Supabase session cookie (SSR) maupun Authorization Bearer token.
 * Melempar ApiError UNAUTHENTICATED (401) jika belum login/sesi kedaluwarsa.
 * Melempar ApiError NOT_FOUND (404) jika user auth ada namun profil database belum ditemukan.
 */
export async function requireUser(req?: Request): Promise<AuthenticatedContext> {
  const authHeader = req?.headers?.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : null;

  let supabase: SupabaseClient<Database>;
  let user: User | null = null;

  if (bearerToken) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
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
