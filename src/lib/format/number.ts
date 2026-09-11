/**
 * Number formatting helpers.
 */

/** Format integer with locale grouping: 1234567 → "1.234.567" (vi-VN). */
export function formatNumber(n: number): string {
  return n.toLocaleString("vi-VN");
}

/** Compact number: 1500 → "1,5K", 1200000 → "1,2M". */
export function formatCompactNumber(n: number): string {
  return new Intl.NumberFormat("vi-VN", {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1,
  }).format(n);
}

/** Percentage: 0.856 → "85,6%". */
export function formatPercent(n: number, decimals = 1): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "percent",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);
}
