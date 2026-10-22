import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { HandoverService } from "@/lib/services/handover.service";
import { handleApiError } from "@/lib/errors/api-error";
import { ApiSuccessResponse, TransactionItemResponse } from "@/types/api";

interface RouteParams {
  params: {
    transactionId: string;
  };
}

/**
 * POST /api/v1/transactions/:transactionId/mark-shipped
 * Pabrik menandai pesanan telah dikirim ke peternak (khusus role 'factory' pemilik).
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { transactionId } = params;
    const { profile, supabase } = await requireUser(req);

    const updatedTx = await HandoverService.markShipped(
      supabase,
      transactionId,
      profile
    );

    return NextResponse.json<ApiSuccessResponse<TransactionItemResponse>>({
      data: updatedTx,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
