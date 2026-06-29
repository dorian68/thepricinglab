// Real in-browser Python execution via Pyodide (loaded lazily from the CDN on
// first use). Keeps the platform Lovable-hostable: no backend needed for the
// "Run" buttons on exercises and notebooks. Auto-loads numpy/scipy/pandas etc.
// from the code's own imports.

let _pyodidePromise = null;
const PYODIDE_VERSION = 'v0.26.2';
const BASE = `https://cdn.jsdelivr.net/pyodide/${PYODIDE_VERSION}/full/`;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(new Error('failed to load ' + src));
    document.head.appendChild(s);
  });
}

export function pyodideReady() {
  return _pyodidePromise != null;
}

export function getPyodide() {
  if (!_pyodidePromise) {
    _pyodidePromise = (async () => {
      if (!window.loadPyodide) await loadScript(BASE + 'pyodide.js');
      return window.loadPyodide({ indexURL: BASE });
    })();
  }
  return _pyodidePromise;
}

export async function runPython(code) {
  let py;
  try {
    py = await getPyodide();
  } catch (e) {
    return { ok: false, stdout: '', error: 'Python runtime failed to load: ' + (e.message || e) };
  }
  // Redirect stdout/stderr to a buffer.
  py.runPython('import sys, io\n_buf = io.StringIO()\nsys.stdout = _buf\nsys.stderr = _buf');
  let err = null;
  try {
    try { await py.loadPackagesFromImports(code); } catch { /* best-effort package load */ }
    await py.runPythonAsync(code);
  } catch (e) {
    err = String(e.message || e);
  }
  let out = '';
  try { out = py.runPython('_buf.getvalue()'); } catch { /* ignore */ }
  py.runPython('sys.stdout = sys.__stdout__\nsys.stderr = sys.__stderr__');
  return { ok: !err, stdout: out, error: err };
}
