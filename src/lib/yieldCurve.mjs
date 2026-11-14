/**
 * Deterministic, dependency-free single-curve bootstrap engine.
 *
 * Supported instruments:
 * - spot-starting simple deposits;
 * - sequential simple FRAs;
 * - STIR futures converted to FRA-equivalent rates with an explicit convexity
 *   adjustment;
 * - spot-starting par swaps with regular annual, semi-annual or quarterly
 *   fixed coupons.
 *
 * Deliberate boundaries: year fractions are supplied directly; there is no
 * holiday calendar, settlement lag, business-day adjustment, implicit stub,
 * extrapolation or OIS/projection multi-curve treatment.
 */

export const YIELD_CURVE_VERSION = '1.0.0';
export const YIELD_CURVE_RESULT_SCHEMA = 'tpl.yield-curve.result.v1';
export const YIELD_CURVE_EXPORT_SCHEMA = 'tpl.yield-curve.export.v1';
export const MAX_CURVE_INSTRUMENTS = 64;
export const MAX_CURVE_CSV_CHARACTERS = 262_144;

const EPSILON = 1e-12;
const TIME_TOLERANCE = 1e-10;
const REPRICING_TOLERANCE = 1e-10;
const SUPPORTED_TYPES = new Set(['deposit', 'fra', 'future', 'swap']);
const SUPPORTED_FREQUENCIES = new Set([1, 2, 4]);

export const DEFAULT_YIELD_CURVE_CONVENTIONS = Object.freeze({
  timeInput: 'ACT/365F year fractions supplied by the user',
  rateUnit: 'decimal',
  depositCompounding: 'simple',
  fraCompounding: 'simple',
  futureQuote: 'price points; futures rate = (100 - price) / 100',
  futureConvexity: 'FRA-equivalent rate = futures rate - explicit convexity adjustment',
  fixedLegFrequency: 1,
  fixedLegSchedule: 'regular spot-starting periods; no implicit stubs',
  floatingLeg: 'single-curve par identity: PV(float) = 1 - DF(T)',
  interpolation: 'log-linear discount factors',
  extrapolation: 'forbidden',
  zeroRates: 'continuous and annually compounded',
  forwardRates: 'continuous and simply annualized over the displayed interval',
});

export const YIELD_CURVE_LIMITATIONS = Object.freeze([
  'Educational deterministic mono-curve: discounting and projection use the same curve.',
  'Maturities are year fractions, not calendar dates; holidays, settlement lags and business-day rules are not modeled.',
  'Only regular spot-starting swap schedules are supported; explicit stubs are rejected.',
  'STIR futures require an explicit convexity adjustment, including an explicit 0 bp assumption.',
  'No discount-factor extrapolation is performed beyond the final market pillar.',
]);

const roundTime = (value) => Number(value.toFixed(12));
const isClose = (left, right, tolerance = TIME_TOLERANCE) => Math.abs(left - right) <= tolerance;
const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value, key);

const normalizeConventions = (input = {}) => {
  const frequency = Number(input.fixedLegFrequency ?? DEFAULT_YIELD_CURVE_CONVENTIONS.fixedLegFrequency);
  if (!SUPPORTED_FREQUENCIES.has(frequency)) {
    throw new Error('Fixed-leg frequency must be 1, 2 or 4 payments per year.');
  }
  if (input.interpolation && input.interpolation !== DEFAULT_YIELD_CURVE_CONVENTIONS.interpolation) {
    throw new Error("Only 'log-linear discount factors' interpolation is supported.");
  }
  if (input.extrapolation && input.extrapolation !== 'forbidden') {
    throw new Error('Discount-factor extrapolation is forbidden.');
  }
  return Object.freeze({
    ...DEFAULT_YIELD_CURVE_CONVENTIONS,
    fixedLegFrequency: frequency,
  });
};

