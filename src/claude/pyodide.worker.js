// Classic dedicated worker following the pinned Pyodide 0.26 worker API.
// App identity/tokens are never transferred to this Python interpreter.
const BASE = 'https://cdn.jsdelivr.net/pyodide/v0.26.2/full/';
let interpreter;
self.onmessage = async ({ data: { id, code } }) => {
  try {
    if (!interpreter) {
      self.importScripts(`${BASE}pyodide.js`);
      interpreter = await self.loadPyodide({ indexURL: BASE });
    }
  } catch {
    self.postMessage({ id, ok: false, stdout: '', error: 'Python runtime failed to load. Retry or download the source and run it locally.', runtimeFailure: true });
    return;
  }
  const namespace = interpreter.toPy({ __name__: '__main__' });
  let stdout = '', error = null;
  try {
    interpreter.runPython('import sys, io\n_tpl_output = io.StringIO()\nsys.stdout = _tpl_output\nsys.stderr = _tpl_output', { globals: namespace });
    await interpreter.loadPackagesFromImports(code);
    await interpreter.runPythonAsync(code, { globals: namespace });
  } catch (failure) { error = String(failure.message || failure); }
  finally {
    try { stdout = interpreter.runPython('_tpl_output.getvalue()', { globals: namespace }); } catch { /* A draft can overwrite its output buffer. */ }
    interpreter.runPython('import sys\nsys.stdout = sys.__stdout__\nsys.stderr = sys.__stderr__');
    namespace.destroy();
  }
  if (stdout.length > 200000) stdout = `${stdout.slice(0, 200000)}\n[Output truncated after 200,000 characters]`;
  self.postMessage({ id, ok: !error, stdout, error });
};
