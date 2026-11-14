export const MONTE_CARLO_INPUT_SCHEMA = 'tpl.monte-carlo.input.v1';
export const MONTE_CARLO_SCHEMA_VERSION = 'tpl.monte-carlo.analysis.v1';
export const MONTE_CARLO_ENGINE_VERSION = '1.0.0';
export const MONTE_CARLO_TERMINAL_CSV_SCHEMA = 'tpl.monte-carlo.terminals.v1';
export const MONTE_CARLO_PATHS_CSV_SCHEMA = 'tpl.monte-carlo.paths.v1';

export const MONTE_CARLO_CONTRACT = Object.freeze({
  inputSchemaVersion: MONTE_CARLO_INPUT_SCHEMA,
  schemaVersion: MONTE_CARLO_SCHEMA_VERSION,
  engineVersion: MONTE_CARLO_ENGINE_VERSION,
  rng: Object.freeze({ algorithm: 'park_miller_16807', normalTransform: 'box_muller_cosine', modulus: 2147483647, multiplier: 16807, seedDomain: Object.freeze([1, 2147483646]) }),
  enums: Object.freeze({
    modes: Object.freeze(['risk_physical', 'pricing_risk_neutral']),
    dayCounts: Object.freeze(['ACT/365F']),
    methods: Object.freeze(['none', 'antithetic', 'control_variate']),
    optionTypes: Object.freeze(['call', 'put']),
    payoffTypes: Object.freeze(['european', 'arithmetic_asian']),
    positions: Object.freeze(['long', 'short']),
    confidenceLevels: Object.freeze([0.95, 0.99]),
  }),
  limits: Object.freeze({
    maxInputBytes: 1_000_000,
    minSpot: 1e-8, maxSpot: 1_000_000_000_000,
    minStrike: 1e-8, maxStrike: 1_000_000_000_000,
    minVolatility: 0, maxVolatility: 5,
    minMaturityYears: 1 / 365_000, maxMaturityYears: 30,
    minRate: -1, maxRate: 1, minPhysicalDrift: -2, maxPhysicalDrift: 2,
    minPaths: 100, maxPaths: 50_000, minTimeSteps: 1, maxTimeSteps: 366,
    maxSamplePaths: 24, minHistogramBins: 10, maxHistogramBins: 80,
    maxQuantity: 1_000_000, minContractMultiplier: 1e-8, maxContractMultiplier: 1_000_000_000_000,
    maxCurrencyLength: 3,
  }),
  exports: Object.freeze({
    terminalCsvSchema: MONTE_CARLO_TERMINAL_CSV_SCHEMA,
    pathsCsvSchema: MONTE_CARLO_PATHS_CSV_SCHEMA,
    terminalCsvHeaders: Object.freeze(['schemaVersion', 'engineVersion', 'analysisId', 'mode', 'pathIndex', 'terminalSpot', 'discountedPayoff', 'pnl', 'loss']),
    pathsCsvHeaders: Object.freeze(['schemaVersion', 'engineVersion', 'analysisId', 'mode', 'pathIndex', 'step', 'timeYears', 'spot']),
  }),
});

const LIMITS = MONTE_CARLO_CONTRACT.limits;
const COMMON_KEYS = ['schemaVersion', 'mode', 'spot', 'volatility', 'maturityYears', 'dayCount', 'paths', 'timeSteps', 'seed', 'method', 'samplePaths', 'histogramBins', 'currency', 'quantity', 'contractMultiplier', 'position'];
const MODE_KEYS = Object.freeze({
  risk_physical: [...COMMON_KEYS, 'physicalDrift', 'confidence'],
  pricing_risk_neutral: [...COMMON_KEYS, 'riskFreeRate', 'dividendYield', 'strike', 'optionType', 'payoffType'],
});

