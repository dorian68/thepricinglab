/**
 * Canonical fixed-rate bullet bond analytics for F-CAL-8.
 *
 * Prices are quoted per 100 nominal. Coupon dates are regular, unadjusted and
 * generated backwards from maturity. This module deliberately does not imply
 * support for calendars, stubs, optionality, curves, spreads or credit risk.
 */

export const BOND_INPUT_SCHEMA = 'tpl.bond.input.v1';
export const BOND_SCHEMA_VERSION = 'tpl.bond.analysis.v1';
export const BOND_ENGINE_VERSION = '1.0.0';
export const BOND_CASHFLOWS_CSV_SCHEMA = 'tpl.bond.cashflows.v1';
export const BOND_SCENARIOS_CSV_SCHEMA = 'tpl.bond.scenarios.v1';

export const BOND_CONTRACT = Object.freeze({
  schemaVersion: 'tpl.bond.contract.v1', inputSchemaVersion: BOND_INPUT_SCHEMA,
  analysisSchemaVersion: BOND_SCHEMA_VERSION, engineVersion: BOND_ENGINE_VERSION,
  instrument: 'fixed_rate_bullet_bond', quoteModes: Object.freeze(['yield', 'clean_price']),
  dayCounts: Object.freeze(['ACT/ACT ICMA', '30E/360']), couponFrequencies: Object.freeze([1, 2, 4, 12]),
  positions: Object.freeze(['long', 'short']),
  limits: Object.freeze({ maxInputBytes: 1_000_000, minCouponRate: 0, maxCouponRate: 1, minYield: -0.95, maxYield: 5, minCleanPrice: 1e-8, maxCleanPrice: 1_000_000, minNotional: 1e-8, maxNotional: 1_000_000_000_000, maxMaturityYears: 100, minShockBp: -5_000, maxShockBp: 5_000, maxCashflows: 1_200, maxRootIterations: 256 }),
  numeric: Object.freeze({ rootPriceTolerance: 1e-11, rootYieldTolerance: 1e-14, exportSignificantDigits: 9, hashSignificantDigits: 17 }),
  conventions: Object.freeze({
    priceBasis: 'per 100 nominal', couponRate: 'annual nominal decimal',
    yield: 'annual nominal decimal compounded at coupon frequency',
    settlement: 'cash flows strictly after settlement are included',
    schedule: 'unadjusted regular schedule generated backwards from maturity with end-of-month preservation',
    accruedInterest: 'coupon per period multiplied by elapsed regular-period fraction',
    dirtyPrice: 'present value of contractual cash flows per 100 nominal',
    cleanPrice: 'dirty price minus accrued interest per 100 nominal',
    dv01: 'positive central price sensitivity: (P(y-1bp)-P(y+1bp))/2',
    positionRisk: 'long=+1, short=-1; monetary values scale by notional/100',
    shock: 'parallel yield shock in basis points with exact repricing and duration-convexity approximation',
  }),
  limitations: Object.freeze([
    'Educational fixed-rate bullet bonds only; no calls, puts, sinking funds, amortisation, floating coupons or inflation linkage.',
    'Coupon schedules are regular and unadjusted; holiday calendars, settlement lags, business-day conventions and irregular stubs are outside v1.',
    'A single yield-to-maturity discounts every cash flow; this is not a curve, z-spread, OAS or credit valuation model.',
    'Taxes, fees, default, recovery and liquidity are not modeled.',
  ]),
  exports: Object.freeze({
    cashflowsCsvSchema: BOND_CASHFLOWS_CSV_SCHEMA, scenariosCsvSchema: BOND_SCENARIOS_CSV_SCHEMA,
    cashflowsCsvHeaders: Object.freeze(['schemaVersion', 'engineVersion', 'analysisId', 'paymentDate', 'periodIndex', 'exponentPeriods', 'timeYears', 'couponPer100', 'principalPer100', 'totalCashflowPer100', 'discountFactor', 'presentValuePer100', 'cashflowDv01Per100', 'positionDv01']),
    scenariosCsvHeaders: Object.freeze(['schemaVersion', 'engineVersion', 'analysisId', 'shockBp', 'yield', 'dirtyPricePer100', 'cleanPricePer100', 'exactChangePer100', 'durationApproxChangePer100', 'durationConvexityApproxChangePer100', 'approximationErrorPer100']),
    lineEnding: 'LF', finalNewline: true, numericFormat: 'finite_significant_9',
  }),
});

