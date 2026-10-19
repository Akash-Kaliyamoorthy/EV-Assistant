/**
 * Formatting utilities.
 */

export function fmtNumber(n, decimals = 2) {
  if (n == null) return '—';
  return Number(n).toFixed(decimals);
}

export function fmtTime(hours) {
  if (hours == null) return '—';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} hr`;
  return `${h} hr ${m} min`;
}

export function fmtCurrency(amount, symbol = '₹') {
  if (amount == null) return '—';
  return `${symbol}${Number(amount).toFixed(2)}`;
}

export function fmtSOC(soc) {
  return `${Math.round(soc)}%`;
}

export function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
