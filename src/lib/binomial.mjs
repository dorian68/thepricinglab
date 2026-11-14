export const BINOMIAL_INPUT_SCHEMA = 'tpl.binomial.input.v1';
export const BINOMIAL_SCHEMA_VERSION = 'tpl.binomial.analysis.v1';
export const BINOMIAL_ENGINE_VERSION = '1.0.0';
export const BINOMIAL_CONVERGENCE_CSV_SCHEMA = 'tpl.binomial.convergence.v1';
export const BINOMIAL_FRONTIER_CSV_SCHEMA = 'tpl.binomial.frontier.v1';

export const BINOMIAL_CONTRACT = Object.freeze({
  schemaVersion: 'tpl.binomial.contract.v1', inputSchemaVersion: BINOMIAL_INPUT_SCHEMA,
  analysisSchemaVersion: BINOMIAL_SCHEMA_VERSION, engineVersion: BINOMIAL_ENGINE_VERSION,
  model: 'cox_ross_rubinstein', measure: 'risk_neutral_Q',
  dayCounts: Object.freeze(['ACT/365F']), optionTypes: Object.freeze(['call', 'put']),
  exerciseStyles: Object.freeze(['european', 'american']), positions: Object.freeze(['long', 'short']),
  limits: Object.freeze({
    maxInputBytes: 1_000_000, minSpot: 1e-8, maxSpot: 1_000_000_000_000,
    minStrike: 1e-8, maxStrike: 1_000_000_000_000, minVolatility: 0, maxVolatility: 5,
    minMaturityYears: 0, maxMaturityYears: 30, minRate: -1, maxRate: 1,
    minSteps: 2, maxSteps: 2_000, maxDisplayDepth: 6, maxQuantity: 1_000_000,
    minContractMultiplier: 1e-8, maxContractMultiplier: 1_000_000_000_000,
  }),
  numeric: Object.freeze({ exerciseTolerance: 1e-12, probabilityTolerance: 1e-14, exportSignificantDigits: 9, hashSignificantDigits: 17 }),
  conventions: Object.freeze({
    up: 'exp(volatility * sqrt(dt))', down: '1 / up',
    probability: '(exp((risk_free_rate-dividend_yield)*dt)-down)/(up-down)',
    discount: 'exp(-risk_free_rate*dt)',
    americanExercise: 'max(intrinsic, discounted_risk_neutral_continuation)',
    earlyExercisePremium: 'american_price_minus_european_price',
    zeroVolatility: 'deterministic risk-neutral path with backward optimal stopping',
    atExpiry: 'exact intrinsic value',
    vega: 'price change per +1 volatility percentage point',
    rho: 'price change per +1 rate percentage point',
    theta: 'price change for one calendar day elapsed',
  }),
  exports: Object.freeze({
    convergenceCsvSchema: BINOMIAL_CONVERGENCE_CSV_SCHEMA,
    frontierCsvSchema: BINOMIAL_FRONTIER_CSV_SCHEMA,
    convergenceCsvHeaders: Object.freeze(['schemaVersion', 'engineVersion', 'analysisId', 'exerciseStyle', 'optionType', 'steps', 'pricePerUnit', 'europeanPricePerUnit', 'blackScholesBenchmark', 'absoluteBenchmarkError']),
    frontierCsvHeaders: Object.freeze(['schemaVersion', 'engineVersion', 'analysisId', 'optionType', 'step', 'timeYears', 'boundarySpot', 'exerciseNodeCount']),
    lineEnding: 'LF', finalNewline: true, numericFormat: 'finite_significant_9',
  }),
});