const LIMITS = BOND_CONTRACT.limits;
const INPUT_KEYS = ['schemaVersion', 'settlementDate', 'maturityDate', 'dayCount', 'couponRate', 'couponFrequency', 'quoteMode', 'yieldToMaturity', 'cleanPrice', 'currency', 'notional', 'position', 'shockBp'];
const MS_PER_DAY = 86_400_000;

const plainObject = (value, label) => {
  if (value === null || typeof value !== 'object' || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) throw new Error(`${label} must be a plain object.`);
};
const exactKeys = (value, allowed, label) => {
  const allowedSet = new Set(allowed); const missing = allowed.filter((key) => !Object.hasOwn(value, key)).sort();
  const unknown = Object.keys(value).filter((key) => !allowedSet.has(key)).sort();
  if (missing.length || unknown.length) throw new Error(`${label} schema is invalid; missing=${missing.join('|') || 'none'}; unknown=${unknown.join('|') || 'none'}.`);
};
const number = (value, label, min, max) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`${label} must be a finite number.`);
  if (value < min || value > max) throw new Error(`${label} is outside the supported domain.`);
  return Object.is(value, -0) ? 0 : value;
};
const integer = (value, label, values) => {
  if (!Number.isSafeInteger(value) || !values.includes(value)) throw new Error(`${label} must be one of ${values.join(', ')}.`);
  return value;
};
const oneOf = (value, values, label) => {
  if (!values.includes(value)) throw new Error(`${label} is unsupported.`);
  return value;
};
const daysInMonth = (year, month) => new Date(Date.UTC(year, month, 0)).getUTCDate();
const formatDate = ({ year, month, day }) => `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
const parseDate = (value, label) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error(`${label} must use strict YYYY-MM-DD format.`);
  const [year, month, day] = value.split('-').map(Number);
  if (year < 1900 || year > 2300 || month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) throw new Error(`${label} is not a valid supported Gregorian date.`);
  return { year, month, day, serial: Date.UTC(year, month - 1, day) / MS_PER_DAY, text: value };
};
const anchoredDate = (maturity, monthsBack) => {
  const zeroMonth = maturity.month - 1 - monthsBack; const year = maturity.year + Math.floor(zeroMonth / 12);
  const monthIndex = ((zeroMonth % 12) + 12) % 12; const month = monthIndex + 1; const last = daysInMonth(year, month);
  const maturityIsEndOfMonth = maturity.day === daysInMonth(maturity.year, maturity.month);
  const day = maturityIsEndOfMonth ? last : Math.min(maturity.day, last);
  return { year, month, day, serial: Date.UTC(year, monthIndex, day) / MS_PER_DAY, text: formatDate({ year, month, day }) };
};
const yearFraction30E360 = (start, end) => ((end.year - start.year) * 360 + (end.month - start.month) * 30 + (Math.min(end.day, 30) - Math.min(start.day, 30))) / 360;

export const normalizeBondInput = (raw) => {
  plainObject(raw, 'Bond input'); exactKeys(raw, INPUT_KEYS, 'Bond input');
  if (raw.schemaVersion !== BOND_INPUT_SCHEMA) throw new Error(`schemaVersion must be '${BOND_INPUT_SCHEMA}'.`);
  const settlement = parseDate(raw.settlementDate, 'settlementDate'); const maturity = parseDate(raw.maturityDate, 'maturityDate');
  if (settlement.serial >= maturity.serial) throw new Error('settlementDate must be strictly before maturityDate.');
  if ((maturity.serial - settlement.serial) / 365.25 > LIMITS.maxMaturityYears) throw new Error(`Remaining maturity cannot exceed ${LIMITS.maxMaturityYears} years.`);
  const quoteMode = oneOf(raw.quoteMode, BOND_CONTRACT.quoteModes, 'quoteMode');
  if (quoteMode === 'yield' && raw.cleanPrice !== null) throw new Error('cleanPrice must be null when quoteMode is yield.');
  if (quoteMode === 'clean_price' && raw.yieldToMaturity !== null) throw new Error('yieldToMaturity must be null when quoteMode is clean_price.');
  const input = {
    schemaVersion: BOND_INPUT_SCHEMA, settlementDate: settlement.text, maturityDate: maturity.text,
    dayCount: oneOf(raw.dayCount, BOND_CONTRACT.dayCounts, 'dayCount'),
    couponRate: number(raw.couponRate, 'couponRate', LIMITS.minCouponRate, LIMITS.maxCouponRate),
    couponFrequency: integer(raw.couponFrequency, 'couponFrequency', BOND_CONTRACT.couponFrequencies), quoteMode,
    yieldToMaturity: quoteMode === 'yield' ? number(raw.yieldToMaturity, 'yieldToMaturity', LIMITS.minYield, LIMITS.maxYield) : null,
    cleanPrice: quoteMode === 'clean_price' ? number(raw.cleanPrice, 'cleanPrice', LIMITS.minCleanPrice, LIMITS.maxCleanPrice) : null,
    currency: raw.currency, notional: number(raw.notional, 'notional', LIMITS.minNotional, LIMITS.maxNotional),
    position: oneOf(raw.position, BOND_CONTRACT.positions, 'position'),
    shockBp: number(raw.shockBp, 'shockBp', LIMITS.minShockBp, LIMITS.maxShockBp),
  };
  if (typeof input.currency !== 'string' || !/^[A-Z]{3}$/.test(input.currency)) throw new Error('currency must be an uppercase three-letter code.');
  return input;
};

export const buildBondSchedule = (input) => {
  const settlement = parseDate(input.settlementDate, 'settlementDate'); const maturity = parseDate(input.maturityDate, 'maturityDate');
  const monthsPerPeriod = 12 / input.couponFrequency; const descending = []; let index = 0;
  while (true) {
    const date = anchoredDate(maturity, index * monthsPerPeriod);
    if (date.serial <= settlement.serial) {
      const previous = date; const future = descending.slice().reverse();
      if (!future.length) throw new Error('Bond schedule has no cash flow after settlement.');
      const next = parseDate(future[0], 'nextCouponDate');
      let elapsedFraction;
      if (input.dayCount === 'ACT/ACT ICMA') elapsedFraction = (settlement.serial - previous.serial) / (next.serial - previous.serial);
      else {
        const fullPeriod = yearFraction30E360(previous, next);
        if (fullPeriod <= 0) throw new Error('Generated 30E/360 coupon period must have a positive year fraction.');
        elapsedFraction = yearFraction30E360(previous, settlement) / fullPeriod;
      }
      if (!Number.isFinite(elapsedFraction) || elapsedFraction < -1e-12 || elapsedFraction >= 1 + 1e-12) throw new Error('Settlement does not fall inside the generated regular coupon period.');
      elapsedFraction = Math.max(0, Math.min(1, elapsedFraction));
      return { previousCouponDate: previous.text, nextCouponDate: next.text, paymentDates: future, accruedPeriodFraction: elapsedFraction, remainingCouponFraction: 1 - elapsedFraction };
    }
    descending.push(date.text); index += 1;
    if (index > LIMITS.maxCashflows) throw new Error(`Bond schedule exceeds ${LIMITS.maxCashflows} cash flows.`);
  }
};

const priceAtYield = (schedule, input, annualYield, includeCashflows = false) => {
  if (!Number.isFinite(annualYield) || annualYield < LIMITS.minYield || annualYield > LIMITS.maxYield) throw new Error('Yield is outside the supported repricing domain.');
  const periodicBase = 1 + annualYield / input.couponFrequency;
  if (periodicBase <= 0) throw new Error('Yield and coupon frequency create a non-positive discounting base.');
  const coupon = 100 * input.couponRate / input.couponFrequency; const rows = []; let dirty = 0;
  schedule.paymentDates.forEach((paymentDate, position) => {
    const exponentPeriods = schedule.remainingCouponFraction + position; const discountFactor = periodicBase ** (-exponentPeriods);
    const principalPer100 = position === schedule.paymentDates.length - 1 ? 100 : 0; const totalCashflowPer100 = coupon + principalPer100;
    const presentValuePer100 = totalCashflowPer100 * discountFactor; dirty += presentValuePer100;
    if (includeCashflows) rows.push({ paymentDate, periodIndex: position + 1, exponentPeriods, timeYears: exponentPeriods / input.couponFrequency, couponPer100: coupon, principalPer100, totalCashflowPer100, discountFactor, presentValuePer100 });
  });
  if (!Number.isFinite(dirty) || dirty <= 0) throw new Error('Bond repricing produced an unsupported non-finite or non-positive value.');
  return { dirtyPricePer100: dirty, cashflows: rows };
};

const solveYield = (schedule, input, targetDirty) => {
  let low = LIMITS.minYield; let high = LIMITS.maxYield;
  let lowResidual = priceAtYield(schedule, input, low).dirtyPricePer100 - targetDirty;
  let highResidual = priceAtYield(schedule, input, high).dirtyPricePer100 - targetDirty;
  if (lowResidual < 0 || highResidual > 0) throw new Error(`cleanPrice has no yield solution inside [${LIMITS.minYield}, ${LIMITS.maxYield}].`);
  let mid = 0; let residual = 0; let iterations = 0;
  for (; iterations < LIMITS.maxRootIterations; iterations += 1) {
    mid = (low + high) / 2; residual = priceAtYield(schedule, input, mid).dirtyPricePer100 - targetDirty;
    if (Math.abs(residual) <= BOND_CONTRACT.numeric.rootPriceTolerance || high - low <= BOND_CONTRACT.numeric.rootYieldTolerance) break;
    if (residual > 0) { low = mid; lowResidual = residual; } else { high = mid; highResidual = residual; }
  }
  void lowResidual; void highResidual;
  return { yieldToMaturity: mid, iterations: iterations + 1, residualPer100: residual };
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
  const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
};
const finiteTree = (value, path = 'result') => {
  if (typeof value === 'number' && !Number.isFinite(value)) throw new Error(`${path} contains a non-finite number.`);
  if (Array.isArray(value)) value.forEach((item, index) => finiteTree(item, `${path}[${index}]`));
  else if (value && typeof value === 'object') Object.entries(value).forEach(([key, item]) => finiteTree(item, `${path}.${key}`));
};

export const analyzeBond = async (raw) => {
  const input = normalizeBondInput(raw); const schedule = buildBondSchedule(input);
  const couponPerPeriod = 100 * input.couponRate / input.couponFrequency;
  const accruedInterestPer100 = couponPerPeriod * schedule.accruedPeriodFraction;
  let yieldToMaturity; let solver = null;
  if (input.quoteMode === 'yield') yieldToMaturity = input.yieldToMaturity;
  else {
    solver = solveYield(schedule, input, input.cleanPrice + accruedInterestPer100);
    yieldToMaturity = solver.yieldToMaturity;
  }
  if (yieldToMaturity - 0.0001 < LIMITS.minYield || yieldToMaturity + 0.0001 > LIMITS.maxYield) throw new Error('Resolved yield must allow symmetric +/-1bp DV01 repricing inside the supported domain.');
  const shockedYield = yieldToMaturity + input.shockBp / 10_000;
  if (shockedYield < LIMITS.minYield || shockedYield > LIMITS.maxYield) throw new Error('Selected shock moves yield outside the supported repricing domain.');
  const base = priceAtYield(schedule, input, yieldToMaturity, true); const dirtyPricePer100 = base.dirtyPricePer100;
  const cleanPricePer100 = dirtyPricePer100 - accruedInterestPer100;
  const weightedTime = base.cashflows.reduce((sum, row) => sum + row.timeYears * row.presentValuePer100, 0);
  const macaulayDurationYears = weightedTime / dirtyPricePer100;
  const modifiedDuration = macaulayDurationYears / (1 + yieldToMaturity / input.couponFrequency);
  const convexity = base.cashflows.reduce((sum, row) => sum + row.presentValuePer100 * row.exponentPeriods * (row.exponentPeriods + 1) / (input.couponFrequency ** 2 * (1 + yieldToMaturity / input.couponFrequency) ** 2), 0) / dirtyPricePer100;
  const down1bp = priceAtYield(schedule, input, yieldToMaturity - 0.0001).dirtyPricePer100;
  const up1bp = priceAtYield(schedule, input, yieldToMaturity + 0.0001).dirtyPricePer100;
  const dv01Per100 = (down1bp - up1bp) / 2; const sign = input.position === 'long' ? 1 : -1; const moneyScale = sign * input.notional / 100;
  const cashflows = base.cashflows.map((row) => {
    const downDiscount = (1 + (yieldToMaturity - 0.0001) / input.couponFrequency) ** (-row.exponentPeriods);
    const upDiscount = (1 + (yieldToMaturity + 0.0001) / input.couponFrequency) ** (-row.exponentPeriods);
    const cashflowDv01Per100 = row.totalCashflowPer100 * (downDiscount - upDiscount) / 2;
    return { ...row, cashflowDv01Per100, positionDv01: cashflowDv01Per100 * moneyScale };
  });
  const cashflowDv01ReconciliationError = cashflows.reduce((sum, row) => sum + row.cashflowDv01Per100, 0) - dv01Per100;
  const scenarioShocks = [...new Set([-200, -100, -50, -25, -1, 0, 1, 25, 50, 100, 200, input.shockBp])].sort((a, b) => a - b);
  const scenarios = scenarioShocks.filter((shockBp) => {
    const scenarioYield = yieldToMaturity + shockBp / 10_000; return scenarioYield >= LIMITS.minYield && scenarioYield <= LIMITS.maxYield;
  }).map((shockBp) => {
    const scenarioYield = yieldToMaturity + shockBp / 10_000; const dirty = priceAtYield(schedule, input, scenarioYield).dirtyPricePer100;
    const exactChangePer100 = dirty - dirtyPricePer100; const deltaYield = shockBp / 10_000;
    const durationApproxChangePer100 = -dirtyPricePer100 * modifiedDuration * deltaYield;
    const durationConvexityApproxChangePer100 = dirtyPricePer100 * (-modifiedDuration * deltaYield + 0.5 * convexity * deltaYield ** 2);
    return { shockBp, yield: scenarioYield, dirtyPricePer100: dirty, cleanPricePer100: dirty - accruedInterestPer100, exactChangePer100, durationApproxChangePer100, durationConvexityApproxChangePer100, approximationErrorPer100: durationConvexityApproxChangePer100 - exactChangePer100 };
  });
  const selectedScenario = scenarios.find((row) => row.shockBp === input.shockBp);
  if (!selectedScenario) throw new Error('Selected shock scenario was not produced.');
  const analysisId = await sha256(JSON.stringify(canonicalTree(input)));
  const diagnostics = [
    { code: 'REGULAR_UNADJUSTED_SCHEDULE', severity: 'info', message: 'Coupon dates are contractual unadjusted dates generated backwards from maturity; no holiday calendar or stub is inferred.' },
    { code: input.quoteMode === 'clean_price' ? 'YIELD_SOLVED_FROM_CLEAN_PRICE' : 'PRICE_FROM_YIELD', severity: 'info', message: input.quoteMode === 'clean_price' ? 'Yield-to-maturity was solved deterministically from clean price plus accrued interest.' : 'Clean and dirty prices were discounted from the supplied nominal yield.' },
  ];
  if (yieldToMaturity < 0) diagnostics.push({ code: 'NEGATIVE_YIELD', severity: 'info', message: 'Negative nominal yield is supported while the periodic discounting base remains positive.' });
  const result = {
    schemaVersion: BOND_SCHEMA_VERSION, engineVersion: BOND_ENGINE_VERSION, analysisId, input,
    instrument: { type: 'fixed-rate bullet', priceBasis: 'per 100 nominal', couponRate: input.couponRate, couponFrequency: input.couponFrequency, couponPerPeriodPer100: couponPerPeriod, redemptionPer100: 100, currency: input.currency },
    schedule: { previousCouponDate: schedule.previousCouponDate, nextCouponDate: schedule.nextCouponDate, maturityDate: input.maturityDate, dayCount: input.dayCount, accruedPeriodFraction: schedule.accruedPeriodFraction, remainingCouponFraction: schedule.remainingCouponFraction, cashflowCount: schedule.paymentDates.length },
    quote: { quoteMode: input.quoteMode, yieldToMaturity, cleanPricePer100, dirtyPricePer100, accruedInterestPer100, solver },
    analytics: { macaulayDurationYears, modifiedDuration, convexity, dv01Per100, priceDown1bpPer100: down1bp, priceUp1bpPer100: up1bp, cashflowDv01ReconciliationError, currentYield: cleanPricePer100 > 0 ? input.couponRate * 100 / cleanPricePer100 : null },
    position: { side: input.position, sign, notional: input.notional, cleanMarketValue: cleanPricePer100 * moneyScale, dirtyMarketValue: dirtyPricePer100 * moneyScale, accruedInterest: accruedInterestPer100 * moneyScale, dv01: dv01Per100 * moneyScale },
    selectedScenario: { ...selectedScenario, exactPnl: selectedScenario.exactChangePer100 * moneyScale, durationPnl: selectedScenario.durationApproxChangePer100 * moneyScale, durationConvexityPnl: selectedScenario.durationConvexityApproxChangePer100 * moneyScale },
    scenarios, cashflows, diagnostics, conventions: BOND_CONTRACT.conventions, limitations: BOND_CONTRACT.limitations,
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
export const buildBondCashflowsCsv = (result) => csv(BOND_CONTRACT.exports.cashflowsCsvHeaders, result.cashflows.map((row) => ({ schemaVersion: BOND_CASHFLOWS_CSV_SCHEMA, engineVersion: result.engineVersion, analysisId: result.analysisId, ...row })));
export const buildBondScenariosCsv = (result) => csv(BOND_CONTRACT.exports.scenariosCsvHeaders, result.scenarios.map((row) => ({ schemaVersion: BOND_SCENARIOS_CSV_SCHEMA, engineVersion: result.engineVersion, analysisId: result.analysisId, ...row })));
export const buildBondJson = (result) => `${JSON.stringify(result, null, 2)}\n`;
