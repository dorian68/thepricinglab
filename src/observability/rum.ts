type RumMetric = 'FCP' | 'LCP' | 'CLS' | 'TTFB' | 'INTERACTION';

type LayoutShiftEntry = PerformanceEntry & {
  value?: number;
  hadRecentInput?: boolean;
};

const resolvePublicApiOrigin = (candidate: unknown) => {
  try {
    const url = new URL(String(candidate || ''));
    if (
      url.protocol !== 'https:'
      || url.username
      || url.password
      || !['', '/'].includes(url.pathname)
      || url.search
      || url.hash
      || ['localhost', '127.0.0.1', '::1'].includes(url.hostname)
    ) return '';
    return url.origin;
  } catch {
    return '';
  }
};

const apiOrigin = resolvePublicApiOrigin(import.meta.env.VITE_TPL_RAG_API_URL);
const enabled = (
  import.meta.env.PROD
  && import.meta.env.VITE_TPL_RUM_ENABLED === 'true'
  && Boolean(apiOrigin)
);

const navigationType = () => {
  const entry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  return entry?.type || 'unknown';
};

const normalizeRoute = (rawRoute: string) => {
  const route = rawRoute.replace(/\/{2,}/g, '/').replace(/\/$/, '') || '/';
  const exact = new Set([
    '/', '/pricing', '/starter-kit', '/starter-kit/success', '/starter-kit/cancel',
    '/billing/success', '/billing/cancel', '/courses', '/tools', '/account',
    '/dashboard', '/auth',
  ]);
  if (exact.has(route)) return route;
  if (route.startsWith('/courses/')) return '/courses/:slug';
  if (route.startsWith('/tools/')) return '/tools/:slug';
  return '/other';
};

const initialRoute = normalizeRoute(window.location.pathname || '/');
const sent = new Set<RumMetric>();

const transmit = (metric: RumMetric, value: number) => {
  if (!enabled || sent.has(metric) || !Number.isFinite(value) || value < 0) return;
  sent.add(metric);
  void fetch(`${apiOrigin}/telemetry/rum`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      metric,
      value,
      route: initialRoute,
      navigation_type: navigationType(),
    }),
    credentials: 'omit',
    referrerPolicy: 'no-referrer',
    keepalive: true,
  }).catch(() => undefined);
};

const observe = (type: string, callback: (entries: PerformanceEntry[]) => void) => {
  if (!('PerformanceObserver' in window)) return undefined;
  try {
    const observer = new PerformanceObserver((list) => callback(list.getEntries()));
    observer.observe({ type, buffered: true } as PerformanceObserverInit);
    return observer;
  } catch {
    return undefined;
  }
};

export const startRumMonitoring = () => {
  if (!enabled) return;

  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  if (navigation && navigation.responseStart >= 0) transmit('TTFB', navigation.responseStart);

  observe('paint', (entries) => {
    const fcp = entries.find((entry) => entry.name === 'first-contentful-paint');
    if (fcp) transmit('FCP', fcp.startTime);
  });

  let latestLcp = 0;
  const lcpObserver = observe('largest-contentful-paint', (entries) => {
    const latest = entries.at(-1);
    if (latest) latestLcp = Math.max(latestLcp, latest.startTime);
  });

  let maximumClsWindow = 0;
  let clsWindowValue = 0;
  let clsWindowStart = 0;
  let previousShift = 0;
  const clsObserver = observe('layout-shift', (entries) => {
    for (const entry of entries as LayoutShiftEntry[]) {
      if (entry.hadRecentInput || typeof entry.value !== 'number') continue;
      const continuesWindow = previousShift > 0
        && entry.startTime - previousShift < 1000
        && entry.startTime - clsWindowStart < 5000;
      if (!continuesWindow) {
        clsWindowStart = entry.startTime;
        clsWindowValue = 0;
      }
      clsWindowValue += entry.value;
      maximumClsWindow = Math.max(maximumClsWindow, clsWindowValue);
      previousShift = entry.startTime;
    }
  });

  let maximumInteraction = 0;
  const interactionObserver = observe('event', (entries) => {
    for (const entry of entries) maximumInteraction = Math.max(maximumInteraction, entry.duration || 0);
  });

  const flush = () => {
    if (latestLcp > 0) transmit('LCP', latestLcp);
    transmit('CLS', maximumClsWindow);
    if (maximumInteraction > 0) transmit('INTERACTION', maximumInteraction);
    lcpObserver?.disconnect();
    clsObserver?.disconnect();
    interactionObserver?.disconnect();
  };
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush();
  }, { once: true });
  window.addEventListener('pagehide', flush, { once: true });
};
