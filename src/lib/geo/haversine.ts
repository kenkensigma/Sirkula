export const MAX_SEARCH_RADIUS_KM = 15;

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
}

/**
 * Validates whether latitude and longitude are within valid geographical boundaries.
 */
export function isValidCoordinate(latitude: number, longitude: number): boolean {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

/**
 * Calculates great-circle distance between two points on Earth using the Haversine formula.
 * Returns distance in kilometers (exact double precision).
 */
export function calculateHaversineDistance(
  coord1: GeoCoordinates,
  coord2: GeoCoordinates
): number {
  if (
    !isValidCoordinate(coord1.latitude, coord1.longitude) ||
    !isValidCoordinate(coord2.latitude, coord2.longitude)
  ) {
    throw new Error("Invalid coordinate values provided to Haversine calculation");
  }

  const toRad = (angle: number) => (angle * Math.PI) / 180;
  const EARTH_RADIUS_KM = 6371;

  const dLat = toRad(coord2.latitude - coord1.latitude);
  const dLon = toRad(coord2.longitude - coord1.longitude);
  const lat1 = toRad(coord1.latitude);
  const lat2 = toRad(coord2.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Formats distance for display only (rounded to 1 decimal place).
 * NOTE: Internal filtering and comparisons must always use exact full precision.
 */
export function formatDistanceDisplay(distanceKm: number): number {
  return Math.round(distanceKm * 10) / 10;
}

/**
 * Determines whether the target point is within maximum allowed radius.
 */
export function isWithinRadius(
  origin: GeoCoordinates,
  target: GeoCoordinates,
  maxRadiusKm = MAX_SEARCH_RADIUS_KM
): boolean {
  const distance = calculateHaversineDistance(origin, target);
  return distance <= maxRadiusKm;
}
