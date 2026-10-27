import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { signupSchema } from "@/lib/validation/auth.schema";
import { ProfileRepository } from "@/lib/repositories/profile.repository";
import { ProfileService } from "@/lib/services/profile.service";
import { createErrorResponse, handleApiError } from "@/lib/errors/api-error";
import { ApiSuccessResponse, UserProfileResponse } from "@/types/api";
import { ProfileRow } from "@/types/database";
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
 * Mendaftarkan user baru di Supabase Auth (atau demo local auth) dan membuat profile dengan role yang ditentukan ('factory' atau 'farmer').
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

      setDemoSession(profile);

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
      return createErrorResponse(
        "VALIDATION_ERROR",
        authError?.message || "Gagal membuat akun autentikasi."
      );
    }

    // 3. Buat / perbarui profil di public.profiles via Admin Client
    let profile: ProfileRow;
    try {
      profile = await ProfileRepository.createProfile({
        id: authData.user.id,
        name: input.name,
        role: input.role,
        phone: input.phone ?? null,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
      });
    } catch {
      // Jika profile sudah dibuat oleh PostgreSQL trigger on_auth_user_created, ambil profilnya
      const existing = await ProfileRepository.getById(supabase, authData.user.id);
      if (existing) {
        profile = existing;
      } else {
        throw new Error("Gagal membuat profil pengguna setelah pendaftaran.");
      }
    }

    return NextResponse.json<ApiSuccessResponse<SignupResponseData>>(
      {
        data: {
          user: {
            id: authData.user.id,
            email: authData.user.email,
          },
          profile: ProfileService.formatProfileResponse(profile),
          session: authData.session,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    return handleApiError(err);
  }
}
