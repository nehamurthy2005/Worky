/**
 * Tests for geolocation utility functions.
 * Geofence check-in radius: 200m from job site.
 * Shift validation: min 4h, max 16h.
 */

import {
  haversineDistance,
  isWithinCheckinRadius,
  formatDistance,
  validateShiftDuration,
  CHECKIN_RADIUS_METERS,
} from "@/lib/utils/geolocation";

describe("CHECKIN_RADIUS_METERS", () => {
  it("is 200 metres", () => {
    expect(CHECKIN_RADIUS_METERS).toBe(200);
  });
});

describe("haversineDistance", () => {
  // Well-known distance: Mumbai CST ↔ Churchgate ≈ 1.2 km
  const CST_LAT = 18.9398;
  const CST_LNG = 72.8355;
  const CHURCHGATE_LAT = 18.9352;
  const CHURCHGATE_LNG = 72.8256;

  it("returns 0 for identical coordinates", () => {
    expect(haversineDistance(0, 0, 0, 0)).toBe(0);
    expect(haversineDistance(19.076, 72.877, 19.076, 72.877)).toBe(0);
  });

  it("is symmetric (A→B = B→A)", () => {
    const d1 = haversineDistance(CST_LAT, CST_LNG, CHURCHGATE_LAT, CHURCHGATE_LNG);
    const d2 = haversineDistance(CHURCHGATE_LAT, CHURCHGATE_LNG, CST_LAT, CST_LNG);
    expect(Math.abs(d1 - d2)).toBeLessThan(0.001);
  });

  it("calculates roughly correct Mumbai CST–Churchgate distance", () => {
    const dist = haversineDistance(CST_LAT, CST_LNG, CHURCHGATE_LAT, CHURCHGATE_LNG);
    // Should be roughly 1000–1500m
    expect(dist).toBeGreaterThan(800);
    expect(dist).toBeLessThan(1800);
  });

  it("returns distance in metres (not km)", () => {
    // Delhi Connaught Place ↔ India Gate ≈ 2.3 km
    const dist = haversineDistance(28.6315, 77.2167, 28.6129, 77.2295);
    expect(dist).toBeGreaterThan(1000); // > 1000m (not 1 km as a float)
    expect(dist).toBeLessThan(5000);
  });
});

describe("isWithinCheckinRadius", () => {
  // Job site: Dharavi, Mumbai
  const JOB_LAT = 19.0421;
  const JOB_LNG = 72.8533;

  it("returns true when user is at the exact job location", () => {
    expect(isWithinCheckinRadius(JOB_LAT, JOB_LNG, JOB_LAT, JOB_LNG)).toBe(true);
  });

  it("returns true when user is within 200m", () => {
    // Move ~100m north (very small lat offset)
    const nearLat = JOB_LAT + 0.0009; // ≈ 100m
    expect(isWithinCheckinRadius(nearLat, JOB_LNG, JOB_LAT, JOB_LNG)).toBe(true);
  });

  it("returns false when user is 500m away", () => {
    // Move ~500m north
    const farLat = JOB_LAT + 0.0045; // ≈ 500m
    expect(isWithinCheckinRadius(farLat, JOB_LNG, JOB_LAT, JOB_LNG)).toBe(false);
  });

  it("returns false when user is 5km away", () => {
    // Mumbai downtown ↔ BKC ≈ 5km
    expect(isWithinCheckinRadius(19.0596, 72.8295, JOB_LAT, JOB_LNG)).toBe(false);
  });

  it("respects custom radius parameter", () => {
    // 500m away but using 1000m radius
    const farLat = JOB_LAT + 0.0045;
    expect(isWithinCheckinRadius(farLat, JOB_LNG, JOB_LAT, JOB_LNG, 1000)).toBe(true);
  });
});

describe("formatDistance", () => {
  it("formats distances under 1km as metres", () => {
    expect(formatDistance(152)).toBe("152m");
    expect(formatDistance(0)).toBe("0m");
    expect(formatDistance(999)).toBe("999m");
  });

  it("formats distances >= 1000m as km", () => {
    expect(formatDistance(1000)).toBe("1.0km");
    expect(formatDistance(1200)).toBe("1.2km");
    expect(formatDistance(5500)).toBe("5.5km");
  });

  it("rounds metres to nearest integer", () => {
    expect(formatDistance(152.7)).toBe("153m");
  });
});

describe("validateShiftDuration", () => {
  function makeDate(hoursFromNow: number): Date {
    return new Date(Date.now() + hoursFromNow * 60 * 60 * 1000);
  }

  it("rejects checkout before check-in", () => {
    const checkin = makeDate(0);
    const checkout = new Date(checkin.getTime() - 1000); // 1 second before
    const result = validateShiftDuration(checkin, checkout);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("after");
  });

  it("rejects shifts shorter than 4 hours", () => {
    const checkin = makeDate(0);
    const checkout = makeDate(2); // 2 hours
    const result = validateShiftDuration(checkin, checkout);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("4 hours");
  });

  it("rejects shifts longer than 16 hours", () => {
    const checkin = makeDate(0);
    const checkout = makeDate(17); // 17 hours
    const result = validateShiftDuration(checkin, checkout);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("16 hours");
  });

  it("accepts a valid 4-hour shift", () => {
    const checkin = makeDate(0);
    const checkout = makeDate(4);
    const result = validateShiftDuration(checkin, checkout);
    expect(result.valid).toBe(true);
    expect(result.minutes).toBeCloseTo(240, 0);
  });

  it("accepts a valid 8-hour shift", () => {
    const checkin = makeDate(0);
    const checkout = makeDate(8);
    const result = validateShiftDuration(checkin, checkout);
    expect(result.valid).toBe(true);
    expect(result.minutes).toBeCloseTo(480, 0);
  });

  it("accepts a valid 16-hour shift (maximum)", () => {
    const checkin = makeDate(0);
    const checkout = makeDate(16);
    const result = validateShiftDuration(checkin, checkout);
    expect(result.valid).toBe(true);
    expect(result.minutes).toBeCloseTo(960, 0);
  });

  it("returns minutes field always", () => {
    const checkin = makeDate(0);
    const checkout = makeDate(6);
    const result = validateShiftDuration(checkin, checkout);
    expect(result.minutes).toBeCloseTo(360, 0);
  });
});
