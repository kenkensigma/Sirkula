import { SupabaseClient } from "@supabase/supabase-js";
import { Database, FreshnessZone } from "@/types/database";
import { BatchItemResponse } from "@/types/api";
import { CreateBatchInput, ListBatchesQueryInput, UpdateBatchInput } from "@/lib/validation/batch.schema";
import { BatchRepository, BatchWithFactory } from "@/lib/repositories/batch.repository";
import { calculateFreshness, deriveExpiryTimestamp } from "@/lib/freshness/freshness";
import { calculateHaversineDistance, formatDistanceDisplay, GeoCoordinates } from "@/lib/geo/haversine";
import { ApiError } from "@/lib/errors/api-error";

export class BatchService {
  /**
   * Mengubah data database BatchRow menjadi format kontrak BatchItemResponse.
   */
  static formatBatchResponse(
    batch: BatchWithFactory,
    distanceKm?: number,
    referenceNow: Date = new Date()
  ): BatchItemResponse {
    let freshnessZone: FreshnessZone;
    try {
      const freshness = calculateFreshness(batch.prepared_at, referenceNow);
      freshnessZone = freshness.freshnessZone;
    } catch {
      freshnessZone = "expired";
    }

    const availableKg = Math.max(0, batch.quantity_kg - batch.reserved_kg - batch.sold_kg);

    return {
      id: batch.id,
      factory_id: batch.factory_id,
      factory_name: batch.factory_name,
      quantity_kg: Number(batch.quantity_kg),
      available_kg: Number(availableKg),
      price_per_kg_idr: batch.price_per_kg_idr,
      latitude: batch.latitude,
      longitude: batch.longitude,
      distance_km: distanceKm !== undefined ? formatDistanceDisplay(distanceKm) : undefined,
      prepared_at: batch.prepared_at,
      expires_at: batch.expires_at,
      freshness_zone: freshnessZone,
      status: batch.status,
      description: batch.description,
    };
  }

  /**
   * Membuat batch ampas tahu baru oleh pabrik (factory).
   */
  static async createBatch(
    client: SupabaseClient<Database>,
    factoryId: string,
    factoryName: string,
    input: CreateBatchInput
  ): Promise<BatchItemResponse> {
    const now = new Date();

    // 1. Validasi waktu produksi (prepared_at) tidak boleh di masa depan
    let freshness;
    try {
      freshness = calculateFreshness(input.prepared_at, now);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("PREPARED_AT_FUTURE")) {
        throw new ApiError(
          "VALIDATION_ERROR",
          "Waktu produksi (prepared_at) tidak boleh berada di masa depan."
        );
      }
      throw new ApiError("VALIDATION_ERROR", "Format waktu produksi tidak valid.");
    }

    // 2. Tidak boleh membuat batch yang dari awal sudah kedaluwarsa (>= 12 jam)
    if (!freshness.isEligibleFresh) {
      throw new ApiError(
        "BATCH_EXPIRED",
        "Ampas tahu telah melewati batas kesegaran maksimal (12 jam) dan tidak dapat didaftarkan sebagai pakan segar."
      );
    }

    const expiresAt = deriveExpiryTimestamp(input.prepared_at).toISOString();

    const newBatch = await BatchRepository.create(client, {
      factory_id: factoryId,
      factory_name: factoryName,
      quantity_kg: input.quantity_kg,
      reserved_kg: 0,
      sold_kg: 0,
      price_per_kg_idr: input.price_per_kg_idr,
      latitude: input.latitude,
      longitude: input.longitude,
      prepared_at: new Date(input.prepared_at).toISOString(),
      expires_at: expiresAt,
      description: input.description ?? null,
      status: "available",
    } as Parameters<typeof BatchRepository.create>[1]);

