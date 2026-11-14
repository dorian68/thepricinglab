export const BLACK_SCHOLES_INPUT_SCHEMA = 'tpl.black-scholes.input.v1';
export const BLACK_SCHOLES_SCHEMA_VERSION = 'tpl.black-scholes.analysis.v1';
export const BLACK_SCHOLES_ENGINE_VERSION = '1.0.0';
export const BLACK_SCHOLES_SCENARIO_CSV_SCHEMA = 'tpl.black-scholes.scenarios.v1';
export const BLACK_SCHOLES_SENSITIVITY_CSV_SCHEMA = 'tpl.black-scholes.sensitivities.v1';

export const BLACK_SCHOLES_CONTRACT = {
  schemaVersion: 'tpl.black-scholes.contract.v1',
  inputSchemaVersion: BLACK_SCHOLES_INPUT_SCHEMA,
  analysisSchemaVersion: BLACK_SCHOLES_SCHEMA_VERSION,
  engineVersion: BLACK_SCHOLES_ENGINE_VERSION,
  model: 'black_scholes_merton_european',
  measure: 'risk_neutral_Q',
  quoteModes: ['volatility', 'market_price'],
  optionTypes: ['call', 'put'],
  dayCounts: ['ACT/365F'],
  positions: ['long', 'short'],
  inputKeys: ['schemaVersion', 'quoteMode', 'optionType', 'spot', 'strike', 'maturityYears', 'dayCount', 'riskFreeRate', 'dividendYield', 'volatility', 'marketPrice', 'currency', 'position', 'quantity', 'multiplier', 'shocks'],
  shockKeys: ['spotPct', 'volPoints', 'days'],
  limits: {
    maxInputBytes: 1_000_000,
    minSpot: 1e-8, maxSpot: 1_000_000_000_000,
    minStrike: 1e-8, maxStrike: 1_000_000_000_000,
    minVolatility: 0, maxVolatility: 5,
    minMaturityYears: 0, maxMaturityYears: 30,
    minRate: -1, maxRate: 1,
    minMarketPrice: 0, maxMarketPrice: 1_000_000_000_000,
    maxQuantity: 1_000_000,
    minMultiplier: 1e-8, maxMultiplier: 1_000_000_000_000,
    maxSpotShockPct: 99.999999,
    maxVolShockPoints: 500,
    maxTimeShockDays: 10_950,
    sensitivityPoints: 21,
  },
  numeric: {
    cdf: 'abramowitz_stegun_7_1_26', ivMaxIterations: 120, ivPriceTolerance: 1e-12,
    ivMaxVolatility: 5, parityTolerance: 1e-12, exportSignificantDigits: 9, hashSignificantDigits: 17,
  },
  conventions: {
    exercise: 'european', rates: 'continuously_compounded_decimals', dividends: 'continuous_yield_decimal', dayCount: 'ACT/365F',
    atExpiry: 'exact_intrinsic_with_half_delta_at_the_money', zeroVolatility: 'discounted_deterministic_forward_payoff',
    zeroVolatilityKink: 'at_discounted_forward_atm_use_half_delta_half_theta_half_rho_and_zero_gamma_vega_as_declared_limiting_convention',
    zeroVolatilityKinkLimit: 'the_sigma_zero_forward_atm_payoff_is_not_classically_differentiable; reported_greeks_are_a_symmetric_limiting_convention',
    delta: 'unit_price_change_per_one_spot_unit', gamma: 'delta_change_per_one_spot_unit',
    vega: 'unit_price_change_per_plus_one_volatility_percentage_point', theta: 'unit_price_change_for_one_calendar_day_elapsed',
    rho: 'unit_price_change_per_plus_one_rate_percentage_point', portfolioScale: 'position_sign_times_quantity_times_multiplier',
    spotShockPct: 'human_percentage_points_divided_by_100', volShockPoints: 'human_volatility_points_divided_by_100',
    timeShockDays: 'calendar_days_elapsed_with_maturity_floored_at_zero',
  },
  scenarios: ['base', 'spotDown', 'spotUp', 'volDown', 'volUp', 'timeForward'],
  sensitivities: ['spot', 'volatility', 'maturity'],
  exports: {
    scenarioCsvSchema: BLACK_SCHOLES_SCENARIO_CSV_SCHEMA,
    sensitivityCsvSchema: BLACK_SCHOLES_SENSITIVITY_CSV_SCHEMA,
    scenarioCsvHeaders: ['schemaVersion', 'engineVersion', 'analysisId', 'scenario', 'spot', 'volatility', 'maturityYears', 'unitPrice', 'portfolioValue', 'pnl'],
    sensitivityCsvHeaders: ['schemaVersion', 'engineVersion', 'analysisId', 'axis', 'x', 'unitPrice', 'portfolioValue'],
    lineEnding: 'LF', finalNewline: true, numericFormat: 'finite_significant_9',
  },
};