const LIMITS = BINOMIAL_CONTRACT.limits;
const INPUT_KEYS = ['schemaVersion', 'spot', 'strike', 'volatility', 'maturityYears', 'dayCount', 'riskFreeRate', 'dividendYield', 'steps', 'optionType', 'exerciseStyle', 'currency', 'quantity', 'contractMultiplier', 'position'];
const plainObject = (value, label) => {
  if (value === null || typeof value !== 'object' || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) throw new Error(`${label} must be a plain object.`);
};
const exactKeys = (value, allowed, label) => {
  const set = new Set(allowed);
  const missing = allowed.filter((key) => !Object.hasOwn(value, key)).sort();
  const unknown = Object.keys(value).filter((key) => !set.has(key)).sort();
  if (missing.length || unknown.length) throw new Error(`${label} schema is invalid; missing=${missing.join('|') || 'none'}; unknown=${unknown.join('|') || 'none'}.`);
};
const number = (value, label, min, max) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`${label} must be a finite number.`);
  if (value < min || value > max) throw new Error(`${label} is outside the supported domain.`);
  return Object.is(value, -0) ? 0 : value;
};
const integer = (value, label, min, max) => {
  if (!Number.isSafeInteger(value) || value < min || value > max) throw new Error(`${label} must be a safe integer between ${min} and ${max}.`);
  return value;
};
const oneOf = (value, values, label) => {
  if (!values.includes(value)) throw new Error(`${label} is unsupported.`);
  return value;
};

export const normalizeBinomialInput = (raw) => {
  plainObject(raw, 'Binomial input'); exactKeys(raw, INPUT_KEYS, 'Binomial input');
  if (raw.schemaVersion !== BINOMIAL_INPUT_SCHEMA) throw new Error(`schemaVersion must be '${BINOMIAL_INPUT_SCHEMA}'.`);
  const input = {
    schemaVersion: BINOMIAL_INPUT_SCHEMA,
    spot: number(raw.spot, 'spot', LIMITS.minSpot, LIMITS.maxSpot),
    strike: number(raw.strike, 'strike', LIMITS.minStrike, LIMITS.maxStrike),
    volatility: number(raw.volatility, 'volatility', LIMITS.minVolatility, LIMITS.maxVolatility),
    maturityYears: number(raw.maturityYears, 'maturityYears', LIMITS.minMaturityYears, LIMITS.maxMaturityYears),
    dayCount: oneOf(raw.dayCount, BINOMIAL_CONTRACT.dayCounts, 'dayCount'),
    riskFreeRate: number(raw.riskFreeRate, 'riskFreeRate', LIMITS.minRate, LIMITS.maxRate),
    dividendYield: number(raw.dividendYield, 'dividendYield', LIMITS.minRate, LIMITS.maxRate),
    steps: integer(raw.steps, 'steps', LIMITS.minSteps, LIMITS.maxSteps),
    optionType: oneOf(raw.optionType, BINOMIAL_CONTRACT.optionTypes, 'optionType'),
    exerciseStyle: oneOf(raw.exerciseStyle, BINOMIAL_CONTRACT.exerciseStyles, 'exerciseStyle'),
    currency: raw.currency,
    quantity: integer(raw.quantity, 'quantity', 1, LIMITS.maxQuantity),
    contractMultiplier: number(raw.contractMultiplier, 'contractMultiplier', LIMITS.minContractMultiplier, LIMITS.maxContractMultiplier),
    position: oneOf(raw.position, BINOMIAL_CONTRACT.positions, 'position'),
  };
  if (typeof input.currency !== 'string' || !/^[A-Z]{3}$/.test(input.currency)) throw new Error('currency must be an uppercase three-letter code.');
  const extremeLog = Math.log(input.spot) + input.volatility * Math.sqrt(input.maturityYears * input.steps);
  if (!Number.isFinite(extremeLog) || extremeLog > 700) throw new Error('spot/volatility/maturity/steps create an unsupported numerical tree range.');
  return input;
};

const intrinsic = (spot, strike, type) => type === 'call' ? Math.max(spot - strike, 0) : Math.max(strike - spot, 0);
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
  const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
};
const finiteTree = (value, path = 'result') => {
  if (typeof value === 'number' && !Number.isFinite(value)) throw new Error(`${path} contains a non-finite number.`);
  if (Array.isArray(value)) value.forEach((item, index) => finiteTree(item, `${path}[${index}]`));
  else if (value && typeof value === 'object') Object.entries(value).forEach(([key, item]) => finiteTree(item, `${path}.${key}`));
};

