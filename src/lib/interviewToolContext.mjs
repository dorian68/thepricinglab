// Only declared market inputs cross a lesson/tool link. No solution is encoded.
export function readInterviewToolContext(search = '') {
  const params = new URLSearchParams(search);
  const result = {};
  const ranges = {
    spot: [0.00000001, 1e8], strike: [0.00000001, 1e8], maturityDays: [0, 10950],
    riskFreeRate: [-100, 100], dividendYield: [-100, 100], volatility: [0, 500],
    quantity: [1, 10000000], multiplier: [0.00000001, 10000000],
    spotShockPercent: [0, 95], volShockPointsPercent: [0, 500], daysShock: [0, 10950],
  };
  for (const [key, [min, max]] of Object.entries(ranges)) {
    const raw = params.get(key);
    if (raw === null || !raw.trim()) continue;
    const value = Number(raw);
    if (Number.isFinite(value) && value >= min && value <= max) result[key] = value;
  }
  if (['call', 'put'].includes(params.get('optionType'))) result.optionType = params.get('optionType');
  if (['long', 'short'].includes(params.get('position'))) result.position = params.get('position');
  if (/^[A-Z]{3}$/.test(params.get('currency') || '')) result.currency = params.get('currency');
  return result;
}

const PRESETS = ['Bull call spread', 'Long straddle', 'Butterfly', 'Iron condor', 'Naked short call', 'Long call', 'Bear put spread', 'Short strangle'];
export function readPayoffPreset(value) {
  const normal = String(value || '').trim().toLowerCase().replace(/[-_]+/g, ' ');
  return PRESETS.find(item => item.toLowerCase() === normal) || 'Bull call spread';
}
