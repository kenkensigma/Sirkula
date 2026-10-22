import { SupabaseClient } from "@supabase/supabase-js";
import { Database, ProfileRow } from "@/types/database";
import { TransactionItemResponse } from "@/types/api";
import { TransactionRepository } from "@/lib/repositories/transaction.repository";
import { TransactionService } from "@/lib/services/transaction.service";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateSecurePin, hashPin, verifyPinHash } from "@/lib/crypto/pin";
import { calculateEstimatedImpact } from "@/lib/pricing/pricing";
import { AuditService } from "@/lib/audit/audit.service";
import { ApiError } from "@/lib/errors/api-error";

export const MAX_PIN_ATTEMPTS = 5;

export interface ConfirmReceivedResult {
  transaction: TransactionItemResponse;
  pin: string;
  instructions: string;
}

export class HandoverService {
  /**
   * Menandai pesanan telah dikirim oleh pihak pabrik (role: factory).
   */
  static async markShipped(
    client: SupabaseClient<Database>,
    transactionId: string,
    factory: ProfileRow
  ): Promise<TransactionItemResponse> {
    const tx = await TransactionRepository.getById(client, transactionId);
    if (!tx) {
      throw new ApiError("NOT_FOUND", "Transaksi tidak ditemukan.");
    }

    if (tx.factory_id !== factory.id) {
      throw new ApiError(
        "FORBIDDEN",
        "Akses ditolak: Anda bukan pabrik penyedia pada transaksi ini."
      );
    }

    if (tx.status !== "paid_simulated") {
      throw new ApiError(
        "STATE_CONFLICT",
        `Pesanan hanya dapat ditandai dikirim jika sudah berstatus 'paid_simulated'. Status saat ini: '${tx.status}'.`
      );
    }

    const adminClient = createAdminClient();
    const nowIso = new Date().toISOString();

    const { data: updatedTx, error } = await adminClient
      .from("transactions")
      .update({
        status: "shipped",
        updated_at: nowIso,
      })
      .eq("id", transactionId)
      .select("*")
      .single();

    if (error || !updatedTx) {
      throw new ApiError("INTERNAL_ERROR", "Gagal memperbarui status pengiriman.");
    }

    await AuditService.log({
      actorId: factory.id,
      action: "MARK_SHIPPED",
      entityType: "transaction",
      entityId: transactionId,
    });

    return TransactionService.formatTransactionResponse(updatedTx);
  }

  /**
   * Peternak mengonfirmasi penerimaan barang dan menerbitkan PIN serah-terima satu kali.
   */
  static async confirmReceived(
    client: SupabaseClient<Database>,
    transactionId: string,
    farmer: ProfileRow
  ): Promise<ConfirmReceivedResult> {
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

    if (tx.status !== "shipped") {
      throw new ApiError(
        "STATE_CONFLICT",
        `Konfirmasi penerimaan hanya dapat dilakukan jika barang telah berstatus 'shipped'. Status saat ini: '${tx.status}'.`
      );
    }

    const adminClient = createAdminClient();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 3600000).toISOString();

    // Generate secure 6-digit PIN and its hash
    const rawPin = generateSecurePin();
    const pinHash = hashPin(rawPin);

    // Simpan hash PIN ke tabel handover_verifications
    const { error: pinError } = await adminClient
      .from("handover_verifications")
      .upsert({
        transaction_id: transactionId,
        pin_hash: pinHash,
        expires_at: expiresAt,
        attempt_count: 0,
        consumed_at: null,
      });

    if (pinError) {
      throw new ApiError("INTERNAL_ERROR", "Gagal menerbitkan PIN verifikasi serah-terima.");
    }

    // Perbarui status transaksi menjadi awaiting_handover_verification
    const { data: updatedTx, error: txError } = await adminClient
      .from("transactions")
      .update({
        status: "awaiting_handover_verification",
        updated_at: now.toISOString(),
      })
      .eq("id", transactionId)
      .select("*")
      .single();

    if (txError || !updatedTx) {
      throw new ApiError("INTERNAL_ERROR", "Gagal memperbarui status verifikasi.");
    }

    await AuditService.log({
      actorId: farmer.id,
      action: "CONFIRM_RECEIVED",
      entityType: "transaction",
      entityId: transactionId,
      metadata: {
        expires_at: expiresAt,
      },
    });