const plainObject = (value, label) => {
  if (value === null || typeof value !== 'object' || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) throw new Error(`${label} must be a plain object.`);
};
const exactKeys = (value, allowed, label) => {
  const allowedSet = new Set(allowed);
  const unknown = Object.keys(value).filter((key) => !allowedSet.has(key)).sort();
  const missing = allowed.filter((key) => !Object.hasOwn(value, key)).sort();
  if (unknown.length || missing.length) throw new Error(`${label} schema is invalid; missing=${missing.join('|') || 'none'}; unknown=${unknown.join('|') || 'none'}.`);
};
const finiteNumber = (value, label, min, max) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`${label} must be a finite number.`);
  if (value < min || value > max) throw new Error(`${label} is outside the supported domain.`);
  return Object.is(value, -0) ? 0 : value;
};
const safeInteger = (value, label, min, max) => {
  if (!Number.isSafeInteger(value) || value < min || value > max) throw new Error(`${label} must be a safe integer between ${min} and ${max}.`);
  return value;
};
const enumValue = (value, values, label) => {
  if (!values.includes(value)) throw new Error(`${label} is unsupported.`);
  return value;
};

export const normalizeMonteCarloInput = (raw) => {
  plainObject(raw, 'Monte Carlo input');
  if (!MONTE_CARLO_CONTRACT.enums.modes.includes(raw.mode)) throw new Error('mode is unsupported.');
  exactKeys(raw, MODE_KEYS[raw.mode], 'Monte Carlo input');
  if (raw.schemaVersion !== MONTE_CARLO_INPUT_SCHEMA) throw new Error(`schemaVersion must be '${MONTE_CARLO_INPUT_SCHEMA}'.`);
  const normalized = {
    schemaVersion: MONTE_CARLO_INPUT_SCHEMA,
    mode: raw.mode,
    spot: finiteNumber(raw.spot, 'spot', LIMITS.minSpot, LIMITS.maxSpot),
    volatility: finiteNumber(raw.volatility, 'volatility', LIMITS.minVolatility, LIMITS.maxVolatility),
    maturityYears: finiteNumber(raw.maturityYears, 'maturityYears', LIMITS.minMaturityYears, LIMITS.maxMaturityYears),
    dayCount: enumValue(raw.dayCount, MONTE_CARLO_CONTRACT.enums.dayCounts, 'dayCount'),
    paths: safeInteger(raw.paths, 'paths', LIMITS.minPaths, LIMITS.maxPaths),
    timeSteps: safeInteger(raw.timeSteps, 'timeSteps', LIMITS.minTimeSteps, LIMITS.maxTimeSteps),
    seed: safeInteger(raw.seed, 'seed', ...MONTE_CARLO_CONTRACT.rng.seedDomain),
    method: enumValue(raw.method, MONTE_CARLO_CONTRACT.enums.methods, 'method'),
    samplePaths: safeInteger(raw.samplePaths, 'samplePaths', 0, LIMITS.maxSamplePaths),
    histogramBins: safeInteger(raw.histogramBins, 'histogramBins', LIMITS.minHistogramBins, LIMITS.maxHistogramBins),
    currency: raw.currency,
    quantity: safeInteger(raw.quantity, 'quantity', 1, LIMITS.maxQuantity),
    contractMultiplier: finiteNumber(raw.contractMultiplier, 'contractMultiplier', LIMITS.minContractMultiplier, LIMITS.maxContractMultiplier),
    position: enumValue(raw.position, MONTE_CARLO_CONTRACT.enums.positions, 'position'),
  };
  if (typeof raw.currency !== 'string' || !/^[A-Z]{3}$/.test(raw.currency)) throw new Error('currency must be an uppercase three-letter code.');
  if (normalized.samplePaths > normalized.paths) throw new Error('samplePaths cannot exceed paths.');
  if (normalized.method === 'antithetic' && normalized.paths % 2 !== 0) throw new Error('paths must be even when method is antithetic.');
  if (raw.mode === 'risk_physical') {
    if (normalized.method === 'control_variate') throw new Error('control_variate is available only for pricing_risk_neutral.');
    normalized.physicalDrift = finiteNumber(raw.physicalDrift, 'physicalDrift', LIMITS.minPhysicalDrift, LIMITS.maxPhysicalDrift);
    normalized.confidence = enumValue(raw.confidence, MONTE_CARLO_CONTRACT.enums.confidenceLevels, 'confidence');
  } else {
    normalized.riskFreeRate = finiteNumber(raw.riskFreeRate, 'riskFreeRate', LIMITS.minRate, LIMITS.maxRate);
    normalized.dividendYield = finiteNumber(raw.dividendYield, 'dividendYield', LIMITS.minRate, LIMITS.maxRate);
    normalized.strike = finiteNumber(raw.strike, 'strike', LIMITS.minStrike, LIMITS.maxStrike);
    normalized.optionType = enumValue(raw.optionType, MONTE_CARLO_CONTRACT.enums.optionTypes, 'optionType');
    normalized.payoffType = enumValue(raw.payoffType, MONTE_CARLO_CONTRACT.enums.payoffTypes, 'payoffType');
  }
  return normalized;
};

