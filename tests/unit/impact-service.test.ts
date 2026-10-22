import { describe, it, expect, vi } from "vitest";
import { ImpactService } from "@/lib/services/impact.service";

describe("Phase 5: ImpactService", () => {
  it("computes accurate aggregate metrics and applies methodology", async () => {
    const mockLogs = [
      { material_kg: 300, estimated_co2e_kg: 520.8, estimated_feed_savings_idr: 255000 },
      { material_kg: 200, estimated_co2e_kg: 347.2, estimated_feed_savings_idr: 170000 },
    ];

    const mockClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockResolvedValue({
              data: mockLogs,
              error: null,
            }),
          }),
        }),
      }),
    } as any;

    const summary = await ImpactService.getSummary(mockClient, {
      from: "2026-10-01T00:00:00Z",
      to: "2026-10-31T23:59:59Z",
    });

    expect(summary.diverted_from_waste_kg).toBe(500);
    expect(summary.estimated_co2e_avoided_kg).toBe(868);
    expect(summary.estimated_feed_savings_idr).toBe(425000);
    expect(summary.methodology.co2e_kg_per_kg_material).toBe(1.736);
    expect(summary.methodology.feed_savings_idr_per_kg).toBe(850);
    expect(summary.methodology.label).toContain("estimasi");
  });

  it("handles empty logs gracefully with 0 values", async () => {
    const mockClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      }),
    } as any;

    const summary = await ImpactService.getSummary(mockClient);

    expect(summary.diverted_from_waste_kg).toBe(0);
    expect(summary.estimated_co2e_avoided_kg).toBe(0);
    expect(summary.estimated_feed_savings_idr).toBe(0);
  });
});
