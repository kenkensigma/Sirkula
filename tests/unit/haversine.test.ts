import { describe, it, expect } from "vitest";
import {
  calculateHaversineDistance,
  formatDistanceDisplay,
  isValidCoordinate,
  isWithinRadius,
  MAX_SEARCH_RADIUS_KM,
} from "@/lib/geo/haversine";

describe("Haversine Distance & Geo Utilities", () => {
  const denpasarPoint = { latitude: -8.65, longitude: 115.21 };
  const sanurPoint = { latitude: -8.68, longitude: 115.26 }; // ~6.5 km away
  const ubudPoint = { latitude: -8.50, longitude: 115.26 }; // ~17 km away

  it("validates coordinate boundaries accurately", () => {
    expect(isValidCoordinate(0, 0)).toBe(true);
    expect(isValidCoordinate(-90, 180)).toBe(true);
    expect(isValidCoordinate(90, -180)).toBe(true);
    expect(isValidCoordinate(-90.1, 0)).toBe(false);
    expect(isValidCoordinate(0, 180.1)).toBe(false);
    expect(isValidCoordinate(NaN, 100)).toBe(false);
  });

  it("calculates 0 distance between identical coordinates", () => {
    const distance = calculateHaversineDistance(denpasarPoint, denpasarPoint);
    expect(distance).toBeCloseTo(0, 4);
  });

  it("calculates realistic distance between Denpasar and Sanur (~6.5 km)", () => {
    const distance = calculateHaversineDistance(denpasarPoint, sanurPoint);
    expect(distance).toBeGreaterThan(5);
    expect(distance).toBeLessThan(8);
  });

  it("formats display distance rounded to 1 decimal place", () => {
    expect(formatDistanceDisplay(6.54321)).toBe(6.5);
    expect(formatDistanceDisplay(6.58)).toBe(6.6);
  });

  it("enforces maximum MVP radius threshold (15 km)", () => {
    expect(MAX_SEARCH_RADIUS_KM).toBe(15);
    // Sanur (~6.5 km) is within 15 km
    expect(isWithinRadius(denpasarPoint, sanurPoint)).toBe(true);
    // Ubud (~17 km) is outside 15 km
    expect(isWithinRadius(denpasarPoint, ubudPoint)).toBe(false);
  });

  it("throws error when invalid coordinates are passed", () => {
    expect(() =>
      calculateHaversineDistance({ latitude: 100, longitude: 0 }, denpasarPoint)
    ).toThrow();
  });
});
