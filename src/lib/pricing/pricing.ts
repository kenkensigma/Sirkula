export const CO2E_KG_PER_KG_MATERIAL = 1.736;
export const FEED_SAVINGS_IDR_PER_KG = 850;

/**
 * Calculates total order price in integer Rupiah.
 */
export function calculateOrderTotalIdr(quantityKg: number, unitPriceIdr: number): number {
  if (quantityKg <= 0) {
    throw new Error("Quantity must be positive");
  }
  if (unitPriceIdr < 0) {
    throw new Error("Unit price cannot be negative");
  }
  return Math.round(quantityKg * unitPriceIdr);
}

/**
 * Calculates estimated impact metrics from diverted ampas tahu material.
 * NOTE: As documented, these are estimates based on baseline assumption models.
 */
export function calculateEstimatedImpact(materialKg: number) {
  if (materialKg < 0) {
    throw new Error("Material quantity cannot be negative");
  }

  const estimatedCo2eKg = Math.round(materialKg * CO2E_KG_PER_KG_MATERIAL * 1000) / 1000;
  const estimatedSavingsIdr = Math.round(materialKg * FEED_SAVINGS_IDR_PER_KG);

  return {
    divertedKg: materialKg,
    estimatedCo2eKg,
    estimatedSavingsIdr,
    methodology: {
      co2ePerKg: CO2E_KG_PER_KG_MATERIAL,
      savingsPerKg: FEED_SAVINGS_IDR_PER_KG,
      label: "estimasi berdasarkan koefisien asumsi; perlu validasi",
    },
  };
}
