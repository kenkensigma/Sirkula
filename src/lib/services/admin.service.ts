import { SupabaseClient } from "@supabase/supabase-js";
import { Database, ProfileRow, TransactionStatus } from "@/types/database";
import { TransactionItemResponse } from "@/types/api";
import { TransactionRepository } from "@/lib/repositories/transaction.repository";
import { TransactionService } from "@/lib/services/transaction.service";
import { createAdminClient } from "@/lib/supabase/admin";
import { AuditService } from "@/lib/audit/audit.service";
import { ApiError } from "@/lib/errors/api-error";

export interface AdminListAuditLogsQuery {
  page?: number;
  limit?: number;
}

export class AdminService {
  /**
   * Mengambil semua transaksi untuk keperluan moderasi admin.
   */
  static async listAllTransactions(
    client: SupabaseClient<Database>,
    admin: ProfileRow,
    params: { page?: number; limit?: number; status?: TransactionStatus }
  ) {
    if (admin.role !== "admin") {
      throw new ApiError("FORBIDDEN", "Hanya admin yang berhak mengakses resource ini.");
    }

    return TransactionService.listTransactions(client, admin, {
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      status: params.status,
    });
  }

  /**
   * Melakukan pengembalian dana simulasi (refund) oleh admin.
   * Wajib idempotent dan membuat reversal ledger entry append-only.
   */
  static async refundSimulation(
    client: SupabaseClient<Database>,
    admin: ProfileRow,
    transactionId: string,
    reason: string = "Pengembalian dana simulasi oleh admin"
  ): Promise<TransactionItemResponse> {
    if (admin.role !== "admin") {
      throw new ApiError("FORBIDDEN", "Hanya admin yang berhak melakukan refund simulasi.");
    }

    const tx = await TransactionRepository.getById(client, transactionId);
    if (!tx) {
      throw new ApiError("NOT_FOUND", "Transaksi tidak ditemukan.");
    }

    // Idempotency: jika sudah direfund, kembalikan transaksi langsung
    if (tx.status === "cancelled_refunded_simulated") {
      return TransactionService.formatTransactionResponse(tx);
    }

    // Hanya transaksi yang telah dibayar yang relevan untuk direfund
    if (tx.status !== "paid_simulated" && tx.status !== "needs_review") {
      throw new ApiError(
        "STATE_CONFLICT",
        `Refund simulasi tidak dapat dilakukan pada status '${tx.status}'.`
      );
    }

    const adminClient = createAdminClient();
    const nowIso = new Date().toISOString();

    // 1. Perbarui status transaksi
    const { data: updatedTx, error: txError } = await adminClient
      .from("transactions")
      .update({
        status: "cancelled_refunded_simulated",
        cancel_reason: reason,
        updated_at: nowIso,
      })
      .eq("id", transactionId)
      .select("*")
      .single();

    if (txError || !updatedTx) {
      throw new ApiError("INTERNAL_ERROR", "Gagal memperbarui status refund.");
    }

    // 2. Kembalikan stok reservasi ke batch
    const { data: batch } = await adminClient
      .from("batches")
      .select("reserved_kg, status, expires_at")
      .eq("id", tx.batch_id)
      .maybeSingle();

    if (batch) {
      const newReserved = Math.max(0, Number(batch.reserved_kg) - Number(tx.quantity_kg));
      await adminClient
        .from("batches")
        .update({
          reserved_kg: newReserved,
          status:
            batch.status === "sold_out" && new Date(batch.expires_at) > new Date()
              ? "available"
              : batch.status,
          updated_at: nowIso,
        })
        .eq("id", tx.batch_id);
    }

    // 3. Catat reversal entry di ledger
    const refundRef = `refund-${transactionId}-${Date.now()}`;
    await adminClient.from("ledger_entries").insert({
      transaction_id: transactionId,
      account_profile_id: tx.farmer_id,
      entry_type: "refund",
      amount_idr: tx.total_amount_idr,
      status: "posted",
      reference_key: refundRef,
    });

    // 4. Catat audit log
    await AuditService.log({
      actorId: admin.id,
      action: "ADMIN_REFUND_SIMULATION",
      entityType: "transaction",
      entityId: transactionId,
      metadata: {
        reason,
        refund_reference: refundRef,
        amount_idr: tx.total_amount_idr,
      },
    });

    return TransactionService.formatTransactionResponse(updatedTx);
  }

  /**
   * Mengambil daftar catatan audit untuk peninjauan admin.
   */
  static async listAuditLogs(
    admin: ProfileRow,
    query: AdminListAuditLogsQuery = {}
  ) {
    if (admin.role !== "admin") {
      throw new ApiError("FORBIDDEN", "Hanya admin yang berhak melihat audit logs.");
    }

    const adminClient = createAdminClient();
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: logs, error, count } = await adminClient
      .from("audit_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      throw new ApiError("INTERNAL_ERROR", `Gagal memuat audit logs: ${error.message}`);
    }

    return {
      items: logs ?? [],
      pagination: {
        page,
        limit,
        total: count ?? 0,
      },
    };
  }
}
