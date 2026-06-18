// Tool control channel — lets the AG-UI agent drive the on-page interactive
// tools (BS pricer, payoff, Monte Carlo, ...) whose parameters live in local
// React useState. Each tool registers an `apply(params)` handler on mount via
// `useToolRegister`; the agent dispatches `app.tool.set_params` → setToolParams.
//
// Non-sensitive by design: this only writes UI parameters, never app data.
import { useEffect, useRef } from 'react';

const registry = new Map();   // toolId -> { apply, getParams }
const snapshot = new Map();   // toolId -> latest params object (for context)
const pending = new Map();    // toolId -> params queued until the tool mounts
const subs = new Set();       // change listeners

function emit() {
  subs.forEach((fn) => { try { fn(); } catch { /* ignore */ } });
}

export function subscribe(fn) {
  subs.add(fn);
  return () => subs.delete(fn);
}

export function registerTool(id, handlers) {
  registry.set(id, handlers);
  if (pending.has(id)) {
    const queued = pending.get(id);
    pending.delete(id);
    try { handlers.apply(queued); } catch { /* ignore */ }
  }
  emit();
  return () => {
    if (registry.get(id) === handlers) registry.delete(id);
    emit();
  };
}

export function publishParams(id, params) {
  snapshot.set(id, params);
}

export function getToolParams(id) {
  const h = registry.get(id);
  if (h && h.getParams) { try { return h.getParams(); } catch { /* ignore */ } }
  return snapshot.get(id) || null;
}

export function isToolMounted(id) {
  return registry.has(id);
}

// Returns true if applied immediately, false if queued until the tool mounts
// (the agent navigates first, then the tool registers and the queued params
// are applied automatically).
export function setToolParams(id, params) {
  const h = registry.get(id);
  if (h && h.apply) { h.apply(params); return true; }
  pending.set(id, params);
  return false;
}

// React hook used inside each tool component.
//   id:      tool identifier (e.g. 'bs-pricer')
//   params:  plain object of the tool's current values (for page context)
//   setters: map of paramKey -> setter function
export function useToolRegister(id, params, setters) {
  const paramsRef = useRef(params);
  paramsRef.current = params;
  const settersRef = useRef(setters);
  settersRef.current = setters;

  // Keep the context snapshot fresh when params change.
  useEffect(() => { publishParams(id, paramsRef.current); }, [id, JSON.stringify(params)]);

  // Register the imperative apply() handler once per mounted tool.
  useEffect(() => {
    const apply = (incoming) => {
      if (!incoming || typeof incoming !== 'object') return;
      Object.entries(incoming).forEach(([k, v]) => {
        const fn = settersRef.current[k];
        if (typeof fn === 'function') fn(v);
      });
    };
    const getParams = () => paramsRef.current;
    return registerTool(id, { apply, getParams });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
}
