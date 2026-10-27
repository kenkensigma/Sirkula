import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { handleApiError } from "@/lib/errors/api-error";
import { ApiSuccessResponse } from "@/types/api";
import { clearDemoSession, isSupabaseConfigured } from "@/lib/auth/demo-auth";

/**
 * POST /api/v1/auth/logout
 * Menghapus sesi Supabase / Demo pengguna aktif dan menghapus cookies autentikasi.
 */
export async function POST() {
  try {
    clearDemoSession();

    if (isSupabaseConfigured()) {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
    }

    return NextResponse.json<ApiSuccessResponse<{ message: string }>>({
      data: {
        message: "Berhasil logout.",
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
