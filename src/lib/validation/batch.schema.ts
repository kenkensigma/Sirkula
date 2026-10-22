import { z } from "zod";

export const createBatchSchema = z.object({
  quantity_kg: z
    .number()
    .positive("Kuantitas ampas harus lebih besar dari 0")
    .max(50000, "Kuantitas melebihi batas wajar"),
  price_per_kg_idr: z
    .number()
    .int("Harga harus berupa bilangan bulat rupiah")
    .nonnegative("Harga tidak boleh negatif"),
  latitude: z
    .number()
    .min(-90, "Latitude harus antara -90 dan 90")
    .max(90, "Latitude harus antara -90 dan 90"),
  longitude: z
    .number()
    .min(-180, "Longitude harus antara -180 dan 180")
    .max(180, "Longitude harus antara -180 dan 180"),
  prepared_at: z
    .string()
    .datetime({ message: "Format waktu produksi (prepared_at) harus berupa ISO 8601 UTC" }),
  description: z.string().max(500, "Deskripsi maksimal 500 karakter").optional(),
});

export const updateBatchSchema = z.object({
  quantity_kg: z
    .number()
    .positive("Kuantitas ampas harus lebih besar dari 0")
    .max(50000, "Kuantitas melebihi batas wajar")
    .optional(),
  price_per_kg_idr: z
    .number()
    .int("Harga harus berupa bilangan bulat")
    .nonnegative("Harga tidak boleh negatif")
    .optional(),
  description: z.string().max(500, "Deskripsi maksimal 500 karakter").nullable().optional(),
});

export const listBatchesQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radius_km: z.coerce
    .number()
    .positive()
    .max(15, "Radius pencarian maksimal 15 km pada MVP")
    .default(15),
  status: z.enum(["available", "paused", "sold_out", "expired", "cancelled"]).optional(),
  sort: z.enum(["distance", "freshness", "newest"]).default("distance"),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

export type CreateBatchInput = z.infer<typeof createBatchSchema>;
export type UpdateBatchInput = z.infer<typeof updateBatchSchema>;
export type ListBatchesQueryInput = z.infer<typeof listBatchesQuerySchema>;
