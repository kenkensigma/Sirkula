import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { requireRole } from "@/lib/auth/require-role";
import { createTransactionSchema, listTransactionsQuerySchema } from "@/lib/validation/transaction.schema";
import { TransactionService } from "@/lib/services/transaction.service";
import { createErrorResponse, handleApiError } from "@/lib/errors/api-error";
import { ApiSuccessResponse, TransactionItemResponse } from "@/types/api";

/**
 * GET /api/v1/transactions
 * Mengambil daftar transaksi milik pengguna aktif (farmer atau factory, atau semua untuk admin).
 */
export async function GET(req: NextRequest) {
  try {
    const { profile, supabase } = await requireUser(req);

    const searchParams = req.nextUrl.searchParams;
    const rawQuery: Record<string, unknown> = {};

    if (searchParams.has("status")) rawQuery.status = searchParams.get("status");
    if (searchParams.has("page")) rawQuery.page = searchParams.get("page");
    if (searchParams.has("limit")) rawQuery.limit = searchParams.get("limit");
    if (searchParams.has("role_view")) rawQuery.role_view = searchParams.get("role_view");

    const parseResult = listTransactionsQuerySchema.safeParse(rawQuery);
    if (!parseResult.success) {
      const details: Record<string, string> = {};
      const issues = parseResult.error.issues ?? [];
      issues.forEach((issue) => {
        const path = issue.path.join(".") || "query";
        details[path] = issue.message;
      });
      return createErrorResponse("VALIDATION_ERROR", "Parameter query tidak valid.", details);
    }

    const { items, pagination } = await TransactionService.listTransactions(
      supabase,
      profile,
      parseResult.data
    );

    return NextResponse.json<ApiSuccessResponse<TransactionItemResponse[]>>({
      data: items,
      meta: {
        pagination,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}

/**
 * POST /api/v1/transactions
 * Membuat transaksi baru dan mereservasi stok secara atomik. Hanya untuk role 'farmer'.
 */
export async function POST(req: NextRequest) {
  try {
    const { profile, supabase } = await requireUser(req);
    requireRole(profile, ["farmer"]);

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return createErrorResponse("VALIDATION_ERROR", "Body JSON tidak valid.");
    }

    const parseResult = createTransactionSchema.safeParse(body);
    if (!parseResult.success) {
      const details: Record<string, string> = {};
      const issues = parseResult.error.issues ?? [];
      issues.forEach((issue) => {
        const path = issue.path.join(".") || "body";
        details[path] = issue.message;
      });
      return createErrorResponse("VALIDATION_ERROR", "Data transaksi tidak valid.", details);
    }

    const newTx = await TransactionService.createTransaction(
      supabase,
      profile,
      parseResult.data
    );

    return NextResponse.json<ApiSuccessResponse<TransactionItemResponse>>(
      {
        data: newTx,
      },
      { status: 201 }
    );
  } catch (err) {
    return handleApiError(err);
  }
}
