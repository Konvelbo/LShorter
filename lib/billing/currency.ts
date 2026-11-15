// ============================================================================
// Multi-Currency & Zero-Decimal Normalization Utilities (LShorter Billing)
// ============================================================================

/**
 * ISO 4217 zero-decimal currencies: these currencies have no minor units (no cents).
 * In payment gateways (Dodo Payments, Stripe), amounts are whole integer units.
 */
export const ZERO_DECIMAL_CURRENCIES = new Set([
  "BIF",
  "CLP",
  "DJF",
  "GNF",
  "JPY",
  "KMF",
  "KRW",
  "MGA",
  "PYG",
  "RWF",
  "UGX",
  "VND",
  "VUV",
  "XAF",
  "XOF",
  "XPF",
]);

/**
 * Three-decimal currencies (1 unit = 1000 subunits).
 */
export const THREE_DECIMAL_CURRENCIES = new Set([
  "BHD",
  "JOD",
  "KWD",
  "OMR",
  "TND",
]);

/**
 * Checks whether a currency is zero-decimal.
 */
export function isZeroDecimalCurrency(currency: string = "USD"): boolean {
  return ZERO_DECIMAL_CURRENCIES.has(currency.toUpperCase().trim());
}

/**
 * Normalizes a raw amount from a payment gateway (Dodo Payments / Stripe):
 * - For zero-decimal currencies (e.g. XOF, JPY), returns the integer amount.
 * - For 3-decimal currencies, divides by 1000.
 * - For standard 2-decimal currencies (USD, EUR, GBP), divides by 100.
 */
export function normalizeGatewayAmount(
  rawAmount: number,
  currency: string = "USD"
): number {
  if (typeof rawAmount !== "number" || Number.isNaN(rawAmount) || rawAmount <= 0) {
    return 0;
  }
  const curr = currency.toUpperCase().trim();
  if (ZERO_DECIMAL_CURRENCIES.has(curr)) {
    return Math.round(rawAmount);
  }
  if (THREE_DECIMAL_CURRENCIES.has(curr)) {
    return Number((rawAmount / 1000).toFixed(3));
  }
  return Number((rawAmount / 100).toFixed(2));
}

/**
 * Corrects legacy stored amounts (e.g. in Convex) where zero-decimal currencies
 * were mistakenly divided by 100 (e.g. 121.30 XOF instead of 12,130 XOF).
 */
export function correctStoredInvoiceAmount(
  amount: number,
  currency: string = "USD"
): number {
  if (typeof amount !== "number" || Number.isNaN(amount) || amount <= 0) {
    return 0;
  }
  const curr = currency.toUpperCase().trim();
  if (ZERO_DECIMAL_CURRENCIES.has(curr)) {
    // If the amount has a fractional part or is abnormally low (under 500 for a paid subscription),
    // it was divided by 100 during a previous bug. Restore it by multiplying by 100.
    if (amount % 1 !== 0 || amount < 500) {
      return Math.round(amount * 100);
    }
    return Math.round(amount);
  }
  return Number(amount.toFixed(2));
}

/**
 * Formats a currency amount for display on UI or PDF:
 * - For zero-decimal currencies: formatted without decimals (e.g. "12 130 XOF")
 * - For standard currencies: formatted with 2 decimals (e.g. "19,60 USD")
 */
export function formatCurrencyDisplay(
  amount: number,
  currency: string = "USD"
): string {
  const curr = currency.toUpperCase().trim();
  const normalized = correctStoredInvoiceAmount(amount, curr);
  if (ZERO_DECIMAL_CURRENCIES.has(curr)) {
    return `${Math.round(normalized).toLocaleString("fr-FR")} ${curr}`;
  }
  return `${normalized.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${curr}`;
}
