import { describe, it, expect } from "vitest";
import { createBatchSchema, listBatchesQuerySchema } from "@/lib/validation/batch.schema";
import { createTransactionSchema, verifyPinSchema } from "@/lib/validation/transaction.schema";

describe("Input Validation Schemas", () => {
  it("validates valid batch creation input", () => {
    const input = {
      quantity_kg: 500,
      price_per_kg_idr: 850,
      latitude: -8.65,
      longitude: 115.21,
      prepared_at: "2026-10-21T08:00:00Z",
      description: "Ampas tahu segar",
    };
    const result = createBatchSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("rejects negative price or zero quantity for batches", () => {
    const invalidInput = {
      quantity_kg: 0,
      price_per_kg_idr: -50,
      latitude: -8.65,
      longitude: 115.21,
      prepared_at: "2026-10-21T08:00:00Z",
    };
    const result = createBatchSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it("enforces maximum 15 km radius limit on query", () => {
    const validQuery = { radius_km: 15 };
    expect(listBatchesQuerySchema.safeParse(validQuery).success).toBe(true);

    const overRadiusQuery = { radius_km: 25 };
    expect(listBatchesQuerySchema.safeParse(overRadiusQuery).success).toBe(false);
  });

  it("validates transaction creation payload", () => {
    const valid = {
      batch_id: "11111111-1111-1111-1111-111111111111",
      quantity_kg: 50,
      idempotency_key: "unique-client-key-12345",
    };
    expect(createTransactionSchema.safeParse(valid).success).toBe(true);

    const invalidUuid = {
      batch_id: "not-a-uuid",
      quantity_kg: 50,
      idempotency_key: "short",
    };
    expect(createTransactionSchema.safeParse(invalidUuid).success).toBe(false);
  });

  it("validates PIN format", () => {
    expect(verifyPinSchema.safeParse({ pin: "123456" }).success).toBe(true);
    expect(verifyPinSchema.safeParse({ pin: "12345" }).success).toBe(false);
    expect(verifyPinSchema.safeParse({ pin: "abcdef" }).success).toBe(false);
  });
});
