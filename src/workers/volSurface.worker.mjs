import { analyzeVolSurface } from '../lib/volSurface.mjs';

self.onmessage = async (event) => {
  const { type, requestId, input } = event.data ?? {};
  if (type !== 'analyze' || typeof requestId !== 'string') {
    self.postMessage({ type: 'error', requestId: typeof requestId === 'string' ? requestId : null, error: 'Unsupported vol-surface worker message.' });
    return;
  }
  try {
    self.postMessage({ type: 'result', requestId, result: await analyzeVolSurface(input) });
  } catch (reason) {
    self.postMessage({ type: 'error', requestId, error: reason instanceof Error ? reason.message : 'Vol-surface analysis failed.' });
  }
};
