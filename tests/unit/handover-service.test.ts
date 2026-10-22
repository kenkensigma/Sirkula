import { describe, it, expect, vi, beforeEach } from "vitest";
import { HandoverService } from "@/lib/services/handover.service";
import { TransactionRepository } from "@/lib/repositories/transaction.repository";
import { AuditService } from "@/lib/audit/audit.service";
import { ProfileRow, TransactionRow } from "@/types/database";
import { ApiError } from "@/lib/errors/api-error";

describe("Phase 4: HandoverService", () => {
  const mockFarmer: ProfileRow = {
    id: "farmer-1",
    name: "Peternak Wayan",
    role: "farmer",
    phone: "081987654321",
    latitude: -8.67,
    longitude: 115.22,
    created_at: "2026-10-21T00:00:00Z",
    updated_at: "2026-10-21T00:00:00Z",
  };

  const mockFactory: ProfileRow = {
    id: "factory-1",
    name: "Pabrik Tahu Sumber Barokah",
    role: "factory",
    phone: "081234567890",
    latitude: -8.65,
    longitude: 115.21,
    created_at: "2026-10-21T00:00:00Z",
    updated_at: "2026-10-21T00:00:00Z",
  };

  const mockTx: TransactionRow = {
    id: "tx-1",
    batch_id: "batch-1",
    farmer_id: "farmer-1",
    factory_id: "factory-1",
    quantity_kg: 50,
    unit_price_idr: 850,
    total_amount_idr: 42500,
    status: "paid_simulated",
    payment_mode: "simulation",
    idempotency_key: "idemp-key-12345",
    cancel_reason: null,
    created_at: "2026-10-21T10:00:00Z",
    updated_at: "2026-10-21T10:00:00Z",
    completed_at: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(AuditService, "log").mockResolvedValue();
  });

  describe("markShipped", () => {
    it("rejects non-owner factory with 403 FORBIDDEN", async () => {
      const mockClient = {} as any;
      const otherFactory: ProfileRow = {
        ...mockFactory,
        id: "factory-999",
      };
      vi.spyOn(TransactionRepository, "getById").mockResolvedValue(mockTx);

      await expect(
        HandoverService.markShipped(mockClient, "tx-1", otherFactory)
      ).rejects.toThrowError(ApiError);
    });

    it("rejects markShipped if transaction is not yet paid_simulated", async () => {
      const mockClient = {} as any;
      const unpaidTx: TransactionRow = {
        ...mockTx,
        status: "awaiting_simulated_payment",
      };
      vi.spyOn(TransactionRepository, "getById").mockResolvedValue(unpaidTx);

      try {
        await HandoverService.markShipped(mockClient, "tx-1", mockFactory);
        expect.fail("Should have thrown STATE_CONFLICT");
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError);
        const apiErr = err as ApiError;
        expect(apiErr.code).toBe("STATE_CONFLICT");
      }
    });
  });

  describe("confirmReceived", () => {
    it("rejects confirmReceived if transaction is not shipped", async () => {
      const mockClient = {} as any;
      vi.spyOn(TransactionRepository, "getById").mockResolvedValue(mockTx); // paid_simulated

      await expect(
        HandoverService.confirmReceived(mockClient, "tx-1", mockFarmer)
      ).rejects.toThrowError(ApiError);
    });
  });
});