const normCdf = (rawX) => {
  const a = [0.254829592, -0.284496736, 1.421413741, -1.453152027, 1.061405429];
  const sign = rawX < 0 ? -1 : 1; const x = Math.abs(rawX) / Math.SQRT2; const t = 1 / (1 + 0.3275911 * x);
  const erf = 1 - (((((a[4] * t + a[3]) * t) + a[2]) * t + a[1]) * t + a[0]) * t * Math.exp(-x * x);
  return 0.5 * (1 + sign * erf);
};
const blackScholes = (input) => {
  if (input.maturityYears === 0) return intrinsic(input.spot, input.strike, input.optionType);
  if (input.volatility === 0) {
    const forwardTerminal = input.spot * Math.exp((input.riskFreeRate - input.dividendYield) * input.maturityYears);
    return Math.exp(-input.riskFreeRate * input.maturityYears) * intrinsic(forwardTerminal, input.strike, input.optionType);
  }
  const sqrtT = Math.sqrt(input.maturityYears);
  const d1 = (Math.log(input.spot / input.strike) + (input.riskFreeRate - input.dividendYield + 0.5 * input.volatility ** 2) * input.maturityYears) / (input.volatility * sqrtT);
  const d2 = d1 - input.volatility * sqrtT;
  const s = input.spot * Math.exp(-input.dividendYield * input.maturityYears);
  const k = input.strike * Math.exp(-input.riskFreeRate * input.maturityYears);
  return input.optionType === 'call' ? s * normCdf(d1) - k * normCdf(d2) : k * normCdf(-d2) - s * normCdf(-d1);
};

const lattice = (input, steps, exerciseStyle = input.exerciseStyle, details = false) => {
  const dt = input.maturityYears / steps;
  const discountFactor = Math.exp(-input.riskFreeRate * dt);
  const deterministic = input.volatility === 0 || input.maturityYears === 0;
  let up = 1; let down = 1; let probability = null; let logUp = 0;
  if (!deterministic) {
    logUp = input.volatility * Math.sqrt(dt); up = Math.exp(logUp); down = 1 / up;
    probability = (Math.exp((input.riskFreeRate - input.dividendYield) * dt) - down) / (up - down);
    const tol = BINOMIAL_CONTRACT.numeric.probabilityTolerance;
    if (!Number.isFinite(probability) || probability < -tol || probability > 1 + tol) throw new Error(`CRR no-arbitrage probability is outside [0,1] at ${steps} steps; increase steps or revise rate/dividend/volatility inputs.`);
    if (probability < 0 || probability > 1) throw new Error(`CRR probability is numerically outside [0,1] at ${steps} steps.`);
  }
  const spotAt = (step, upMoves) => deterministic
    ? input.spot * Math.exp((input.riskFreeRate - input.dividendYield) * step * dt)
    : input.spot * Math.exp((2 * upMoves - step) * logUp);
  let values = Array.from({ length: steps + 1 }, (_, j) => intrinsic(spotAt(steps, j), input.strike, input.optionType));
  let europeanValues = values.slice();
  const boundary = []; const nodes = []; let exercisedNodeCount = 0; let firstExerciseStep = null;
  if (details && steps <= LIMITS.maxDisplayDepth) {
    for (let j = 0; j <= steps; j += 1) nodes.push({ step: steps, upMoves: j, spot: spotAt(steps, j), intrinsic: values[j], continuation: null, value: values[j], exercise: false });
  }
  for (let step = steps - 1; step >= 0; step -= 1) {
    const next = new Array(step + 1); const nextEuropean = new Array(step + 1); const exercisedSpots = [];
    for (let j = 0; j <= step; j += 1) {
      const continuation = deterministic ? discountFactor * values[j] : discountFactor * ((1 - probability) * values[j] + probability * values[j + 1]);
      const europeanContinuation = deterministic ? discountFactor * europeanValues[j] : discountFactor * ((1 - probability) * europeanValues[j] + probability * europeanValues[j + 1]);
      const spot = spotAt(step, j); const immediate = intrinsic(spot, input.strike, input.optionType);
      const exercise = exerciseStyle === 'american' && immediate > continuation + BINOMIAL_CONTRACT.numeric.exerciseTolerance * Math.max(1, Math.abs(continuation));
      next[j] = exercise ? immediate : continuation; nextEuropean[j] = europeanContinuation;
      if (exercise) exercisedSpots.push(spot);
      if (details && step <= LIMITS.maxDisplayDepth) nodes.push({ step, upMoves: j, spot, intrinsic: immediate, continuation, value: next[j], exercise });
    }
    if (details && exercisedSpots.length) {
      exercisedNodeCount += exercisedSpots.length; firstExerciseStep = firstExerciseStep === null ? step : Math.min(firstExerciseStep, step);
      boundary.push({ step, timeYears: step * dt, boundarySpot: input.optionType === 'put' ? Math.max(...exercisedSpots) : Math.min(...exercisedSpots), exerciseNodeCount: exercisedSpots.length });
    }
    values = next; europeanValues = nextEuropean;
  }
  boundary.sort((a, b) => a.step - b.step); nodes.sort((a, b) => a.step - b.step || a.upMoves - b.upMoves);
  return {
    price: values[0], europeanPrice: europeanValues[0], up, down, probability, discountFactor, dt,
    deterministic, boundary, nodes, exercisedNodeCount, firstExerciseStep,
  };
};

