/**
 * Tests for currency utility functions.
 * All monetary values in KoinWork are stored as integer paisa.
 * 1 KCoin = 1000 paisa | ₹1 = 100 paisa | 1 KCoin = ₹10
 */

import {
  kCoinsToPaisa,
  paisaToKCoins,
  rupeesToPaisa,
  paisaToRupees,
  formatKCoins,
  formatRupees,
  formatKCoinWithRupees,
  calculateTDS,
  PAISA_PER_KCOIN,
  PAISA_PER_RUPEE,
  KCOIN_VALUE_RUPEES,
} from "@/lib/utils/currency";

describe("Currency constants", () => {
  it("PAISA_PER_KCOIN is 1000", () => {
    expect(PAISA_PER_KCOIN).toBe(1000);
  });

  it("PAISA_PER_RUPEE is 100", () => {
    expect(PAISA_PER_RUPEE).toBe(100);
  });

  it("KCOIN_VALUE_RUPEES is 10", () => {
    expect(KCOIN_VALUE_RUPEES).toBe(10);
  });
});

describe("kCoinsToPaisa", () => {
  it("converts 1 KCoin → 1000 paisa", () => {
    expect(kCoinsToPaisa(1)).toBe(1000);
  });

  it("converts 50 KCoins → 50000 paisa", () => {
    expect(kCoinsToPaisa(50)).toBe(50_000);
  });

  it("converts 0 KCoins → 0 paisa", () => {
    expect(kCoinsToPaisa(0)).toBe(0);
  });

  it("always returns an integer (no float drift)", () => {
    const result = kCoinsToPaisa(1.1);
    expect(Number.isInteger(result)).toBe(true);
    expect(result).toBe(1100);
  });

  it("converts 1000 KCoins → 1000000 paisa", () => {
    expect(kCoinsToPaisa(1000)).toBe(1_000_000);
  });
});

describe("paisaToKCoins", () => {
  it("converts 1000 paisa → 1 KCoin", () => {
    expect(paisaToKCoins(1000)).toBe(1);
  });

  it("converts 0 paisa → 0 KCoins", () => {
    expect(paisaToKCoins(0)).toBe(0);
  });

  it("converts 500 paisa → 0.5 KCoins", () => {
    expect(paisaToKCoins(500)).toBe(0.5);
  });

  it("round-trips: kCoinsToPaisa → paisaToKCoins", () => {
    const original = 42;
    expect(paisaToKCoins(kCoinsToPaisa(original))).toBe(original);
  });
});

describe("rupeesToPaisa", () => {
  it("converts ₹1 → 100 paisa", () => {
    expect(rupeesToPaisa(1)).toBe(100);
  });

  it("converts ₹10 → 1000 paisa", () => {
    expect(rupeesToPaisa(10)).toBe(1000);
  });

  it("always returns integer", () => {
    expect(Number.isInteger(rupeesToPaisa(1.5))).toBe(true);
    expect(rupeesToPaisa(1.5)).toBe(150);
  });

  it("converts ₹30000 → 3000000 paisa (TDS threshold)", () => {
    expect(rupeesToPaisa(30_000)).toBe(3_000_000);
  });
});

describe("paisaToRupees", () => {
  it("converts 100 paisa → ₹1", () => {
    expect(paisaToRupees(100)).toBe(1);
  });

  it("converts 1000 paisa → ₹10", () => {
    expect(paisaToRupees(1000)).toBe(10);
  });

  it("round-trips: rupeesToPaisa → paisaToRupees", () => {
    expect(paisaToRupees(rupeesToPaisa(500))).toBe(500);
  });
});

describe("formatKCoins", () => {
  it("formats 1000 paisa as '1 KCoins'", () => {
    expect(formatKCoins(1000)).toContain("1");
    expect(formatKCoins(1000)).toContain("KCoins");
  });

  it("formats 50000 paisa correctly", () => {
    expect(formatKCoins(50_000)).toContain("50");
    expect(formatKCoins(50_000)).toContain("KCoins");
  });

  it("formats 0 paisa as '0 KCoins'", () => {
    expect(formatKCoins(0)).toContain("0");
  });
});

describe("formatRupees", () => {
  it("formats 100 paisa as ₹1", () => {
    expect(formatRupees(100)).toContain("1");
    expect(formatRupees(100)).toContain("₹");
  });

  it("formats 50000 paisa as ₹500", () => {
    expect(formatRupees(50_000)).toContain("500");
  });
});

describe("formatKCoinWithRupees", () => {
  it("includes both KCoins and ₹ value", () => {
    const result = formatKCoinWithRupees(5000); // 5 KCoins = ₹50
    expect(result).toContain("KCoins");
    expect(result).toContain("₹");
    expect(result).toContain("5");
    expect(result).toContain("50");
  });
});

describe("calculateTDS", () => {
  const THRESHOLD = 3_000_000; // ₹30,000 in paisa

  it("returns 0 TDS when below threshold", () => {
    expect(calculateTDS(0, 1_000_000)).toBe(0); // ₹10,000 earned + ₹10,000 withdrawal
    expect(calculateTDS(1_000_000, 1_000_000)).toBe(0); // ₹10,000 + ₹10,000 = ₹20,000 — still below
  });

  it("returns 0 TDS when exactly at threshold", () => {
    // ₹20,000 earned + ₹10,000 withdrawal = ₹30,000 exactly (no TDS yet)
    expect(calculateTDS(2_000_000, 1_000_000)).toBe(0);
  });

  it("taxes only the amount crossing the threshold", () => {
    // ₹20,000 earned + ₹15,000 withdrawal = ₹35,000
    // Taxable: ₹5,000 = 500,000 paisa
    // TDS = 500,000 * 10% = 50,000 paisa
    const tds = calculateTDS(2_000_000, 1_500_000);
    expect(tds).toBe(50_000);
  });

  it("taxes full withdrawal when already above threshold", () => {
    // Already ₹30,000+ earned — full 10% TDS on withdrawal
    const tds = calculateTDS(THRESHOLD, 1_000_000);
    expect(tds).toBe(100_000); // 10% of ₹10,000 = ₹1,000 = 100,000 paisa
  });

  it("taxes full withdrawal when far above threshold", () => {
    const tds = calculateTDS(10_000_000, 500_000); // ₹1,00,000 earned, ₹5,000 withdrawal
    expect(tds).toBe(50_000); // 10% of ₹5,000 = 50,000 paisa
  });

  it("returns integer (no float result)", () => {
    const tds = calculateTDS(2_500_000, 1_234_567);
    expect(Number.isInteger(tds)).toBe(true);
  });
});
