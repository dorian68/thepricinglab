import { blackScholesOption, normCdf } from './blackScholes.mjs';

// Small, explicit terminal-scenario illustration for the Lab. The full MC lab
// remains the configurable pricing/risk engine; these cases are not backtests.
export function shortStrangleScenario({ mu, sigma, seed = 1, pathCount = 2000, entryIV = 0.18 }) {
  for (const [key, value, low, high] of [['mu', mu, -1, 1], ['sigma', sigma, 0, 3], ['entryIV', entryIV, 0.001, 3]]) {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < low || value > high) throw new Error(`Invalid scenario ${key}.`);
  }
  if (!Number.isInteger(pathCount) || pathCount < 2 || pathCount > 100000) throw new Error('Scenario pathCount must be an integer from 2 to 100000.');
  if (!Number.isInteger(seed) || seed < 1 || seed >= 2147483647) throw new Error('Invalid scenario seed.');
  const spot = 100, horizonYears = 30 / 252, callStrike = 105, putStrike = 95, multiplier = 400;
  const option = (optionType, strike) => blackScholesOption({ spot, strike, maturityYears: horizonYears, riskFreeRate: 0.02, dividendYield: 0, volatility: entryIV, optionType }).price;
  const premium = (option('call', callStrike) + option('put', putStrike)) * multiplier;
  let rng = seed;
  const uniform = () => { rng = rng * 16807 % 2147483647; return rng / 2147483647; };
  const normal = () => Math.sqrt(-2 * Math.log(uniform())) * Math.cos(2 * Math.PI * uniform());
  let mean = 0, sumSquared = 0, worst = Infinity, wins = 0;
  for (let index = 0; index < pathCount; index++) {
    const terminal = spot * Math.exp((mu - 0.5 * sigma ** 2) * horizonYears + sigma * Math.sqrt(horizonYears) * normal());
    const pnl = premium - multiplier * (Math.max(terminal - callStrike, 0) + Math.max(putStrike - terminal, 0));
    const delta = pnl - mean;
    mean += delta / (index + 1);
    sumSquared += delta * (pnl - mean);
    worst = Math.min(worst, pnl);
    if (pnl > 0) wins++;
  }
  const sd = Math.sqrt(sumSquared / (pathCount - 1));
  const forwardMean = spot * Math.exp(mu * horizonYears);
  const expectedIntrinsic = (strike, call) => {
    if (sigma === 0) return Math.max(call ? forwardMean - strike : strike - forwardMean, 0);
    const d1 = (Math.log(spot / strike) + (mu + 0.5 * sigma ** 2) * horizonYears) / (sigma * Math.sqrt(horizonYears));
    const d2 = d1 - sigma * Math.sqrt(horizonYears);
    return call ? forwardMean * normCdf(d1) - strike * normCdf(d2) : strike * normCdf(-d2) - forwardMean * normCdf(-d1);
  };
  const analyticalMeanPnl = premium - multiplier * (expectedIntrinsic(callStrike, true) + expectedIntrinsic(putStrike, false));
  const result = { sampleCount: pathCount, premium, horizonYears, meanPnl: mean, pnlSd: sd, analyticalMeanPnl, standardError: sd / Math.sqrt(pathCount), pnl: Math.round(mean), meanOverSd: sd > 0 ? mean / sd : null, worst: Math.round(worst), win: 100 * wins / pathCount, volPnl: Math.round(sd) };
  if (!Object.entries(result).every(([key, value]) => (key === 'meanOverSd' && value === null) || Number.isFinite(value))) throw new Error('Scenario produced invalid numeric results.');
  return Object.freeze(result);
}
