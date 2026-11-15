export const hasNumericValue = value => (typeof value === 'number' || (typeof value === 'string' && value.trim() !== '')) && Number.isFinite(Number(value));
export function deskNumber(value, digits = 2) {
  return hasNumericValue(value) ? Number(value).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits }) : '—';
}
export function deskRiskLabel(risk) {
  if (!risk || risk.status === 'NOT_ASSESSED' || !hasNumericValue(risk.limit_usage)) return 'Limits not assessed · no portfolio limit check';
  return `Risk ${risk.status || 'unknown'} · ${risk.dominant_risk || 'see assessment'}`;
}
