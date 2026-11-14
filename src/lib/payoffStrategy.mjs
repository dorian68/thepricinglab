export const PAYOFF_STRATEGY_ENGINE_VERSION = '1.0.1';
export const PAYOFF_STRATEGY_SCHEMA_VERSION = 'tpl.payoff-strategy.analysis.v1';
export const PAYOFF_STRATEGY_CURVE_CSV_SCHEMA = 'tpl.payoff-strategy.curve.v1';
export const PAYOFF_STRATEGY_SCENARIO_CSV_SCHEMA = 'tpl.payoff-strategy.scenarios.v1';

export const PAYOFF_STRATEGY_CONTRACT = Object.freeze({
  schemaVersion: 'tpl.payoff-strategy.contract.v1',
  analysisSchemaVersion: PAYOFF_STRATEGY_SCHEMA_VERSION,
  engineVersion: PAYOFF_STRATEGY_ENGINE_VERSION,
  limits: Object.freeze({
    maxInputBytes: 1_000_000,
    maxLegs: 20, maxIdentifierLength: 64, maxCurrencyLength: 3,
    minSpot: 1e-8, maxSpot: 1_000_000_000,
    minStrike: 1e-8, maxStrike: 1_000_000_000,
    maxPremium: 1_000_000_000, maxQuantity: 1_000_000,
    minContractMultiplier: 1e-8, maxContractMultiplier: 1_000_000_000,
    minMaturityYears: 1e-8, maxMaturityYears: 100,
    minVolatility: 1e-6, maxVolatility: 5, minRate: -1, maxRate: 1,
    minGridPoints: 101, maxGridPoints: 2001,
  }),
  enums: Object.freeze({
    optionTypes: Object.freeze(['call', 'put']),
    sides: Object.freeze(['long', 'short']),
    premiumSources: Object.freeze(['model', 'manual']),
    boundKinds: Object.freeze(['finite', 'unlimited']),
  }),
  units: Object.freeze({
    spotStrikePremium: 'currency per underlying unit', quantity: 'positive integer contracts',
    contractMultiplier: 'underlying units per contract', volatilityRatesDividendYield: 'decimal',
    maturity: 'years', pnlPrice: 'currency', delta: 'currency P&L per +1 spot unit',
    gamma: 'currency P&L per +1 spot-unit squared', vega: 'currency P&L per +1 volatility point',
    theta: 'currency P&L per calendar day', rho: 'currency P&L per +1 rate point',
  }),
  numeric: Object.freeze({ comparisonTolerance: 1e-12, zeroTolerance: 1e-10, exportSignificantDigits: 12, hashSignificantDigits: 17 }),
  exports: Object.freeze({
    curveCsvSchema: PAYOFF_STRATEGY_CURVE_CSV_SCHEMA,
    scenarioCsvSchema: PAYOFF_STRATEGY_SCENARIO_CSV_SCHEMA,
    curveHeaders: Object.freeze(['schemaVersion', 'engineVersion', 'analysisId', 'terminalSpot', 'grossPayoff', 'terminalPnl']),
    scenarioHeaders: Object.freeze(['schemaVersion', 'engineVersion', 'analysisId', 'terminalSpot', 'grossPayoff', 'terminalPnl', 'legContributions']),
  }),
});

const LIMITS = PAYOFF_STRATEGY_CONTRACT.limits;
const ZERO = PAYOFF_STRATEGY_CONTRACT.numeric.zeroTolerance;
const INPUT_KEYS = new Set(['spot', 'volatility', 'timeToMaturity', 'riskFreeRate', 'dividendYield', 'currency', 'contractMultiplier', 'gridPoints', 'legs']);
const LEG_KEYS = new Set(['id', 'type', 'side', 'strike', 'quantity', 'premiumSource', 'manualPremium']);

const assertPlainObject = (value, label) => {
  if (value === null || typeof value !== 'object' || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) {
    throw new Error(`${label} must be a plain object.`);
  }
};

const assertExactKeys = (value, allowed, required, label) => {
  const unknown = Object.keys(value).filter((key) => !allowed.has(key));
  const missing = required.filter((key) => !Object.hasOwn(value, key));
  if (unknown.length || missing.length) throw new Error(`${label} schema is invalid; missing=${missing.sort().join('|') || 'none'}; unknown=${unknown.sort().join('|') || 'none'}.`);
};

