// Python runs outside the rendering thread. Failed/timed-out CDN loads remain
// retryable, and a stopped runtime cannot continue consuming CPU in a hidden tab.
let worker = null;
let nextId = 0;
let pending = null;
export function pyodideReady() { return worker !== null; }
function finish(result) {
  if (!pending) return;
  const current = pending; pending = null;
  clearTimeout(current.timer); current.resolve(result);
}
export function cancelPython() {
  worker?.terminate(); worker = null;
  finish({ ok: false, stdout: '', error: 'Python runtime stopped. Your source has been retained.' });
}
export function getPyodide() {
  if (!worker) {
    worker = new Worker(new URL('./pyodide.worker.js', import.meta.url));
    worker.onmessage = event => {
      if (event.data.id !== pending?.id) return;
      const result = event.data;
      if (result.runtimeFailure) { worker?.terminate(); worker = null; }
      finish({ ok: result.ok, stdout: result.stdout || '', error: result.error || null });
    };
    worker.onerror = event => {
      event.preventDefault(); worker?.terminate(); worker = null;
      finish({ ok: false, stdout: '', error: 'Python runtime could not load. Retry or download the source and run it locally.' });
    };
  }
  return worker;
}
export function runPython(code, { timeoutMs = 60000 } = {}) {
  if (pending) return Promise.resolve({ ok: false, stdout: '', error: 'A Python run is already in progress. Stop it before starting another.' });
  if (typeof code !== 'string' || code.length > 200000) return Promise.resolve({ ok: false, stdout: '', error: 'Python source must be text of at most 200,000 characters.' });
  return new Promise(resolve => {
    const id = ++nextId;
    const timer = setTimeout(() => {
      worker?.terminate(); worker = null;
      finish({ ok: false, stdout: '', error: 'Python runtime timed out. Your source has been retained; retry or run the downloaded file locally.' });
    }, timeoutMs);
    pending = { id, timer, resolve };
    try { getPyodide().postMessage({ id, code }); }
    catch { worker?.terminate(); worker = null; finish({ ok: false, stdout: '', error: 'Browser Python is unavailable. Download the source to run it locally.' }); }
  });
}