const canonicalNumber = (value) => {
  if (!Number.isFinite(value)) throw new Error('Canonical data contains a non-finite number.');
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
const sha256 = async (text) => {
  if (!globalThis.crypto?.subtle) throw new Error('SHA-256 is unavailable in this runtime.');
  const bytes = new TextEncoder().encode(text);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
};
const finiteTree = (value, path = 'result') => {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error(`${path} contains a non-finite number.`);
  } else if (Array.isArray(value)) value.forEach((item, index) => finiteTree(item, `${path}[${index}]`));
  else if (value && typeof value === 'object') Object.entries(value).forEach(([key, item]) => finiteTree(item, `${path}.${key}`));
};

class ParkMillerRng {
  constructor(seed) { this.state = seed; }
  uniform() {
    this.state = (this.state * MONTE_CARLO_CONTRACT.rng.multiplier) % MONTE_CARLO_CONTRACT.rng.modulus;
    return this.state / MONTE_CARLO_CONTRACT.rng.modulus;
  }
  normal() {
    const u1 = Math.max(this.uniform(), Number.MIN_VALUE);
    const u2 = this.uniform();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }
}

const mean = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;
const sampleVariance = (values, center = mean(values)) => {
  if (values.length < 2 || values.every((value) => value === values[0])) return 0;
  return values.reduce((sum, value) => sum + (value - center) ** 2, 0) / (values.length - 1);
};
const quantileType7 = (sorted, probability) => {
  const index = (sorted.length - 1) * probability;
  const lower = Math.floor(index);
  const fraction = index - lower;
  return sorted[lower] + fraction * (sorted[Math.min(lower + 1, sorted.length - 1)] - sorted[lower]);
};
const normCdf = (rawX) => {
  const sign = rawX < 0 ? -1 : 1;
  const x = Math.abs(rawX) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * x);
  const coefficients = [0.254829592, -0.284496736, 1.421413741, -1.453152027, 1.061405429];
  const erf = 1 - (((((coefficients[4] * t + coefficients[3]) * t) + coefficients[2]) * t + coefficients[1]) * t + coefficients[0]) * t * Math.exp(-x * x);
  return 0.5 * (1 + sign * erf);
};
const blackScholesPrice = (input) => {
  const { spot, strike, volatility, maturityYears: maturity, riskFreeRate: rate, dividendYield: dividend, optionType } = input;
  if (volatility === 0) {
    const terminal = spot * Math.exp((rate - dividend) * maturity);
    return Math.exp(-rate * maturity) * (optionType === 'call' ? Math.max(terminal - strike, 0) : Math.max(strike - terminal, 0));
  }
  const d1 = (Math.log(spot / strike) + (rate - dividend + 0.5 * volatility ** 2) * maturity) / (volatility * Math.sqrt(maturity));
  const d2 = d1 - volatility * Math.sqrt(maturity);
  if (optionType === 'call') return spot * Math.exp(-dividend * maturity) * normCdf(d1) - strike * Math.exp(-rate * maturity) * normCdf(d2);
  return strike * Math.exp(-rate * maturity) * normCdf(-d2) - spot * Math.exp(-dividend * maturity) * normCdf(-d1);
};

