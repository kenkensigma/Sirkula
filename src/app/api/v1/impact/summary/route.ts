import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ImpactService } from "@/lib/services/impact.service";
import { handleApiError } from "@/lib/errors/api-error";
import { ApiSuccessResponse, ImpactSummaryResponse } from "@/types/api";

/**
 * GET /api/v1/impact/summary
 * Mengambil ringkasan dampak lingkungan dan penghematan biaya pakan dari transaksi yang telah selesai.
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const from = searchParams.get("from") ?? undefined;
    const to = searchParams.get("to") ?? undefined;

    const supabase = createClient();
    const summary = await ImpactService.getSummary(supabase, { from, to });

    return NextResponse.json<ApiSuccessResponse<ImpactSummaryResponse>>({
      data: summary,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
