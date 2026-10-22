import { SupabaseClient } from "@supabase/supabase-js";
import { Database, BatchRow, BatchStatus } from "@/types/database";
import { ApiError } from "@/lib/errors/api-error";

export interface BatchWithFactory extends BatchRow {
  factory_name: string;
}

export interface ListBatchesFilter {
  factoryId?: string;
  status?: BatchStatus;
  onlyActiveFresh?: boolean;
}

export class BatchRepository {
  /**
   * Mengambil batch berdasarkan ID beserta nama pabrik pemiliknya.
   */
  static async getById(
    client: SupabaseClient<Database>,
    batchId: string
  ): Promise<BatchWithFactory | null> {
    const { data: batch, error } = await client
      .from("batches")
      .select("*")
      .eq("id", batchId)
      .maybeSingle();

    if (error) {
      throw new ApiError("INTERNAL_ERROR", `Gagal mengambil batch: ${error.message}`);
    }

    if (!batch) {
      return null;
    }

    // Ambil nama pabrik dari tabel profiles
    const { data: factoryProfile } = await client
      .from("profiles")
      .select("name")
      .eq("id", batch.factory_id)
      .maybeSingle();

    return {
      ...batch,
      factory_name: factoryProfile?.name ?? "Pabrik",
    };
  }

  /**
   * Membuat batch baru.
   */
  static async create(
    client: SupabaseClient<Database>,
    data: Database["public"]["Tables"]["batches"]["Insert"]
  ): Promise<BatchRow> {
    const { data: newBatch, error } = await client
      .from("batches")
      .insert(data)
      .select("*")
      .single();

    if (error) {
      throw new ApiError("INTERNAL_ERROR", `Gagal membuat batch: ${error.message}`);
    }

    return newBatch;
  }

  /**
   * Memperbarui data batch.
   */
  static async update(
    client: SupabaseClient<Database>,
    batchId: string,
    data: Database["public"]["Tables"]["batches"]["Update"]
  ): Promise<BatchRow> {
    const { data: updatedBatch, error } = await client
      .from("batches")
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", batchId)
      .select("*")
      .single();

    if (error) {
      throw new ApiError("INTERNAL_ERROR", `Gagal memperbarui batch: ${error.message}`);
    }

    return updatedBatch;
  }

  /**
   * Mengambil daftar batch dengan filter tertentu.
   */
  static async list(
    client: SupabaseClient<Database>,
    filter: ListBatchesFilter = {}
  ): Promise<BatchWithFactory[]> {
    let query = client.from("batches").select("*");

    if (filter.factoryId) {
      query = query.eq("factory_id", filter.factoryId);
    }

    if (filter.status) {
      query = query.eq("status", filter.status);
    }

    if (filter.onlyActiveFresh) {
      query = query
        .eq("status", "available")
        .gt("expires_at", new Date().toISOString());
    }

    const { data: batches, error } = await query.order("created_at", { ascending: false });

    if (error) {
      throw new ApiError("INTERNAL_ERROR", `Gagal mengambil daftar batch: ${error.message}`);
    }

    if (!batches || batches.length === 0) {
      return [];
    }

    // Batch query untuk mengambil nama profil seluruh pabrik yang terlibat
    const factoryIds = Array.from(new Set(batches.map((b) => b.factory_id)));
    const { data: profiles } = await client
      .from("profiles")
      .select("id, name")
      .in("id", factoryIds);

    const profileMap = new Map<string, string>();
    profiles?.forEach((p) => {
      profileMap.set(p.id, p.name);
    });

    return batches.map((b) => ({
      ...b,
      factory_name: profileMap.get(b.factory_id) ?? "Pabrik",
    }));
  }
}
