import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { TransactionService } from "@/lib/services/transaction.service";
import { handleApiError } from "@/lib/errors/api-error";
import { ApiSuccessResponse, TransactionItemResponse } from "@/types/api";

interface RouteParams {
  params: {
    transactionId: string;
  };
}

/**
 * GET /api/v1/transactions/:transactionId
 * Mengambil detail transaksi bagi farmer, factory terkait, atau admin.
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { transactionId } = params;
    const { profile, supabase } = await requireUser(req);

    const tx = await TransactionService.getTransactionById(
      supabase,
      transactionId,
      profile
    );

    return NextResponse.json<ApiSuccessResponse<TransactionItemResponse>>({
      data: tx,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