const INPUT_KEYS = BLACK_SCHOLES_CONTRACT.inputKeys;
const SHOCK_KEYS = BLACK_SCHOLES_CONTRACT.shockKeys;
const LIMITS = BLACK_SCHOLES_CONTRACT.limits;

const plainObject = (value, label) => {
  if (value === null || typeof value !== 'object' || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) throw new Error(`${label} must be a plain object.`);
};
const exactKeys = (value, expected, label) => {
  const allowed = new Set(expected);
  const missing = expected.filter((key) => !Object.hasOwn(value, key)).sort();
  const unknown = Object.keys(value).filter((key) => !allowed.has(key)).sort();
  if (missing.length || unknown.length) throw new Error(`${label} schema is invalid; missing=${missing.join('|') || 'none'}; unknown=${unknown.join('|') || 'none'}.`);
};
const finiteNumber = (value, label, minimum, maximum) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`${label} must be a finite number.`);
  if (value < minimum || value > maximum) throw new Error(`${label} is outside the supported domain.`);
  return Object.is(value, -0) ? 0 : value;
};
const oneOf = (value, choices, label) => {
  if (!choices.includes(value)) throw new Error(`${label} is unsupported.`);
  return value;
};

export const normalizeBlackScholesInput = (raw) => {
  plainObject(raw, 'Black-Scholes input');
  exactKeys(raw, INPUT_KEYS, 'Black-Scholes input');
  if (raw.schemaVersion !== BLACK_SCHOLES_INPUT_SCHEMA) throw new Error(`schemaVersion must be '${BLACK_SCHOLES_INPUT_SCHEMA}'.`);
  plainObject(raw.shocks, 'shocks');
  exactKeys(raw.shocks, SHOCK_KEYS, 'shocks');
  const quoteMode = oneOf(raw.quoteMode, BLACK_SCHOLES_CONTRACT.quoteModes, 'quoteMode');
  const normalized = {
    schemaVersion: BLACK_SCHOLES_INPUT_SCHEMA,
    quoteMode,
    optionType: oneOf(raw.optionType, BLACK_SCHOLES_CONTRACT.optionTypes, 'optionType'),
    spot: finiteNumber(raw.spot, 'spot', LIMITS.minSpot, LIMITS.maxSpot),
    strike: finiteNumber(raw.strike, 'strike', LIMITS.minStrike, LIMITS.maxStrike),
    maturityYears: finiteNumber(raw.maturityYears, 'maturityYears', LIMITS.minMaturityYears, LIMITS.maxMaturityYears),
    dayCount: oneOf(raw.dayCount, BLACK_SCHOLES_CONTRACT.dayCounts, 'dayCount'),
    riskFreeRate: finiteNumber(raw.riskFreeRate, 'riskFreeRate', LIMITS.minRate, LIMITS.maxRate),
    dividendYield: finiteNumber(raw.dividendYield, 'dividendYield', LIMITS.minRate, LIMITS.maxRate),
    volatility: raw.volatility,
    marketPrice: raw.marketPrice,
    currency: raw.currency,
    position: oneOf(raw.position, BLACK_SCHOLES_CONTRACT.positions, 'position'),
    quantity: finiteNumber(raw.quantity, 'quantity', Number.MIN_VALUE, LIMITS.maxQuantity),
    multiplier: finiteNumber(raw.multiplier, 'multiplier', LIMITS.minMultiplier, LIMITS.maxMultiplier),
    shocks: {
      spotPct: finiteNumber(raw.shocks.spotPct, 'shocks.spotPct', 0, LIMITS.maxSpotShockPct),
      volPoints: finiteNumber(raw.shocks.volPoints, 'shocks.volPoints', 0, LIMITS.maxVolShockPoints),
      days: finiteNumber(raw.shocks.days, 'shocks.days', 0, LIMITS.maxTimeShockDays),
    },
  };
  if (typeof raw.currency !== 'string' || !/^[A-Z]{3}$/.test(raw.currency)) throw new Error('currency must be an uppercase three-letter code.');
  if (quoteMode === 'volatility') {
    normalized.volatility = finiteNumber(raw.volatility, 'volatility', LIMITS.minVolatility, LIMITS.maxVolatility);
    if (raw.marketPrice !== null) throw new Error('marketPrice must be null when quoteMode is volatility.');
    normalized.marketPrice = null;
  } else {
    if (raw.volatility !== null) throw new Error('volatility must be null when quoteMode is market_price.');
    normalized.volatility = null;
    normalized.marketPrice = finiteNumber(raw.marketPrice, 'marketPrice', LIMITS.minMarketPrice, LIMITS.maxMarketPrice);
    if (normalized.maturityYears === 0) throw new Error('market_price inversion is undefined at expiry; use quoteMode volatility for the T=0 limit.');
  }
  return normalized;
};

