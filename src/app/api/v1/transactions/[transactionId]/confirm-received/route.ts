import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { ConfirmReceivedResult, HandoverService } from "@/lib/services/handover.service";
import { handleApiError } from "@/lib/errors/api-error";
import { ApiSuccessResponse } from "@/types/api";

interface RouteParams {
  params: {
    transactionId: string;
  };
}

/**
 * POST /api/v1/transactions/:transactionId/confirm-received
 * Peternak mengonfirmasi kedatangan barang dan menerbitkan 6-digit PIN verifikasi serah-terima.
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { transactionId } = params;
    const { profile, supabase } = await requireUser(req);

    const result = await HandoverService.confirmReceived(
      supabase,
      transactionId,
      profile
    );

    return NextResponse.json<ApiSuccessResponse<ConfirmReceivedResult>>({
      data: result,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
