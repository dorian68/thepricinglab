/**
 * Deterministic, dependency-free realized-volatility engine.
 *
 * Conventions:
 * - observations must be strictly chronological daily OHLC bars;
 * - all five estimators use the same sessions, rows 1..N-1;
 * - variances and volatilities are decimals, never percentages;
 * - no observation is sorted, dropped, adjusted, winsorized or imputed;
 * - annualization is an explicit integer convention between 1 and 366.
 */

export const REALIZED_VOLATILITY_VERSION = '1.0.0';
export const REALIZED_VOLATILITY_RESULT_SCHEMA = 'tpl.realized-volatility-analysis.v1';
export const REALIZED_VOLATILITY_ROLLING_CSV_SCHEMA = 'tpl.realized-volatility.rolling.v1';
export const REALIZED_VOLATILITY_OBSERVATIONS_CSV_SCHEMA = 'tpl.realized-volatility.observations.v1';
export const MAX_REALIZED_VOLATILITY_ROWS = 50_001;
export const MAX_REALIZED_VOLATILITY_CSV_CHARACTERS = 10 * 1024 * 1024;

export const REALIZED_VOLATILITY_CONTRACT = Object.freeze({
  csv: {
    requiredHeader: ['date', 'open', 'high', 'low', 'close'],
    optionalTrailingHeader: 'volume',
    delimiters: [',', ';'],
    maxUtf8Bytes: MAX_REALIZED_VOLATILITY_CSV_CHARACTERS,
    maxRows: MAX_REALIZED_VOLATILITY_ROWS,
    blankRows: 'reject',
    headerOrder: 'exact',
    dateOrder: 'strictly_increasing',
    dateMinimum: '1900-01-01',
    dateMaximum: '2200-12-31',
    numberFormat: 'finite_dot_decimal_no_thousands_separator',
  },
  config: {
    windowMinimum: 5,
    windowMaximum: 252,
    annualizationMinimum: 1,
    annualizationMaximum: 366,
    calendarModes: ['weekday_sessions', 'calendar_daily'],
    priceBases: ['unadjusted_ohlc', 'split_adjusted_ohlc', 'provider_adjusted_ohlc', 'unknown'],
  },
  diagnostics: {
    largeMoveAbsoluteLogThreshold: Math.log(1.25),
    robustReturnZThreshold: 8,
    flatAndRepeatedFractionThreshold: 0.05,
    estimatorDivergenceRatioThreshold: 1.5,
    overnightDominanceThreshold: 0.5,
  },
  provenance: {
    datasetHash: 'sha256_utf8_canonical_csv',
    canonicalCsvHeaderOrder: ['date', 'open', 'high', 'low', 'close', 'volume'],
    canonicalCsvLineEnding: 'LF',
    canonicalCsvFinalNewline: true,
    canonicalNumericSignificantDigits: 17,
    canonicalNumericFormat: 'normalized_scientific',
    rawUploadHashForbidden: true,
  },
  exportNumericSignificantDigits: 12,
  exportNumericFormat: 'normalized_scientific',
});

export const ESTIMATOR_KEYS = Object.freeze([
  'closeToClose',
  'parkinson',
  'garmanKlass',
  'rogersSatchell',
  'yangZhang',
]);

const ESTIMATOR_LABELS = Object.freeze({
  closeToClose: 'Close-to-close',
  parkinson: 'Parkinson',
  garmanKlass: 'Garman-Klass',
  rogersSatchell: 'Rogers-Satchell',
  yangZhang: 'Yang-Zhang',
});

export const TEACHING_CSV = `date,open,high,low,close
2024-01-02,100.00,101.40,99.35,100.90
2024-01-03,101.05,102.10,100.20,101.55
2024-01-04,101.40,102.00,99.80,100.15
2024-01-05,100.25,101.65,99.90,101.20
2024-01-08,101.45,102.80,100.95,102.35
2024-01-09,102.20,103.10,101.20,101.75
2024-01-10,101.60,102.45,100.70,101.10
2024-01-11,101.35,103.00,101.05,102.70
2024-01-12,102.55,103.25,101.70,102.05
2024-01-15,102.20,103.60,101.85,103.10
2024-01-16,103.00,104.10,102.35,103.75
2024-01-17,103.90,104.45,102.70,103.05
`;

const EPSILON = 1e-15;
const REQUIRED_HEADERS = Object.freeze(['date', 'open', 'high', 'low', 'close']);
const OPTIONAL_HEADERS = Object.freeze(['volume']);
const VALID_ADJUSTMENT_BASIS = new Set(['adjusted', 'unadjusted']);
const STRICT_NUMBER_PATTERN = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;