const simulatePath = (input, normals, capture) => {
  const drift = input.mode === 'risk_physical' ? input.physicalDrift : input.riskFreeRate - input.dividendYield;
  const dt = input.maturityYears / input.timeSteps;
  const diffusion = input.volatility * Math.sqrt(dt);
  const driftStep = (drift - 0.5 * input.volatility ** 2) * dt;
  let spot = input.spot;
  let monitoredSum = 0;
  const points = capture ? [{ step: 0, timeYears: 0, spot }] : null;
  for (let step = 1; step <= input.timeSteps; step += 1) {
    spot *= Math.exp(driftStep + diffusion * normals[step - 1]);
    monitoredSum += spot;
    if (capture) points.push({ step, timeYears: step * dt, spot });
  }
  return { terminalSpot: spot, arithmeticAverage: monitoredSum / input.timeSteps, points };
};

const buildHistogram = (terminals, requestedBins) => {
  const minimum = Math.min(...terminals);
  const maximum = Math.max(...terminals);
  if (minimum === maximum) return [{ lower: minimum, upper: maximum, midpoint: minimum, count: terminals.length, probability: 1 }];
  const width = (maximum - minimum) / requestedBins;
  const counts = Array(requestedBins).fill(0);
  terminals.forEach((value) => { counts[Math.min(requestedBins - 1, Math.floor((value - minimum) / width))] += 1; });
  return counts.map((count, index) => ({
    lower: minimum + index * width,
    upper: minimum + (index + 1) * width,
    midpoint: minimum + (index + 0.5) * width,
    count,
    probability: count / terminals.length,
  }));
};

const pricingEstimate = (input, payoffs, discountedTerminals, count) => {
  const raw = payoffs.slice(0, count);
  const rawCenter = mean(raw);
  const rawVariance = sampleVariance(raw, rawCenter);
  let estimatorSamples = raw;
  let beta = 0;
  if (input.method === 'antithetic') {
    estimatorSamples = [];
    for (let index = 0; index < count; index += 2) estimatorSamples.push((raw[index] + raw[index + 1]) / 2);
  } else if (input.method === 'control_variate') {
    const controls = discountedTerminals.slice(0, count);
    const controlMean = mean(controls);
    const payoffMean = rawCenter;
    const covariance = controls.reduce((sum, value, index) => sum + (value - controlMean) * (raw[index] - payoffMean), 0) / Math.max(1, count - 1);
    const controlVariance = sampleVariance(controls, controlMean);
    beta = controlVariance > 0 ? covariance / controlVariance : 0;
    const expectedControl = input.spot * Math.exp(-input.dividendYield * input.maturityYears);
    estimatorSamples = raw.map((value, index) => value - beta * (controls[index] - expectedControl));
  }
  const price = mean(estimatorSamples);
  const variance = sampleVariance(estimatorSamples, price);
  const standardError = Math.sqrt(variance / estimatorSamples.length);
  const rawStandardError = Math.sqrt(rawVariance / raw.length);
  return {
    paths: count,
    effectiveSamples: estimatorSamples.length,
    price,
    standardError,
    ci95: { lower: price - 1.96 * standardError, upper: price + 1.96 * standardError },
    rawPrice: rawCenter,
    rawStandardError,
    beta,
    varianceReductionRatio: standardError > 0 ? (rawStandardError ** 2) / (standardError ** 2) : (rawStandardError === 0 ? 1 : Number.MAX_VALUE),
  };
};

