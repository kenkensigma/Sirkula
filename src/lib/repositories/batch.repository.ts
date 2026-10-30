import { SupabaseClient } from "@supabase/supabase-js";
import { Database, BatchRow, BatchStatus } from "@/types/database";
import { ApiError } from "@/lib/errors/api-error";
import { isSupabaseConfigured, demoBatches } from "@/lib/auth/demo-auth";

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
    if (!isSupabaseConfigured()) {
      const demo = demoBatches.get(batchId);
      if (demo) return { ...demo };
      return null;
    }

    try {
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
    } catch (err) {
      // Fallback ke demo data jika offline
      const demo = demoBatches.get(batchId);
      if (demo) return { ...demo };
      throw err;
    }
  }

  /**
   * Membuat batch baru.
   */
  static async create(
    client: SupabaseClient<Database>,
    data: Database["public"]["Tables"]["batches"]["Insert"]
  ): Promise<BatchRow> {
    if (!isSupabaseConfigured()) {
      const id = (data as { id?: string }).id || crypto.randomUUID();
      const now = new Date().toISOString();
      const newBatch: BatchRow = {
        id,
        factory_id: data.factory_id,
        quantity_kg: Number(data.quantity_kg),
        reserved_kg: Number(data.reserved_kg ?? 0),
        sold_kg: Number(data.sold_kg ?? 0),
        price_per_kg_idr: Number(data.price_per_kg_idr),
        latitude: Number(data.latitude),
        longitude: Number(data.longitude),
        prepared_at: data.prepared_at,
        expires_at: data.expires_at,
        description: data.description ?? null,
        status: data.status ?? "available",
        created_at: now,
        updated_at: now,
      };

      demoBatches.set(id, {
        ...newBatch,
        factory_name: (data as { factory_name?: string }).factory_name || "Pabrik Tahu Sumber Barokah",
      });

      return newBatch;
    }

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
    if (!isSupabaseConfigured()) {
      const existing = demoBatches.get(batchId);
      if (!existing) {
        throw new ApiError("NOT_FOUND", "Batch tidak ditemukan.");
      }

      const updated: BatchWithFactory = {
        ...existing,
        quantity_kg: data.quantity_kg !== undefined ? Number(data.quantity_kg) : existing.quantity_kg,
        reserved_kg: data.reserved_kg !== undefined ? Number(data.reserved_kg) : existing.reserved_kg,
        sold_kg: data.sold_kg !== undefined ? Number(data.sold_kg) : existing.sold_kg,
        price_per_kg_idr: data.price_per_kg_idr !== undefined ? Number(data.price_per_kg_idr) : existing.price_per_kg_idr,
        description: data.description !== undefined ? data.description : existing.description,
        status: data.status !== undefined ? data.status : existing.status,
        updated_at: new Date().toISOString(),
      };

      demoBatches.set(batchId, updated);
      return updated;
    }

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
    if (!isSupabaseConfigured()) {
      return this.listDemoBatches(filter);
    }

    try {
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
        return this.listDemoBatches(filter);
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
    } catch {
      // Fallback to demo batches on network/configuration error
      return this.listDemoBatches(filter);
    }
  }

  private static listDemoBatches(filter: ListBatchesFilter): BatchWithFactory[] {
    const now = new Date().toISOString();
    const result: BatchWithFactory[] = [];

    for (const b of demoBatches.values()) {
      if (filter.factoryId && b.factory_id !== filter.factoryId) continue;
      if (filter.status && b.status !== filter.status) continue;
      if (filter.onlyActiveFresh) {
        if (b.status !== "available" || b.expires_at <= now) continue;
      }
      result.push({ ...b });
    }

    return result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
}
