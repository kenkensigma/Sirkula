import { FreshnessZone } from "@/types/database";

export const MAX_FRESH_HOURS = 12;

export interface FreshnessResult {
  ageHours: number;
  freshnessZone: FreshnessZone;
  isEligibleFresh: boolean;
  expiresAt: Date;
}

/**
 * Calculates freshness parameters for a batch based on its preparation timestamp.
 *
 * Freshness policy:
 * - 0 <= age <= 8 hours: 'green' (optimal fresh)
 * - > 8 hours and <= 10.5 hours: 'yellow' (moderately fresh)
 * - > 10.5 hours and < 12 hours: 'pending_decision' (explicitly flags that product specification is pending)
 * - >= 12 hours: 'expired' (must not be sold as fresh feed)
 *
 * Throws an error if prepared_at is in the future.
 */
export function calculateFreshness(
  preparedAtInput: string | Date,
  referenceNow: Date = new Date()
): FreshnessResult {
  const preparedAt = typeof preparedAtInput === "string" ? new Date(preparedAtInput) : preparedAtInput;

  if (isNaN(preparedAt.getTime())) {
    throw new Error("Invalid prepared_at timestamp");
  }

  const nowMs = referenceNow.getTime();
  const prepMs = preparedAt.getTime();

  if (prepMs > nowMs) {
    throw new Error("PREPARED_AT_FUTURE: Preparation time cannot be in the future");
  }

  const ageMs = nowMs - prepMs;
  const ageHours = ageMs / 3_600_000;
  const expiresAt = new Date(prepMs + MAX_FRESH_HOURS * 3_600_000);

  let freshnessZone: FreshnessZone;
  let isEligibleFresh: boolean;

  if (ageHours <= 8) {
    freshnessZone = "green";
    isEligibleFresh = true;
  } else if (ageHours <= 10.5) {
    freshnessZone = "yellow";
    isEligibleFresh = true;
  } else if (ageHours < 12) {
    // Explicitly preserved for product team decision as instructed in README and SYSTEM.md
    freshnessZone = "pending_decision";
    isEligibleFresh = true;
  } else {
    freshnessZone = "expired";
    isEligibleFresh = false;
  }

  return {
    ageHours,
    freshnessZone,
    isEligibleFresh,
    expiresAt,
  };
}

/**
 * Derives batch expiration timestamp (12 hours after prepared_at).
 */
export function deriveExpiryTimestamp(preparedAtInput: string | Date): Date {
  const preparedAt = typeof preparedAtInput === "string" ? new Date(preparedAtInput) : preparedAtInput;
  if (isNaN(preparedAt.getTime())) {
    throw new Error("Invalid prepared_at timestamp");
  }
  return new Date(preparedAt.getTime() + MAX_FRESH_HOURS * 3_600_000);
}
