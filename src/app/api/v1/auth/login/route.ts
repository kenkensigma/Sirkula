import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validation/auth.schema";
import { ProfileRepository } from "@/lib/repositories/profile.repository";
import { ProfileService } from "@/lib/services/profile.service";
import { createErrorResponse, handleApiError } from "@/lib/errors/api-error";
import { ApiSuccessResponse, UserProfileResponse } from "@/types/api";
import { isSupabaseConfigured, verifyDemoLogin, setDemoSession } from "@/lib/auth/demo-auth";

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

    // 1. Dukungan Demo Mode jika Supabase belum dikonfigurasi
    if (!isSupabaseConfigured()) {
      const { user, profile, error } = verifyDemoLogin(email, password);

      if (error || !user || !profile) {
        return createErrorResponse(
          "UNAUTHENTICATED",
          error || "Email atau password yang dimasukkan salah."
        );
      }

      setDemoSession(profile);

      return NextResponse.json<ApiSuccessResponse<LoginResponseData>>({
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
      });
    }

    // 2. Real Supabase Auth
    const supabase = createClient();

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      return createErrorResponse(
        "UNAUTHENTICATED",
        authError?.message || "Email atau password yang dimasukkan salah."
      );
    }

    const profile = await ProfileRepository.getById(supabase, authData.user.id);

    return NextResponse.json<ApiSuccessResponse<LoginResponseData>>({
      data: {
        user: {
          id: authData.user.id,
          email: authData.user.email,
        },
        profile: profile ? ProfileService.formatProfileResponse(profile) : null,
        session: authData.session,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