export const analyzeMonteCarlo = async (rawInput) => {
  const input = normalizeMonteCarloInput(rawInput);
  const analysisId = await sha256(JSON.stringify(canonicalTree(input)));
  const rng = new ParkMillerRng(input.seed);
  const observations = [];
  const samplePaths = [];
  const discountedPayoffs = [];
  const discountedTerminals = [];
  const discount = input.mode === 'pricing_risk_neutral' ? Math.exp(-input.riskFreeRate * input.maturityYears) : 1;
  const sign = input.position === 'long' ? 1 : -1;

  const appendPath = (normals, pathIndex) => {
    const simulated = simulatePath(input, normals, pathIndex < input.samplePaths);
    const row = { pathIndex, terminalSpot: simulated.terminalSpot, discountedPayoff: null, pnl: null, loss: null };
    if (input.mode === 'risk_physical') {
      row.pnl = sign * input.quantity * input.contractMultiplier * (simulated.terminalSpot - input.spot);
      row.loss = -row.pnl;
    } else {
      const underlying = input.payoffType === 'european' ? simulated.terminalSpot : simulated.arithmeticAverage;
      const payoff = input.optionType === 'call' ? Math.max(underlying - input.strike, 0) : Math.max(input.strike - underlying, 0);
      row.discountedPayoff = discount * payoff;
      discountedPayoffs.push(row.discountedPayoff);
      discountedTerminals.push(discount * simulated.terminalSpot);
    }
    observations.push(row);
    if (simulated.points) samplePaths.push({ pathIndex, points: simulated.points });
  };

  if (input.method === 'antithetic') {
    for (let pathIndex = 0; pathIndex < input.paths; pathIndex += 2) {
      const normals = Array.from({ length: input.timeSteps }, () => rng.normal());
      appendPath(normals, pathIndex);
      appendPath(normals.map((value) => -value), pathIndex + 1);
    }
  } else {
    for (let pathIndex = 0; pathIndex < input.paths; pathIndex += 1) {
      appendPath(Array.from({ length: input.timeSteps }, () => rng.normal()), pathIndex);
    }
  }

  const terminals = observations.map((row) => row.terminalSpot);
  const sortedTerminals = [...terminals].sort((left, right) => left - right);
  const drift = input.mode === 'risk_physical' ? input.physicalDrift : input.riskFreeRate - input.dividendYield;
  const analyticalMean = input.spot * Math.exp(drift * input.maturityYears);
  const analyticalVariance = input.spot ** 2 * Math.exp(2 * drift * input.maturityYears) * (Math.exp(input.volatility ** 2 * input.maturityYears) - 1);
  const terminalMean = mean(terminals);
  const terminalStdDev = Math.sqrt(sampleVariance(terminals, terminalMean));
  const result = {
    schemaVersion: MONTE_CARLO_SCHEMA_VERSION,
    engineVersion: MONTE_CARLO_ENGINE_VERSION,
    analysisId,
    mode: input.mode,
    measure: input.mode === 'risk_physical' ? 'P' : 'Q',
    input,
    run: {
      requestedPaths: input.paths,
      simulatedPaths: observations.length,
      timeSteps: input.timeSteps,
      samplePathCount: samplePaths.length,
      seed: input.seed,
      method: input.method,
      rng: MONTE_CARLO_CONTRACT.rng.algorithm,
      normalTransform: MONTE_CARLO_CONTRACT.rng.normalTransform,
    },
    distribution: {
      terminalMean,
      terminalStdDev,
      analyticalTerminalMean: analyticalMean,
      analyticalTerminalStdDev: Math.sqrt(Math.max(0, analyticalVariance)),
      meanRelativeError: analyticalMean === 0 ? 0 : (terminalMean - analyticalMean) / analyticalMean,
      quantiles: {
        p01: quantileType7(sortedTerminals, 0.01), p05: quantileType7(sortedTerminals, 0.05),
        p50: quantileType7(sortedTerminals, 0.5), p95: quantileType7(sortedTerminals, 0.95), p99: quantileType7(sortedTerminals, 0.99),
      },
      probabilityBelowInitialSpot: terminals.filter((value) => value < input.spot).length / terminals.length,
      histogram: buildHistogram(terminals, input.histogramBins),
    },
    samplePaths,
    observations,
    risk: null,
    pricing: null,
    conventions: {
      dayCount: input.dayCount,
      measure: input.mode === 'risk_physical' ? 'Physical P measure using the declared expected return.' : 'Risk-neutral Q measure using drift r-q and discounting at r.',
      rng: 'Park-Miller 16807 uniforms with Box-Muller cosine normals; seed and all inputs are reproducible.',
      limitations: input.mode === 'risk_physical'
        ? ['Parametric GBM, constant drift and volatility.', 'VaR and ES are model estimates, not guarantees or historical backtests.', 'No jumps, volatility smile, transaction costs or liquidity stress.']
        : ['Constant-rate, constant-volatility GBM.', 'European benchmark uses Black-Scholes; arithmetic Asian has no closed-form benchmark here.', 'No smile/skew, jumps, early exercise, transaction costs or liquidity model.'],
    },
  };

  if (input.mode === 'risk_physical') {
    const losses = observations.map((row) => row.loss).sort((left, right) => left - right);
    const rawLossQuantile = quantileType7(losses, input.confidence);
    const tailCount = Math.max(1, Math.ceil((1 - input.confidence) * losses.length - 1e-12));
    const tailLosses = losses.slice(losses.length - tailCount);
    result.risk = {
      confidence: input.confidence,
      pnlMean: mean(observations.map((row) => row.pnl)),
      probabilityOfLoss: observations.filter((row) => row.pnl < 0).length / observations.length,
      rawLossQuantile,
      valueAtRisk: Math.max(0, rawLossQuantile),
      expectedShortfall: Math.max(0, mean(tailLosses)),
      tailCount,
      convention: 'Loss = -P&L; VaR is the confidence quantile of loss floored at zero; ES is the mean of the worst ceil((1-confidence)*N) losses, floored at zero.',
    };
  } else {
    const counts = [...new Set([Math.max(input.method === 'antithetic' ? 2 : 1, Math.floor(input.paths / 4)), Math.max(input.method === 'antithetic' ? 2 : 1, Math.floor(input.paths / 2)), input.paths]
      .map((count) => input.method === 'antithetic' ? count - (count % 2) : count))].filter((count) => count >= (input.method === 'antithetic' ? 2 : 1));
    const estimates = counts.map((count) => pricingEstimate(input, discountedPayoffs, discountedTerminals, count));
    const finalEstimate = estimates.at(-1);
    const benchmark = input.payoffType === 'european' ? blackScholesPrice(input) : null;
    const bias = benchmark === null ? null : finalEstimate.price - benchmark;
    result.pricing = {
      ...finalEstimate,
      portfolioValue: sign * input.quantity * input.contractMultiplier * finalEstimate.price,
      blackScholesBenchmark: benchmark,
      bias,
      zScore: benchmark === null || finalEstimate.standardError === 0 ? null : bias / finalEstimate.standardError,
      benchmarkInsideCi95: benchmark === null ? null : benchmark >= finalEstimate.ci95.lower && benchmark <= finalEstimate.ci95.upper,
      convergence: estimates.map(({ paths, effectiveSamples, price, standardError, ci95 }) => ({ paths, effectiveSamples, price, standardError, ci95 })),
    };
  }
  finiteTree(result);
  return result;
};