const convergenceSteps = (steps) => [...new Set([Math.max(2, Math.floor(steps / 8)), Math.max(2, Math.floor(steps / 4)), Math.max(2, Math.floor(steps / 2)), Math.max(2, steps - 1), steps])].sort((a, b) => a - b);
const priceOnly = (input, overrides = {}) => lattice({ ...input, ...overrides }, overrides.steps ?? input.steps, overrides.exerciseStyle ?? input.exerciseStyle, false).price;
const greeks = (input, price, detailed) => {
  const levelOne = detailed.nodes.filter((node) => node.step === 1);
  const levelTwo = detailed.nodes.filter((node) => node.step === 2);
  let delta; let gamma; let theta;
  if (!detailed.deterministic && levelOne.length === 2 && levelTwo.length === 3) {
    delta = (levelOne[1].value - levelOne[0].value) / (levelOne[1].spot - levelOne[0].spot);
    const deltaDown = (levelTwo[1].value - levelTwo[0].value) / (levelTwo[1].spot - levelTwo[0].spot);
    const deltaUp = (levelTwo[2].value - levelTwo[1].value) / (levelTwo[2].spot - levelTwo[1].spot);
    gamma = (deltaUp - deltaDown) / ((levelTwo[2].spot - levelTwo[0].spot) / 2);
    theta = (levelTwo[1].value - price) / (2 * detailed.dt * 365);
  } else {
    const spotBump = Math.min(
      Math.max(input.spot * 0.01, Math.min(1e-6, input.spot * 0.5)),
      (LIMITS.maxSpot - LIMITS.minSpot) / 4,
    );
    if (input.spot - spotBump >= LIMITS.minSpot && input.spot + spotBump <= LIMITS.maxSpot) {
      const upSpot = priceOnly(input, { spot: input.spot + spotBump });
      const downSpot = priceOnly(input, { spot: input.spot - spotBump });
      delta = (upSpot - downSpot) / (2 * spotBump);
      gamma = (upSpot - 2 * price + downSpot) / (spotBump ** 2);
    } else if (input.spot + 2 * spotBump <= LIMITS.maxSpot) {
      const first = priceOnly(input, { spot: input.spot + spotBump });
      const second = priceOnly(input, { spot: input.spot + 2 * spotBump });
      delta = (-3 * price + 4 * first - second) / (2 * spotBump);
      gamma = (price - 2 * first + second) / (spotBump ** 2);
    } else {
      const first = priceOnly(input, { spot: input.spot - spotBump });
      const second = priceOnly(input, { spot: input.spot - 2 * spotBump });
      delta = (3 * price - 4 * first + second) / (2 * spotBump);
      gamma = (price - 2 * first + second) / (spotBump ** 2);
    }
    theta = input.maturityYears > 1 / 365
      ? priceOnly(input, { maturityYears: input.maturityYears - 1 / 365 }) - price
      : priceOnly(input, { maturityYears: LIMITS.minMaturityYears }) - price;
  }
  const volBump = 1e-4;
  const admissibleVolFloor = Math.abs(input.riskFreeRate - input.dividendYield) * Math.sqrt(input.maturityYears / input.steps);
  const upVolatility = Math.max(input.volatility + volBump, admissibleVolFloor * 1.000001 + Number.EPSILON);
  const downVolatility = input.volatility - volBump;
  const canUseUpVol = upVolatility <= LIMITS.maxVolatility;
  const canUseDownVol = downVolatility >= LIMITS.minVolatility && downVolatility > admissibleVolFloor * 1.000001;
  let vega;
  if (canUseUpVol && canUseDownVol) {
    vega = (priceOnly(input, { volatility: upVolatility }) - priceOnly(input, { volatility: downVolatility })) / (upVolatility - downVolatility) * 0.01;
  } else if (canUseUpVol) {
    vega = (priceOnly(input, { volatility: upVolatility }) - price) / (upVolatility - input.volatility) * 0.01;
  } else if (canUseDownVol) {
    vega = (price - priceOnly(input, { volatility: downVolatility })) / (input.volatility - downVolatility) * 0.01;
  } else {
    throw new Error('Vega cannot be estimated inside the supported volatility and CRR probability domain.');
  }
  const rateBump = 1e-4;
  const admissibleRatePrice = (riskFreeRate) => {
    if (riskFreeRate < LIMITS.minRate || riskFreeRate > LIMITS.maxRate) return null;
    try { return priceOnly(input, { riskFreeRate }); }
    catch (reason) {
      if (reason instanceof Error && reason.message.includes('CRR no-arbitrage probability')) return null;
      throw reason;
    }
  };
  const upRatePrice = admissibleRatePrice(input.riskFreeRate + rateBump);
  const downRatePrice = admissibleRatePrice(input.riskFreeRate - rateBump);
  let rho;
  if (upRatePrice !== null && downRatePrice !== null) rho = (upRatePrice - downRatePrice) / (2 * rateBump) * 0.01;
  else if (upRatePrice !== null) rho = (upRatePrice - price) / rateBump * 0.01;
  else if (downRatePrice !== null) rho = (price - downRatePrice) / rateBump * 0.01;
  else throw new Error('Rho cannot be estimated inside the supported rate and CRR probability domain.');
  return { delta, gamma, vega, theta, rho };
};

