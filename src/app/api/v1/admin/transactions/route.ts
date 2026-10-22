import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { requireRole } from "@/lib/auth/require-role";
import { AdminService } from "@/lib/services/admin.service";
import { handleApiError } from "@/lib/errors/api-error";
import { ApiSuccessResponse, TransactionItemResponse } from "@/types/api";
import { TransactionStatus } from "@/types/database";

/**
 * GET /api/v1/admin/transactions
 * Admin melihat daftar semua transaksi untuk moderasi dan dukungan operasional.
 */
export async function GET(req: NextRequest) {
  try {
    const { profile, supabase } = await requireUser(req);
    requireRole(profile, ["admin"]);

    const searchParams = req.nextUrl.searchParams;
    const page = searchParams.has("page") ? parseInt(searchParams.get("page")!, 10) : 1;
    const limit = searchParams.has("limit") ? parseInt(searchParams.get("limit")!, 10) : 20;
    const status = (searchParams.get("status") as TransactionStatus) ?? undefined;

    const { items, pagination } = await AdminService.listAllTransactions(
      supabase,
      profile,
      { page, limit, status }
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