const normalizeInstrument = (raw, index) => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error(`Instrument ${index + 1} must be an object.`);
  }
  const type = String(raw.type ?? raw.instrument ?? '').trim().toLowerCase();
  if (!SUPPORTED_TYPES.has(type)) {
    throw new Error(`Instrument ${index + 1} has unsupported type '${type || 'empty'}'.`);
  }
  const maturity = Number(raw.maturity ?? raw.maturityYears);
  const start = type === 'fra' || type === 'future'
    ? Number(raw.start ?? raw.startYears)
    : 0;

  let quote;
  let futurePrice = null;
  let convexityAdjustment = null;
  let futuresRate = null;
  if (type === 'future') {
    if (!hasOwn(raw, 'futurePrice')) {
      throw new Error(`Instrument ${index + 1}: a STIR future requires futurePrice in price points.`);
    }
    if (!hasOwn(raw, 'convexityAdjustment')) {
      throw new Error(`Instrument ${index + 1}: a STIR future requires an explicit convexityAdjustment, including 0.`);
    }
    futurePrice = Number(raw.futurePrice);
    convexityAdjustment = Number(raw.convexityAdjustment);
    futuresRate = (100 - futurePrice) / 100;
    quote = futuresRate - convexityAdjustment;
  } else {
    quote = Number(raw.quote ?? raw.quoteDecimal);
  }

  return {
    id: `${type}-${index + 1}`,
    type,
    start,
    maturity,
    quote,
    futurePrice,
    futuresRate,
    convexityAdjustment,
  };
};

const validateNormalizedInstrument = (instrument, index, conventions, previousMaturity) => {
  const label = `Instrument ${index + 1} (${instrument.type})`;
  if (![instrument.start, instrument.maturity, instrument.quote].every(Number.isFinite)) {
    throw new Error(`${label} contains a non-finite start, maturity or quote.`);
  }
  if (instrument.maturity <= 0 || instrument.maturity > 50) {
    throw new Error(`${label}: maturity must be in (0, 50] years.`);
  }
  if (index > 0 && instrument.maturity <= previousMaturity + TIME_TOLERANCE) {
    throw new Error(`${label}: maturities must be strictly increasing with no duplicate or quasi-duplicate pillar.`);
  }
  if (instrument.type === 'future') {
    if (![instrument.futurePrice, instrument.convexityAdjustment, instrument.futuresRate].every(Number.isFinite)) {
      throw new Error(`${label}: future price and convexity adjustment must be finite.`);
    }
    if (instrument.futurePrice <= 0 || instrument.futurePrice >= 200) {
      throw new Error(`${label}: future price must be in (0, 200) price points.`);
    }
    if (Math.abs(instrument.convexityAdjustment) > 0.1) {
      throw new Error(`${label}: absolute convexity adjustment cannot exceed 1,000 bp.`);
    }
  }

  if (instrument.quote < -0.25 || instrument.quote > 2) {
    throw new Error(`${label}: decimal rate must be between -0.25 and 2.`);
  }

  if (instrument.type === 'deposit') {
    if (1 + instrument.quote * instrument.maturity <= EPSILON) {
      throw new Error(`${label}: 1 + rate × accrual must be positive.`);
    }
  }

  if (instrument.type === 'fra' || instrument.type === 'future') {
    if (instrument.start < 0 || instrument.start >= instrument.maturity - TIME_TOLERANCE) {
      throw new Error(`${label}: start must satisfy 0 <= start < maturity.`);
    }
    if (instrument.start > previousMaturity + TIME_TOLERANCE) {
      throw new Error(`${label}: start ${instrument.start}Y is not covered by the curve built through ${previousMaturity}Y; extrapolation is forbidden.`);
    }
    const accrual = instrument.maturity - instrument.start;
    if (1 + instrument.quote * accrual <= EPSILON) {
      throw new Error(`${label}: 1 + forward rate × accrual must be positive.`);
    }
  }

  if (instrument.type === 'swap') {
    const periods = instrument.maturity * conventions.fixedLegFrequency;
    if (!isClose(periods, Math.round(periods))) {
      throw new Error(`${label}: maturity creates an implicit stub at ${conventions.fixedLegFrequency} payments/year; provide a regular maturity.`);
    }
  }
};

export const validateCurveInstruments = (rawInstruments, conventionInput = {}) => {
  const conventions = normalizeConventions(conventionInput);
  if (!Array.isArray(rawInstruments) || rawInstruments.length < 2) {
    throw new Error('Curve construction requires at least two instruments.');
  }
  if (rawInstruments.length > MAX_CURVE_INSTRUMENTS) {
    throw new Error(`Curve construction accepts at most ${MAX_CURVE_INSTRUMENTS} instruments.`);
  }
  const instruments = rawInstruments.map(normalizeInstrument);
  let previousMaturity = 0;
  instruments.forEach((instrument, index) => {
    validateNormalizedInstrument(instrument, index, conventions, previousMaturity);
    previousMaturity = instrument.maturity;
  });
  return { instruments, conventions };
};