export const analyzeBinomial = async (raw) => {
  const input = normalizeBinomialInput(raw);
  const analysisId = await sha256(JSON.stringify(canonicalTree(input)));
  const detailed = lattice(input, input.steps, input.exerciseStyle, true);
  const benchmark = blackScholes(input);
  const convergence = convergenceSteps(input.steps).map((steps) => {
    const run = lattice(input, steps, input.exerciseStyle, false);
    return { steps, pricePerUnit: run.price, europeanPricePerUnit: run.europeanPrice, blackScholesBenchmark: benchmark, absoluteBenchmarkError: input.exerciseStyle === 'european' ? Math.abs(run.price - benchmark) : Math.abs(run.europeanPrice - benchmark) };
  });
  const adjacent = lattice(input, Math.max(2, input.steps - 1), input.exerciseStyle, false).price;
  const perUnitGreeks = greeks(input, detailed.price, detailed);
  const sign = input.position === 'long' ? 1 : -1; const scale = sign * input.quantity * input.contractMultiplier;
  const diagnostics = [];
  if (input.maturityYears === 0) diagnostics.push({ code: 'AT_EXPIRY_INTRINSIC', severity: 'info', message: 'At expiry, the value is the exact intrinsic payoff and no probability is required.' });
  else if (detailed.deterministic) diagnostics.push({ code: 'ZERO_VOLATILITY_DETERMINISTIC', severity: 'info', message: 'Zero volatility uses the deterministic risk-neutral path and backward optimal stopping.' });
  const adjacentGap = Math.abs(detailed.price - adjacent);
  const earlyExercisePremium = detailed.price - detailed.europeanPrice;
  const premiumTolerance = BINOMIAL_CONTRACT.numeric.exerciseTolerance * Math.max(1, Math.abs(detailed.price), Math.abs(detailed.europeanPrice));
  if (earlyExercisePremium < -premiumTolerance) throw new Error('American value fell below the same-tree European value.');
  const reportedEarlyExercisePremium = Math.abs(earlyExercisePremium) <= premiumTolerance ? 0 : earlyExercisePremium;
  if (adjacentGap > Math.max(1e-6, Math.abs(detailed.price) * 1e-3)) diagnostics.push({ code: 'ADJACENT_STEP_OSCILLATION', severity: 'warning', message: 'N and N-1 prices still differ materially; increase steps before relying on the estimate.' });
  if (input.exerciseStyle === 'american' && detailed.exercisedNodeCount === 0) diagnostics.push({ code: 'NO_EARLY_EXERCISE_REGION', severity: 'info', message: 'No pre-maturity node exercised on this lattice.' });
  if (input.exerciseStyle === 'american' && input.optionType === 'call' && input.dividendYield <= 0 && input.riskFreeRate >= 0) diagnostics.push({ code: 'NON_DIVIDEND_CALL_CHECK', severity: 'info', message: 'With non-negative rates, a non-dividend American call should not exercise early and should converge to its European value.' });
  const result = {
    schemaVersion: BINOMIAL_SCHEMA_VERSION, engineVersion: BINOMIAL_ENGINE_VERSION, analysisId, input,
    model: { name: 'Cox-Ross-Rubinstein', measure: 'Q', dayCount: input.dayCount, timeStepYears: detailed.dt, upFactor: detailed.up, downFactor: detailed.down, riskNeutralUpProbability: detailed.probability, discountFactorPerStep: detailed.discountFactor, noArbitrageProbability: detailed.probability === null || (detailed.probability >= 0 && detailed.probability <= 1) },
    valuation: { pricePerUnit: detailed.price, positionValue: detailed.price * scale, europeanPricePerUnit: detailed.europeanPrice, earlyExercisePremiumPerUnit: reportedEarlyExercisePremium, intrinsicAtSpot: intrinsic(input.spot, input.strike, input.optionType), blackScholesBenchmark: benchmark, benchmarkComparisonPrice: input.exerciseStyle === 'european' ? detailed.price : detailed.europeanPrice, benchmarkAbsoluteError: Math.abs((input.exerciseStyle === 'european' ? detailed.price : detailed.europeanPrice) - benchmark), adjacentStepPrice: adjacent, adjacentStepGap: adjacentGap, adjacentStepAverage: (detailed.price + adjacent) / 2 },
    greeks: { perUnit: perUnitGreeks, position: Object.fromEntries(Object.entries(perUnitGreeks).map(([key, value]) => [key, value * scale])) },
    convergence,
    earlyExercise: { available: input.exerciseStyle === 'american', exercisedNodeCount: detailed.exercisedNodeCount, firstExerciseStep: detailed.firstExerciseStep, firstExerciseTimeYears: detailed.firstExerciseStep === null ? null : detailed.firstExerciseStep * detailed.dt, boundary: detailed.boundary },
    tree: { displayDepth: Math.min(input.steps, LIMITS.maxDisplayDepth), nodes: detailed.nodes }, diagnostics,
    limitations: ['Constant risk-free rate, continuous dividend yield and constant volatility.', 'No discrete dividends, term structures, smile/skew, jumps, transaction costs, liquidity or margin.', 'Finite-difference Greeks for an American lattice may oscillate with the step count; convergence must be inspected.', 'Educational local calculation; inputs are user assumptions, not live market data.'],
  };
  finiteTree(result); return result;
};

