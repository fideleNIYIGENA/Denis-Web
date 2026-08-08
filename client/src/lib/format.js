/** Format a number with thousands separators. */
export function formatNumber(value) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? Math.round(n).toLocaleString('en-US') : '0';
}

/** Format a price with a currency prefix — `RWF 5,000` or `$5.00`. */
export function formatPrice(value, currency = 'RWF') {
  const n = Number(value || 0);
  if (currency === 'USD') {
    return Number.isFinite(n) ? `$${n.toFixed(2)}` : '$0.00';
  }
  return `RWF ${formatNumber(n)}`;
}

/** Legacy helper: format a value as RWF. */
export function formatMoney(value) {
  return formatPrice(value, 'RWF');
}

/**
 * Pick the price for the active currency, falling back to the other currency
 * when the selected one has no price configured. Returns `{ amount, currency }`.
 */
export function pickPrice(rwf, usd, currency) {
  const r = Number(rwf) || 0;
  const u = Number(usd) || 0;
  if (currency === 'USD') return u > 0 ? { amount: u, currency: 'USD' } : { amount: r, currency: 'RWF' };
  return r > 0 ? { amount: r, currency: 'RWF' } : { amount: u, currency: 'USD' };
}
