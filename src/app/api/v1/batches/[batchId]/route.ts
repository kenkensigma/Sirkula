import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { requireRole } from "@/lib/auth/require-role";
import { updateBatchSchema } from "@/lib/validation/batch.schema";
import { BatchService } from "@/lib/services/batch.service";
import { createErrorResponse, handleApiError } from "@/lib/errors/api-error";
import { ApiSuccessResponse, BatchItemResponse } from "@/types/api";
import { GeoCoordinates, isValidCoordinate } from "@/lib/geo/haversine";

interface RouteParams {
  params: {
    batchId: string;
  };
}

/**
 * GET /api/v1/batches/:batchId
 * Mengambil detail satu batch ampas tahu beserta estimasi jarak (bila koordinat tersedia).
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { batchId } = params;

    // Titik koordinat acuan opsional (dari query parameter atau user profil)
    const latParam = req.nextUrl.searchParams.get("lat");
    const lngParam = req.nextUrl.searchParams.get("lng");

    let originCoords: GeoCoordinates | undefined;
    if (latParam !== null && lngParam !== null) {
      const lat = parseFloat(latParam);
      const lng = parseFloat(lngParam);
      if (isValidCoordinate(lat, lng)) {
        originCoords = { latitude: lat, longitude: lng };
      }
    }

    let supabaseClient;
    try {
      const auth = await requireUser(req);
      supabaseClient = auth.supabase;
      if (!originCoords && auth.profile.latitude !== null && auth.profile.longitude !== null) {
        originCoords = {
          latitude: auth.profile.latitude,
          longitude: auth.profile.longitude,
        };
      }
    } catch {
      const { createClient } = await import("@/lib/supabase/server");
      supabaseClient = createClient();
    }

    const batch = await BatchService.getBatchById(supabaseClient, batchId, originCoords);

    return NextResponse.json<ApiSuccessResponse<BatchItemResponse>>({
      data: batch,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

/**
 * PATCH /api/v1/batches/:batchId
 * Memperbarui harga, kuantitas, atau deskripsi batch oleh pabrik pemilik.
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { batchId } = params;
    const { user, profile, supabase } = await requireUser(req);
    requireRole(profile, ["factory"]);

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return createErrorResponse("VALIDATION_ERROR", "Body JSON tidak valid.");
    }

    const parseResult = updateBatchSchema.safeParse(body);
    if (!parseResult.success) {
      const details: Record<string, string> = {};
      const issues = parseResult.error.issues ?? [];
      issues.forEach((issue) => {
        const path = issue.path.join(".") || "body";
        details[path] = issue.message;
      });
      return createErrorResponse("VALIDATION_ERROR", "Data pembaruan batch tidak valid.", details);
    }

    const updatedBatch = await BatchService.updateBatch(
      supabase,
      batchId,
      user.id,
      parseResult.data
    );

    return NextResponse.json<ApiSuccessResponse<BatchItemResponse>>({
      data: updatedBatch,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
