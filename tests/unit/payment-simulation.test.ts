import { describe, it, expect, vi, beforeEach } from "vitest";
import { PaymentSimulationService } from "@/lib/services/payment-simulation.service";
import { TransactionRepository } from "@/lib/repositories/transaction.repository";
import { AuditService } from "@/lib/audit/audit.service";
import { ProfileRow, TransactionRow } from "@/types/database";
import { ApiError } from "@/lib/errors/api-error";

describe("Phase 4: PaymentSimulationService", () => {
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

  it("rejects payment if caller is not the farmer owner", async () => {
    const mockClient = {} as any;
    vi.spyOn(TransactionRepository, "getById").mockResolvedValue(mockTx);

    await expect(
      PaymentSimulationService.paySimulation(mockClient, "tx-1", mockOtherUser)
    ).rejects.toThrowError(ApiError);
  });

  it("rejects payment if status is not awaiting_simulated_payment", async () => {
    const mockClient = {} as any;
    const completedTx: TransactionRow = {
      ...mockTx,
      status: "completed",
    };
    vi.spyOn(TransactionRepository, "getById").mockResolvedValue(completedTx);

    try {
      await PaymentSimulationService.paySimulation(mockClient, "tx-1", mockFarmer);
      expect.fail("Should have thrown STATE_CONFLICT");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      const apiErr = err as ApiError;
      expect(apiErr.code).toBe("STATE_CONFLICT");
      expect(apiErr.statusCode).toBe(409);
    }
  });

  it("handles idempotent replay if already paid_simulated", async () => {
    const mockClient = {} as any;
    const paidTx: TransactionRow = {
      ...mockTx,
      status: "paid_simulated",
    };
    vi.spyOn(TransactionRepository, "getById").mockResolvedValue(paidTx);

    const res = await PaymentSimulationService.paySimulation(mockClient, "tx-1", mockFarmer);
    expect(res.status).toBe("paid_simulated");
  });
});
