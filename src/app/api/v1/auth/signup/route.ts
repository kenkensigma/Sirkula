import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { signupSchema } from "@/lib/validation/auth.schema";
import { ProfileRepository } from "@/lib/repositories/profile.repository";
import { ProfileService } from "@/lib/services/profile.service";
import { createErrorResponse, handleApiError } from "@/lib/errors/api-error";
import { ApiSuccessResponse, UserProfileResponse } from "@/types/api";
import { isSupabaseConfigured, registerDemoUser, setDemoSession } from "@/lib/auth/demo-auth";

interface SignupResponseData {
  user: {
    id: string;
    email?: string;
  };
  profile: UserProfileResponse;
  session: unknown;
}

/**
 * POST /api/v1/auth/signup
 * Mendaftarkan user baru di Supabase Auth dan membuat profile terverifikasi dengan role yang ditentukan ('factory' atau 'farmer').
 * Mendukung fallback offline/local mode via cookie-based user registry.
 */
export async function POST(req: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return createErrorResponse("VALIDATION_ERROR", "Body JSON tidak valid.");
    }

    const parseResult = signupSchema.safeParse(body);
    if (!parseResult.success) {
      const details: Record<string, string> = {};
      const issues = parseResult.error.issues ?? [];
      issues.forEach((issue) => {
        const path = issue.path.join(".") || "body";
        details[path] = issue.message;
      });
      return createErrorResponse("VALIDATION_ERROR", "Data registrasi tidak valid.", details);
    }

    const input = parseResult.data;

    // 1. Dukungan Demo Mode jika Supabase belum dikonfigurasi
    if (!isSupabaseConfigured()) {
      const { user, profile, error } = registerDemoUser({
        email: input.email,
        password: input.password,
        name: input.name,
        role: input.role,
        phone: input.phone,
        latitude: input.latitude,
        longitude: input.longitude,
      });

      if (error || !user || !profile) {
        return createErrorResponse(
          "STATE_CONFLICT",
          error || "Gagal membuat akun demo."
        );
      }

      setDemoSession({
        id: user.id,
        email: user.email,
        name: profile.name,
        role: profile.role,
        phone: profile.phone ?? null,
        latitude: profile.latitude ?? null,
        longitude: profile.longitude ?? null,
        created_at: profile.created_at,
      });

      return NextResponse.json<ApiSuccessResponse<SignupResponseData>>(
        {
          data: {
            user: {
              id: user.id,
              email: user.email,
            },
            profile: ProfileService.formatProfileResponse(profile),
            session: {
              access_token: "demo-access-token",
              token_type: "bearer",
            },
          },
        },
        { status: 201 }
      );
    }

    // 2. Real Supabase Auth
    const supabase = createClient();

    let authUserId: string;
    let authUserEmail: string = input.email;
    let authSession: unknown = null;
    let createdProfile;
    let isOfflineMode = false;

    // 1. Daftarkan akun di Supabase Auth jika koneksi tersedia
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          data: {
            name: input.name,
            role: input.role,
          },
        },
      });

      if (authError || !authData.user) {
        if (
          authError &&
          !authError.message.toLowerCase().includes("fetch failed") &&
          !authError.message.toLowerCase().includes("enotfound") &&
          !authError.message.toLowerCase().includes("failed to fetch")
        ) {
          return createErrorResponse("VALIDATION_ERROR", authError.message);
        }
        // Fallback untuk offline / mock mode
        authUserId = `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        isOfflineMode = true;
      } else {
        authUserId = authData.user.id;
        authUserEmail = authData.user.email || input.email;
        authSession = authData.session;
      }
    } catch {
      authUserId = `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      isOfflineMode = true;
    }

    // 2. Buat profil di public.profiles via Admin Client jika koneksi tersedia
    try {
      const profile = await ProfileRepository.createProfile({
        id: authUserId,
        name: input.name,
        role: input.role,
        phone: input.phone ?? null,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
      });

      createdProfile = profile;
    } catch {
      createdProfile = {
        id: authUserId,
        name: input.name,
        role: input.role,
        phone: input.phone ?? null,
        latitude: input.latitude ?? -8.67,
        longitude: input.longitude ?? 115.22,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    const response = NextResponse.json<ApiSuccessResponse<SignupResponseData>>(
      {
        data: {
          user: {
            id: authUserId,
            email: authUserEmail,
          },
          profile: ProfileService.formatProfileResponse(createdProfile),
          session: authSession,
        },
      },
      { status: 201 }
    );

    // Set session cookie (active session)
    response.cookies.set(
      "sirkula_session",
      JSON.stringify({
        id: authUserId,
        email: authUserEmail,
        name: input.name,
        role: input.role,
        phone: input.phone || null,
      }),
      {
        httpOnly: true,
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
        sameSite: "lax",
      }
    );

    // In offline mode, also save to user registry cookie so login can find them
    if (isOfflineMode) {
      try {
        const { cookies } = await import("next/headers");
        const cookieStore = cookies();
        const existingRegistryRaw = cookieStore.get("sirkula_users_registry")?.value;
        let registry: Array<{ email: string; password: string; id: string; name: string; role: string; phone?: string }> = [];

        if (existingRegistryRaw) {
          try {
            registry = JSON.parse(existingRegistryRaw);
          } catch {
            registry = [];
          }
        }

        // Avoid duplicates
        const alreadyExists = registry.some((u) => u.email === input.email);
        if (!alreadyExists) {
          registry.push({
            email: input.email,
            password: input.password,
            id: authUserId,
            name: input.name,
            role: input.role,
            phone: input.phone || undefined,
          });
        }

        response.cookies.set(
          "sirkula_users_registry",
          JSON.stringify(registry),
          {
            httpOnly: true,
            path: "/",
            maxAge: 60 * 60 * 24 * 30,
            sameSite: "lax",
          }
        );
      } catch {
        // Cookie registry save failed — non-critical
      }
    }

    return response;
  } catch (err) {
    return handleApiError(err);
  }
}