export const buildRegularSwapSchedule = (maturity, fixedLegFrequency = 1) => {
  if (!Number.isFinite(maturity) || maturity <= 0) throw new Error('Swap maturity must be positive and finite.');
  if (!SUPPORTED_FREQUENCIES.has(fixedLegFrequency)) throw new Error('Fixed-leg frequency must be 1, 2 or 4.');
  const exactPeriods = maturity * fixedLegFrequency;
  if (!isClose(exactPeriods, Math.round(exactPeriods))) {
    throw new Error('Swap maturity would require an implicit stub, which is not supported.');
  }
  const periodCount = Math.round(exactPeriods);
  const accrual = 1 / fixedLegFrequency;
  return Array.from({ length: periodCount }, (_, index) => ({
    time: roundTime((index + 1) * accrual),
    accrual,
  }));
};

export const interpolateLogDiscountFactor = (time, rawAnchors) => {
  if (!Number.isFinite(time) || time < 0) throw new Error('Discount-factor time must be finite and >= 0.');
  if (!Array.isArray(rawAnchors) || rawAnchors.length < 1) throw new Error('At least the t=0 curve anchor is required.');
  const anchors = rawAnchors;
  const first = anchors[0];
  const last = anchors[anchors.length - 1];
  if (!isClose(first.time, 0) || !isClose(first.discountFactor, 1)) {
    throw new Error('Curve anchors must start at t=0 with DF=1.');
  }
  for (let index = 0; index < anchors.length; index += 1) {
    const anchor = anchors[index];
    if (![anchor.time, anchor.discountFactor].every(Number.isFinite) || anchor.discountFactor <= 0) {
      throw new Error('Curve anchors must have finite times and strictly positive discount factors.');
    }
    if (index > 0 && anchor.time <= anchors[index - 1].time + TIME_TOLERANCE) {
      throw new Error('Curve anchor times must be strictly increasing.');
    }
  }
  if (time > last.time + TIME_TOLERANCE) {
    throw new Error(`Discount factor at ${time}Y requires extrapolation beyond ${last.time}Y, which is forbidden.`);
  }
  const exact = anchors.find((anchor) => isClose(anchor.time, time));
  if (exact) return exact.discountFactor;
  for (let index = 1; index < anchors.length; index += 1) {
    const left = anchors[index - 1];
    const right = anchors[index];
    if (time > left.time && time < right.time) {
      const weight = (time - left.time) / (right.time - left.time);
      return Math.exp((1 - weight) * Math.log(left.discountFactor) + weight * Math.log(right.discountFactor));
    }
  }
  throw new Error(`Discount factor at ${time}Y is outside the supported interpolation domain.`);
};

const swapPvResidual = (quote, schedule, anchors) => {
  let annuity = 0;
  for (const payment of schedule) {
    annuity += payment.accrual * interpolateLogDiscountFactor(payment.time, anchors);
  }
  const terminalDiscount = interpolateLogDiscountFactor(schedule[schedule.length - 1].time, anchors);
  return quote * annuity - (1 - terminalDiscount);
};

