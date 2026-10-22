import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { requireRole } from "@/lib/auth/require-role";
import { createBatchSchema, listBatchesQuerySchema } from "@/lib/validation/batch.schema";
import { BatchService } from "@/lib/services/batch.service";
import { createErrorResponse, handleApiError } from "@/lib/errors/api-error";
import { ApiSuccessResponse, BatchItemResponse } from "@/types/api";
import { GeoCoordinates } from "@/lib/geo/haversine";

/**
 * GET /api/v1/batches
 * Mengambil daftar batch ampas tahu dengan filter jarak (radius maks 15 km), status, dan pagination.
 */
export async function GET(req: NextRequest) {
  try {
    // Ambil user jika ada (opsional untuk listing publik, namun jika ada kita gunakan koordinatnya)
    let userRole = "farmer";
    let userId = "";
    let profileCoords: GeoCoordinates | undefined;
    let supabaseClient;

    try {
      const auth = await requireUser(req);
      userRole = auth.profile.role;
      userId = auth.profile.id;
      supabaseClient = auth.supabase;
      if (auth.profile.latitude !== null && auth.profile.longitude !== null) {
        profileCoords = {
          latitude: auth.profile.latitude,
          longitude: auth.profile.longitude,
        };
      }
    } catch {
      // Unauthenticated request: gunakan client standar
      const { createClient } = await import("@/lib/supabase/server");
      supabaseClient = createClient();
    }

    // Parse query params
    const searchParams = req.nextUrl.searchParams;
    const rawQuery: Record<string, unknown> = {};

    if (searchParams.has("lat")) rawQuery.lat = searchParams.get("lat");
    if (searchParams.has("lng")) rawQuery.lng = searchParams.get("lng");
    if (searchParams.has("radius_km")) rawQuery.radius_km = searchParams.get("radius_km");
    if (searchParams.has("status")) rawQuery.status = searchParams.get("status");
    if (searchParams.has("sort")) rawQuery.sort = searchParams.get("sort");
    if (searchParams.has("page")) rawQuery.page = searchParams.get("page");
    if (searchParams.has("limit")) rawQuery.limit = searchParams.get("limit");

    const parseResult = listBatchesQuerySchema.safeParse(rawQuery);
    if (!parseResult.success) {
      const details: Record<string, string> = {};
      const issues = parseResult.error.issues ?? [];
      issues.forEach((issue) => {
        const path = issue.path.join(".") || "query";
        details[path] = issue.message;
      });
      return createErrorResponse("VALIDATION_ERROR", "Parameter query tidak valid.", details);
    }

    const { items, pagination } = await BatchService.listBatches(
      supabaseClient,
      userRole,
      userId,
      parseResult.data,
      profileCoords
    );

    return NextResponse.json<ApiSuccessResponse<BatchItemResponse[]>>({
      data: items,
      meta: {
        pagination,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}

/**
 * POST /api/v1/batches
 * Membuat listing batch ampas tahu baru. Hanya dapat diakses oleh role 'factory'.
 */
export async function POST(req: NextRequest) {
  try {
    const { user, profile, supabase } = await requireUser(req);
    requireRole(profile, ["factory"]);

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return createErrorResponse("VALIDATION_ERROR", "Body JSON tidak valid.");
    }

    const parseResult = createBatchSchema.safeParse(body);
    if (!parseResult.success) {
      const details: Record<string, string> = {};
      const issues = parseResult.error.issues ?? [];
      issues.forEach((issue) => {
        const path = issue.path.join(".") || "body";
        details[path] = issue.message;
      });
      return createErrorResponse("VALIDATION_ERROR", "Data pembuatan batch tidak valid.", details);
    }

    const newBatch = await BatchService.createBatch(
      supabase,
      user.id,
      profile.name,
      parseResult.data
    );

    return NextResponse.json<ApiSuccessResponse<BatchItemResponse>>(
      {
        data: newBatch,
      },
      { status: 201 }
    );
  } catch (err) {
    return handleApiError(err);
  }
}
