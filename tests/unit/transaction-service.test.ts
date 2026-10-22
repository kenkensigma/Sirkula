import { describe, it, expect, vi, beforeEach } from "vitest";
import { TransactionService } from "@/lib/services/transaction.service";
import { TransactionRepository } from "@/lib/repositories/transaction.repository";
import { AuditService } from "@/lib/audit/audit.service";
import { ProfileRow, TransactionRow } from "@/types/database";
import { ApiError } from "@/lib/errors/api-error";

describe("Phase 3: TransactionService", () => {
  const mockFarmer: ProfileRow = {
    id: "farmer-1",
    name: "Pak Wayan Peternak",
    role: "farmer",
    phone: "081987654321",
    latitude: -8.67,
    longitude: 115.22,
    created_at: "2026-10-21T00:00:00Z",
    updated_at: "2026-10-21T00:00:00Z",
  };

  const mockFactory: ProfileRow = {
    id: "factory-1",
    name: "Pabrik Tahu Barokah",
    role: "factory",
    phone: "081234567890",
    latitude: -8.65,
    longitude: 115.21,
    created_at: "2026-10-21T00:00:00Z",
    updated_at: "2026-10-21T00:00:00Z",
  };

  const mockOtherUser: ProfileRow = {
    id: "farmer-2",
    name: "Peternak Lain",
    role: "farmer",
    phone: null,
    latitude: null,
    longitude: null,
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
    status: "awaiting_simulated_payment",
    payment_mode: "simulation",
    idempotency_key: "client-unique-key-12345",
    cancel_reason: null,
    created_at: "2026-10-21T10:00:00Z",
    updated_at: "2026-10-21T10:00:00Z",
    completed_at: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(AuditService, "log").mockResolvedValue();
  });

  it("formats TransactionRow correctly to TransactionItemResponse", () => {
    const formatted = TransactionService.formatTransactionResponse(mockTx);

    expect(formatted).toEqual({
      id: "tx-1",
      batch_id: "batch-1",
      farmer_id: "farmer-1",
      factory_id: "factory-1",
      quantity_kg: 50,
      unit_price_idr: 850,
      total_amount_idr: 42500,
      status: "awaiting_simulated_payment",
      payment_mode: "simulation",
      idempotency_key: "client-unique-key-12345",
      created_at: "2026-10-21T10:00:00Z",
      completed_at: null,
    });
  });

  describe("createTransaction", () => {
    it("rejects non-farmer role with 403 FORBIDDEN", async () => {
      const mockClient = {} as any;
      await expect(
        TransactionService.createTransaction(mockClient, mockFactory, {
          batch_id: "batch-1",
          quantity_kg: 50,
          idempotency_key: "idemp-key-123",
        })
      ).rejects.toThrowError(ApiError);
    });

    it("creates transaction and logs audit entry when called by farmer", async () => {
      const mockClient = {} as any;
      vi.spyOn(TransactionRepository, "createReservation").mockResolvedValue(mockTx);

      const result = await TransactionService.createTransaction(mockClient, mockFarmer, {
        batch_id: "batch-1",
        quantity_kg: 50,
        idempotency_key: "client-unique-key-12345",
      });

      expect(result.id).toBe("tx-1");
      expect(result.total_amount_idr).toBe(42500);
      expect(AuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          actorId: "farmer-1",
          action: "CREATE_TRANSACTION",
          entityType: "transaction",
          entityId: "tx-1",
        })
      );
    });
  });

  describe("getTransactionById", () => {
    it("allows the farmer who placed the order", async () => {
      const mockClient = {} as any;
      vi.spyOn(TransactionRepository, "getById").mockResolvedValue(mockTx);

      const res = await TransactionService.getTransactionById(mockClient, "tx-1", mockFarmer);
      expect(res.id).toBe("tx-1");
    });

    it("allows the factory who supplies the order", async () => {
      const mockClient = {} as any;
      vi.spyOn(TransactionRepository, "getById").mockResolvedValue(mockTx);

      const res = await TransactionService.getTransactionById(mockClient, "tx-1", mockFactory);
      expect(res.id).toBe("tx-1");
    });

    it("throws 404 NOT_FOUND for third party to prevent disclosure", async () => {
      const mockClient = {} as any;
      vi.spyOn(TransactionRepository, "getById").mockResolvedValue(mockTx);

      await expect(
        TransactionService.getTransactionById(mockClient, "tx-1", mockOtherUser)
      ).rejects.toThrowError(ApiError);
    });
  });

  describe("cancelTransaction state machine", () => {
    it("allows cancellation when status is awaiting_simulated_payment", async () => {
      const mockClient = {} as any;
      vi.spyOn(TransactionRepository, "getById").mockResolvedValue(mockTx);
      vi.spyOn(TransactionRepository, "cancelAndRelease").mockResolvedValue({
        ...mockTx,
        status: "cancelled",
        cancel_reason: "Batal beli",
      });

      const res = await TransactionService.cancelTransaction(
        mockClient,
        "tx-1",
        mockFarmer,
        "Batal beli"
      );

      expect(res.status).toBe("cancelled");
      expect(AuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "CANCEL_TRANSACTION",
        })
      );
    });

    it("rejects cancellation when status is shipped or completed with 409 STATE_CONFLICT", async () => {
      const mockClient = {} as any;
      const shippedTx: TransactionRow = {
        ...mockTx,
        status: "shipped",
      };
      vi.spyOn(TransactionRepository, "getById").mockResolvedValue(shippedTx);

      try {
        await TransactionService.cancelTransaction(mockClient, "tx-1", mockFarmer);
        expect.fail("Should have thrown STATE_CONFLICT");
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError);
        const apiErr = err as ApiError;
        expect(apiErr.code).toBe("STATE_CONFLICT");
        expect(apiErr.statusCode).toBe(409);
      }
    });
  });
});
