import { SupabaseClient } from "@supabase/supabase-js";
import { Database, ProfileRow, TransactionRow } from "@/types/database";
import { TransactionItemResponse } from "@/types/api";
import { CreateTransactionInput, ListTransactionsQueryInput } from "@/lib/validation/transaction.schema";
import { TransactionRepository } from "@/lib/repositories/transaction.repository";
import { AuditService } from "@/lib/audit/audit.service";
import { ApiError } from "@/lib/errors/api-error";

export class TransactionService {
  /**
   * Mengubah TransactionRow database menjadi kontrak response TransactionItemResponse.
   */
  static formatTransactionResponse(tx: TransactionRow): TransactionItemResponse {
    return {
      id: tx.id,
      batch_id: tx.batch_id,
      farmer_id: tx.farmer_id,
      factory_id: tx.factory_id,
      quantity_kg: Number(tx.quantity_kg),
      unit_price_idr: tx.unit_price_idr,
      total_amount_idr: Number(tx.total_amount_idr),
      status: tx.status,
      payment_mode: "simulation",
      idempotency_key: tx.idempotency_key,
      created_at: tx.created_at,
      completed_at: tx.completed_at,
    };
  }

  /**
   * Membuat transaksi baru dengan reservasi stok atomik (role: farmer).
   */
  static async createTransaction(
    client: SupabaseClient<Database>,
    farmer: ProfileRow,
    input: CreateTransactionInput
  ): Promise<TransactionItemResponse> {
    if (farmer.role !== "farmer") {
      throw new ApiError(
        "FORBIDDEN",
        "Hanya pengguna dengan role 'farmer' yang dapat membuat transaksi pemesanan."
      );
    }

    const tx = await TransactionRepository.createReservation(client, {
      farmerId: farmer.id,
      batchId: input.batch_id,
      quantityKg: input.quantity_kg,
      idempotencyKey: input.idempotency_key,
    });

    // Catat log audit secara aman
    await AuditService.log({
      actorId: farmer.id,
      action: "CREATE_TRANSACTION",
      entityType: "transaction",
      entityId: tx.id,
      metadata: {
        batch_id: tx.batch_id,
        quantity_kg: tx.quantity_kg,
        total_amount_idr: tx.total_amount_idr,
        status: tx.status,
      },
    });

    return this.formatTransactionResponse(tx);
  }

  /**
   * Mengambil detail transaksi dengan validasi otorisasi pihak terkait.
   */
  static async getTransactionById(
    client: SupabaseClient<Database>,
    transactionId: string,
    user: ProfileRow
  ): Promise<TransactionItemResponse> {
    const tx = await TransactionRepository.getById(client, transactionId);

    if (!tx) {
      throw new ApiError("NOT_FOUND", "Transaksi tidak ditemukan.");
    }

    // Hanya pihak farmer atau factory yang terlibat, atau admin yang berhak melihat
    const isParticipant =
      tx.farmer_id === user.id ||
      tx.factory_id === user.id ||
      user.role === "admin";

    if (!isParticipant) {
      // 404 untuk mencegah data leakage existence
      throw new ApiError("NOT_FOUND", "Transaksi tidak ditemukan.");
    }

    return this.formatTransactionResponse(tx);
  }

  /**
   * Mengambil daftar transaksi milik pengguna.
   */
  static async listTransactions(
    client: SupabaseClient<Database>,
    user: ProfileRow,
    query: ListTransactionsQueryInput
  ): Promise<{ items: TransactionItemResponse[]; pagination: { page: number; limit: number; total: number } }> {
    const { items, total } = await TransactionRepository.list(client, {
      userId: user.id,
      userRole: user.role,
      status: query.status,
      roleView: query.role_view,
      page: query.page,
      limit: query.limit,
    });

    return {
      items: items.map(this.formatTransactionResponse),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
      },
    };
  }

  /**
   * Membatalkan transaksi dan melepaskan reservasi stok kembali ke batch.
   */
  static async cancelTransaction(
    client: SupabaseClient<Database>,
    transactionId: string,
    user: ProfileRow,
    reason?: string
  ): Promise<TransactionItemResponse> {
    const existing = await TransactionRepository.getById(client, transactionId);
    if (!existing) {
      throw new ApiError("NOT_FOUND", "Transaksi tidak ditemukan.");
    }

    const isParticipant =
      existing.farmer_id === user.id ||
      existing.factory_id === user.id ||
      user.role === "admin";

    if (!isParticipant) {
      throw new ApiError("NOT_FOUND", "Transaksi tidak ditemukan.");
    }

    // State machine check: hanya status belum dikirim yang dapat dibatalkan
    if (
      existing.status !== "awaiting_simulated_payment" &&
      existing.status !== "paid_simulated"
    ) {
      throw new ApiError(
        "STATE_CONFLICT",
        `Transaksi tidak dapat dibatalkan dalam status '${existing.status}'.`
      );
    }

    const cancelReason = reason || `Dibatalkan oleh ${user.role} (${user.name})`;

    const updatedTx = await TransactionRepository.cancelAndRelease(client, {
      transactionId,
      actorId: user.id,
      cancelReason,
    });

    await AuditService.log({
      actorId: user.id,
      action: "CANCEL_TRANSACTION",
      entityType: "transaction",
      entityId: updatedTx.id,
      metadata: {
        previous_status: existing.status,
        new_status: updatedTx.status,
        reason: cancelReason,
      },
    });

    return this.formatTransactionResponse(updatedTx);
  }
}
