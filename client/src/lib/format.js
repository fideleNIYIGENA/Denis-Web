/** Format a number with thousands separators. */
export function formatNumber(value) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? Math.round(n).toLocaleString('en-US') : '0';
}

/** Format a price as an integer amount (no decimals, thousands separators). */
export function formatPrice(value) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '0';
}

/** Format a price with the site currency prefix (RWF). */
export function formatMoney(value) {
  return `RWF ${formatPrice(value)}`;
}
