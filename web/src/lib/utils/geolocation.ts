/**
 * KoinWork Geolocation Utilities
 *
 * All distances are in metres.
 * Geofence radius for check-in: 200 m from job site.
 */

export const CHECKIN_RADIUS_METERS = 200;
export const EARTH_RADIUS_METERS = 6_371_000;

/**
 * Haversine formula: great-circle distance between two GPS coordinates.
 * Returns distance in metres.
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
}

/**
 * Returns true if the user is within the allowed check-in radius.
 */
export function isWithinCheckinRadius(
  userLat: number,
  userLng: number,
  jobLat: number,
  jobLng: number,
  radiusMeters: number = CHECKIN_RADIUS_METERS
): boolean {
  const distance = haversineDistance(userLat, userLng, jobLat, jobLng);
  return distance <= radiusMeters;
}

/**
 * Returns how far the user is from the job site, formatted as a string.
 * e.g. "152m" or "1.2km"
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

/**
 * Validates that a shift duration is within allowed bounds.
 * Min: 4 hours (240 minutes), Max: 16 hours (960 minutes)
 */
export function validateShiftDuration(
  checkinTime: Date,
  checkoutTime: Date
): { valid: boolean; minutes: number; error?: string } {
  const minutes =
    (checkoutTime.getTime() - checkinTime.getTime()) / (1000 * 60);

  if (checkoutTime <= checkinTime) {
    return { valid: false, minutes, error: "Checkout must be after check-in." };
  }
  if (minutes < 240) {
    return {
      valid: false,
      minutes,
      error: `Minimum shift is 4 hours. This shift was ${Math.floor(minutes / 60)}h ${Math.round(minutes % 60)}m.`,
    };
  }
  if (minutes > 960) {
    return {
      valid: false,
      minutes,
      error: `Maximum shift is 16 hours. This shift was ${Math.floor(minutes / 60)}h ${Math.round(minutes % 60)}m.`,
    };
  }
  return { valid: true, minutes };
}
