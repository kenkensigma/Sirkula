import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { GET as getTransactions, POST as postTransaction } from "@/app/api/v1/transactions/route";
import { GET as getTransactionDetail } from "@/app/api/v1/transactions/[transactionId]/route";
import { POST as cancelTransaction } from "@/app/api/v1/transactions/[transactionId]/cancel/route";

describe("Phase 3: Transaction Route Handlers", () => {
  describe("GET /api/v1/transactions", () => {
    it("returns 401 UNAUTHENTICATED when unauthenticated", async () => {
      const req = new NextRequest("http://localhost:3000/api/v1/transactions", {
        method: "GET",
      });
      const res = await getTransactions(req);
      const json = await res.json();

      expect(res.status).toBe(401);
      expect(json.error.code).toBe("UNAUTHENTICATED");
    });
  });

  describe("POST /api/v1/transactions", () => {
    it("returns 401 UNAUTHENTICATED when unauthenticated", async () => {
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

      expect(res.status).toBe(401);
      expect(json.error.code).toBe("UNAUTHENTICATED");
    });
  });

  describe("GET /api/v1/transactions/:transactionId", () => {
    it("returns 401 UNAUTHENTICATED when unauthenticated", async () => {
      const req = new NextRequest("http://localhost:3000/api/v1/transactions/tx-1", {
        method: "GET",
      });
      const res = await getTransactionDetail(req, { params: { transactionId: "tx-1" } });
      const json = await res.json();

      expect(res.status).toBe(401);
      expect(json.error.code).toBe("UNAUTHENTICATED");
    });
  });

  describe("POST /api/v1/transactions/:transactionId/cancel", () => {
    it("returns 401 UNAUTHENTICATED when unauthenticated", async () => {
      const req = new NextRequest("http://localhost:3000/api/v1/transactions/tx-1/cancel", {
        method: "POST",
      });
      const res = await cancelTransaction(req, { params: { transactionId: "tx-1" } });
      const json = await res.json();

      expect(res.status).toBe(401);
      expect(json.error.code).toBe("UNAUTHENTICATED");
    });
  });
});
