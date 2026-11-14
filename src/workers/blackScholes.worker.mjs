import { analyzeBlackScholes } from '../lib/blackScholes.mjs';

self.onmessage = async (event) => {
  const request = event.data;
  if (!request || request.type !== 'analyze' || typeof request.requestId !== 'string') {
    self.postMessage({ type: 'error', requestId: request?.requestId ?? null, error: 'Invalid Black-Scholes worker request.' });
    return;
  }
  try {
    const result = await analyzeBlackScholes(request.input);
    self.postMessage({ type: 'result', requestId: request.requestId, result });
  } catch (error) {
    self.postMessage({ type: 'error', requestId: request.requestId, error: error instanceof Error ? error.message : 'Black-Scholes analysis failed.' });
  }
};
