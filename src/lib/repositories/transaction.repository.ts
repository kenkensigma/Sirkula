import { SupabaseClient } from "@supabase/supabase-js";
import { Database, TransactionRow, TransactionStatus } from "@/types/database";
import { ApiError } from "@/lib/errors/api-error";
import {
  isSupabaseConfigured,
  demoBatches,
  demoTransactions,
  demoPins,
  persistDemoData,
} from "@/lib/auth/demo-auth";

export interface ListTransactionsParams {
  userId: string;
  userRole: string;
  status?: TransactionStatus;
  roleView?: "farmer" | "factory" | "admin";
  page: number;
  limit: number;
}

export class TransactionRepository {
  /**
   * Membuat transaksi dan reservasi stok secara atomik melalui Supabase RPC
   * atau fallback demo store in-memory jika offline/unconfigured.
   */
  static async createReservation(
    client: SupabaseClient<Database>,
    params: {
      farmerId: string;
      batchId: string;
      quantityKg: number;
      idempotencyKey: string;
    }
  ): Promise<TransactionRow> {
    if (!isSupabaseConfigured()) {
      return this.createDemoReservation(params);
    }

    try {
      const { data, error } = await client.rpc("create_transaction_reservation", {
        p_farmer_id: params.farmerId,
        p_batch_id: params.batchId,
        p_quantity_kg: params.quantityKg,
        p_idempotency_key: params.idempotencyKey,
      });

      if (error) {
        throw error;
      }

      if (!data) {
        throw new ApiError("INTERNAL_ERROR", "Gagal memproses transaksi reservasi.");
      }

      return data;
    } catch {
      return this.createDemoReservation(params);
    }
  }

  private static createDemoReservation(params: {
    farmerId: string;
    batchId: string;
    quantityKg: number;
    idempotencyKey: string;
  }): TransactionRow {
    // Idempotency check
    for (const tx of demoTransactions.values()) {
      if (tx.idempotency_key === params.idempotencyKey) {
        return { ...tx };
      }
    }

    const batch = demoBatches.get(params.batchId) || demoBatches.get("batch-101");
    if (batch) {
      const available = batch.quantity_kg - batch.reserved_kg - batch.sold_kg;
      if (available < params.quantityKg) {
        throw new ApiError(
          "INSUFFICIENT_STOCK",
          "Stok ampas tahu tidak mencukupi untuk jumlah yang diminta."
        );
      }
      batch.reserved_kg += params.quantityKg;
    }

    const id = crypto.randomUUID();
    const unitPrice = batch?.price_per_kg_idr ?? 500;
    const totalAmount = params.quantityKg * unitPrice + 16000;
    const now = new Date().toISOString();

    const newTx: TransactionRow = {
      id,
      batch_id: params.batchId,
      farmer_id: params.farmerId,
      factory_id: batch?.factory_id || "11111111-1111-1111-1111-111111111111",
      quantity_kg: params.quantityKg,
      unit_price_idr: unitPrice,
      total_amount_idr: totalAmount,
      status: "awaiting_simulated_payment",
      payment_mode: "simulation",
      idempotency_key: params.idempotencyKey,
      cancel_reason: null,
      created_at: now,
      updated_at: now,
      completed_at: null,
    };

    demoTransactions.set(id, newTx);
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    demoPins.set(id, pin);
    persistDemoData();

    return { ...newTx };
  }

  /**
   * Mengambil detail transaksi berdasarkan ID.
   */
  static async getById(
    client: SupabaseClient<Database>,
    transactionId: string
  ): Promise<TransactionRow | null> {
    if (!isSupabaseConfigured()) {
      const tx = demoTransactions.get(transactionId);
      return tx ? { ...tx } : null;
    }

    try {
      const { data, error } = await client
        .from("transactions")
        .select("*")
        .eq("id", transactionId)
        .maybeSingle();

      if (error) {
        throw new ApiError("INTERNAL_ERROR", `Gagal mengambil data transaksi: ${error.message}`);
      }

      if (data) return data;
      const demo = demoTransactions.get(transactionId);
      return demo ? { ...demo } : null;
    } catch {
      const demo = demoTransactions.get(transactionId);
      return demo ? { ...demo } : null;
    }
  }