const finiteNumber = (value, label, { min = -Infinity, max = Infinity, exclusiveMin = false } = {}) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`${label} must be a finite number.`);
  if ((exclusiveMin ? value <= min : value < min) || value > max) throw new Error(`${label} is outside the supported domain.`);
  return Object.is(value, -0) ? 0 : value;
};

const canonicalNumber = (value) => {
  if (!Number.isFinite(value)) throw new Error('Canonical input contains a non-finite number.');
  if (Object.is(value, -0) || value === 0) return '0';
  const [rawMantissa, rawExponent] = value.toExponential(16).toLowerCase().split('e');
  return `${rawMantissa.replace(/0+$/, '').replace(/\.$/, '')}e${Number(rawExponent)}`;
};

const exportNumber = (value) => {
  if (!Number.isFinite(value)) throw new Error('Evidence export contains a non-finite number.');
  if (Object.is(value, -0) || Math.abs(value) < 1e-15) return '0';
  const [rawMantissa, rawExponent] = value.toExponential(11).toLowerCase().split('e');
  return `${rawMantissa.replace(/0+$/, '').replace(/\.$/, '')}e${Number(rawExponent)}`;
};

const assertFiniteTree = (value, path = 'result') => {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error(`${path} contains a non-finite number.`);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertFiniteTree(item, `${path}[${index}]`));
    return;
  }
  if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) assertFiniteTree(item, `${path}.${key}`);
  }
};

const sha256 = async (text) => {
  if (!globalThis.crypto?.subtle) throw new Error('SHA-256 is unavailable in this runtime.');
  const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
};

const normPdf = (x) => Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);

// Same deterministic A&S approximation is mirrored by the Python engine.
export const normCdf = (rawX) => {
  const coefficients = [0.254829592, -0.284496736, 1.421413741, -1.453152027, 1.061405429];
  const sign = rawX < 0 ? -1 : 1;
  const x = Math.abs(rawX) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * x);
  const erf = 1 - (((((coefficients[4] * t + coefficients[3]) * t) + coefficients[2]) * t + coefficients[1]) * t + coefficients[0]) * t * Math.exp(-x * x);
  return 0.5 * (1 + sign * erf);
};

export const blackScholesLeg = ({ spot, strike, timeToMaturity, riskFreeRate, dividendYield, volatility, type }) => {
  const sqrtT = Math.sqrt(timeToMaturity);
  const d1 = (Math.log(spot / strike) + (riskFreeRate - dividendYield + 0.5 * volatility * volatility) * timeToMaturity) / (volatility * sqrtT);
  const d2 = d1 - volatility * sqrtT;
  const discountedSpot = spot * Math.exp(-dividendYield * timeToMaturity);
  const discountedStrike = strike * Math.exp(-riskFreeRate * timeToMaturity);
  const density = normPdf(d1);
  let price;
  let delta;
  let thetaAnnual;
  let rhoPerPoint;
  if (type === 'call') {
    price = discountedSpot * normCdf(d1) - discountedStrike * normCdf(d2);
    delta = Math.exp(-dividendYield * timeToMaturity) * normCdf(d1);
    thetaAnnual = -(discountedSpot * density * volatility) / (2 * sqrtT)
      - riskFreeRate * discountedStrike * normCdf(d2)
      + dividendYield * discountedSpot * normCdf(d1);
    rhoPerPoint = strike * timeToMaturity * Math.exp(-riskFreeRate * timeToMaturity) * normCdf(d2) / 100;
  } else {
    price = discountedStrike * normCdf(-d2) - discountedSpot * normCdf(-d1);
    delta = -Math.exp(-dividendYield * timeToMaturity) * normCdf(-d1);
    thetaAnnual = -(discountedSpot * density * volatility) / (2 * sqrtT)
      + riskFreeRate * discountedStrike * normCdf(-d2)
      - dividendYield * discountedSpot * normCdf(-d1);
    rhoPerPoint = -strike * timeToMaturity * Math.exp(-riskFreeRate * timeToMaturity) * normCdf(-d2) / 100;
  }
  const result = {
    price,
    greeks: {
      delta,
      gamma: Math.exp(-dividendYield * timeToMaturity) * density / (spot * volatility * sqrtT),
      vega: discountedSpot * density * sqrtT / 100,
      theta: thetaAnnual / 365,
      rho: rhoPerPoint,
    },
    d1,
    d2,
  };
  assertFiniteTree(result, 'Black-Scholes result');
  return result;
};

