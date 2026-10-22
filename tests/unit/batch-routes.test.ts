import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { GET as getBatches, POST as postBatch } from "@/app/api/v1/batches/route";
import { GET as getBatchDetail, PATCH as patchBatch } from "@/app/api/v1/batches/[batchId]/route";
import { POST as deactivateBatch } from "@/app/api/v1/batches/[batchId]/deactivate/route";

describe("Phase 2: Batch Marketplace Route Handlers", () => {
  describe("GET /api/v1/batches", () => {
    it("rejects radius_km greater than 15 with 400 VALIDATION_ERROR", async () => {
      const req = new NextRequest("http://localhost:3000/api/v1/batches?radius_km=25", {
        method: "GET",
      });
      const res = await getBatches(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toBeDefined();
      expect(json.error.code).toBe("VALIDATION_ERROR");
      expect(json.error.details["radius_km"]).toContain("15 km");
    });

    it("rejects invalid coordinate values with 400 VALIDATION_ERROR", async () => {
      const req = new NextRequest("http://localhost:3000/api/v1/batches?lat=120&lng=115.21", {
        method: "GET",
      });
      const res = await getBatches(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("POST /api/v1/batches", () => {
    it("returns 401 UNAUTHENTICATED when unauthenticated", async () => {
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

      expect(res.status).toBe(401);
      expect(json.error.code).toBe("UNAUTHENTICATED");
    });
  });

  describe("PATCH /api/v1/batches/:batchId", () => {
    it("returns 401 UNAUTHENTICATED when unauthenticated", async () => {
      const req = new NextRequest("http://localhost:3000/api/v1/batches/1111", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price_per_kg_idr: 900 }),
      });
      const res = await patchBatch(req, { params: { batchId: "1111" } });
      const json = await res.json();

      expect(res.status).toBe(401);
      expect(json.error.code).toBe("UNAUTHENTICATED");
    });
  });

  describe("POST /api/v1/batches/:batchId/deactivate", () => {
    it("returns 401 UNAUTHENTICATED when unauthenticated", async () => {
      const req = new NextRequest("http://localhost:3000/api/v1/batches/1111/deactivate", {
        method: "POST",
      });
      const res = await deactivateBatch(req, { params: { batchId: "1111" } });
      const json = await res.json();

      expect(res.status).toBe(401);
      expect(json.error.code).toBe("UNAUTHENTICATED");
    });
  });
});