const solveSparseSwapDiscountFactor = (instrument, anchors, conventions) => {
  const schedule = buildRegularSwapSchedule(instrument.maturity, conventions.fixedLegFrequency);
  const lastAnchor = anchors[anchors.length - 1];
  const residualAtLogDiscount = (logDiscount) => {
    const candidate = Math.exp(logDiscount);
    const candidateAnchors = [...anchors, {
      time: instrument.maturity,
      discountFactor: candidate,
      instrumentId: instrument.id,
    }];
    return swapPvResidual(instrument.quote, schedule, candidateAnchors);
  };

  const lowerLogDiscount = -30;
  const upperLogDiscount = Math.log(100);
  const scanSteps = 512;
  const brackets = [];
  let previousLog = lowerLogDiscount;
  let previousResidual = residualAtLogDiscount(previousLog);
  if (!Number.isFinite(previousResidual)) throw new Error(`${instrument.id}: swap root residual is not finite.`);
  for (let step = 1; step <= scanSteps; step += 1) {
    const currentLog = lowerLogDiscount + (upperLogDiscount - lowerLogDiscount) * step / scanSteps;
    const currentResidual = residualAtLogDiscount(currentLog);
    if (!Number.isFinite(currentResidual)) throw new Error(`${instrument.id}: swap root residual is not finite.`);
    if (Math.abs(previousResidual) <= 1e-15) {
      brackets.push([previousLog, previousLog]);
    } else if (Math.abs(currentResidual) <= 1e-15) {
      brackets.push([currentLog, currentLog]);
    } else if (Math.sign(previousResidual) !== Math.sign(currentResidual)) {
      brackets.push([previousLog, currentLog]);
    }
    previousLog = currentLog;
    previousResidual = currentResidual;
  }

  const uniqueBrackets = brackets.filter((bracket, index) => (
    index === 0 || !isClose(bracket[0], brackets[index - 1][0], 1e-9)
  ));
  if (uniqueBrackets.length !== 1) {
    throw new Error(`${instrument.id}: swap discount-factor root is ${uniqueBrackets.length ? 'not unique' : 'not bracketed'} in the supported positive domain.`);
  }

  let [low, high] = uniqueBrackets[0];
  let iterations = 0;
  if (!isClose(low, high, 1e-15)) {
    let lowResidual = residualAtLogDiscount(low);
    for (iterations = 0; iterations < 200; iterations += 1) {
      const mid = 0.5 * (low + high);
      const midResidual = residualAtLogDiscount(mid);
      if (Math.abs(midResidual) <= 1e-15 || Math.abs(high - low) <= 1e-14) {
        low = mid;
        high = mid;
        break;
      }
      if (Math.sign(lowResidual) === Math.sign(midResidual)) {
        low = mid;
        lowResidual = midResidual;
      } else {
        high = mid;
      }
    }
  }
  const logDiscountFactor = 0.5 * (low + high);
  const discountFactor = Math.exp(logDiscountFactor);
  if (!Number.isFinite(discountFactor) || discountFactor <= 0) {
    throw new Error(`${instrument.id}: solved discount factor is not finite and positive.`);
  }
  const solvedAnchors = [...anchors, {
    time: instrument.maturity,
    discountFactor,
    instrumentId: instrument.id,
  }];
  const residual = swapPvResidual(instrument.quote, schedule, solvedAnchors);
  if (!Number.isFinite(residual) || Math.abs(residual) > REPRICING_TOLERANCE) {
    throw new Error(`${instrument.id}: swap root did not converge within the repricing tolerance.`);
  }
  const interpolatedCouponCount = schedule.filter((payment) => (
    payment.time > lastAnchor.time + TIME_TOLERANCE && payment.time < instrument.maturity - TIME_TOLERANCE
  )).length;
  return { discountFactor, iterations, interpolatedCouponCount };
};

const repriceInstrument = (instrument, anchors, conventions) => {
  const discountEnd = interpolateLogDiscountFactor(instrument.maturity, anchors);
  let impliedQuote;
  let pvResidual;
  let annuity = null;
  let discountStart = 1;
  if (instrument.type === 'deposit') {
    impliedQuote = (1 / discountEnd - 1) / instrument.maturity;
    pvResidual = discountEnd * (1 + instrument.quote * instrument.maturity) - 1;
  } else if (instrument.type === 'fra' || instrument.type === 'future') {
    discountStart = interpolateLogDiscountFactor(instrument.start, anchors);
    const accrual = instrument.maturity - instrument.start;
    impliedQuote = (discountStart / discountEnd - 1) / accrual;
    pvResidual = discountEnd * (1 + instrument.quote * accrual) - discountStart;
  } else {
    const schedule = buildRegularSwapSchedule(instrument.maturity, conventions.fixedLegFrequency);
    annuity = schedule.reduce((total, payment) => (
      total + payment.accrual * interpolateLogDiscountFactor(payment.time, anchors)
    ), 0);
    impliedQuote = (1 - discountEnd) / annuity;
    pvResidual = instrument.quote * annuity - (1 - discountEnd);
  }
  const quoteResidual = impliedQuote - instrument.quote;
  const output = {
    instrumentId: instrument.id,
    type: instrument.type,
    start: instrument.start,
    maturity: instrument.maturity,
    marketQuote: instrument.quote,
    impliedQuote,
    quoteResidual,
    pvResidual,
    discountStart,
    discountEnd,
    annuity,
  };
  if (instrument.type === 'future') {
    const impliedFuturePrice = 100 - 100 * (impliedQuote + instrument.convexityAdjustment);
    return {
      ...output,
      marketFuturePrice: instrument.futurePrice,
      futuresRate: instrument.futuresRate,
      convexityAdjustment: instrument.convexityAdjustment,
      fraEquivalentRate: instrument.quote,
      impliedFuturePrice,
      futurePriceResidual: impliedFuturePrice - instrument.futurePrice,
    };
  }
  return output;
};