    return {
      transaction: TransactionService.formatTransactionResponse(updatedTx),
      pin: rawPin,
      instructions:
        "Berikan 6-digit PIN ini kepada pihak pengantar/pabrik saat ampas tahu telah diperiksa dan diserahterimakan.",
    };
  }

  /**
   * Memverifikasi PIN serah-terima dan menyelesaikan transaksi, merilis ledger simulasi, dan mencatat impact.
   */
  static async verifyPin(
    client: SupabaseClient<Database>,
    transactionId: string,
    user: ProfileRow,
    pin: string
  ): Promise<TransactionItemResponse> {
    const tx = await TransactionRepository.getById(client, transactionId);
    if (!tx) {
      throw new ApiError("NOT_FOUND", "Transaksi tidak ditemukan.");
    }

    const isParticipant =
      tx.farmer_id === user.id ||
      tx.factory_id === user.id ||
      user.role === "admin";

    if (!isParticipant) {
      throw new ApiError("NOT_FOUND", "Transaksi tidak ditemukan.");
    }

    if (tx.status !== "awaiting_handover_verification") {
      throw new ApiError(
        "STATE_CONFLICT",
        `Verifikasi PIN tidak dapat dilakukan pada status '${tx.status}'.`
      );
    }

    const adminClient = createAdminClient();

    // 1. Ambil data verifikasi PIN
    const { data: record, error: recordError } = await adminClient
      .from("handover_verifications")
      .select("*")
      .eq("transaction_id", transactionId)
      .maybeSingle();

    if (recordError || !record) {
      throw new ApiError("NOT_FOUND", "Data verifikasi serah-terima tidak ditemukan.");
    }

    if (record.consumed_at) {
      throw new ApiError("PIN_INVALID", "PIN verifikasi telah digunakan sebelumnya.");
    }

    if (new Date(record.expires_at) <= new Date()) {
      throw new ApiError("PIN_INVALID", "PIN verifikasi telah kedaluwarsa.");
    }

    if (record.attempt_count >= MAX_PIN_ATTEMPTS) {
      throw new ApiError(
        "RATE_LIMITED",
        "Batas maksimum percobaan PIN telah terlampaui. Transaksi dialihkan untuk peninjauan admin."
      );
    }

    // 2. Cocokkan hash PIN dengan constant-time comparison
    const isMatch = verifyPinHash(pin, record.pin_hash);

    if (!isMatch) {
      const newAttempts = record.attempt_count + 1;
      const willLock = newAttempts >= MAX_PIN_ATTEMPTS;

      await adminClient
        .from("handover_verifications")
        .update({ attempt_count: newAttempts })
        .eq("id", record.id);

      if (willLock) {
        await adminClient
          .from("transactions")
          .update({
            status: "needs_review",
            updated_at: new Date().toISOString(),
          })
          .eq("id", transactionId);

        throw new ApiError(
          "RATE_LIMITED",
          "Batas percobaan PIN telah terlampaui. Status transaksi dialihkan ke needs_review."
        );
      }

      const remaining = MAX_PIN_ATTEMPTS - newAttempts;
      throw new ApiError("PIN_INVALID", `PIN verifikasi salah. Sisa percobaan: ${remaining}.`);
    }

    const nowIso = new Date().toISOString();

    // 3. PIN valid: Konsumsi PIN
    await adminClient
      .from("handover_verifications")
      .update({
        consumed_at: nowIso,
      })
      .eq("id", record.id);

    // 4. Update transaksi menjadi completed
    const { data: completedTx, error: completeError } = await adminClient
      .from("transactions")
      .update({
        status: "completed",
        completed_at: nowIso,
        updated_at: nowIso,
      })
      .eq("id", transactionId)
      .select("*")
      .single();

    if (completeError || !completedTx) {
      throw new ApiError("INTERNAL_ERROR", "Gagal menyelesaikan status transaksi.");
    }

    // 5. Update stok batch: konversi reserved menjadi sold
    const { data: batch } = await adminClient
      .from("batches")
      .select("reserved_kg, sold_kg")
      .eq("id", completedTx.batch_id)
      .maybeSingle();

    if (batch) {
      const newReserved = Math.max(0, Number(batch.reserved_kg) - Number(completedTx.quantity_kg));
      const newSold = Number(batch.sold_kg) + Number(completedTx.quantity_kg);
      await adminClient
        .from("batches")
        .update({
          reserved_kg: newReserved,
          sold_kg: newSold,
          updated_at: nowIso,
        })
        .eq("id", completedTx.batch_id);
    }

    // 6. Tulis entry ledger simulasi untuk rilis pembayaran ke pabrik
    const releaseRef = `release-${transactionId}-${Date.now()}`;
    await adminClient.from("ledger_entries").insert({
      transaction_id: transactionId,
      account_profile_id: completedTx.factory_id,
      entry_type: "release",
      amount_idr: completedTx.total_amount_idr,
      status: "posted",
      reference_key: releaseRef,
    });

    // 7. Hitung dan catat estimasi dampak lingkungan di impact_logs
    const impact = calculateEstimatedImpact(Number(completedTx.quantity_kg));
    await adminClient.from("impact_logs").upsert({
      transaction_id: transactionId,
      material_kg: impact.divertedKg,
      estimated_co2e_kg: impact.estimatedCo2eKg,
      estimated_feed_savings_idr: impact.estimatedSavingsIdr,
      methodology_version: "v1.0-mvp-assumption",
    });

    // 8. Audit log
    await AuditService.log({
      actorId: user.id,
      action: "VERIFY_PIN_COMPLETED",
      entityType: "transaction",
      entityId: transactionId,
      metadata: {
        release_reference: releaseRef,
        co2e_kg: impact.estimatedCo2eKg,
      },
    });

    return TransactionService.formatTransactionResponse(completedTx);
  }
}
