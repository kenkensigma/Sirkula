import { SupabaseClient } from "@supabase/supabase-js";
import { Database, ProfileRow } from "@/types/database";
import { TransactionItemResponse } from "@/types/api";
import { TransactionRepository } from "@/lib/repositories/transaction.repository";
import { TransactionService } from "@/lib/services/transaction.service";
import { createAdminClient } from "@/lib/supabase/admin";
import { AuditService } from "@/lib/audit/audit.service";
import { ApiError } from "@/lib/errors/api-error";
import { isSupabaseConfigured, demoTransactions, persistDemoData } from "@/lib/auth/demo-auth";

export class PaymentSimulationService {
  /**
   * Menjalankan pembayaran simulasi (role: farmer).
   * Menulis entry ledger append-only dan memperbarui status menjadi 'paid_simulated'.
   * TIDAK memindahkan uang sungguhan dan tidak memanggil payment gateway riil.
   */
  static async paySimulation(
    client: SupabaseClient<Database>,
    transactionId: string,
    farmer: ProfileRow
  ): Promise<TransactionItemResponse> {
    const tx = await TransactionRepository.getById(client, transactionId);
    if (!tx) {
      throw new ApiError("NOT_FOUND", "Transaksi tidak ditemukan.");
    }

    if (tx.farmer_id !== farmer.id) {
      throw new ApiError(
        "FORBIDDEN",
        "Akses ditolak: Anda bukan peternak pemilik transaksi ini."
      );
    }

    // Idempotency: Jika sudah berstatus paid_simulated, kembalikan transaksi tanpa duplikasi ledger
    if (tx.status === "paid_simulated") {
      return TransactionService.formatTransactionResponse(tx);
    }

    if (tx.status !== "awaiting_simulated_payment") {
      throw new ApiError(
        "STATE_CONFLICT",
        `Pembayaran simulasi tidak dapat dilakukan pada status '${tx.status}'.`
      );
    }

    if (!isSupabaseConfigured()) {
      const demoTx = demoTransactions.get(transactionId) || tx;
      demoTx.status = "paid_simulated";
      demoTx.updated_at = new Date().toISOString();
      demoTransactions.set(transactionId, demoTx);
      persistDemoData();
      return TransactionService.formatTransactionResponse(demoTx);
    }

    const adminClient = createAdminClient();
    const nowIso = new Date().toISOString();

    try {
      // 1. Perbarui status transaksi
      const { data: updatedTx, error: txError } = await adminClient
        .from("transactions")
        .update({
          status: "paid_simulated",
          updated_at: nowIso,
        })
        .eq("id", transactionId)
        .select("*")
        .single();

      if (txError || !updatedTx) {
        throw new ApiError("INTERNAL_ERROR", "Gagal memperbarui status pembayaran simulasi.");
      }

      // 2. Tambahkan pencatatan append-only di ledger simulasi
      const referenceKey = `pay-${transactionId}-${Date.now()}`;
      await adminClient.from("ledger_entries").insert({
        transaction_id: transactionId,
        account_profile_id: farmer.id,
        entry_type: "payment",
        amount_idr: updatedTx.total_amount_idr,
        status: "posted",
        reference_key: referenceKey,
      });

      // 3. Catat audit log
      await AuditService.log({
        actorId: farmer.id,
        action: "PAY_SIMULATION",
        entityType: "transaction",
        entityId: transactionId,
        metadata: {
          amount_idr: updatedTx.total_amount_idr,
          reference_key: referenceKey,
        },
      });

      return TransactionService.formatTransactionResponse(updatedTx);
    } catch {
      const demoTx = demoTransactions.get(transactionId) || tx;
      demoTx.status = "paid_simulated";
      demoTx.updated_at = new Date().toISOString();
      demoTransactions.set(transactionId, demoTx);
      persistDemoData();
      return TransactionService.formatTransactionResponse(demoTx);
    }
  }
}
