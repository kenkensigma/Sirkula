import { describe, it, expect } from "vitest";
import { calculateFreshness, deriveExpiryTimestamp } from "@/lib/freshness/freshness";

describe("Freshness Calculation Policy", () => {
  const referenceNow = new Date("2026-10-21T12:00:00Z");

  it("classifies 0 hours old as green", () => {
    const preparedAt = new Date("2026-10-21T12:00:00Z");
    const result = calculateFreshness(preparedAt, referenceNow);
    expect(result.freshnessZone).toBe("green");
    expect(result.isEligibleFresh).toBe(true);
    expect(result.ageHours).toBe(0);
  });

  it("classifies exactly 8 hours old as green", () => {
    const preparedAt = new Date("2026-10-21T04:00:00Z"); // 8 hours earlier
    const result = calculateFreshness(preparedAt, referenceNow);
    expect(result.freshnessZone).toBe("green");
    expect(result.isEligibleFresh).toBe(true);
    expect(result.ageHours).toBe(8);
  });

  it("classifies >8 and <=10.5 hours as yellow", () => {
    // 8.5 hours earlier
    const prep8Half = new Date(referenceNow.getTime() - 8.5 * 3600 * 1000);
    const res8Half = calculateFreshness(prep8Half, referenceNow);
    expect(res8Half.freshnessZone).toBe("yellow");
    expect(res8Half.isEligibleFresh).toBe(true);

    // Exactly 10.5 hours earlier
    const prep10Half = new Date(referenceNow.getTime() - 10.5 * 3600 * 1000);
    const res10Half = calculateFreshness(prep10Half, referenceNow);
    expect(res10Half.freshnessZone).toBe("yellow");
    expect(res10Half.isEligibleFresh).toBe(true);
  });

  it("explicitly flags 10.5 to <12 hours as pending_decision without making silent assumptions", () => {
    // 11 hours earlier
    const prep11 = new Date(referenceNow.getTime() - 11 * 3600 * 1000);
    const res11 = calculateFreshness(prep11, referenceNow);
    expect(res11.freshnessZone).toBe("pending_decision");
    expect(res11.isEligibleFresh).toBe(true);
  });

  it("classifies >=12 hours as expired and ineligible for fresh catalog", () => {
    // Exactly 12 hours earlier
    const prep12 = new Date(referenceNow.getTime() - 12 * 3600 * 1000);
    const res12 = calculateFreshness(prep12, referenceNow);
    expect(res12.freshnessZone).toBe("expired");
    expect(res12.isEligibleFresh).toBe(false);

    // 14 hours earlier
    const prep14 = new Date(referenceNow.getTime() - 14 * 3600 * 1000);
    const res14 = calculateFreshness(prep14, referenceNow);
    expect(res14.freshnessZone).toBe("expired");
    expect(res14.isEligibleFresh).toBe(false);
  });

  it("rejects prepared_at in the future", () => {
    const futureTime = new Date(referenceNow.getTime() + 1000 * 60);
    expect(() => calculateFreshness(futureTime, referenceNow)).toThrowError(
      /PREPARED_AT_FUTURE/
    );
  });

  it("derives expiration timestamp exactly 12 hours after prepared_at", () => {
    const preparedAt = new Date("2026-10-21T02:00:00Z");
    const expiresAt = deriveExpiryTimestamp(preparedAt);
    expect(expiresAt.toISOString()).toBe("2026-10-21T14:00:00.000Z");
  });
});
