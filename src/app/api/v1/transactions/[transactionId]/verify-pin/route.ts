import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { verifyPinSchema } from "@/lib/validation/transaction.schema";
import { HandoverService } from "@/lib/services/handover.service";
import { createErrorResponse, handleApiError } from "@/lib/errors/api-error";
import { ApiSuccessResponse, TransactionItemResponse } from "@/types/api";

interface RouteParams {
  params: {
    transactionId: string;
  };
}

/**
 * POST /api/v1/transactions/:transactionId/verify-pin
 * Memverifikasi 6-digit PIN serah-terima satu kali dan menyelesaikan transaksi.
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { transactionId } = params;
    const { profile, supabase } = await requireUser(req);

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return createErrorResponse("VALIDATION_ERROR", "Body JSON tidak valid.");
    }

    const parseResult = verifyPinSchema.safeParse(body);
    if (!parseResult.success) {
      const details: Record<string, string> = {};
      const issues = parseResult.error.issues ?? [];
      issues.forEach((issue) => {
        const path = issue.path.join(".") || "body";
        details[path] = issue.message;
      });
      return createErrorResponse("VALIDATION_ERROR", "Format PIN tidak valid.", details);
    }

    const completedTx = await HandoverService.verifyPin(
      supabase,
      transactionId,
      profile,
      parseResult.data.pin
    );

    return NextResponse.json<ApiSuccessResponse<TransactionItemResponse>>({
      data: completedTx,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
