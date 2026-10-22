import { describe, it, expect, vi, beforeEach } from "vitest";
import { BatchService } from "@/lib/services/batch.service";
import { BatchWithFactory } from "@/lib/repositories/batch.repository";
import { ApiError } from "@/lib/errors/api-error";

describe("Phase 2: BatchService", () => {
  const referenceTime = new Date("2026-10-21T12:00:00Z");

  const mockBatch: BatchWithFactory = {
    id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    factory_id: "11111111-1111-1111-1111-111111111111",
    factory_name: "Pabrik Tahu Sumber Barokah",
    quantity_kg: 500,
    reserved_kg: 50,
    sold_kg: 100,
    price_per_kg_idr: 850,
    latitude: -8.65,
    longitude: 115.21,
    prepared_at: "2026-10-21T08:00:00Z", // 4 hours old -> green
    expires_at: "2026-10-21T20:00:00Z",
    status: "available",
    description: "Ampas tahu segar baru selesai pres.",
    created_at: "2026-10-21T08:05:00Z",
    updated_at: "2026-10-21T08:05:00Z",
  };

  it("calculates available_kg correctly from quantity, reserved, and sold", () => {
    const formatted = BatchService.formatBatchResponse(mockBatch, 4.234, referenceTime);

    // 500 - 50 - 100 = 350
    expect(formatted.available_kg).toBe(350);
    expect(formatted.quantity_kg).toBe(500);
    expect(formatted.factory_name).toBe("Pabrik Tahu Sumber Barokah");
    expect(formatted.freshness_zone).toBe("green");
    expect(formatted.distance_km).toBe(4.2); // formatted to 1 decimal place
  });

  it("assigns 'expired' freshness zone when age exceeds 12 hours", () => {
    const expiredBatch: BatchWithFactory = {
      ...mockBatch,
      prepared_at: "2026-10-20T22:00:00Z", // 14 hours old
    };

    const formatted = BatchService.formatBatchResponse(expiredBatch, undefined, referenceTime);
    expect(formatted.freshness_zone).toBe("expired");
  });

  describe("createBatch validation and business rules", () => {
    it("rejects prepared_at timestamp in the future", async () => {
      const mockClient = {} as any;
      const futureTime = new Date(Date.now() + 3600000).toISOString();

      await expect(
        BatchService.createBatch(mockClient, "factory-1", "Pabrik", {
          quantity_kg: 200,
          price_per_kg_idr: 800,
          latitude: -8.65,
          longitude: 115.21,
          prepared_at: futureTime,
        })
      ).rejects.toThrowError(ApiError);
    });

    it("rejects creating batch that is already older than 12 hours", async () => {
      const mockClient = {} as any;
      const ancientTime = new Date(Date.now() - 15 * 3600000).toISOString();

      try {
        await BatchService.createBatch(mockClient, "factory-1", "Pabrik", {
          quantity_kg: 200,
          price_per_kg_idr: 800,
          latitude: -8.65,
          longitude: 115.21,
          prepared_at: ancientTime,
        });
        expect.fail("Should have thrown BATCH_EXPIRED");
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError);
        const apiErr = err as ApiError;
        expect(apiErr.code).toBe("BATCH_EXPIRED");
        expect(apiErr.statusCode).toBe(410);
      }
    });
  });
});
