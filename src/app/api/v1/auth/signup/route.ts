import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { signupSchema } from "@/lib/validation/auth.schema";
import { ProfileRepository } from "@/lib/repositories/profile.repository";
import { ProfileService } from "@/lib/services/profile.service";
import { createErrorResponse, handleApiError } from "@/lib/errors/api-error";
import { ApiSuccessResponse, UserProfileResponse } from "@/types/api";

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
    const supabase = createClient();

    // 1. Daftarkan akun di Supabase Auth
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

    // 2. Buat profil di public.profiles via Admin Client (bypass RLS insert check yang dibatasi)
    const profile = await ProfileRepository.createProfile({
      id: authData.user.id,
      name: input.name,
      role: input.role,
      phone: input.phone ?? null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
    });

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