export const normCdf = (rawX) => {
  if (typeof rawX !== 'number' || !Number.isFinite(rawX)) throw new Error('normCdf input must be finite.');
  const sign = rawX < 0 ? -1 : 1;
  const x = Math.abs(rawX) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * x);
  const erf = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return 0.5 * (1 + sign * erf);
};
export const normPdf = (x) => {
  if (typeof x !== 'number' || !Number.isFinite(x)) throw new Error('normPdf input must be finite.');
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
};

const expiryDelta = (spot, strike, type) => {
  if (spot > strike) return type === 'call' ? 1 : 0;
  if (spot < strike) return type === 'call' ? 0 : -1;
  return type === 'call' ? 0.5 : -0.5;
};

export const blackScholesOption = ({ spot, strike, maturityYears, riskFreeRate, dividendYield = 0, volatility, optionType = 'call' }) => {
  const type = oneOf(optionType, BLACK_SCHOLES_CONTRACT.optionTypes, 'optionType');
  const s = finiteNumber(spot, 'spot', LIMITS.minSpot, LIMITS.maxSpot);
  const k = finiteNumber(strike, 'strike', LIMITS.minStrike, LIMITS.maxStrike);
  const maturity = finiteNumber(maturityYears, 'maturityYears', LIMITS.minMaturityYears, LIMITS.maxMaturityYears);
  const rate = finiteNumber(riskFreeRate, 'riskFreeRate', LIMITS.minRate, LIMITS.maxRate);
  const dividend = finiteNumber(dividendYield, 'dividendYield', LIMITS.minRate, LIMITS.maxRate);
  const sigma = finiteNumber(volatility, 'volatility', LIMITS.minVolatility, LIMITS.maxVolatility);
  if (maturity === 0) {
    const price = type === 'call' ? Math.max(s - k, 0) : Math.max(k - s, 0);
    return { type, price, greeks: { delta: expiryDelta(s, k, type), gamma: 0, vega: 0, theta: 0, rho: 0 }, d1: null, d2: null, limit: 'expiry' };
  }
  const eq = Math.exp(-dividend * maturity);
  const er = Math.exp(-rate * maturity);
  if (sigma === 0) {
    const discountedSpot = s * eq; const discountedStrike = k * er; const difference = discountedSpot - discountedStrike;
    const kinkTolerance = 1e-14 * Math.max(1, Math.abs(discountedSpot), Math.abs(discountedStrike));
    const relation = difference > kinkTolerance ? 1 : difference < -kinkTolerance ? -1 : 0;
    const weight = type === 'call' ? (relation > 0 ? 1 : relation < 0 ? 0 : 0.5) : (relation < 0 ? 1 : relation > 0 ? 0 : 0.5);
    const price = type === 'call' ? Math.max(difference, 0) : Math.max(-difference, 0);
    const delta = (type === 'call' ? 1 : -1) * weight * eq;
    const theta = weight * (type === 'call' ? dividend * discountedSpot - rate * discountedStrike : rate * discountedStrike - dividend * discountedSpot) / 365;
    const rho = (type === 'call' ? 1 : -1) * weight * k * maturity * er / 100;
    return { type, price, greeks: { delta, gamma: 0, vega: 0, theta, rho }, d1: null, d2: null, limit: 'zero_volatility' };
  }
  const rootT = Math.sqrt(maturity);
  const d1 = (Math.log(s / k) + (rate - dividend + 0.5 * sigma ** 2) * maturity) / (sigma * rootT);
  const d2 = d1 - sigma * rootT;
  const pdf = normPdf(d1);
  let price; let delta; let theta; let rho;
  if (type === 'call') {
    price = s * eq * normCdf(d1) - k * er * normCdf(d2);
    delta = eq * normCdf(d1);
    theta = (-s * eq * pdf * sigma / (2 * rootT) - rate * k * er * normCdf(d2) + dividend * s * eq * normCdf(d1)) / 365;
    rho = k * maturity * er * normCdf(d2) / 100;
  } else {
    price = k * er * normCdf(-d2) - s * eq * normCdf(-d1);
    delta = -eq * normCdf(-d1);
    theta = (-s * eq * pdf * sigma / (2 * rootT) + rate * k * er * normCdf(-d2) - dividend * s * eq * normCdf(-d1)) / 365;
    rho = -k * maturity * er * normCdf(-d2) / 100;
  }
  return { type, price, greeks: { delta, gamma: eq * pdf / (s * sigma * rootT), vega: s * eq * pdf * rootT / 100, theta, rho }, d1, d2, limit: 'closed_form' };
};

