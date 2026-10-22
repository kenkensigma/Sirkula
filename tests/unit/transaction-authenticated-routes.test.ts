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
    batch_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    farmer_id: "farmer-1",
    factory_id: "factory-1",
    quantity_kg: 50,
    unit_price_idr: 850,
    total_amount_idr: 42500,
    status: "awaiting_simulated_payment" as const,
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

vi.mock("@/lib/services/transaction.service", () => ({
  TransactionService: {
    createTransaction: vi.fn().mockResolvedValue(mockTx),
    getTransactionById: vi.fn().mockResolvedValue(mockTx),
    listTransactions: vi.fn().mockResolvedValue({
      items: [mockTx],
      pagination: { page: 1, limit: 20, total: 1 },
    }),
    cancelTransaction: vi.fn().mockResolvedValue({
      ...mockTx,
      status: "cancelled",
    }),
  },
}));

import { GET as getTransactions, POST as postTransaction } from "@/app/api/v1/transactions/route";
import { GET as getTransactionDetail } from "@/app/api/v1/transactions/[transactionId]/route";
import { POST as cancelTransaction } from "@/app/api/v1/transactions/[transactionId]/cancel/route";

describe("Phase 3: Authenticated Transaction Endpoints", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentMockUser = mockFarmer;
  });

  it("farmer can create a transaction and reserve stock", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        batch_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        quantity_kg: 50,
        idempotency_key: "idemp-key-12345",
      }),
    });
    const res = await postTransaction(req);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.data.id).toBe("tx-1");
    expect(json.data.status).toBe("awaiting_simulated_payment");
  });

  it("factory user is rejected from creating transactions with 403 FORBIDDEN", async () => {
    currentMockUser = mockFactory as any;

    const req = new NextRequest("http://localhost:3000/api/v1/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        batch_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        quantity_kg: 50,
        idempotency_key: "idemp-key-12345",
      }),
    });
    const res = await postTransaction(req);
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.error.code).toBe("FORBIDDEN");
  });

  it("authenticated participant can fetch their transaction list", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/transactions?page=1&limit=10", {
      method: "GET",
    });
    const res = await getTransactions(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toHaveLength(1);
    expect(json.meta.pagination.total).toBe(1);
  });

  it("authenticated participant can cancel a transaction", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/transactions/tx-1/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reason: "Stok berlebih di peternakan",
      }),
    });
    const res = await cancelTransaction(req, { params: { transactionId: "tx-1" } });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.status).toBe("cancelled");
  });
});