    return this.formatBatchResponse({
      ...newBatch,
      factory_name: factoryName,
    });
  }

  /**
   * Mengambil detail satu batch berdasarkan ID.
   */
  static async getBatchById(
    client: SupabaseClient<Database>,
    batchId: string,
    originCoords?: GeoCoordinates
  ): Promise<BatchItemResponse> {
    const batch = await BatchRepository.getById(client, batchId);
    if (!batch) {
      throw new ApiError("NOT_FOUND", "Batch ampas tahu tidak ditemukan.");
    }

    let distanceKm: number | undefined;
    if (originCoords) {
      distanceKm = calculateHaversineDistance(originCoords, {
        latitude: batch.latitude,
        longitude: batch.longitude,
      });
    }

    return this.formatBatchResponse(batch, distanceKm);
  }

  /**
   * Mengambil daftar batch dengan filter radius (maksimal 15 km), status, dan pengurutan.
   */
  static async listBatches(
    client: SupabaseClient<Database>,
    userRole: string,
    userId: string,
    query: ListBatchesQueryInput,
    profileCoords?: GeoCoordinates
  ): Promise<{ items: BatchItemResponse[]; pagination: { page: number; limit: number; total: number } }> {
    // 1. Tentukan titik koordinat pencarian (dari query atau profil pengguna)
    let searchOrigin: GeoCoordinates | undefined;
    if (query.lat !== undefined && query.lng !== undefined) {
      searchOrigin = { latitude: query.lat, longitude: query.lng };
    } else if (profileCoords) {
      searchOrigin = profileCoords;
    }

    const isFactory = userRole === "factory";

    // 2. Ambil data dari database
    // Jika factory memfilter miliknya sendiri, tampilkan semua status miliknya.
    // Jika marketplace umum/peternak, hanya ambil yang 'available' dan belum kedaluwarsa.
    const batches = await BatchRepository.list(client, {
      factoryId: isFactory && query.status ? userId : undefined,
      status: query.status,
      onlyActiveFresh: !isFactory || !query.status,
    });

    const now = new Date();

    // 3. Hitung jarak dan filter radius 15 km
    interface CalculatedBatch {
      batch: BatchWithFactory;
      distanceKm?: number;
      ageHours: number;
    }

    const calculatedBatches: CalculatedBatch[] = [];

    for (const batch of batches) {
      let distanceKm: number | undefined;
      if (searchOrigin) {
        distanceKm = calculateHaversineDistance(searchOrigin, {
          latitude: batch.latitude,
          longitude: batch.longitude,
        });

        // Filter radius maksimal (default 15 km, dibatasi query.radius_km)
        if (distanceKm > query.radius_km) {
          continue;
        }
      }

      let ageHours = 0;
      try {
        const fresh = calculateFreshness(batch.prepared_at, now);
        ageHours = fresh.ageHours;
        // Jangan tampilkan batch yang expired pada listing publik/farmer
        if (!isFactory && !fresh.isEligibleFresh) {
          continue;
        }
      } catch {
        if (!isFactory) continue;
      }

      calculatedBatches.push({ batch, distanceKm, ageHours });
    }

    // 4. Pengurutan (sort)
    if (query.sort === "distance" && searchOrigin) {
      calculatedBatches.sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
    } else if (query.sort === "freshness") {
      calculatedBatches.sort((a, b) => a.ageHours - b.ageHours);
    } else {
      // sort === 'newest'
      calculatedBatches.sort(
        (a, b) =>
          new Date(b.batch.created_at).getTime() - new Date(a.batch.created_at).getTime()
      );
    }

    // 5. Pagination
    const total = calculatedBatches.length;
    const startIndex = (query.page - 1) * query.limit;
    const paginatedItems = calculatedBatches.slice(startIndex, startIndex + query.limit);

    const items = paginatedItems.map(({ batch, distanceKm }) =>
      this.formatBatchResponse(batch, distanceKm, now)
    );

    return {
      items,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
      },
    };
  }

  /**
   * Memperbarui batch ampas oleh pemilik pabrik.
   */
  static async updateBatch(
    client: SupabaseClient<Database>,
    batchId: string,
    factoryId: string,
    input: UpdateBatchInput
  ): Promise<BatchItemResponse> {
    const existing = await BatchRepository.getById(client, batchId);
    if (!existing) {
      throw new ApiError("NOT_FOUND", "Batch ampas tahu tidak ditemukan.");
    }

    // Verifikasi kepemilikan pabrik
    if (existing.factory_id !== factoryId) {
      throw new ApiError(
        "FORBIDDEN",
        "Akses ditolak: Anda bukan pemilik batch ampas tahu ini."
      );
    }

    // Validasi kuantitas baru tidak boleh kurang dari stok yang sudah dipesan/terjual
    if (input.quantity_kg !== undefined) {
      const minimumAllowed = Number(existing.reserved_kg) + Number(existing.sold_kg);
      if (input.quantity_kg < minimumAllowed) {
        throw new ApiError(
          "STATE_CONFLICT",
          `Kuantitas tidak boleh lebih kecil dari jumlah yang sudah dipesan/terjual (${minimumAllowed} kg).`
        );
      }
    }

    const updated = await BatchRepository.update(client, batchId, {
      quantity_kg: input.quantity_kg,
      price_per_kg_idr: input.price_per_kg_idr,
      description: input.description,
    });

    return this.formatBatchResponse({
      ...updated,
      factory_name: existing.factory_name,
    });
  }

  /**
   * Menonaktifkan listing batch oleh pemilik pabrik.
   */
  static async deactivateBatch(
    client: SupabaseClient<Database>,
    batchId: string,
    factoryId: string
  ): Promise<BatchItemResponse> {
    const existing = await BatchRepository.getById(client, batchId);
    if (!existing) {
      throw new ApiError("NOT_FOUND", "Batch ampas tahu tidak ditemukan.");
    }

    if (existing.factory_id !== factoryId) {
      throw new ApiError(
        "FORBIDDEN",
        "Akses ditolak: Anda bukan pemilik batch ampas tahu ini."
      );
    }

    if (existing.status === "cancelled") {
      throw new ApiError("STATE_CONFLICT", "Batch ampas tahu sudah berstatus nonaktif/dibatalkan.");
    }

    const updated = await BatchRepository.update(client, batchId, {
      status: "cancelled",
    });

    return this.formatBatchResponse({
      ...updated,
      factory_name: existing.factory_name,
    });
  }
}