const arbitrageBounds = (input) => {
  const discountedSpot = input.spot * Math.exp(-input.dividendYield * input.maturityYears);
  const discountedStrike = input.strike * Math.exp(-input.riskFreeRate * input.maturityYears);
  return input.optionType === 'call'
    ? { lower: Math.max(0, discountedSpot - discountedStrike), upper: discountedSpot }
    : { lower: Math.max(0, discountedStrike - discountedSpot), upper: discountedStrike };
};

export const solveImpliedVolatility = (input) => {
  const bounds = arbitrageBounds(input);
  const price = input.marketPrice;
  const tolerance = BLACK_SCHOLES_CONTRACT.numeric.ivPriceTolerance * Math.max(1, Math.abs(price), Math.abs(bounds.lower), Math.abs(bounds.upper));
  if (price < bounds.lower - tolerance || price > bounds.upper + tolerance) throw new Error(`marketPrice violates no-arbitrage bounds [${bounds.lower}, ${bounds.upper}].`);
  const atZero = blackScholesOption({ ...input, volatility: 0 }).price;
  if (Math.abs(price - atZero) <= tolerance) return { volatility: 0, solver: { method: 'lower_bound', iterations: 0, residual: atZero - price, converged: true } };
  const atMaximum = blackScholesOption({ ...input, volatility: LIMITS.maxVolatility }).price;
  if (price > atMaximum + tolerance) throw new Error(`marketPrice requires volatility above the supported maximum ${LIMITS.maxVolatility}.`);
  let low = 0; let high = LIMITS.maxVolatility; let candidate = 0; let modelPrice = atZero;
  for (let iteration = 1; iteration <= BLACK_SCHOLES_CONTRACT.numeric.ivMaxIterations; iteration += 1) {
    candidate = 0.5 * (low + high);
    modelPrice = blackScholesOption({ ...input, volatility: candidate }).price;
    const residual = modelPrice - price;
    if (Math.abs(residual) <= tolerance) return { volatility: candidate, solver: { method: 'bisection', iterations: iteration, residual, converged: true } };
    if (modelPrice < price) low = candidate; else high = candidate;
  }
  throw new Error('implied-volatility solver did not converge within 120 iterations.');
};