const exportNumber = (value) => {
  if (value === null || value === undefined) return '';
  if (!Number.isFinite(value)) throw new Error('Evidence export contains a non-finite number.');
  if (value === 0 || Object.is(value, -0) || Math.abs(value) < 1e-15) return '0';
  const [mantissa, exponent] = value.toExponential(8).toLowerCase().split('e');
  return `${mantissa.replace(/0+$/, '').replace(/\.$/, '')}e${Number(exponent)}`;
};
const csvEscape = (value) => { const text = String(value ?? ''); return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text; };
const csv = (headers, rows) => `${headers.join(',')}\n${rows.map((row) => headers.map((header) => csvEscape(typeof row[header] === 'number' ? exportNumber(row[header]) : row[header])).join(',')).join('\n')}${rows.length ? '\n' : ''}`;
export const buildBinomialConvergenceCsv = (result) => csv(BINOMIAL_CONTRACT.exports.convergenceCsvHeaders, result.convergence.map((row) => ({ schemaVersion: BINOMIAL_CONVERGENCE_CSV_SCHEMA, engineVersion: result.engineVersion, analysisId: result.analysisId, exerciseStyle: result.input.exerciseStyle, optionType: result.input.optionType, ...row })));
export const buildBinomialFrontierCsv = (result) => csv(BINOMIAL_CONTRACT.exports.frontierCsvHeaders, result.earlyExercise.boundary.map((row) => ({ schemaVersion: BINOMIAL_FRONTIER_CSV_SCHEMA, engineVersion: result.engineVersion, analysisId: result.analysisId, optionType: result.input.optionType, ...row })));
export const buildBinomialJson = (result) => `${JSON.stringify(result, null, 2)}\n`;