export const normalizePayoffStrategyInput = (raw) => {
  assertPlainObject(raw, 'strategy input');
  assertExactKeys(raw, INPUT_KEYS, ['spot', 'volatility', 'timeToMaturity', 'riskFreeRate', 'dividendYield', 'currency', 'contractMultiplier', 'gridPoints', 'legs'], 'strategy input');
  const spot = finiteNumber(raw.spot, 'spot', { min: LIMITS.minSpot, max: LIMITS.maxSpot });
  const volatility = finiteNumber(raw.volatility, 'volatility', { min: LIMITS.minVolatility, max: LIMITS.maxVolatility });
  const timeToMaturity = finiteNumber(raw.timeToMaturity, 'timeToMaturity', { min: LIMITS.minMaturityYears, max: LIMITS.maxMaturityYears });
  const riskFreeRate = finiteNumber(raw.riskFreeRate, 'riskFreeRate', { min: LIMITS.minRate, max: LIMITS.maxRate });
  const dividendYield = finiteNumber(raw.dividendYield, 'dividendYield', { min: LIMITS.minRate, max: LIMITS.maxRate });
  const contractMultiplier = finiteNumber(raw.contractMultiplier, 'contractMultiplier', { min: LIMITS.minContractMultiplier, max: LIMITS.maxContractMultiplier });
  if (typeof raw.currency !== 'string' || !/^[A-Z]{3}$/.test(raw.currency)) throw new Error('currency must be an uppercase three-letter code.');
  if (!Number.isSafeInteger(raw.gridPoints) || raw.gridPoints < LIMITS.minGridPoints || raw.gridPoints > LIMITS.maxGridPoints || raw.gridPoints % 2 === 0) {
    throw new Error(`gridPoints must be an odd safe integer between ${LIMITS.minGridPoints} and ${LIMITS.maxGridPoints}.`);
  }
  if (!Array.isArray(raw.legs) || raw.legs.length < 1 || raw.legs.length > LIMITS.maxLegs) throw new Error(`legs must contain between 1 and ${LIMITS.maxLegs} entries.`);
  const ids = new Set();
  const legs = raw.legs.map((leg, index) => {
    assertPlainObject(leg, `leg ${index + 1}`);
    assertExactKeys(leg, LEG_KEYS, ['id', 'type', 'side', 'strike', 'quantity', 'premiumSource', 'manualPremium'], `leg ${index + 1}`);
    if (typeof leg.id !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(leg.id)) throw new Error(`leg ${index + 1} id is invalid.`);
    if (ids.has(leg.id)) throw new Error(`leg id '${leg.id}' is duplicated.`);
    ids.add(leg.id);
    if (!PAYOFF_STRATEGY_CONTRACT.enums.optionTypes.includes(leg.type)) throw new Error(`leg ${leg.id} type is unsupported.`);
    if (!PAYOFF_STRATEGY_CONTRACT.enums.sides.includes(leg.side)) throw new Error(`leg ${leg.id} side is unsupported.`);
    if (!PAYOFF_STRATEGY_CONTRACT.enums.premiumSources.includes(leg.premiumSource)) throw new Error(`leg ${leg.id} premiumSource is unsupported.`);
    const strike = finiteNumber(leg.strike, `leg ${leg.id} strike`, { min: LIMITS.minStrike, max: LIMITS.maxStrike });
    if (!Number.isSafeInteger(leg.quantity) || leg.quantity < 1 || leg.quantity > LIMITS.maxQuantity) throw new Error(`leg ${leg.id} quantity must be a positive safe integer.`);
    let manualPremium = null;
    if (leg.premiumSource === 'manual') manualPremium = finiteNumber(leg.manualPremium, `leg ${leg.id} manualPremium`, { min: 0, max: LIMITS.maxPremium });
    else if (leg.manualPremium !== null) throw new Error(`leg ${leg.id} manualPremium must be null when premiumSource is model.`);
    return Object.freeze({ id: leg.id, type: leg.type, side: leg.side, strike, quantity: leg.quantity, premiumSource: leg.premiumSource, manualPremium });
  });
  return Object.freeze({ spot, volatility, timeToMaturity, riskFreeRate, dividendYield, currency: raw.currency, contractMultiplier, gridPoints: raw.gridPoints, legs: Object.freeze(legs) });
};

