import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { requireRole } from "@/lib/auth/require-role";
import { BatchService } from "@/lib/services/batch.service";
import { handleApiError } from "@/lib/errors/api-error";
import { ApiSuccessResponse, BatchItemResponse } from "@/types/api";

interface RouteParams {
  params: {
    batchId: string;
  };
}

/**
 * POST /api/v1/batches/:batchId/deactivate
 * Menonaktifkan listing batch ampas tahu milik pabrik.
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { batchId } = params;
    const { user, profile, supabase } = await requireUser(req);
    requireRole(profile, ["factory"]);

    const deactivatedBatch = await BatchService.deactivateBatch(
      supabase,
      batchId,
      user.id
    );

    return NextResponse.json<ApiSuccessResponse<BatchItemResponse>>({
      data: deactivatedBatch,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
