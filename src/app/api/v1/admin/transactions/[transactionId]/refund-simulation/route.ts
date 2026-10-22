import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { requireRole } from "@/lib/auth/require-role";
import { AdminService } from "@/lib/services/admin.service";
import { handleApiError } from "@/lib/errors/api-error";
import { ApiSuccessResponse, TransactionItemResponse } from "@/types/api";

interface RouteParams {
  params: {
    transactionId: string;
  };
}

/**
 * POST /api/v1/admin/transactions/:transactionId/refund-simulation
 * Admin mencatat pengembalian saldo simulasi (idempotent, append-only reversal entry).
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { transactionId } = params;
    const { profile, supabase } = await requireUser(req);
    requireRole(profile, ["admin"]);

    let reason: string | undefined;
    try {
      const body = await req.json();
      reason = body.reason;
    } catch {
      reason = undefined;
    }

    const refundedTx = await AdminService.refundSimulation(
      supabase,
      profile,
      transactionId,
      reason
    );

    return NextResponse.json<ApiSuccessResponse<TransactionItemResponse>>({
      data: refundedTx,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
