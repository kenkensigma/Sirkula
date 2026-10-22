import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { mockFactory, mockFarmer, mockBatch } = vi.hoisted(() => ({
  mockFactory: {
    id: "factory-1",
    name: "Pabrik Tahu Sumber Barokah",
    role: "factory" as const,
    phone: "081234567890",
    latitude: -8.65,
    longitude: 115.21,
    created_at: "2026-10-21T00:00:00Z",
    updated_at: "2026-10-21T00:00:00Z",
  },
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
  mockBatch: {
    id: "batch-1",
    factory_id: "factory-1",
    factory_name: "Pabrik Tahu Sumber Barokah",
    quantity_kg: 500,
    available_kg: 350,
    price_per_kg_idr: 850,
    latitude: -8.65,
    longitude: 115.21,
    prepared_at: "2026-10-21T08:00:00Z",
    expires_at: "2026-10-21T20:00:00Z",
    freshness_zone: "green" as const,
    status: "available" as const,
    description: "Ampas segar",
  },
}));

let currentMockUser = mockFactory;

vi.mock("@/lib/auth/require-user", () => ({
  requireUser: vi.fn().mockImplementation(() =>
    Promise.resolve({
      user: { id: currentMockUser.id, email: "user@test.local" },
      profile: currentMockUser,
      supabase: {},
    })
  ),
}));

vi.mock("@/lib/services/batch.service", () => ({
  BatchService: {
    createBatch: vi.fn().mockResolvedValue(mockBatch),
    getBatchById: vi.fn().mockResolvedValue(mockBatch),
    listBatches: vi.fn().mockResolvedValue({
      items: [mockBatch],
      pagination: { page: 1, limit: 20, total: 1 },
    }),
    updateBatch: vi.fn().mockImplementation((_client, _batchId, factoryId, input) => {
      if (factoryId !== mockBatch.factory_id) {
        const { ApiError } = require("@/lib/errors/api-error");
        throw new ApiError("FORBIDDEN", "Bukan pemilik batch");
      }
      return Promise.resolve({
        ...mockBatch,
        price_per_kg_idr: input.price_per_kg_idr ?? mockBatch.price_per_kg_idr,
      });
    }),
    deactivateBatch: vi.fn().mockImplementation((_client, _batchId, factoryId) => {
      if (factoryId !== mockBatch.factory_id) {
        const { ApiError } = require("@/lib/errors/api-error");
        throw new ApiError("FORBIDDEN", "Bukan pemilik batch");
      }
      return Promise.resolve({
        ...mockBatch,
        status: "cancelled",
      });
    }),
  },
}));

import { POST as postBatch } from "@/app/api/v1/batches/route";
import { PATCH as patchBatch } from "@/app/api/v1/batches/[batchId]/route";
import { POST as deactivateBatch } from "@/app/api/v1/batches/[batchId]/deactivate/route";

describe("Phase 2: Authenticated Batch Operations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentMockUser = mockFactory;
  });

  it("factory user can create a new batch listing", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/batches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quantity_kg: 500,
        price_per_kg_idr: 850,
        latitude: -8.65,
        longitude: 115.21,
        prepared_at: "2026-10-21T08:00:00Z",
        description: "Ampas segar",
      }),
    });
    const res = await postBatch(req);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.data.id).toBe("batch-1");
    expect(json.data.price_per_kg_idr).toBe(850);
  });

  it("farmer user is rejected with 403 FORBIDDEN when attempting to create a batch", async () => {
    currentMockUser = mockFarmer as any;

    const req = new NextRequest("http://localhost:3000/api/v1/batches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quantity_kg: 500,
        price_per_kg_idr: 850,
        latitude: -8.65,
        longitude: 115.21,
        prepared_at: "2026-10-21T08:00:00Z",
      }),
    });
    const res = await postBatch(req);
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.error.code).toBe("FORBIDDEN");
  });

  it("factory owner can update their batch", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/batches/batch-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        price_per_kg_idr: 900,
      }),
    });
    const res = await patchBatch(req, { params: { batchId: "batch-1" } });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.price_per_kg_idr).toBe(900);
  });

  it("factory owner can deactivate their batch listing", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/batches/batch-1/deactivate", {
      method: "POST",
    });
    const res = await deactivateBatch(req, { params: { batchId: "batch-1" } });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.status).toBe("cancelled");
  });
});
