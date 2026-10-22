import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { mockFarmer, mockFactory, mockTx } = vi.hoisted(() => ({
  mockFarmer: {
    id: "farmer-1",
    name: "Peternak Wayan",
    role: "farmer" as const,
    phone: "081987654321",
    latitude: -8.67,
    longitude: 115.22,
    created_at: "2026-10-21T00:00:00Z",
    updated_at: "2026-10-21T00:00:00Z",
  },
  mockFactory: {
    id: "factory-1",
    name: "Pabrik Tahu Barokah",
    role: "factory" as const,
    phone: "081234567890",
    latitude: -8.65,
    longitude: 115.21,
    created_at: "2026-10-21T00:00:00Z",
    updated_at: "2026-10-21T00:00:00Z",
  },
  mockTx: {
    id: "tx-1",
    batch_id: "batch-1",
    farmer_id: "farmer-1",
    factory_id: "factory-1",
    quantity_kg: 50,
    unit_price_idr: 850,
    total_amount_idr: 42500,
    status: "paid_simulated" as const,
    payment_mode: "simulation" as const,
    idempotency_key: "idemp-key-12345",
    created_at: "2026-10-21T10:00:00Z",
    completed_at: null,
  },
}));

let currentMockUser = mockFarmer;

vi.mock("@/lib/auth/require-user", () => ({
  requireUser: vi.fn().mockImplementation(() =>
    Promise.resolve({
      user: { id: currentMockUser.id, email: "user@sirkula.local" },
      profile: currentMockUser,
      supabase: {},
    })
  ),
}));

vi.mock("@/lib/services/payment-simulation.service", () => ({
  PaymentSimulationService: {
    paySimulation: vi.fn().mockResolvedValue({
      ...mockTx,
      status: "paid_simulated",
    }),
  },
}));

vi.mock("@/lib/services/handover.service", () => ({
  HandoverService: {
    markShipped: vi.fn().mockResolvedValue({
      ...mockTx,
      status: "shipped",
    }),
    confirmReceived: vi.fn().mockResolvedValue({
      transaction: { ...mockTx, status: "awaiting_handover_verification" },
      pin: "123456",
      instructions: "Berikan 6-digit PIN ini kepada pengantar.",
    }),
    verifyPin: vi.fn().mockResolvedValue({
      ...mockTx,
      status: "completed",
      completed_at: "2026-10-21T12:00:00Z",
    }),
  },
}));

import { POST as postPaySimulation } from "@/app/api/v1/transactions/[transactionId]/pay-simulation/route";
import { POST as postMarkShipped } from "@/app/api/v1/transactions/[transactionId]/mark-shipped/route";
import { POST as postConfirmReceived } from "@/app/api/v1/transactions/[transactionId]/confirm-received/route";
import { POST as postVerifyPin } from "@/app/api/v1/transactions/[transactionId]/verify-pin/route";

describe("Phase 4: Payment Simulation & Handover Route Handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentMockUser = mockFarmer;
  });

  describe("POST /api/v1/transactions/:transactionId/pay-simulation", () => {
    it("successfully marks payment as simulated", async () => {
      const req = new NextRequest("http://localhost:3000/api/v1/transactions/tx-1/pay-simulation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_method: "simulated_balance" }),
      });
      const res = await postPaySimulation(req, { params: { transactionId: "tx-1" } });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data.status).toBe("paid_simulated");
    });
  });

  describe("POST /api/v1/transactions/:transactionId/mark-shipped", () => {
    it("factory can mark transaction shipped", async () => {
      currentMockUser = mockFactory as any;

      const req = new NextRequest("http://localhost:3000/api/v1/transactions/tx-1/mark-shipped", {
        method: "POST",
      });
      const res = await postMarkShipped(req, { params: { transactionId: "tx-1" } });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data.status).toBe("shipped");
    });
  });

  describe("POST /api/v1/transactions/:transactionId/confirm-received", () => {
    it("farmer can confirm receipt and receive generated PIN", async () => {
      const req = new NextRequest("http://localhost:3000/api/v1/transactions/tx-1/confirm-received", {
        method: "POST",
      });
      const res = await postConfirmReceived(req, { params: { transactionId: "tx-1" } });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data.pin).toBe("123456");
      expect(json.data.transaction.status).toBe("awaiting_handover_verification");
    });
  });

  describe("POST /api/v1/transactions/:transactionId/verify-pin", () => {
    it("verifies PIN and marks transaction completed", async () => {
      const req = new NextRequest("http://localhost:3000/api/v1/transactions/tx-1/verify-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: "123456" }),
      });
      const res = await postVerifyPin(req, { params: { transactionId: "tx-1" } });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data.status).toBe("completed");
    });
  });
});
