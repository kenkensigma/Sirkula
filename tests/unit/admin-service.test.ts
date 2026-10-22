import { describe, it, expect, vi, beforeEach } from "vitest";
import { AdminService } from "@/lib/services/admin.service";
import { TransactionRepository } from "@/lib/repositories/transaction.repository";
import { AuditService } from "@/lib/audit/audit.service";
import { ProfileRow, TransactionRow } from "@/types/database";
import { ApiError } from "@/lib/errors/api-error";

describe("Phase 5: AdminService", () => {
  const mockAdmin: ProfileRow = {
    id: "admin-1",
    name: "Admin Re-Flow",
    role: "admin",
    phone: "081122334455",
    latitude: -8.655,
    longitude: 115.215,
    created_at: "2026-10-21T00:00:00Z",
    updated_at: "2026-10-21T00:00:00Z",
  };

  const mockFarmer: ProfileRow = {
    id: "farmer-1",
    name: "Pak Wayan",
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
    status: "paid_simulated",
    payment_mode: "simulation",
    idempotency_key: "idemp-12345",
    cancel_reason: null,
    created_at: "2026-10-21T10:00:00Z",
    updated_at: "2026-10-21T10:00:00Z",
    completed_at: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(AuditService, "log").mockResolvedValue();
  });

  describe("listAllTransactions authorization", () => {
    it("rejects non-admin users with 403 FORBIDDEN", async () => {
      const mockClient = {} as any;
      await expect(
        AdminService.listAllTransactions(mockClient, mockFarmer, {})
      ).rejects.toThrowError(ApiError);
    });
  });

  describe("refundSimulation", () => {
    it("rejects non-admin users with 403 FORBIDDEN", async () => {
      const mockClient = {} as any;
      await expect(
        AdminService.refundSimulation(mockClient, mockFarmer, "tx-1")
      ).rejects.toThrowError(ApiError);
    });

    it("rejects refund if transaction is awaiting_simulated_payment", async () => {
      const mockClient = {} as any;
      const unpaidTx: TransactionRow = {
        ...mockTx,
        status: "awaiting_simulated_payment",
      };
      vi.spyOn(TransactionRepository, "getById").mockResolvedValue(unpaidTx);

      await expect(
        AdminService.refundSimulation(mockClient, mockAdmin, "tx-1")
      ).rejects.toThrowError(ApiError);
    });

    it("handles idempotent replay if transaction was already refunded", async () => {
      const mockClient = {} as any;
      const alreadyRefunded: TransactionRow = {
        ...mockTx,
        status: "cancelled_refunded_simulated",
      };
      vi.spyOn(TransactionRepository, "getById").mockResolvedValue(alreadyRefunded);

      const res = await AdminService.refundSimulation(mockClient, mockAdmin, "tx-1");
      expect(res.status).toBe("cancelled_refunded_simulated");
    });
  });

  describe("listAuditLogs", () => {
    it("rejects non-admin users with 403 FORBIDDEN", async () => {
      await expect(
        AdminService.listAuditLogs(mockFarmer)
      ).rejects.toThrowError(ApiError);
    });
  });
});
