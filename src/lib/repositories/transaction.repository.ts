import { SupabaseClient } from "@supabase/supabase-js";
import { Database, TransactionRow, TransactionStatus } from "@/types/database";
import { ApiError } from "@/lib/errors/api-error";

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
   * Membuat transaksi dan reservasi stok secara atomik melalui Supabase RPC.
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
  }

  /**
   * Mengambil detail transaksi berdasarkan ID.
   */
  static async getById(
    client: SupabaseClient<Database>,
    transactionId: string
  ): Promise<TransactionRow | null> {
    const { data, error } = await client
      .from("transactions")
      .select("*")
      .eq("id", transactionId)
      .maybeSingle();

    if (error) {
      throw new ApiError("INTERNAL_ERROR", `Gagal mengambil data transaksi: ${error.message}`);
    }

    return data;
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
    const { data, error } = await client.rpc("cancel_transaction_and_release", {
      p_transaction_id: params.transactionId,
      p_actor_id: params.actorId,
      p_cancel_reason: params.cancelReason,
    });

    if (error) {
      throw error;
    }

    if (!data) {
      throw new ApiError("INTERNAL_ERROR", "Gagal membatalkan transaksi.");
    }

    return data;
  }

  /**
   * Mengambil daftar transaksi milik pengguna (atau semua bagi admin).
   */
  static async list(
    client: SupabaseClient<Database>,
    params: ListTransactionsParams
  ): Promise<{ items: TransactionRow[]; total: number }> {
    let query = client.from("transactions").select("*", { count: "exact" });

    // Filter akses berdasarkan role
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
  }
}