const exportNumber = (value) => {
  if (!Number.isFinite(value)) throw new Error('Evidence export contains a non-finite number.');
  if (value === 0 || Object.is(value, -0) || Math.abs(value) < 1e-15) return '0';
  const [mantissa, exponent] = value.toExponential(11).toLowerCase().split('e');
  return `${mantissa.replace(/0+$/, '').replace(/\.$/, '')}e${Number(exponent)}`;
};
const csvCell = (value) => {
  if (value === null || value === undefined) return '';
  const text = typeof value === 'number' ? exportNumber(value) : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};
const csv = (headers, rows) => `${headers.join(',')}\n${rows.map((row) => headers.map((header) => csvCell(row[header])).join(',')).join('\n')}\n`;

export const buildMonteCarloTerminalCsv = (result) => {
  finiteTree(result);
  return csv(MONTE_CARLO_CONTRACT.exports.terminalCsvHeaders, result.observations.map((row) => ({
    schemaVersion: MONTE_CARLO_TERMINAL_CSV_SCHEMA, engineVersion: result.engineVersion, analysisId: result.analysisId, mode: result.mode, ...row,
  })));
};
export const buildMonteCarloPathsCsv = (result) => {
  finiteTree(result);
  return csv(MONTE_CARLO_CONTRACT.exports.pathsCsvHeaders, result.samplePaths.flatMap((path) => path.points.map((point) => ({
    schemaVersion: MONTE_CARLO_PATHS_CSV_SCHEMA, engineVersion: result.engineVersion, analysisId: result.analysisId, mode: result.mode, pathIndex: path.pathIndex, ...point,
  }))));
};
export const buildMonteCarloJson = (result) => {
  finiteTree(result);
  return `${JSON.stringify(result, null, 2)}\n`;
};