const canonicalInputText = (input) => [
  PAYOFF_STRATEGY_SCHEMA_VERSION,
  `spot=${canonicalNumber(input.spot)}`,
  `volatility=${canonicalNumber(input.volatility)}`,
  `timeToMaturity=${canonicalNumber(input.timeToMaturity)}`,
  `riskFreeRate=${canonicalNumber(input.riskFreeRate)}`,
  `dividendYield=${canonicalNumber(input.dividendYield)}`,
  `currency=${input.currency}`,
  `contractMultiplier=${canonicalNumber(input.contractMultiplier)}`,
  `gridPoints=${input.gridPoints}`,
  ...input.legs.map((leg) => `leg=${leg.id}|${leg.type}|${leg.side}|${canonicalNumber(leg.strike)}|${leg.quantity}|${leg.premiumSource}|${leg.manualPremium === null ? 'null' : canonicalNumber(leg.manualPremium)}`),
].join('\n') + '\n';

const uniqueSorted = (values) => [...new Set(values.map((value) => Math.abs(value) < ZERO ? 0 : value))].sort((left, right) => left - right);
const directionOf = (side) => side === 'long' ? 1 : -1;

const strategyValuesAt = (terminalSpot, legs) => {
  let grossPayoff = 0;
  let terminalPnl = 0;
  const legContributions = [];
  for (const leg of legs) {
    const intrinsic = leg.type === 'call' ? Math.max(terminalSpot - leg.strike, 0) : Math.max(leg.strike - terminalSpot, 0);
    const gross = leg.direction * leg.scale * intrinsic;
    const pnl = gross - leg.direction * leg.scale * leg.entryPremium;
    grossPayoff += gross;
    terminalPnl += pnl;
    legContributions.push({ id: leg.id, grossPayoff: gross, terminalPnl: pnl });
  }
  return { terminalSpot, grossPayoff, terminalPnl, legContributions };
};

const coefficientsAt = (terminalSpot, legs) => {
  let slope = 0;
  let intercept = 0;
  for (const leg of legs) {
    intercept -= leg.direction * leg.scale * leg.entryPremium;
    if (leg.type === 'call' && terminalSpot > leg.strike) {
      slope += leg.direction * leg.scale;
      intercept -= leg.direction * leg.scale * leg.strike;
    }
    if (leg.type === 'put' && terminalSpot < leg.strike) {
      slope -= leg.direction * leg.scale;
      intercept += leg.direction * leg.scale * leg.strike;
    }
  }
  return { slope, intercept };
};

const piecewiseAnalysis = (legs) => {
  const boundaries = uniqueSorted([0, ...legs.map((leg) => leg.strike)]);
  const segments = [];
  const breakevens = [];
  const zeroIntervals = [];
  for (let index = 0; index < boundaries.length; index += 1) {
    const lowerSpot = boundaries[index];
    const upperSpot = boundaries[index + 1] ?? null;
    const probe = upperSpot === null ? lowerSpot + Math.max(1, lowerSpot * 0.1) : (lowerSpot + upperSpot) / 2;
    const { slope, intercept } = coefficientsAt(probe, legs);
    const lowerPnl = slope * lowerSpot + intercept;
    const upperPnl = upperSpot === null ? null : slope * upperSpot + intercept;
    segments.push({ lowerSpot, upperSpot, slope, intercept, lowerPnl, upperPnl });
    if (Math.abs(slope) <= ZERO && Math.abs(intercept) <= ZERO) zeroIntervals.push({ lowerSpot, upperSpot });
    if (Math.abs(slope) > ZERO) {
      const root = -intercept / slope;
      const inside = root >= lowerSpot - ZERO && (upperSpot === null || root <= upperSpot + ZERO);
      if (inside && root >= -ZERO) breakevens.push(Math.max(0, root));
    }
  }
  const exactBreakevens = uniqueSorted(breakevens).filter((value, index, values) => index === 0 || Math.abs(value - values[index - 1]) > ZERO);
  const candidatePnls = boundaries.map((spot) => strategyValuesAt(spot, legs).terminalPnl);
  const terminalSlope = segments.at(-1).slope;
  const maxProfit = terminalSlope > ZERO
    ? { kind: 'unlimited', amount: null }
    : { kind: 'finite', amount: Math.max(0, ...candidatePnls) };
  const maxLoss = terminalSlope < -ZERO
    ? { kind: 'unlimited', amount: null }
    : { kind: 'finite', amount: Math.max(0, -Math.min(0, ...candidatePnls)) };
  return { segments, breakevens: exactBreakevens, zeroIntervals, bounds: { maxProfit, maxLoss } };
};

