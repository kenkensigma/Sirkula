import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validation/auth.schema";
import { ProfileRepository } from "@/lib/repositories/profile.repository";
import { ProfileService } from "@/lib/services/profile.service";
import { createErrorResponse, handleApiError } from "@/lib/errors/api-error";
import { ApiSuccessResponse, UserProfileResponse } from "@/types/api";

interface LoginResponseData {
  user: {
    id: string;
    email?: string;
  };
  profile: UserProfileResponse | null;
  session: unknown;
}

/**
 * POST /api/v1/auth/login
 * Melakukan autentikasi menggunakan email dan password, mengembalikan session token dan profil pengguna.
 * Mendukung fallback session cookie untuk mode offline / pengembangan lokal.
 */
export async function POST(req: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return createErrorResponse("VALIDATION_ERROR", "Body JSON tidak valid.");
    }

    const parseResult = loginSchema.safeParse(body);
    if (!parseResult.success) {
      const details: Record<string, string> = {};
      const issues = parseResult.error.issues ?? [];
      issues.forEach((issue) => {
        const path = issue.path.join(".") || "body";
        details[path] = issue.message;
      });
      return createErrorResponse("VALIDATION_ERROR", "Data login tidak valid.", details);
    }

    const { email, password } = parseResult.data;
    const supabase = createClient();

    // Attempt Supabase Auth login
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!authError && authData.user) {
        // Supabase login succeeded — return session + set cookie
        const profile = await ProfileRepository.getById(supabase, authData.user.id);

        const response = NextResponse.json<ApiSuccessResponse<LoginResponseData>>({
          data: {
            user: {
              id: authData.user.id,
              email: authData.user.email,
            },
            profile: profile ? ProfileService.formatProfileResponse(profile) : null,
            session: authData.session,
          },
        });

        // Set fallback session cookie as well
        response.cookies.set(
          "sirkula_session",
          JSON.stringify({
            id: authData.user.id,
            email: authData.user.email,
            name: profile?.name || authData.user.user_metadata?.name || "Pengguna Sirkula",
            role: profile?.role || authData.user.user_metadata?.role || "farmer",
            phone: profile?.phone || null,
          }),
          {
            httpOnly: true,
            path: "/",
            maxAge: 60 * 60 * 24 * 7,
            sameSite: "lax",
          }
        );

        return response;
      }

      // Check if this is a connection failure (offline mode) vs actual invalid credentials
      if (
        authError &&
        (authError.message.toLowerCase().includes("fetch failed") ||
          authError.message.toLowerCase().includes("enotfound") ||
          authError.message.toLowerCase().includes("failed to fetch") ||
          authError.message.toLowerCase().includes("network") ||
          authError.message.toLowerCase().includes("econnrefused"))
      ) {
        // Supabase is unreachable — fall through to cookie-based login below
      } else {
        // Real auth failure (bad credentials)
        return createErrorResponse(
          "UNAUTHENTICATED",
          "Email atau password yang dimasukkan salah."
        );
      }
    } catch {
      // Network exception — fall through to offline login
    }

    // Offline/local fallback: check if there's a matching sirkula_session cookie
    // or look for a matching registered user via a simple cookie-based registry
    try {
      const { cookies } = await import("next/headers");
      const cookieStore = cookies();
      const existingSessionRaw = cookieStore.get("sirkula_session")?.value;

      if (existingSessionRaw) {
        const parsed = JSON.parse(existingSessionRaw);
        if (parsed && parsed.email === email) {
          // Re-validate with existing cookie session
          const response = NextResponse.json<ApiSuccessResponse<LoginResponseData>>({
            data: {
              user: { id: parsed.id, email: parsed.email },
              profile: {
                id: parsed.id,
                name: parsed.name || "Pengguna Sirkula",
                role: parsed.role || "farmer",
                phone: parsed.phone || null,
                location: { latitude: -8.67, longitude: 115.22 },
                created_at: new Date().toISOString(),
              } as UserProfileResponse,
              session: null,
            },
          });

          // Refresh the cookie
          response.cookies.set(
            "sirkula_session",
            existingSessionRaw,
            {
              httpOnly: true,
              path: "/",
              maxAge: 60 * 60 * 24 * 7,
              sameSite: "lax",
            }
          );

          return response;
        }
      }
    } catch {
      // Cookie access failed
    }

    // Check localStorage-style registered users via a server-side users registry cookie
    try {
      const { cookies } = await import("next/headers");
      const cookieStore = cookies();
      const registryRaw = cookieStore.get("sirkula_users_registry")?.value;

      if (registryRaw) {
        const registry: Array<{ email: string; password: string; id: string; name: string; role: string; phone?: string }> =
          JSON.parse(registryRaw);
        const matchedUser = registry.find((u) => u.email === email && u.password === password);

        if (matchedUser) {
          const response = NextResponse.json<ApiSuccessResponse<LoginResponseData>>({
            data: {
              user: { id: matchedUser.id, email: matchedUser.email },
              profile: {
                id: matchedUser.id,
                name: matchedUser.name,
                role: matchedUser.role,
                phone: matchedUser.phone || null,
                location: { latitude: -8.67, longitude: 115.22 },
                created_at: new Date().toISOString(),
              } as UserProfileResponse,
              session: null,
            },
          });

          response.cookies.set(
            "sirkula_session",
            JSON.stringify({
              id: matchedUser.id,
              email: matchedUser.email,
              name: matchedUser.name,
              role: matchedUser.role,
              phone: matchedUser.phone || null,
            }),
            {
              httpOnly: true,
              path: "/",
              maxAge: 60 * 60 * 24 * 7,
              sameSite: "lax",
            }
          );

          return response;
        }
      }
    } catch {
      // Registry not available
    }

    return createErrorResponse(
      "UNAUTHENTICATED",
      "Email atau password yang dimasukkan salah."
    );
  } catch (err) {
    return handleApiError(err);
  }
}