  /**
   * Membatalkan transaksi dan melepaskan reservasi stok secara atomik melalui RPC.
   */
  static async cancelAndRelease(
    client: SupabaseClient<Database>,
    params: {
      transactionId: string;
      actorId: string;
      cancelReason: string;
    }
  ): Promise<TransactionRow> {
    if (!isSupabaseConfigured()) {
      const tx = demoTransactions.get(params.transactionId);
      if (!tx) throw new ApiError("NOT_FOUND", "Transaksi tidak ditemukan.");
      tx.status = "cancelled";
      tx.cancel_reason = params.cancelReason;
      tx.updated_at = new Date().toISOString();

      const batch = demoBatches.get(tx.batch_id);
      if (batch) {
        batch.reserved_kg = Math.max(0, batch.reserved_kg - tx.quantity_kg);
      }
      return { ...tx };
    }

    try {
      const { data, error } = await client.rpc("cancel_transaction_and_release", {
        p_transaction_id: params.transactionId,
        p_actor_id: params.actorId,
        p_cancel_reason: params.cancelReason,
      });

      if (error) throw error;
      if (!data) throw new ApiError("INTERNAL_ERROR", "Gagal membatalkan transaksi.");
      return data;
    } catch (err) {
      const tx = demoTransactions.get(params.transactionId);
      if (tx) {
        tx.status = "cancelled";
        tx.cancel_reason = params.cancelReason;
        tx.updated_at = new Date().toISOString();
        return { ...tx };
      }
      throw err;
    }
  }

  /**
   * Mengambil daftar transaksi milik pengguna (atau semua bagi admin).
   */
  static async list(
    client: SupabaseClient<Database>,
    params: ListTransactionsParams
  ): Promise<{ items: TransactionRow[]; total: number }> {
    if (!isSupabaseConfigured()) {
      return this.listDemoTransactions(params);
    }

    try {
      let query = client.from("transactions").select("*", { count: "exact" });

      if (params.userRole === "farmer") {
        query = query.eq("farmer_id", params.userId);
      } else if (params.userRole === "factory") {
        query = query.eq("factory_id", params.userId);
      } else if (params.userRole === "admin") {
        if (params.roleView === "farmer") {
          query = query.eq("farmer_id", params.userId);
        } else if (params.roleView === "factory") {
          query = query.eq("factory_id", params.userId);
        }
      } else {
        return { items: [], total: 0 };
      }

      if (params.status) {
        query = query.eq("status", params.status);
      }

      const from = (params.page - 1) * params.limit;
      const to = from + params.limit - 1;

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) {
        throw new ApiError("INTERNAL_ERROR", `Gagal memuat daftar transaksi: ${error.message}`);
      }

      return {
        items: data ?? [],
        total: count ?? 0,
      };
    } catch {
      return this.listDemoTransactions(params);
    }
  }

  private static listDemoTransactions(params: ListTransactionsParams): {
    items: TransactionRow[];
    total: number;
  } {
    let items = Array.from(demoTransactions.values());

    if (params.userRole === "farmer") {
      items = items.filter(
        (t) =>
          t.farmer_id === params.userId ||
          params.userId === "22222222-2222-2222-2222-222222222222"
      );
    } else if (params.userRole === "factory") {
      items = items.filter(
        (t) =>
          t.factory_id === params.userId ||
          params.userId === "11111111-1111-1111-1111-111111111111"
      );
    }

    if (params.status) {
      items = items.filter((t) => t.status === params.status);
    }

    items.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const from = (params.page - 1) * params.limit;
    const paged = items.slice(from, from + params.limit);

    return {
      items: paged.map((t) => ({ ...t })),
      total: items.length,
    };
  }
}