const buildTerminalGeometry = (input, legs) => {
  const piecewise = piecewiseAnalysis(legs);
  const important = [0, input.spot, ...legs.map((leg) => leg.strike), ...piecewise.breakevens];
  const maximumStrike = Math.max(...legs.map((leg) => leg.strike));
  const maximumBreakeven = piecewise.breakevens.length ? Math.max(...piecewise.breakevens) : 0;
  const maximumSpot = Math.max(input.spot * 2, maximumStrike * 1.5, maximumBreakeven * 1.1, 1);
  const regularGrid = Array.from({ length: input.gridPoints }, (_, index) => maximumSpot * index / (input.gridPoints - 1));
  const curve = uniqueSorted([...regularGrid, ...important.filter((value) => value <= maximumSpot)]).map((spot) => {
    const point = strategyValuesAt(spot, legs);
    return { terminalSpot: point.terminalSpot, grossPayoff: point.grossPayoff, terminalPnl: point.terminalPnl };
  });
  const scenarioSpots = uniqueSorted([0, input.spot * 0.5, input.spot * 0.75, input.spot, input.spot * 1.25, input.spot * 1.5, input.spot * 2, ...legs.map((leg) => leg.strike), ...piecewise.breakevens]);
  return { piecewise, curve, scenarios: scenarioSpots.map((spot) => strategyValuesAt(spot, legs)), atSpot: strategyValuesAt(input.spot, legs) };
};

export const analyzePayoffTerminal = (rawInput) => {
  const input = normalizePayoffStrategyInput(rawInput);
  if (input.legs.some((leg) => leg.premiumSource !== 'manual')) throw new Error('Terminal-only analysis requires an explicit manual premium for every leg.');
  const legs = input.legs.map((leg) => {
    const direction = directionOf(leg.side);
    const scale = leg.quantity * input.contractMultiplier;
    return { ...leg, direction, scale, entryPremium: leg.manualPremium, entryPremiumAmount: direction * scale * leg.manualPremium };
  });
  const { piecewise, curve, scenarios, atSpot } = buildTerminalGeometry(input, legs);
  const result = {
    input,
    legs,
    summary: {
      grossPayoffAtSpot: atSpot.grossPayoff,
      terminalPnlAtSpot: atSpot.terminalPnl,
      netEntryPremium: legs.reduce((sum, leg) => sum + leg.entryPremiumAmount, 0),
    },
    bounds: piecewise.bounds,
    breakevens: piecewise.breakevens,
    zeroIntervals: piecewise.zeroIntervals,
    segments: piecewise.segments,
    curve,
    scenarios,
  };
  assertFiniteTree(result, 'terminal result');
  return result;
};