const canonicalNumber = (value) => {
  if (!Number.isFinite(value)) throw new Error('Canonical input contains a non-finite number.');
  if (value === 0 || Object.is(value, -0)) return '0';
  const [mantissa, exponent] = value.toExponential(16).toLowerCase().split('e');
  return `${mantissa.replace(/0+$/, '').replace(/\.$/, '')}e${Number(exponent)}`;
};
const canonicalTree = (value) => {
  if (typeof value === 'number') return canonicalNumber(value);
  if (Array.isArray(value)) return value.map(canonicalTree);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalTree(value[key])]));
  return value;
};
const sha256 = async (value) => {
  if (!globalThis.crypto?.subtle) throw new Error('SHA-256 is unavailable in this runtime.');
  const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
};
const finiteTree = (value, path = 'result') => {
  if (typeof value === 'number' && !Number.isFinite(value)) throw new Error(`${path} contains a non-finite number.`);
  if (Array.isArray(value)) value.forEach((item, index) => finiteTree(item, `${path}[${index}]`));
  else if (value && typeof value === 'object') Object.entries(value).forEach(([key, item]) => finiteTree(item, `${path}.${key}`));
};

const enrichOption = (option, input) => {
  const sign = input.position === 'long' ? 1 : -1;
  const scale = sign * input.quantity * input.multiplier;
  return {
    unitPrice: option.price,
    type: option.type,
    greeks: option.greeks,
    limit: option.limit,
    portfolioValue: scale * option.price,
    portfolioGreeks: Object.fromEntries(Object.entries(option.greeks).map(([key, value]) => [key, scale * value])),
  };
};

const optionAt = (input, volatility, optionType = input.optionType, overrides = {}) => blackScholesOption({
  spot: overrides.spot ?? input.spot,
  strike: input.strike,
  maturityYears: overrides.maturityYears ?? input.maturityYears,
  riskFreeRate: input.riskFreeRate,
  dividendYield: input.dividendYield,
  volatility,
  optionType,
});

const buildScenarios = (input, volatility, basePortfolioValue) => {
  const spotShift = input.shocks.spotPct / 100;
  const volShift = input.shocks.volPoints / 100;
  if (volatility + volShift > LIMITS.maxVolatility) throw new Error('volatility plus shocks.volPoints exceeds the supported domain.');
  const downVol = Math.max(0, volatility - volShift);
  const timeForward = Math.max(0, input.maturityYears - input.shocks.days / 365);
  const definitions = [
    ['base', input.spot, volatility, input.maturityYears],
    ['spotDown', input.spot * (1 - spotShift), volatility, input.maturityYears],
    ['spotUp', input.spot * (1 + spotShift), volatility, input.maturityYears],
    ['volDown', input.spot, downVol, input.maturityYears],
    ['volUp', input.spot, volatility + volShift, input.maturityYears],
    ['timeForward', input.spot, volatility, timeForward],
  ];
  const sign = input.position === 'long' ? 1 : -1;
  const scale = sign * input.quantity * input.multiplier;
  return definitions.map(([scenario, spot, scenarioVolatility, maturityYears]) => {
    const unitPrice = optionAt(input, scenarioVolatility, input.optionType, { spot, maturityYears }).price;
    const portfolioValue = scale * unitPrice;
    return { scenario, spot, volatility: scenarioVolatility, maturityYears, unitPrice, portfolioValue, pnl: portfolioValue - basePortfolioValue };
  });
};

const linspace = (low, high, count) => Array.from({ length: count }, (_, index) => low + (high - low) * index / (count - 1));
const buildSensitivities = (input, volatility) => {
  const sign = input.position === 'long' ? 1 : -1;
  const scale = sign * input.quantity * input.multiplier;
  const axes = {
    spot: linspace(input.spot * 0.6, input.spot * 1.4, LIMITS.sensitivityPoints),
    volatility: linspace(Math.max(0, volatility - 0.1), Math.min(LIMITS.maxVolatility, volatility + 0.1), LIMITS.sensitivityPoints),
    maturity: linspace(0, Math.min(LIMITS.maxMaturityYears, Math.max(input.maturityYears * 2, 1)), LIMITS.sensitivityPoints),
  };
  return Object.fromEntries(Object.entries(axes).map(([axis, values]) => [axis, values.map((x) => {
    const option = optionAt(input, axis === 'volatility' ? x : volatility, input.optionType, {
      spot: axis === 'spot' ? x : input.spot,
      maturityYears: axis === 'maturity' ? x : input.maturityYears,
    });
    return { x, unitPrice: option.price, portfolioValue: scale * option.price };
  })]));
};

