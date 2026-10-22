import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { cancelTransactionSchema } from "@/lib/validation/transaction.schema";
import { TransactionService } from "@/lib/services/transaction.service";
import { createErrorResponse, handleApiError } from "@/lib/errors/api-error";
import { ApiSuccessResponse, TransactionItemResponse } from "@/types/api";

interface RouteParams {
  params: {
    transactionId: string;
  };
}

/**
 * POST /api/v1/transactions/:transactionId/cancel
 * Membatalkan transaksi dan mengembalikan kuantitas reservasi ke batch ampas tahu.
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { transactionId } = params;
    const { profile, supabase } = await requireUser(req);

    let reason: string | undefined;
    try {
      const body = await req.json();
      const parseResult = cancelTransactionSchema.safeParse(body);
      if (!parseResult.success) {
        const details: Record<string, string> = {};
        const issues = parseResult.error.issues ?? [];
        issues.forEach((issue) => {
          const path = issue.path.join(".") || "body";
          details[path] = issue.message;
        });
        return createErrorResponse("VALIDATION_ERROR", "Data pembatalan tidak valid.", details);
      }
      reason = parseResult.data.reason;
    } catch {
      // Body opsional pada endpoint cancel
      reason = undefined;
    }

    const cancelledTx = await TransactionService.cancelTransaction(
      supabase,
      transactionId,
      profile,
      reason
    );

    return NextResponse.json<ApiSuccessResponse<TransactionItemResponse>>({
      data: cancelledTx,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