const uniqueSortedTimes = (values) => {
  const sorted = [...values].map(roundTime).sort((left, right) => left - right);
  return sorted.filter((value, index) => index === 0 || !isClose(value, sorted[index - 1]));
};

const buildCurveNodes = (instruments, anchors, conventions) => {
  const times = new Set(anchors.slice(1).map((anchor) => roundTime(anchor.time)));
  for (const instrument of instruments) {
    if (instrument.type === 'fra' || instrument.type === 'future') times.add(roundTime(instrument.start));
    if (instrument.type === 'swap') {
      buildRegularSwapSchedule(instrument.maturity, conventions.fixedLegFrequency)
        .forEach((payment) => times.add(roundTime(payment.time)));
    }
  }
  const anchorByTime = new Map(anchors.slice(1).map((anchor) => [roundTime(anchor.time), anchor]));
  let previousTime = 0;
  let previousDiscount = 1;
  return uniqueSortedTimes(times).filter((time) => time > TIME_TOLERANCE).map((time) => {
    const discountFactor = interpolateLogDiscountFactor(time, anchors);
    const intervalYears = time - previousTime;
    const continuousForward = Math.log(previousDiscount / discountFactor) / intervalYears;
    const simpleForward = (previousDiscount / discountFactor - 1) / intervalYears;
    const annualCompoundedForward = Math.pow(previousDiscount / discountFactor, 1 / intervalYears) - 1;
    const anchor = anchorByTime.get(roundTime(time));
    const node = {
      time,
      intervalStart: previousTime,
      intervalEnd: time,
      intervalYears,
      intervalLabel: `${previousTime}Y→${time}Y`,
      source: anchor ? 'market-pillar' : 'interpolated-cashflow',
      instrumentId: anchor?.instrumentId ?? null,
      discountFactor,
      zeroContinuous: -Math.log(discountFactor) / time,
      zeroAnnual: Math.pow(discountFactor, -1 / time) - 1,
      forwardContinuous: continuousForward,
      forwardSimple: simpleForward,
      forwardAnnualCompounded: annualCompoundedForward,
    };
    previousTime = time;
    previousDiscount = discountFactor;
    return node;
  });
};

