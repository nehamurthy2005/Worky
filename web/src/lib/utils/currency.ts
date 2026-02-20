/**
 * KoinWork Currency Utilities
 *
 * Conversion constants:
 *   1 KCoin = ₹10 = 1000 paisa
 *   ₹1     = 100 paisa
 *
 * Rule: All DB values are stored as integer paisa (BIGINT).
 *       These helpers are for UI display and input parsing only.
 */

export const PAISA_PER_KCOIN = 1000;
export const PAISA_PER_RUPEE = 100;
export const KCOIN_VALUE_RUPEES = 10; // 1 KCoin = ₹10

/**
 * Convert KCoins to paisa (for DB writes).
 * Always returns an integer.
 */
export function kCoinsToPaisa(kcoins: number): number {
  return Math.round(kcoins * PAISA_PER_KCOIN);
}

/**
 * Convert paisa to KCoins (for UI display).
 */
export function paisaToKCoins(paisa: number): number {
  return paisa / PAISA_PER_KCOIN;
}

/**
 * Convert rupees to paisa (for DB writes).
 * Always returns an integer.
 */
export function rupeesToPaisa(rupees: number): number {
  return Math.round(rupees * PAISA_PER_RUPEE);
}

/**
 * Convert paisa to rupees (for UI display).
 */
export function paisaToRupees(paisa: number): number {
  return paisa / PAISA_PER_RUPEE;
}

/**
 * Format paisa as a human-readable KCoin string.
 * e.g. 5000 paisa → "5 KCoins"
 */
export function formatKCoins(paisa: number): string {
  const kcoins = paisaToKCoins(paisa);
  return `${kcoins.toLocaleString("en-IN")} KCoins`;
}

/**
 * Format paisa as a human-readable rupee string.
 * e.g. 5000 paisa → "₹50"
 */
export function formatRupees(paisa: number): string {
  const rupees = paisaToRupees(paisa);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(rupees);
}

/**
 * Format paisa as combined display: "5 KCoins (₹50)"
 */
export function formatKCoinWithRupees(paisa: number): string {
  return `${formatKCoins(paisa)} (${formatRupees(paisa)})`;
}

/**
 * Calculate TDS amount in paisa.
 * Under Section 194-O: 10% TDS on earnings > ₹30,000/year.
 *
 * @param yearlyEarningsPaisa - total earnings so far this FY
 * @param withdrawalAmountPaisa - amount being withdrawn now
 * @returns tds amount in paisa (integer)
 */
export function calculateTDS(
  yearlyEarningsPaisa: number,
  withdrawalAmountPaisa: number
): number {
  const TDS_THRESHOLD_PAISA = 3_000_000; // ₹30,000 = 3,000,000 paisa
  const TDS_RATE = 0.1; // 10%

  if (yearlyEarningsPaisa >= TDS_THRESHOLD_PAISA) {
    // Already over threshold — full TDS on withdrawal
    return Math.round(withdrawalAmountPaisa * TDS_RATE);
  }

  const remainingBeforeThreshold =
    TDS_THRESHOLD_PAISA - yearlyEarningsPaisa;

  if (withdrawalAmountPaisa <= remainingBeforeThreshold) {
    // Still below threshold — no TDS
    return 0;
  }

  // Partial: only the amount above the threshold is taxed
  const taxableAmount = withdrawalAmountPaisa - remainingBeforeThreshold;
  return Math.round(taxableAmount * TDS_RATE);
}