export const analyzeBlackScholes = async (rawInput) => {
  const input = normalizeBlackScholesInput(rawInput);
  const analysisId = await sha256(JSON.stringify(canonicalTree(input)));
  const iv = input.quoteMode === 'market_price' ? solveImpliedVolatility(input) : null;
  const effectiveVolatility = iv ? iv.volatility : input.volatility;
  const call = enrichOption(optionAt(input, effectiveVolatility, 'call'), input);
  const put = enrichOption(optionAt(input, effectiveVolatility, 'put'), input);
  const selected = input.optionType === 'call' ? call : put;
  const parityLeft = call.unitPrice - put.unitPrice;
  const parityRight = input.spot * Math.exp(-input.dividendYield * input.maturityYears) - input.strike * Math.exp(-input.riskFreeRate * input.maturityYears);
  const parityResidual = parityLeft - parityRight;
  const result = {
    schemaVersion: BLACK_SCHOLES_SCHEMA_VERSION,
    engineVersion: BLACK_SCHOLES_ENGINE_VERSION,
    analysisId,
    input,
    quote: {
      mode: input.quoteMode,
      observedMarketPrice: input.marketPrice,
      impliedVolatility: effectiveVolatility,
      solver: iv ? iv.solver : null,
    },
    call,
    put,
    selected,
    parity: { lhs: parityLeft, rhs: parityRight, residual: parityResidual, holds: Math.abs(parityResidual) <= BLACK_SCHOLES_CONTRACT.numeric.parityTolerance * Math.max(1, Math.abs(parityLeft), Math.abs(parityRight)) },
    scenarios: buildScenarios(input, effectiveVolatility, selected.portfolioValue),
    sensitivities: buildSensitivities(input, effectiveVolatility),
    conventions: structuredClone(BLACK_SCHOLES_CONTRACT.conventions),
  };
  finiteTree(result);
  return result;
};

const exportNumber = (value) => {
  if (!Number.isFinite(value)) throw new Error('Evidence export contains a non-finite number.');
  if (value === 0 || Object.is(value, -0) || Math.abs(value) < 1e-15) return '0';
  const [mantissa, exponent] = value.toExponential(BLACK_SCHOLES_CONTRACT.numeric.exportSignificantDigits - 1).toLowerCase().split('e');
  return `${mantissa.replace(/0+$/, '').replace(/\.$/, '')}e${Number(exponent)}`;
};
const csvCell = (value) => {
  if (value === null || value === undefined) return '';
  const text = typeof value === 'number' ? exportNumber(value) : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};
const csv = (headers, rows) => `${headers.join(',')}\n${rows.map((row) => headers.map((header) => csvCell(row[header])).join(',')).join('\n')}\n`;

export const buildBlackScholesJson = (result) => { finiteTree(result); return `${JSON.stringify(result, null, 2)}\n`; };
export const buildBlackScholesScenarioCsv = (result) => csv(BLACK_SCHOLES_CONTRACT.exports.scenarioCsvHeaders, result.scenarios.map((row) => ({ schemaVersion: BLACK_SCHOLES_SCENARIO_CSV_SCHEMA, engineVersion: result.engineVersion, analysisId: result.analysisId, ...row })));
export const buildBlackScholesSensitivityCsv = (result) => csv(BLACK_SCHOLES_CONTRACT.exports.sensitivityCsvHeaders, Object.entries(result.sensitivities).flatMap(([axis, rows]) => rows.map((row) => ({ schemaVersion: BLACK_SCHOLES_SENSITIVITY_CSV_SCHEMA, engineVersion: result.engineVersion, analysisId: result.analysisId, axis, ...row }))));