export const buildYieldCurve = (rawInstruments, conventionInput = {}) => {
  const { instruments, conventions } = validateCurveInstruments(rawInstruments, conventionInput);
  const anchors = [{ time: 0, discountFactor: 1, instrumentId: 'origin' }];
  let totalRootIterations = 0;
  let interpolatedCouponCount = 0;

  for (const instrument of instruments) {
    let discountFactor;
    if (instrument.type === 'deposit') {
      discountFactor = 1 / (1 + instrument.quote * instrument.maturity);
    } else if (instrument.type === 'fra' || instrument.type === 'future') {
      const startDiscount = interpolateLogDiscountFactor(instrument.start, anchors);
      const accrual = instrument.maturity - instrument.start;
      discountFactor = startDiscount / (1 + instrument.quote * accrual);
    } else {
      const solved = solveSparseSwapDiscountFactor(instrument, anchors, conventions);
      discountFactor = solved.discountFactor;
      totalRootIterations += solved.iterations;
      interpolatedCouponCount += solved.interpolatedCouponCount;
    }
    if (!Number.isFinite(discountFactor) || discountFactor <= 0) {
      throw new Error(`${instrument.id}: bootstrapped discount factor must be finite and > 0.`);
    }
    anchors.push({
      time: instrument.maturity,
      discountFactor,
      instrumentId: instrument.id,
    });
  }

  const repricing = instruments.map((instrument) => repriceInstrument(instrument, anchors, conventions));
  const maxAbsPvResidual = Math.max(...repricing.map((item) => Math.abs(item.pvResidual)));
  const maxAbsQuoteResidual = Math.max(...repricing.map((item) => Math.abs(item.quoteResidual)));
  if (maxAbsPvResidual > REPRICING_TOLERANCE || maxAbsQuoteResidual > REPRICING_TOLERANCE) {
    throw new Error(`Curve repricing failed: max PV residual=${maxAbsPvResidual}, max quote residual=${maxAbsQuoteResidual}.`);
  }

  const curve = buildCurveNodes(instruments, anchors, conventions);
  const negativeForwardIntervals = curve
    .filter((node) => node.forwardContinuous < -1e-12)
    .map((node) => node.intervalLabel);
  const risingDiscountFactorIntervals = curve
    .filter((node, index) => node.discountFactor > (index === 0 ? 1 : curve[index - 1].discountFactor) + 1e-12)
    .map((node) => node.intervalLabel);
  const largeForwardIntervals = curve
    .filter((node) => Math.abs(node.forwardContinuous) > 0.5)
    .map((node) => node.intervalLabel);
  const zeroConvexityFutures = instruments
    .filter((instrument) => instrument.type === 'future' && instrument.convexityAdjustment === 0)
    .map((instrument) => instrument.id);
  const warnings = [];
  if (interpolatedCouponCount > 0) warnings.push(`${interpolatedCouponCount} swap coupon nodes were constructed by declared log-DF interpolation.`);
  if (negativeForwardIntervals.length) warnings.push(`Negative forward rates observed on ${negativeForwardIntervals.join(', ')}; allowed, but review the curve shape.`);
  if (risingDiscountFactorIntervals.length) warnings.push(`Discount factors rise on ${risingDiscountFactorIntervals.join(', ')}; consistent with negative forwards, not an automatic arbitrage failure.`);
  if (largeForwardIntervals.length) warnings.push(`Absolute continuous forwards exceed 50% on ${largeForwardIntervals.join(', ')}; check quote units and input quality.`);
  if (zeroConvexityFutures.length) warnings.push(`Explicit 0 bp futures convexity assumption used for ${zeroConvexityFutures.join(', ')}.`);

  return {
    schema: YIELD_CURVE_RESULT_SCHEMA,
    engineVersion: YIELD_CURVE_VERSION,
    conventions,
    limitations: [...YIELD_CURVE_LIMITATIONS],
    inputs: instruments,
    anchors: anchors.slice(1),
    curve,
    repricing,
    diagnostics: {
      converged: true,
      positiveDiscountFactors: anchors.every((anchor) => Number.isFinite(anchor.discountFactor) && anchor.discountFactor > 0),
      instrumentCount: instruments.length,
      marketPillarCount: anchors.length - 1,
      curveNodeCount: curve.length,
      interpolatedCouponCount,
      totalRootIterations,
      maxAbsPvResidual,
      maxAbsQuoteResidual,
      negativeForwardIntervals,
      risingDiscountFactorIntervals,
      largeForwardIntervals,
      warnings,
    },
  };
};

const splitCsvLine = (line, delimiter) => {
  const values = [];
  let current = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === delimiter && !quoted) {
      values.push(current.trim());
      current = '';
    } else {
      current += character;
    }
  }
  if (quoted) throw new Error('CSV contains an unterminated quoted field.');
  values.push(current.trim());
  return values;
};

const normalizeHeader = (value) => value.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
const CSV_HEADERS = Object.freeze([
  'instrument',
  'startyears',
  'maturityyears',
  'quotepercent',
  'futureprice',
  'convexityadjustmentbp',
]);

const parseCsvNumber = (value, rowNumber, field, delimiter, required) => {
  if (value === undefined || value.trim() === '') {
    if (required) throw new Error(`CSV row ${rowNumber}: '${field}' is required.`);
    return null;
  }
  const normalized = delimiter === ';' ? value.replace(',', '.') : value;
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) throw new Error(`CSV row ${rowNumber}: '${field}' must be a finite number.`);
  return parsed;
};

