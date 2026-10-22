import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { mockAdmin, mockFarmer, mockSummary } = vi.hoisted(() => ({
  mockAdmin: {
    id: "admin-1",
    name: "Admin Re-Flow",
    role: "admin" as const,
    phone: "081122334455",
    latitude: -8.655,
    longitude: 115.215,
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
  mockSummary: {
    period: { from: "2026-10-01", to: "2026-10-31" },
    diverted_from_waste_kg: 500,
    estimated_co2e_avoided_kg: 868,
    estimated_feed_savings_idr: 425000,
    methodology: {
      co2e_kg_per_kg_material: 1.736,
      feed_savings_idr_per_kg: 850,
      label: "estimasi berdasarkan koefisien asumsi; perlu validasi",
    },
  },
}));

let currentMockUser = mockAdmin;

vi.mock("@/lib/auth/require-user", () => ({
  requireUser: vi.fn().mockImplementation(() =>
    Promise.resolve({
      user: { id: currentMockUser.id, email: "user@sirkula.local" },
      profile: currentMockUser,
      supabase: {},
    })
  ),
}));

vi.mock("@/lib/services/impact.service", () => ({
  ImpactService: {
    getSummary: vi.fn().mockResolvedValue(mockSummary),
  },
}));

vi.mock("@/lib/services/admin.service", () => ({
  AdminService: {
    listAllTransactions: vi.fn().mockResolvedValue({
      items: [],
      pagination: { page: 1, limit: 20, total: 0 },
    }),
    refundSimulation: vi.fn().mockResolvedValue({
      id: "tx-1",
      status: "cancelled_refunded_simulated",
    }),
    listAuditLogs: vi.fn().mockResolvedValue({
      items: [{ id: "log-1", action: "TEST_ACTION" }],
      pagination: { page: 1, limit: 20, total: 1 },
    }),
  },
}));

import { GET as getImpactSummary } from "@/app/api/v1/impact/summary/route";
import { GET as getAdminTransactions } from "@/app/api/v1/admin/transactions/route";
import { POST as postAdminRefund } from "@/app/api/v1/admin/transactions/[transactionId]/refund-simulation/route";
import { GET as getAdminAuditLogs } from "@/app/api/v1/admin/audit-logs/route";

describe("Phase 5: Impact and Admin Route Handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentMockUser = mockAdmin;
  });

  describe("GET /api/v1/impact/summary", () => {
    it("returns aggregate impact metrics with methodology", async () => {
      const req = new NextRequest("http://localhost:3000/api/v1/impact/summary", {
        method: "GET",
      });
      const res = await getImpactSummary(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data.diverted_from_waste_kg).toBe(500);
      expect(json.data.estimated_co2e_avoided_kg).toBe(868);
      expect(json.data.methodology.label).toContain("estimasi");
    });
  });

  describe("GET /api/v1/admin/transactions", () => {
    it("allows admin to list all transactions", async () => {
      const req = new NextRequest("http://localhost:3000/api/v1/admin/transactions", {
        method: "GET",
      });
      const res = await getAdminTransactions(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data).toBeDefined();
    });

    it("rejects non-admin users with 403 FORBIDDEN", async () => {
      currentMockUser = mockFarmer as any;

      const req = new NextRequest("http://localhost:3000/api/v1/admin/transactions", {
        method: "GET",
      });
      const res = await getAdminTransactions(req);
      const json = await res.json();

      expect(res.status).toBe(403);
      expect(json.error.code).toBe("FORBIDDEN");
    });
  });

  describe("POST /api/v1/admin/transactions/:id/refund-simulation", () => {
    it("allows admin to execute refund simulation", async () => {
      const req = new NextRequest("http://localhost:3000/api/v1/admin/transactions/tx-1/refund-simulation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Barang rusak saat serah-terima" }),
      });
      const res = await postAdminRefund(req, { params: { transactionId: "tx-1" } });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data.status).toBe("cancelled_refunded_simulated");
    });

    it("rejects non-admin with 403 FORBIDDEN", async () => {
      currentMockUser = mockFarmer as any;

      const req = new NextRequest("http://localhost:3000/api/v1/admin/transactions/tx-1/refund-simulation", {
        method: "POST",
      });
      const res = await postAdminRefund(req, { params: { transactionId: "tx-1" } });
      const json = await res.json();

      expect(res.status).toBe(403);
      expect(json.error.code).toBe("FORBIDDEN");
    });
  });

  describe("GET /api/v1/admin/audit-logs", () => {
    it("allows admin to view audit logs", async () => {
      const req = new NextRequest("http://localhost:3000/api/v1/admin/audit-logs", {
        method: "GET",
      });
      const res = await getAdminAuditLogs(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data).toHaveLength(1);
    });

    it("rejects non-admin with 403 FORBIDDEN", async () => {
      currentMockUser = mockFarmer as any;

      const req = new NextRequest("http://localhost:3000/api/v1/admin/audit-logs", {
        method: "GET",
      });
      const res = await getAdminAuditLogs(req);
      const json = await res.json();

      expect(res.status).toBe(403);
      expect(json.error.code).toBe("FORBIDDEN");
    });
  });
});