const assertPlainObject = (value, label) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`);
  }
};

const isLeapYear = (year) => year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);

const daysInMonth = (year, month) => [
  31,
  isLeapYear(year) ? 29 : 28,
  31,
  30,
  31,
  30,
  31,
  31,
  30,
  31,
  30,
  31,
][month - 1];

// Howard Hinnant's civil-date algorithm, shifted to Unix epoch.
const dayOrdinal = (year, month, day) => {
  const adjustedYear = year - (month <= 2 ? 1 : 0);
  const era = Math.floor(adjustedYear / 400);
  const yearOfEra = adjustedYear - era * 400;
  const adjustedMonth = month + (month > 2 ? -3 : 9);
  const dayOfYear = Math.floor((153 * adjustedMonth + 2) / 5) + day - 1;
  const dayOfEra = yearOfEra * 365 + Math.floor(yearOfEra / 4) - Math.floor(yearOfEra / 100) + dayOfYear;
  return era * 146097 + dayOfEra - 719468;
};

const parseIsoDate = (value, rowNumber) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`CSV row ${rowNumber}: 'date' must use YYYY-MM-DD.`);
  }
  const [year, month, day] = value.split('-').map(Number);
  if (year < 1900 || year > 2200 || month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) {
    throw new Error(`CSV row ${rowNumber}: '${value}' is not a valid calendar date.`);
  }
  return { value, ordinal: dayOrdinal(year, month, day) };
};

const splitCsvLine = (line, delimiter) => {
  const fields = [];
  let field = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === delimiter && !quoted) {
      fields.push(field.trim());
      field = '';
    } else {
      field += character;
    }
  }
  if (quoted) throw new Error('CSV contains an unterminated quoted field.');
  fields.push(field.trim());
  return fields;
};

const detectDelimiter = (headerLine) => {
  const candidates = [',', ';'].map((delimiter) => ({
    delimiter,
    fields: splitCsvLine(headerLine, delimiter),
  }));
  const matches = candidates.filter(({ fields }) => fields.length > 1);
  if (matches.length !== 1) {
    throw new Error('CSV delimiter must be unambiguously comma or semicolon.');
  }
  return matches[0].delimiter;
};

const parsePositiveNumber = (value, rowNumber, field) => {
  if (!value) throw new Error(`CSV row ${rowNumber}: '${field}' is required.`);
  if (/^[=+@]/.test(value)) throw new Error(`CSV row ${rowNumber}: '${field}' contains a spreadsheet formula.`);
  if (!STRICT_NUMBER_PATTERN.test(value)) throw new Error(`CSV row ${rowNumber}: '${field}' must use a dot-decimal finite number.`);
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`CSV row ${rowNumber}: '${field}' must be a finite number.`);
  if (parsed <= 0) throw new Error(`CSV row ${rowNumber}: '${field}' must be strictly positive.`);
  return parsed;
};

const parseNonNegativeNumber = (value, rowNumber, field) => {
  if (!value) throw new Error(`CSV row ${rowNumber}: '${field}' is required.`);
  if (!STRICT_NUMBER_PATTERN.test(value)) throw new Error(`CSV row ${rowNumber}: '${field}' must use a dot-decimal finite number.`);
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error(`CSV row ${rowNumber}: '${field}' must be a finite number >= 0.`);
  return parsed;
};

export const parseRealizedVolatilityCsv = (text, options = {}) => {
  if (typeof text !== 'string' || !text.trim()) throw new Error('CSV file is empty.');
  assertPlainObject(options, 'CSV options');
  const maxCharacters = options.maxCharacters ?? MAX_REALIZED_VOLATILITY_CSV_CHARACTERS;
  const maxRows = options.maxRows ?? MAX_REALIZED_VOLATILITY_ROWS;
  if (!Number.isSafeInteger(maxCharacters) || maxCharacters <= 0) throw new Error('maxCharacters must be a positive safe integer.');
  if (!Number.isSafeInteger(maxRows) || maxRows < 3) throw new Error('maxRows must be a safe integer >= 3.');
  if (new TextEncoder().encode(text).length > maxCharacters) throw new Error(`CSV exceeds the ${maxCharacters}-byte limit.`);
  if (text.includes('\0')) throw new Error('CSV contains a null byte.');

  const normalized = text.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  const rawLines = normalized.split('\n');
  while (rawLines.length && rawLines.at(-1).trim() === '') rawLines.pop();
  const blankIndex = rawLines.findIndex((line, index) => index > 0 && !line.trim());
  if (blankIndex >= 0) throw new Error(`CSV row ${blankIndex + 1}: blank rows are not allowed.`);

  const delimiter = detectDelimiter(rawLines[0]);
  const headers = splitCsvLine(rawLines[0], delimiter);
  const acceptedHeaders = [REQUIRED_HEADERS, [...REQUIRED_HEADERS, ...OPTIONAL_HEADERS]];
  if (!acceptedHeaders.some((candidate) => candidate.length === headers.length && candidate.every((header, index) => header === headers[index]))) {
    throw new Error('CSV header must be exactly date,open,high,low,close with optional trailing volume; reordered, adjusted-close and unknown columns are forbidden.');
  }
  const headerIndex = Object.fromEntries([...REQUIRED_HEADERS, ...OPTIONAL_HEADERS].map((header) => [header, headers.indexOf(header)]));
  if (rawLines.length - 1 > maxRows) throw new Error(`CSV exceeds the ${maxRows}-observation limit.`);

  const rows = [];
  for (let index = 1; index < rawLines.length; index += 1) {
    const rowNumber = index + 1;
    const values = splitCsvLine(rawLines[index], delimiter);
    if (values.length !== headers.length) throw new Error(`CSV row ${rowNumber}: expected ${headers.length} fields, received ${values.length}.`);
    const parsedDate = parseIsoDate(values[headerIndex.date], rowNumber);
    if (rows.length && parsedDate.ordinal <= rows.at(-1)._ordinal) {
      const reason = parsedDate.ordinal === rows.at(-1)._ordinal ? 'duplicate' : 'not strictly chronological';
      throw new Error(`CSV row ${rowNumber}: date '${parsedDate.value}' is ${reason}; rows are never silently sorted.`);
    }
    const open = parsePositiveNumber(values[headerIndex.open], rowNumber, 'open');
    const high = parsePositiveNumber(values[headerIndex.high], rowNumber, 'high');
    const low = parsePositiveNumber(values[headerIndex.low], rowNumber, 'low');
    const close = parsePositiveNumber(values[headerIndex.close], rowNumber, 'close');
    if (high < low || high < open || high < close || low > open || low > close) {
      throw new Error(`CSV row ${rowNumber}: OHLC consistency requires high >= open/close/low and low <= open/close/high.`);
    }
    const volume = headerIndex.volume >= 0
      ? parseNonNegativeNumber(values[headerIndex.volume], rowNumber, 'volume')
      : undefined;
    rows.push({ date: parsedDate.value, open, high, low, close, ...(volume === undefined ? {} : { volume }), rowNumber, _ordinal: parsedDate.ordinal });
  }
  return rows.map(({ _ordinal, rowNumber, ...row }) => row);
};

const median = (rawValues) => {
  const values = [...rawValues].sort((left, right) => left - right);
  const middle = Math.floor(values.length / 2);
  return values.length % 2 ? values[middle] : 0.5 * (values[middle - 1] + values[middle]);
};

const sampleVariance = (values) => {
  if (values.length < 2) throw new Error('At least two sessions are required for sample variance.');
  const average = values.reduce((total, value) => total + value, 0) / values.length;
  return values.reduce((total, value) => total + (value - average) ** 2, 0) / (values.length - 1);
};

const nonNegative = (value) => {
  if (value >= 0) return value;
  if (value > -1e-14) return 0;
  throw new Error(`Estimator produced a negative variance (${value}).`);
};

const buildSessions = (rows) => rows.slice(1).map((row, index) => {
  const previous = rows[index];
  const closeToCloseReturn = Math.log(row.close / previous.close);
  const overnightReturn = Math.log(row.open / previous.close);
  const openToCloseReturn = Math.log(row.close / row.open);
  const highLowLog = Math.log(row.high / row.low);
  const highOpenLog = Math.log(row.high / row.open);
  const highCloseLog = Math.log(row.high / row.close);
  const lowOpenLog = Math.log(row.low / row.open);
  const lowCloseLog = Math.log(row.low / row.close);
  return {
    startDate: previous.date,
    date: row.date,
    closeToCloseReturn,
    overnightReturn,
    openToCloseReturn,
    parkinsonContribution: (highLowLog ** 2) / (4 * Math.log(2)),
    garmanKlassContribution: 0.5 * highLowLog ** 2 - (2 * Math.log(2) - 1) * openToCloseReturn ** 2,
    rogersSatchellContribution: highOpenLog * highCloseLog + lowOpenLog * lowCloseLog,
  };
});

const estimateWindow = (sessions, annualization) => {
  const count = sessions.length;
  if (count < 2) throw new Error('Every estimator window requires at least two sessions.');
  const average = (field) => sessions.reduce((total, session) => total + session[field], 0) / count;
  const closeToClose = sampleVariance(sessions.map((session) => session.closeToCloseReturn));
  const parkinson = average('parkinsonContribution');
  const garmanKlass = average('garmanKlassContribution');
  const rogersSatchell = average('rogersSatchellContribution');
  const overnightVariance = sampleVariance(sessions.map((session) => session.overnightReturn));
  const openCloseVariance = sampleVariance(sessions.map((session) => session.openToCloseReturn));
  const yangZhangWeight = 0.34 / (1.34 + (count + 1) / (count - 1));
  const yangZhang = overnightVariance + yangZhangWeight * openCloseVariance + (1 - yangZhangWeight) * rogersSatchell;
  const variances = { closeToClose, parkinson, garmanKlass, rogersSatchell, yangZhang };
  return Object.fromEntries(ESTIMATOR_KEYS.map((key) => {
    const variance = nonNegative(variances[key]);
    return [key, {
      key,
      label: ESTIMATOR_LABELS[key],
      sessionCount: count,
      variance,
      annualizedVolatility: Math.sqrt(variance * annualization),
    }];
  }));
};

const yangZhangWeight = (sessionCount) => 0.34 / (1.34 + (sessionCount + 1) / (sessionCount - 1));

const utf8Bytes = (text) => new TextEncoder().encode(text);

// Small synchronous SHA-256 implementation keeps the browser/CLI API identical.
const sha256 = (text) => {
  const source = [...utf8Bytes(text)];
  const bitLength = source.length * 8;
  source.push(0x80);
  while (source.length % 64 !== 56) source.push(0);
  const high = Math.floor(bitLength / 0x1_0000_0000);
  const low = bitLength >>> 0;
  for (let shift = 24; shift >= 0; shift -= 8) source.push((high >>> shift) & 0xff);
  for (let shift = 24; shift >= 0; shift -= 8) source.push((low >>> shift) & 0xff);
  const constants = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];
  const rotateRight = (value, bits) => (value >>> bits) | (value << (32 - bits));
  const state = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
  for (let offset = 0; offset < source.length; offset += 64) {
    const words = new Uint32Array(64);
    for (let index = 0; index < 16; index += 1) {
      const start = offset + index * 4;
      words[index] = ((source[start] << 24) | (source[start + 1] << 16) | (source[start + 2] << 8) | source[start + 3]) >>> 0;
    }
    for (let index = 16; index < 64; index += 1) {
      const x = words[index - 15];
      const y = words[index - 2];
      const sigma0 = rotateRight(x, 7) ^ rotateRight(x, 18) ^ (x >>> 3);
      const sigma1 = rotateRight(y, 17) ^ rotateRight(y, 19) ^ (y >>> 10);
      words[index] = (words[index - 16] + sigma0 + words[index - 7] + sigma1) >>> 0;
    }
    let [a, b, c, d, e, f, g, h] = state;
    for (let index = 0; index < 64; index += 1) {
      const sum1 = rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25);
      const choose = (e & f) ^ (~e & g);
      const temporary1 = (h + sum1 + choose + constants[index] + words[index]) >>> 0;
      const sum0 = rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22);
      const majority = (a & b) ^ (a & c) ^ (b & c);
      const temporary2 = (sum0 + majority) >>> 0;
      h = g; g = f; f = e; e = (d + temporary1) >>> 0; d = c; c = b; b = a; a = (temporary1 + temporary2) >>> 0;
    }
    [a, b, c, d, e, f, g, h].forEach((value, index) => { state[index] = (state[index] + value) >>> 0; });
  }
  return state.map((value) => value.toString(16).padStart(8, '0')).join('');
};

const canonicalNumber = (value) => {
  if (!Number.isFinite(value)) throw new Error('Canonical dataset contains a non-finite number.');
  if (Object.is(value, -0) || value === 0) return '0';
  const [rawMantissa, rawExponent] = value.toExponential(16).toLowerCase().split('e');
  const mantissa = rawMantissa.replace(/0+$/, '').replace(/\.$/, '');
  return `${mantissa}e${Number(rawExponent)}`;
};

const exportNumber = (value) => {
  if (!Number.isFinite(value)) throw new Error('Evidence export contains a non-finite number.');
  if (Object.is(value, -0) || value === 0) return '0';
  const [rawMantissa, rawExponent] = value.toExponential(11).toLowerCase().split('e');
  const mantissa = rawMantissa.replace(/0+$/, '').replace(/\.$/, '');
  return `${mantissa}e${Number(rawExponent)}`;
};

const canonicalObservationCsv = (rows) => {
  const hasVolume = rows.length > 0 && Object.hasOwn(rows[0], 'volume');
  const header = `date,open,high,low,close${hasVolume ? ',volume' : ''}`;
  return `${header}\n${rows.map((row) => [
    row.date,
    canonicalNumber(row.open),
    canonicalNumber(row.high),
    canonicalNumber(row.low),
    canonicalNumber(row.close),
    ...(hasVolume ? [canonicalNumber(row.volume)] : []),
  ].join(',')).join('\n')}\n`;
};

const weekdayFromOrdinal = (ordinal) => ((ordinal + 4) % 7 + 7) % 7; // 0=Sunday, Unix epoch was Thursday.

const missingExpectedDays = (leftDate, rightDate, frequency) => {
  const left = parseIsoDate(leftDate, 0).ordinal;
  const right = parseIsoDate(rightDate, 0).ordinal;
  let missing = 0;
  for (let ordinal = left + 1; ordinal < right; ordinal += 1) {
    const weekday = weekdayFromOrdinal(ordinal);
    if (frequency === 'calendar-daily' || (weekday !== 0 && weekday !== 6)) missing += 1;
  }
  return missing;
};

const buildDiagnostics = (rows, sessions, estimators, config) => {
  const events = [];
  const flagsByDate = new Map(rows.slice(1).map((row) => [row.date, []]));
  const add = (code, rowIndex, message, value) => {
    const event = { code, date: rows[rowIndex].date, row: rowIndex + 1, message, ...(value === undefined ? {} : { value }) };
    events.push(event);
    flagsByDate.get(rows[rowIndex].date).push(code);
  };

  let possibleMissingSessionCount = 0;
  for (let index = 1; index < rows.length; index += 1) {
    const missing = missingExpectedDays(
      rows[index - 1].date,
      rows[index].date,
      config.calendarMode === 'calendar_daily' ? 'calendar-daily' : 'business-daily',
    );
    if (missing > 0) {
      possibleMissingSessionCount += missing;
      add('POSSIBLE_MISSING_SESSION', index, `${missing} expected dates are absent before this row; holidays are not modeled.`, missing);
    }
  }

  const returns = sessions.map((session) => session.closeToCloseReturn);
  const center = median(returns);
  const mad = median(returns.map((value) => Math.abs(value - center)));
  sessions.forEach((session, position) => {
    const rowIndex = position + 1;
    if (Math.abs(session.closeToCloseReturn) >= Math.log(1.25)) {
      add('LARGE_CLOSE_JUMP', rowIndex, 'Absolute close-to-close log return is at least log(1.25); possible gap or corporate action retained.', session.closeToCloseReturn);
    }
    if (mad > EPSILON) {
      const robustZ = 0.6744897501960817 * (session.closeToCloseReturn - center) / mad;
      if (Math.abs(robustZ) > 8) add('ROBUST_RETURN_OUTLIER', rowIndex, 'Absolute median/MAD robust z-score exceeds 8; observation retained.', robustZ);
    } else if (Math.abs(session.closeToCloseReturn - center) > 1e-12) {
      add('ROBUST_RETURN_OUTLIER_MAD_ZERO', rowIndex, 'Return differs from the median while MAD is zero; observation retained.', session.closeToCloseReturn);
    }
    const logRange = Math.log(rows[rowIndex].high / rows[rowIndex].low);
    if (logRange >= Math.log(1.25)) {
      add('LARGE_INTRADAY_RANGE', rowIndex, 'Log high/low range is at least log(1.25); observation retained.', logRange);
    }
  });

  let flatBarCount = 0;
  let repeatedCloseCount = 0;
  let longestFlatRun = 0;
  let currentFlatRun = 0;
  for (let index = 1; index < rows.length; index += 1) {
    const row = rows[index];
    if (row.open === row.high && row.high === row.low && row.low === row.close) {
      flatBarCount += 1;
      currentFlatRun += 1;
      longestFlatRun = Math.max(longestFlatRun, currentFlatRun);
      add('FLAT_BAR', index, 'Open, high, low and close are identical.');
    } else {
      currentFlatRun = 0;
    }
    if (row.close === rows[index - 1].close) {
      repeatedCloseCount += 1;
      add('REPEATED_CLOSE', index, 'Close is unchanged from the previous row.');
    }
  }

  const counts = {
    possibleMissingSessionCount,
    flatBarCount,
    flatBarFraction: flatBarCount / sessions.length,
    repeatedCloseCount,
    repeatedCloseFraction: repeatedCloseCount / sessions.length,
    longestFlatRun,
    medianCloseReturn: center,
    returnMad: mad,
  };
  const warningSummaries = [];
  if (sessions.length < 20) warningSummaries.push({ code: 'SMALL_SAMPLE', message: 'Fewer than 20 aligned sessions; estimates are statistically fragile.' });
  if (config.priceBasis === 'unknown') warningSummaries.push({ code: 'UNKNOWN_PRICE_BASIS', message: 'OHLC adjustment status is unknown; corporate-action contamination cannot be excluded.' });
  if (possibleMissingSessionCount) warningSummaries.push({ code: 'POSSIBLE_MISSING_SESSIONS', message: `${possibleMissingSessionCount} expected dates are absent; no holiday calendar is available.` });
  if (counts.flatBarFraction > 0.05) warningSummaries.push({ code: 'MANY_FLAT_BARS', message: `Flat bars represent ${(counts.flatBarFraction * 100).toFixed(2)}% of aligned sessions.` });
  if (counts.repeatedCloseFraction > 0.05) warningSummaries.push({ code: 'MANY_REPEATED_CLOSES', message: `Repeated closes represent ${(counts.repeatedCloseFraction * 100).toFixed(2)}% of aligned sessions.` });
  const eventCodes = new Set(events.map((event) => event.code));
  if (eventCodes.has('LARGE_CLOSE_JUMP') || eventCodes.has('LARGE_INTRADAY_RANGE')) warningSummaries.push({ code: 'LARGE_MOVE_REVIEW', message: 'Large close jumps or intraday ranges were retained; review corporate actions, units and source quality.' });
  if (eventCodes.has('ROBUST_RETURN_OUTLIER') || eventCodes.has('ROBUST_RETURN_OUTLIER_MAD_ZERO')) warningSummaries.push({ code: 'RETURN_OUTLIERS', message: 'Robust return outliers were retained and identified by date.' });
  const positiveVols = ESTIMATOR_KEYS.map((key) => estimators[key].annualizedVolatility).filter((value) => value > 0);
  const estimatorMaxMinRatio = positiveVols.length >= 2 ? Math.max(...positiveVols) / Math.min(...positiveVols) : null;
  if (estimatorMaxMinRatio !== null && estimatorMaxMinRatio > 1.5) warningSummaries.push({ code: 'ESTIMATOR_DIVERGENCE', message: `Maximum/minimum positive annualized volatility ratio is ${estimatorMaxMinRatio.toPrecision(6).replace(/\.?0+$/, '')} (> 1.5).` });
  const overnightVariance = sampleVariance(sessions.map((session) => session.overnightReturn));
  const overnightVarianceShareOfYangZhang = estimators.yangZhang.variance > 0 ? overnightVariance / estimators.yangZhang.variance : null;
  if (overnightVarianceShareOfYangZhang !== null && overnightVarianceShareOfYangZhang > 0.5) warningSummaries.push({ code: 'OVERNIGHT_DOMINANT', message: `Overnight sample variance is ${(overnightVarianceShareOfYangZhang * 100).toFixed(2)}% of Yang-Zhang variance.` });

  return { events, flagsByDate, counts, warningSummaries, estimatorMaxMinRatio, overnightVarianceShareOfYangZhang };
};

const normalizeRows = (rawRows) => {
  if (!Array.isArray(rawRows)) throw new Error('rows must be an array.');
  if (rawRows.length < 6) throw new Error('At least six OHLC rows are required: one seed plus five sessions.');
  if (rawRows.length > MAX_REALIZED_VOLATILITY_ROWS) throw new Error(`rows exceeds the ${MAX_REALIZED_VOLATILITY_ROWS}-observation limit.`);
  rawRows.forEach((row) => assertPlainObject(row, 'Each observation'));
  const hasVolume = rawRows.length > 0 && Object.hasOwn(rawRows[0], 'volume');
  if (rawRows.some((row) => Object.hasOwn(row, 'volume') !== hasVolume)) throw new Error('volume must be present on every row or on no rows.');
  const csv = `date,open,high,low,close${hasVolume ? ',volume' : ''}\n${rawRows.map((row) => {
    const expected = new Set([...REQUIRED_HEADERS, ...(hasVolume ? OPTIONAL_HEADERS : [])]);
    const unknown = Object.keys(row).filter((key) => !expected.has(key));
    const missing = [...expected].filter((key) => !Object.hasOwn(row, key));
    if (unknown.length || missing.length) {
      throw new Error(`Each observation has invalid schema; missing=${missing.sort().join('|') || 'none'}; unknown=${unknown.sort().join('|') || 'none'}.`);
    }
    return [row.date, row.open, row.high, row.low, row.close, ...(hasVolume ? [row.volume] : [])].join(',');
  }).join('\n')}\n`;
  return parseRealizedVolatilityCsv(csv);
};

export const analyzeRealizedVolatility = (rawRows, rawConfig = {}, rawProvenance = {}) => {
  assertPlainObject(rawConfig, 'config');
  assertPlainObject(rawProvenance, 'provenance');
  const rows = normalizeRows(rawRows);
  const sessions = buildSessions(rows);
  const annualization = rawConfig.annualization ?? 252;
  if (!Number.isSafeInteger(annualization) || annualization < 1 || annualization > 366) throw new Error('annualization must be a safe integer between 1 and 366.');
  const rollingWindow = rawConfig.rollingWindow ?? rawConfig.window ?? Math.min(20, sessions.length);
  if (!Number.isSafeInteger(rollingWindow) || rollingWindow < 5 || rollingWindow > 252 || rollingWindow > sessions.length) {
    throw new Error(`rollingWindow must be a safe integer between 5 and ${Math.min(252, sessions.length)}.`);
  }
  const calendarMode = rawConfig.calendarMode ?? 'weekday_sessions';
  if (!['weekday_sessions', 'calendar_daily'].includes(calendarMode)) {
    throw new Error("calendarMode must be 'weekday_sessions' or 'calendar_daily'.");
  }
  const inferredPriceBasis = rawProvenance.adjustmentBasis === 'adjusted'
    ? 'split_adjusted_ohlc'
    : (rawProvenance.adjustmentBasis === 'unadjusted' ? 'unadjusted_ohlc' : 'unknown');
  const priceBasis = rawConfig.priceBasis ?? inferredPriceBasis;
  if (!['split_adjusted_ohlc', 'provider_adjusted_ohlc', 'unadjusted_ohlc', 'unknown'].includes(priceBasis)) {
    throw new Error("priceBasis must be 'split_adjusted_ohlc', 'provider_adjusted_ohlc', 'unadjusted_ohlc' or 'unknown'.");
  }
  const label = (raw, fallback, maximum, name) => {
    const value = raw === undefined || raw === null || String(raw).trim() === '' ? fallback : String(raw).trim();
    if (value.length > maximum || /[\x00-\x1f\x7f]/.test(value)) throw new Error(`${name} must be control-character-free and at most ${maximum} characters.`);
    return value;
  };
  const sourceLabel = label(rawConfig.sourceLabel ?? rawProvenance.sourceLabel, 'user-provided CSV', 200, 'sourceLabel');
  const symbolLabel = label(rawConfig.symbolLabel ?? rawProvenance.symbolLabel, 'unlabelled single series', 120, 'symbolLabel');
  const filenameCandidate = rawConfig.filename ?? rawProvenance.filename;
  const filename = filenameCandidate === undefined || filenameCandidate === null || String(filenameCandidate).trim() === ''
    ? null
    : label(filenameCandidate, 'input.csv', 255, 'filename');
  const normalizedCalendarMode = calendarMode;
  const expectedFrequency = normalizedCalendarMode === 'calendar_daily' ? 'calendar-daily' : 'business-daily';
  const config = Object.freeze({
    annualization,
    rollingWindow,
    window: rollingWindow,
    expectedFrequency,
    calendarMode: normalizedCalendarMode,
    priceBasis,
    sourceLabel,
    symbolLabel,
    filename,
  });
  const estimators = estimateWindow(sessions, annualization);
  const canonicalDataset = canonicalObservationCsv(rows);
  const inferredAdjustmentBasis = priceBasis === 'split_adjusted_ohlc' || priceBasis === 'provider_adjusted_ohlc'
    ? 'adjusted'
    : (priceBasis === 'unadjusted_ohlc' ? 'unadjusted' : 'unknown');
  const adjustmentBasis = String(rawProvenance.adjustmentBasis ?? inferredAdjustmentBasis).toLowerCase();
  const source = {
    filename,
    sha256: sha256(canonicalDataset),
    hashBasis: 'canonical-observations-utf8',
    adjustmentBasis: VALID_ADJUSTMENT_BASIS.has(adjustmentBasis) ? adjustmentBasis : 'unknown',
  };
  const analysisConfig = JSON.stringify({ annualization, calendarMode: normalizedCalendarMode, filename, priceBasis, sourceLabel, symbolLabel, window: rollingWindow });
  const analysisId = sha256(`${source.sha256}\n${analysisConfig}`);
  const rolling = [];
  for (let end = rollingWindow - 1; end < sessions.length; end += 1) {
    const windowSessions = sessions.slice(end - rollingWindow + 1, end + 1);
    rolling.push({
      startDate: windowSessions[0].startDate,
      endDate: windowSessions.at(-1).date,
      sessionCount: rollingWindow,
      yangZhangK: yangZhangWeight(rollingWindow),
      estimators: estimateWindow(windowSessions, annualization),
    });
  }
  const diagnostics = buildDiagnostics(rows, sessions, estimators, config);
  const warningRange = { startDate: rows[0].date, endDate: rows.at(-1).date };
  const warnings = [
    ...diagnostics.events.map((event) => ({ ...event, severity: 'warning', includedInCalculation: true })),
    ...diagnostics.warningSummaries.map((warning) => ({ ...warning, ...warningRange, severity: 'warning', includedInCalculation: true })),
  ];
  const sessionByDate = new Map(sessions.map((session) => [session.date, session]));
  const closeMean = sessions.reduce((total, session) => total + session.closeToCloseReturn, 0) / sessions.length;
  const overnightMean = sessions.reduce((total, session) => total + session.overnightReturn, 0) / sessions.length;
  const intradayMean = sessions.reduce((total, session) => total + session.openToCloseReturn, 0) / sessions.length;
  const fullK = yangZhangWeight(sessions.length);
  const observations = rows.map((row) => {
    const session = sessionByDate.get(row.date);
    const contribution = session ? {
      closeToClose: (session.closeToCloseReturn - closeMean) ** 2 / (sessions.length - 1),
      parkinson: session.parkinsonContribution / sessions.length,
      garmanKlass: session.garmanKlassContribution / sessions.length,
      rogersSatchell: session.rogersSatchellContribution / sessions.length,
      yangZhang: (session.overnightReturn - overnightMean) ** 2 / (sessions.length - 1)
        + fullK * (session.openToCloseReturn - intradayMean) ** 2 / (sessions.length - 1)
        + (1 - fullK) * session.rogersSatchellContribution / sessions.length,
    } : null;
    return {
      date: row.date,
      open: row.open,
      high: row.high,
      low: row.low,
      close: row.close,
      closeToCloseReturn: session?.closeToCloseReturn ?? null,
      overnightReturn: session?.overnightReturn ?? null,
      openToCloseReturn: session?.openToCloseReturn ?? null,
      intradayReturn: session?.openToCloseReturn ?? null,
      logRange: session ? Math.log(row.high / row.low) : null,
      varianceContributions: contribution,
      flags: diagnostics.flagsByDate.get(row.date) ?? [],
      ...(Object.hasOwn(row, 'volume') ? { volume: row.volume } : {}),
    };
  });
  const summary = Object.fromEntries(ESTIMATOR_KEYS.map((key) => [key, {
    n: sessions.length,
    dailyVariance: estimators[key].variance,
    dailyVol: Math.sqrt(estimators[key].variance),
    annualizedVol: estimators[key].annualizedVolatility,
  }]));
  const inputs = rows.map(({ rowNumber, ...row }) => row);
  return {
    schema: REALIZED_VOLATILITY_RESULT_SCHEMA,
    engineVersion: REALIZED_VOLATILITY_VERSION,
    analysisId,
    source,
    provenance: {
      sourceLabel,
      symbolLabel,
      filename: source.filename,
      priceBasis,
      datasetSha256: source.sha256,
      provider: null,
      persistence: 'none',
    },
    config,
    dateRange: { start: rows[0].date, end: rows.at(-1).date },
    observationCount: rows.length,
    sessionCount: sessions.length,
    inputs,
    yangZhangK: fullK,
    summary,
    estimators,
    rolling,
    observations,
    warnings,
    conventions: {
      frequency: 'daily sessions; no resampling',
      returnUnit: 'natural-log returns in decimal form',
      alignment: 'row 0 is the previous-close seed; all estimators use rows 1..N-1',
      closeToClose: 'sample variance of log(C_t/C_{t-1})',
      parkinson: 'mean(log(H/L)^2 / (4 ln 2))',
      garmanKlass: 'mean(0.5 log(H/L)^2 - (2 ln 2 - 1) log(C/O)^2)',
      rogersSatchell: 'mean(log(H/O)log(H/C) + log(L/O)log(L/C))',
      yangZhang: 'sample overnight variance + k sample open-close variance + (1-k) Rogers-Satchell',
      yangZhangWeight: 'k = 0.34 / (1.34 + (n+1)/(n-1))',
      annualization: 'annualized volatility = sqrt(explicit sessionsPerYear * daily variance)',
      missingData: 'no sorting, dropping, winsorization, resampling, interpolation or imputation',
      sessionsPerYear: annualization,
      rollingWindow,
    },
    limitations: [
      'Historical realized volatility is not a forecast or trading signal.',
      'Calendar and business-day checks do not infer exchange-specific holidays.',
      'Unknown adjustment basis can leave splits and distributions in the estimates.',
      'Daily OHLC estimators do not model microstructure noise or intraday path ordering.',
    ],
    diagnostics: {
      status: warnings.length ? 'WARN' : 'PASS',
      rowCount: rows.length,
      seedRowCount: 1,
      alignedSessionCount: sessions.length,
      rollingPointCount: rolling.length,
      counts: diagnostics.counts,
      estimatorMaxMinRatio: diagnostics.estimatorMaxMinRatio,
      overnightVarianceShareOfYangZhang: diagnostics.overnightVarianceShareOfYangZhang,
      events: diagnostics.events,
      warnings: diagnostics.warningSummaries,
      errors: [],
    },
  };
};

const csvValue = (value) => {
  if (value === null || value === undefined) return '';
  const numeric = typeof value === 'number';
  const text = numeric ? exportNumber(value) : String(value);
  const safe = !numeric && /^[=+\-@]/.test(text) ? `'${text}` : text;
  return /[",\n;]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

const csvLine = (values) => values.map(csvValue).join(',');

const validateResultForExport = (result) => {
  assertPlainObject(result, 'result');
  if (result.schema !== REALIZED_VOLATILITY_RESULT_SCHEMA || result.engineVersion !== REALIZED_VOLATILITY_VERSION) {
    throw new Error('Result schema or engine version is not exportable by this engine.');
  }
  if (!/^[a-f0-9]{64}$/.test(result.source?.sha256 ?? '')) throw new Error('Result provenance SHA-256 is missing or invalid.');
};

export const buildRollingCsv = (result) => {
  validateResultForExport(result);
  const headers = ['schema', 'engineVersion', 'sourceSha256', 'annualization', 'windowSessions', 'startDate', 'endDate'];
  for (const key of ESTIMATOR_KEYS) headers.push(`${key}Variance`, `${key}AnnualizedVolatility`);
  const lines = [csvLine(headers)];
  for (const item of result.rolling) {
    const values = [REALIZED_VOLATILITY_ROLLING_CSV_SCHEMA, result.engineVersion, result.source.sha256, String(result.config.annualization), String(item.sessionCount), item.startDate, item.endDate];
    for (const key of ESTIMATOR_KEYS) values.push(item.estimators[key].variance, item.estimators[key].annualizedVolatility);
    lines.push(csvLine(values));
  }
  return `${lines.join('\n')}\n`;
};

export const buildObservationsCsv = (result) => {
  validateResultForExport(result);
  const headers = [
    'schema', 'engineVersion', 'sourceSha256', 'date', 'open', 'high', 'low', 'close', 'volume',
    'closeToCloseReturn', 'overnightReturn', 'openToCloseReturn', 'logRange', 'flags',
    ...ESTIMATOR_KEYS.map((key) => `${key}VarianceContribution`),
  ];
  const lines = [csvLine(headers)];
  for (const item of result.observations) {
    lines.push(csvLine([
      REALIZED_VOLATILITY_OBSERVATIONS_CSV_SCHEMA,
      result.engineVersion,
      result.source.sha256,
      item.date,
      item.open,
      item.high,
      item.low,
      item.close,
      item.volume,
      item.closeToCloseReturn,
      item.overnightReturn,
      item.openToCloseReturn,
      item.logRange,
      item.flags.join('|'),
      ...ESTIMATOR_KEYS.map((key) => item.varianceContributions?.[key]),
    ]));
  }
  return `${lines.join('\n')}\n`;
};
