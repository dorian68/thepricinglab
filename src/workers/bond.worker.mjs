import { analyzeBond } from '../lib/bond.mjs';

self.onmessage = async (event) => {
  const request = event.data;
  if (!request || request.type !== 'analyze' || typeof request.requestId !== 'string') {
    self.postMessage({ type: 'error', requestId: request?.requestId ?? null, error: 'Invalid bond worker request.' });
    return;
  }
  try {
    const result = await analyzeBond(request.input);
    self.postMessage({ type: 'result', requestId: request.requestId, result });
  } catch (error) {
    self.postMessage({ type: 'error', requestId: request.requestId, error: error instanceof Error ? error.message : 'Bond analysis failed.' });
  }
};
