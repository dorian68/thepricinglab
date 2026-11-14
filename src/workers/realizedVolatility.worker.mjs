import {
  analyzeRealizedVolatility,
  parseRealizedVolatilityCsv,
} from '../lib/realizedVolatility.mjs';

const workerScope = globalThis.self ?? globalThis;

workerScope.onmessage = (event) => {
  const message = event?.data;
  if (!message || message.type !== 'analyze') return;
  const { runId, csvText, filename, config } = message;
  try {
    if (typeof runId !== 'string' && typeof runId !== 'number') throw new Error('runId must be a string or number.');
    const rows = parseRealizedVolatilityCsv(csvText);
    const result = analyzeRealizedVolatility(rows, config ?? {}, {
      filename,
      sourceText: csvText,
      sourceLabel: config?.sourceLabel,
      symbolLabel: config?.symbolLabel,
      adjustmentBasis: config?.adjustmentBasis
        ?? (['split_adjusted_ohlc', 'provider_adjusted_ohlc'].includes(config?.priceBasis) ? 'adjusted' : undefined),
    });
    workerScope.postMessage({ type: 'result', runId, result });
  } catch (error) {
    workerScope.postMessage({
      type: 'error',
      runId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
