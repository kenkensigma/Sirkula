import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { paySimulationSchema } from "@/lib/validation/transaction.schema";
import { PaymentSimulationService } from "@/lib/services/payment-simulation.service";
import { createErrorResponse, handleApiError } from "@/lib/errors/api-error";
import { ApiSuccessResponse, TransactionItemResponse } from "@/types/api";

interface RouteParams {
  params: {
    transactionId: string;
  };
}

/**
 * POST /api/v1/transactions/:transactionId/pay-simulation
 * Menandai pembayaran transaksi menggunakan saldo simulasi (khusus role 'farmer').
 * SIMULASI SAJA: Tidak memindahkan dana sungguhan.
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

    const parseResult = paySimulationSchema.safeParse(body);
    if (!parseResult.success) {
      const details: Record<string, string> = {};
      const issues = parseResult.error.issues ?? [];
      issues.forEach((issue) => {
        const path = issue.path.join(".") || "body";
        details[path] = issue.message;
      });
      return createErrorResponse("VALIDATION_ERROR", "Data pembayaran simulasi tidak valid.", details);
    }

    const updatedTx = await PaymentSimulationService.paySimulation(
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
