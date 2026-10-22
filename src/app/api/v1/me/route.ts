import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { updateProfileSchema } from "@/lib/validation/profile.schema";
import { ProfileService } from "@/lib/services/profile.service";
import { createErrorResponse, handleApiError } from "@/lib/errors/api-error";
import { ApiSuccessResponse, UserProfileResponse } from "@/types/api";

/**
 * GET /api/v1/me
 * Mengambil profil lengkap pengguna yang sedang aktif (terautentikasi).
 */
export async function GET(req: NextRequest) {
  try {
    const { user, supabase } = await requireUser(req);
    const profile = await ProfileService.getProfile(supabase, user.id);

    return NextResponse.json<ApiSuccessResponse<UserProfileResponse>>({
      data: profile,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

/**
 * PATCH /api/v1/me
 * Memperbarui data profil aman milik pengguna aktif (nama, telepon, koordinat lokasi).
 * Role dan data sensitif tidak dapat diubah melalui endpoint ini.
 */
export async function PATCH(req: NextRequest) {
  try {
    const { user, supabase } = await requireUser(req);

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return createErrorResponse("VALIDATION_ERROR", "Body JSON tidak valid.");
    }

    // Role, id, created_at, or privileged fields are stripped/ignored by schema
    const parseResult = updateProfileSchema.safeParse(body);
    if (!parseResult.success) {
      const details: Record<string, string> = {};
      const issues = parseResult.error.issues ?? [];
      issues.forEach((issue) => {
        const path = issue.path.join(".") || "body";
        details[path] = issue.message;
      });
      return createErrorResponse("VALIDATION_ERROR", "Request tidak valid.", details);
    }

    // Pastikan jika body kosong sama sekali tetap valid atau informatif
    const updatedProfile = await ProfileService.updateProfile(
      supabase,
      user.id,
      parseResult.data
    );

    return NextResponse.json<ApiSuccessResponse<UserProfileResponse>>({
      data: updatedProfile,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
