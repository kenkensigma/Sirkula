import { describe, it, expect } from "vitest";
import {
  calculateOrderTotalIdr,
  calculateEstimatedImpact,
  CO2E_KG_PER_KG_MATERIAL,
  FEED_SAVINGS_IDR_PER_KG,
} from "@/lib/pricing/pricing";

describe("Pricing and Impact Calculations", () => {
  it("calculates total price accurately as integer Rupiah", () => {
    // 50 kg at Rp850/kg = Rp42,500
    expect(calculateOrderTotalIdr(50, 850)).toBe(42500);

    // Handles fractional kg with rounding: 12.5 kg at Rp850/kg = 10,625
    expect(calculateOrderTotalIdr(12.5, 850)).toBe(10625);
  });

  it("rejects zero or negative quantities", () => {
    expect(() => calculateOrderTotalIdr(0, 850)).toThrow();
    expect(() => calculateOrderTotalIdr(-10, 850)).toThrow();
  });

  it("rejects negative unit price", () => {
    expect(() => calculateOrderTotalIdr(50, -100)).toThrow();
  });

  it("calculates estimated impact with explicit assumptions", () => {
    const impact = calculateEstimatedImpact(500); // 500 kg
    expect(impact.divertedKg).toBe(500);
    expect(impact.estimatedCo2eKg).toBe(500 * CO2E_KG_PER_KG_MATERIAL); // 868 kg CO2e
    expect(impact.estimatedSavingsIdr).toBe(500 * FEED_SAVINGS_IDR_PER_KG); // 425,000 IDR
    expect(impact.methodology.label).toContain("estimasi");
  });
});
