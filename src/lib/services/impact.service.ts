import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/database";
import { ImpactSummaryResponse } from "@/types/api";
import { CO2E_KG_PER_KG_MATERIAL, FEED_SAVINGS_IDR_PER_KG } from "@/lib/pricing/pricing";
import { ApiError } from "@/lib/errors/api-error";

export interface ImpactSummaryQuery {
  from?: string;
  to?: string;
}

export class ImpactService {
  /**
   * Mengambil ringkasan agregat dampak lingkungan dan penghematan biaya pakan
   * dari ampas tahu yang berhasil dialihkan dari limbah (transaksi completed).
   */
  static async getSummary(
    client: SupabaseClient<Database>,
    query: ImpactSummaryQuery = {}
  ): Promise<ImpactSummaryResponse> {
    const now = new Date();
    // Default 30 hari ke belakang jika tanggal tidak ditentukan
    const defaultFrom = new Date(now.getTime() - 30 * 24 * 3600 * 1000).toISOString();
    const defaultTo = now.toISOString();

    const fromDate = query.from || defaultFrom;
    const toDate = query.to || defaultTo;

    // Ambil data dari impact_logs
    const { data: logs, error } = await client
      .from("impact_logs")
      .select("material_kg, estimated_co2e_kg, estimated_feed_savings_idr, created_at")
      .gte("created_at", fromDate)
      .lte("created_at", toDate);

    if (error) {
      throw new ApiError("INTERNAL_ERROR", `Gagal memuat ringkasan dampak: ${error.message}`);
    }

    let totalMaterialKg = 0;
    let totalCo2eKg = 0;
    let totalSavingsIdr = 0;

    if (logs && logs.length > 0) {
      for (const log of logs) {
        totalMaterialKg += Number(log.material_kg);
        totalCo2eKg += Number(log.estimated_co2e_kg);
        totalSavingsIdr += Number(log.estimated_feed_savings_idr);
      }
    }

    return {
      period: {
        from: fromDate,
        to: toDate,
      },
      diverted_from_waste_kg: Math.round(totalMaterialKg * 100) / 100,
      estimated_co2e_avoided_kg: Math.round(totalCo2eKg * 1000) / 1000,
      estimated_feed_savings_idr: Math.round(totalSavingsIdr),
      methodology: {
        co2e_kg_per_kg_material: CO2E_KG_PER_KG_MATERIAL,
        feed_savings_idr_per_kg: FEED_SAVINGS_IDR_PER_KG,
        label: "estimasi berdasarkan koefisien asumsi; perlu validasi",
      },
    };
  }
}