export const parseYieldCurveCsv = (text, conventionInput = {}) => {
  if (typeof text !== 'string' || !text.trim()) throw new Error('CSV file is empty.');
  if (text.length > MAX_CURVE_CSV_CHARACTERS) {
    throw new Error(`CSV exceeds the ${MAX_CURVE_CSV_CHARACTERS}-character safety limit.`);
  }
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/)
    .filter((line) => line.trim() && !line.trim().startsWith('#'));
  if (lines.length < 3) throw new Error('CSV must contain a header and at least two data rows.');
  const delimiter = [',', ';', '\t']
    .map((candidate) => ({ candidate, count: splitCsvLine(lines[0], candidate).length }))
    .sort((left, right) => right.count - left.count)[0].candidate;
  const rawHeaders = splitCsvLine(lines[0], delimiter);
  const headers = rawHeaders.map(normalizeHeader);
  if (new Set(headers).size !== headers.length) throw new Error('CSV contains duplicate or ambiguous columns.');
  const unknown = headers.filter((header) => !CSV_HEADERS.includes(header));
  const missing = CSV_HEADERS.filter((header) => !headers.includes(header));
  if (unknown.length) throw new Error(`CSV contains unknown column(s): ${unknown.join(', ')}.`);
  if (missing.length) throw new Error(`CSV is missing required explicit column(s): ${missing.join(', ')}.`);
  const indexOf = (header) => headers.indexOf(header);
  const instruments = [];
  for (let rowIndex = 1; rowIndex < lines.length; rowIndex += 1) {
    const rowNumber = rowIndex + 1;
    const values = splitCsvLine(lines[rowIndex], delimiter);
    if (values.length !== headers.length) throw new Error(`CSV row ${rowNumber} has ${values.length} fields; expected ${headers.length}.`);
    const type = values[indexOf('instrument')].trim().toLowerCase();
    if (!SUPPORTED_TYPES.has(type)) throw new Error(`CSV row ${rowNumber}: unsupported instrument '${type || 'empty'}'.`);
    const start = parseCsvNumber(values[indexOf('startyears')], rowNumber, 'startYears', delimiter, type === 'fra' || type === 'future');
    const maturity = parseCsvNumber(values[indexOf('maturityyears')], rowNumber, 'maturityYears', delimiter, true);
    const quotePercent = parseCsvNumber(values[indexOf('quotepercent')], rowNumber, 'quotePercent', delimiter, type !== 'future');
    const futurePrice = parseCsvNumber(values[indexOf('futureprice')], rowNumber, 'futurePrice', delimiter, type === 'future');
    const convexityBp = parseCsvNumber(values[indexOf('convexityadjustmentbp')], rowNumber, 'convexityAdjustmentBp', delimiter, type === 'future');
    if (type === 'future' && quotePercent !== null) throw new Error(`CSV row ${rowNumber}: future quotePercent must be blank; use futurePrice.`);
    if (type !== 'future' && (futurePrice !== null || convexityBp !== null)) {
      throw new Error(`CSV row ${rowNumber}: futurePrice and convexityAdjustmentBp must be blank for ${type}.`);
    }
    if ((type === 'deposit' || type === 'swap') && start !== null && Math.abs(start) > TIME_TOLERANCE) {
      throw new Error(`CSV row ${rowNumber}: ${type} is spot-starting; startYears must be blank or 0.`);
    }
    instruments.push(type === 'future' ? {
      type,
      start,
      maturity,
      futurePrice,
      convexityAdjustment: convexityBp / 10_000,
    } : {
      type,
      start: start ?? 0,
      maturity,
      quote: quotePercent / 100,
    });
  }
  validateCurveInstruments(instruments, conventionInput);
  return instruments;
};

export const createYieldCurveExport = (result, dataSource) => {
  if (!result || result.schema !== YIELD_CURVE_RESULT_SCHEMA) {
    throw new Error('A valid yield-curve result is required for export.');
  }
  if (typeof dataSource !== 'string' || !dataSource.trim()) {
    throw new Error('Yield-curve export requires a non-empty data source label.');
  }
  return {
    schema: YIELD_CURVE_EXPORT_SCHEMA,
    engineVersion: result.engineVersion,
    dataSource: dataSource.trim(),
    conventions: result.conventions,
    limitations: result.limitations,
    inputs: result.inputs,
    anchors: result.anchors,
    curve: result.curve,
    repricing: result.repricing,
    diagnostics: result.diagnostics,
  };
};
