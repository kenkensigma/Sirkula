import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").max(100, "Nama maksimal 100 karakter").optional(),
  phone: z
    .string()
    .regex(/^(\+62|62|0)8[1-9][0-9]{6,10}$/, "Format nomor telepon tidak valid")
    .nullable()
    .optional(),
  latitude: z
    .number()
    .min(-90, "Latitude harus antara -90 dan 90")
    .max(90, "Latitude harus antara -90 dan 90")
    .nullable()
    .optional(),
  longitude: z
    .number()
    .min(-180, "Longitude harus antara -180 dan 180")
    .max(180, "Longitude harus antara -180 dan 180")
    .nullable()
    .optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
