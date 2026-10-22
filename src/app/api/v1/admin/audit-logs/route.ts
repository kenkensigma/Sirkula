import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { requireRole } from "@/lib/auth/require-role";
import { AdminService } from "@/lib/services/admin.service";
import { handleApiError } from "@/lib/errors/api-error";
import { ApiSuccessResponse } from "@/types/api";

/**
 * GET /api/v1/admin/audit-logs
 * Admin memeriksa catatan audit sensitif yang aman tanpa membocorkan PIN/secrets.
 */
export async function GET(req: NextRequest) {
  try {
    const { profile } = await requireUser(req);
    requireRole(profile, ["admin"]);

    const searchParams = req.nextUrl.searchParams;
    const page = searchParams.has("page") ? parseInt(searchParams.get("page")!, 10) : 1;
    const limit = searchParams.has("limit") ? parseInt(searchParams.get("limit")!, 10) : 20;

    const { items, pagination } = await AdminService.listAuditLogs(profile, {
      page,
      limit,
    });

    return NextResponse.json<ApiSuccessResponse<unknown[]>>({
      data: items,
      meta: {
        pagination,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