export const analyzePayoffStrategy = async (rawInput) => {
  const input = normalizePayoffStrategyInput(rawInput);
  const analysisId = await sha256(canonicalInputText(input));
  const legs = input.legs.map((leg) => {
    const model = blackScholesLeg({ ...input, strike: leg.strike, type: leg.type });
    const direction = directionOf(leg.side);
    const scale = leg.quantity * input.contractMultiplier;
    const entryPremium = leg.premiumSource === 'model' ? model.price : leg.manualPremium;
    return {
      ...leg, direction, scale, modelPremium: model.price, entryPremium,
      modelValue: direction * scale * model.price,
      entryPremiumAmount: direction * scale * entryPremium,
      greeks: Object.fromEntries(Object.entries(model.greeks).map(([key, value]) => [key, direction * scale * value])),
    };
  });
  const { piecewise, curve, scenarios, atSpot } = buildTerminalGeometry(input, legs);
  const netEntryPremium = legs.reduce((sum, leg) => sum + leg.entryPremiumAmount, 0);
  const currentModelValue = legs.reduce((sum, leg) => sum + leg.modelValue, 0);
  const greeks = ['delta', 'gamma', 'vega', 'theta', 'rho'].reduce((total, key) => ({ ...total, [key]: legs.reduce((sum, leg) => sum + leg.greeks[key], 0) }), {});
  const manualCount = legs.filter((leg) => leg.premiumSource === 'manual').length;
  const result = {
    schemaVersion: PAYOFF_STRATEGY_SCHEMA_VERSION,
    engineVersion: PAYOFF_STRATEGY_ENGINE_VERSION,
    analysisId,
    input,
    legs,
    summary: {
      grossPayoffAtSpot: atSpot.grossPayoff,
      terminalPnlAtSpot: atSpot.terminalPnl,
      netEntryPremium,
      entryCashflow: -netEntryPremium,
      currentModelValue,
      inceptionModelPnl: currentModelValue - netEntryPremium,
    },
    greeks,
    bounds: piecewise.bounds,
    breakevens: piecewise.breakevens,
    zeroIntervals: piecewise.zeroIntervals,
    segments: piecewise.segments,
    curve,
    scenarios,
    diagnostics: {
      warnings: [
        ...(manualCount ? [{ code: 'MANUAL_PREMIUM', message: `${manualCount} leg(s) use user-entered premiums; they are not live market quotes.` }] : []),
        { code: 'EUROPEAN_TERMINAL_ONLY', message: 'Terminal P&L covers European vanilla exercise only; no early exercise, margin, costs or path dependence.' },
      ],
      manualPremiumLegCount: manualCount,
    },
    conventions: {
      priceModel: 'Black-Scholes-Merton European vanilla',
      terminalDomain: 'S_T >= 0',
      premiumRule: 'terminalPnl = signed intrinsic payoff - signed entry premium',
      marketDataStatus: 'user assumptions only; no live quote or market-data request',
      greekUnits: PAYOFF_STRATEGY_CONTRACT.units,
      limitations: ['European exercise only', 'constant volatility by strike and maturity', 'no transaction costs', 'no margin or liquidity model', 'no early exercise or path dependence'],
    },
  };
  assertFiniteTree(result);
  return result;
};

const csvCell = (value) => {
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

export const buildPayoffCurveCsv = (result) => {
  if (result?.schemaVersion !== PAYOFF_STRATEGY_SCHEMA_VERSION || !Array.isArray(result.curve)) throw new Error('Invalid payoff-strategy result.');
  const rows = result.curve.map((point) => [PAYOFF_STRATEGY_CURVE_CSV_SCHEMA, result.engineVersion, result.analysisId, exportNumber(point.terminalSpot), exportNumber(point.grossPayoff), exportNumber(point.terminalPnl)]);
  return `${PAYOFF_STRATEGY_CONTRACT.exports.curveHeaders.join(',')}\n${rows.map((row) => row.map(csvCell).join(',')).join('\n')}\n`;
};

export const buildPayoffScenarioCsv = (result) => {
  if (result?.schemaVersion !== PAYOFF_STRATEGY_SCHEMA_VERSION || !Array.isArray(result.scenarios)) throw new Error('Invalid payoff-strategy result.');
  const rows = result.scenarios.map((point) => [
    PAYOFF_STRATEGY_SCENARIO_CSV_SCHEMA, result.engineVersion, result.analysisId,
    exportNumber(point.terminalSpot), exportNumber(point.grossPayoff), exportNumber(point.terminalPnl),
    point.legContributions.map((leg) => `${leg.id}:${exportNumber(leg.terminalPnl)}`).join('|'),
  ]);
  return `${PAYOFF_STRATEGY_CONTRACT.exports.scenarioHeaders.join(',')}\n${rows.map((row) => row.map(csvCell).join(',')).join('\n')}\n`;
};

export const buildPayoffJson = (result) => {
  if (result?.schemaVersion !== PAYOFF_STRATEGY_SCHEMA_VERSION) throw new Error('Invalid payoff-strategy result.');
  assertFiniteTree(result);
  return `${JSON.stringify(result, null, 2)}\n`;
};
