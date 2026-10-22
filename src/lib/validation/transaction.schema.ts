import { z } from "zod";

const uuidPattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export const createTransactionSchema = z.object({
  batch_id: z.string().regex(uuidPattern, "Batch ID harus berupa UUID valid"),
  quantity_kg: z
    .number()
    .positive("Kuantitas pemesanan harus lebih besar dari 0")
    .max(50000, "Kuantitas melebihi batas pesanan"),
  idempotency_key: z
    .string()
    .min(8, "Idempotency key minimal 8 karakter")
    .max(128, "Idempotency key maksimal 128 karakter"),
});

export const paySimulationSchema = z.object({
  payment_method: z.literal("simulated_balance", {
    message: "Metode pembayaran harus simulated_balance pada MVP",
  }),
});

export const verifyPinSchema = z.object({
  pin: z.string().regex(/^\d{6}$/, "PIN serah-terima harus terdiri dari 6 digit angka"),
});

export const cancelTransactionSchema = z.object({
  reason: z.string().max(300, "Alasan pembatalan maksimal 300 karakter").optional(),
});

export const listTransactionsQuerySchema = z.object({
  status: z
    .enum([
      "awaiting_simulated_payment",
      "paid_simulated",
      "shipped",
      "awaiting_handover_verification",
      "completed",
      "cancelled",
      "cancelled_refunded_simulated",
      "needs_review",
    ])
    .optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
  role_view: z.enum(["farmer", "factory", "admin"]).optional(),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type PaySimulationInput = z.infer<typeof paySimulationSchema>;
export type VerifyPinInput = z.infer<typeof verifyPinSchema>;
export type CancelTransactionInput = z.infer<typeof cancelTransactionSchema>;
export type ListTransactionsQueryInput = z.infer<typeof listTransactionsQuerySchema>;
