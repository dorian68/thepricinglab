export const SITE_ORIGIN = 'https://thepricinglibrary.com';
export const SITE_NAME = 'The Pricing Library';

const own = (entries, key) => Object.prototype.hasOwnProperty.call(entries, key) ? entries[key] : undefined;

const courseAliases = {
  'black-scholes': 'black-scholes',
  'yield-curves': 'yield-curves',
  greeks: 'greeks',
  'implied-vol': 'implied-vol',
  'vol-products': 'vol-products',
  'exotic-options': 'exotics',
  exotics: 'exotics',
  'monte-carlo': 'monte-carlo',
  'stochastic-calculus': 'stochastic',
  stochastic: 'stochastic',
  'hedging-strategies': 'hedging',
  hedging: 'hedging',
  'rates-swaps': 'rates-swaps',
  'credit-derivatives': 'credit-derivatives',
  'market-risk-var': 'market-risk-var',
  'structured-products': 'structured-products',
  'fixed-income-bonds': 'fixed-income-bonds',
};

const toolAliases = {
  'black-scholes': 'bs-pricer',
  'bs-pricer': 'bs-pricer',
  'payoff-visualizer': 'payoff',
  payoff: 'payoff',
  'monte-carlo': 'mc',
  mc: 'mc',
  'model-calibration': 'calib',
  calib: 'calib',
  'volatility-calculator': 'iv-calc',
  'iv-calc': 'iv-calc',
  'vol-surface': 'volsurface',
  volsurface: 'volsurface',
  binomial: 'binomial',
  bond: 'bond',
  curve: 'curve',
};

const pathAliases = {
  '/login': '/auth/login',
  '/signup': '/auth/signup',
  '/bug-report': '/bug',
  '/api-docs': '/api',
  '/admin-login': '/admin',
  '/admin-dashboard': '/admin',
  '/exercices': '/exercises',
  '/survival-mode': '/survival',
  '/labo-trading': '/lab',
  '/quant-pro-tools': '/tools',
  '/rapports': '/dashboard',
  '/vol-surface': '/tools/volsurface',
  '/VolSurface': '/tools/volsurface',
  '/courses/fundamentals': '/courses',
  '/courses/advanced': '/courses',
  '/courses/complex': '/courses',
  '/quizzes': '/dashboard',
  '/projects': '/community/projects',
  '/community/notebook-workspace': '/notebooks',
};

// These historical URLs already displayed the first article. Resolve the
// application route as well as its canonical, so the two cannot disagree.
const legacyArticleAliases = [
  'understanding-black-scholes-model',
  'monte-carlo-vs-binomial-trees',
  'quant-interview-questions',
  'exotic-options-guide',
  'implied-volatility-options-trading',
  'yield-curves-guide',
  'greeks-explained',
  'vol-products',
];

// These existing public screens are outside the curated 40-URL sitemap.
// Preserve their visibility and give them accurate metadata, rather than
// mistaking a missing sitemap entry for a missing application route.
const additionalPublicRoutes = [
  { path: '/tools/binomial', title: 'Binomial Tree', description: 'View the Binomial Tree tool and its Pro access requirements on The Pricing Library.' },
  { path: '/tools/volsurface', title: 'Vol Surface Explorer', description: 'View the Vol Surface Explorer and its Pro access requirements on The Pricing Library.' },
  { path: '/tools/bond', title: 'Bond Calculator', description: 'View the Bond Calculator and its Pro access requirements on The Pricing Library.' },
  { path: '/tools/curve', title: 'Yield Curve Builder', description: 'View the Yield Curve Builder and its Pro access requirements on The Pricing Library.' },
  { path: '/community/publications', title: 'Community Publications', description: 'Explore publications shared in The Pricing Library community.' },
  { path: '/api', title: 'API Documentation', description: 'Read the API documentation available on The Pricing Library.' },
].map((route) => ({ ...route, title: `${route.title} | ${SITE_NAME}` }));

const utilityTitles = {
  '/auth': 'Account access',
  '/auth/login': 'Log in',
  '/auth/signup': 'Create an account',
  '/dashboard': 'Your dashboard',
  '/admin': 'Administration',
  '/bug': 'Report a bug',
  '/practice': 'Practice workspace',
  '/challenge': 'Challenge workspace',
};

export function normalizePath(rawPath) {
  const path = String(rawPath || '/').split(/[?#]/, 1)[0].replace(/\/+$/, '');
  return path || '/';
}

export function resolveApplicationPath(rawPath) {
  const path = normalizePath(rawPath);
  const parts = path.split('/').filter(Boolean);
  if (own(pathAliases, path)) return pathAliases[path];

  if (path.startsWith('/survival-mode/wave/')) return `/survival/${parts[2] || 'advanced'}`;
  if (path.startsWith('/survival-mode/')) return `/survival/${parts[1] || 'advanced'}`;
  if (path.startsWith('/community/article/')) return '/community/publications';
  if (path.startsWith('/community/strategy/')) return '/community/projects';

  if (parts[0] === 'courses' && parts.length > 1) {
    const slug = own(courseAliases, parts[parts.length - 1]);
    if (slug) return `/courses/${slug}`;
  }
  if (parts[0] === 'tools' && parts.length > 1) {
    const slug = own(toolAliases, parts[parts.length - 1]);
    if (slug) return `/tools/${slug}`;
  }
  if (parts[0] === 'blog' && parts.length === 2 && legacyArticleAliases.includes(parts[1])) {
    return '/blog/understanding-vega';
  }
  if (parts[0] === 'trading') {
    return `/lab/${parts[1] === 'exercises' ? 'exercises' : (parts[1] || 'backtest')}`;
  }
  if (parts[0] === 'community') {
    const aliases = {
      chat: 'forum', forum: 'forum', contribute: 'publications',
      explore: 'publications', playground: 'projects',
      'strategy-builder': 'projects', 'pair-programming': 'forum',
      'weekly-challenge': 'forum',
    };
    if (own(aliases, parts[1])) return `/community/${aliases[parts[1]]}`;
  }
  return path;
}

function utilityTitle(path) {
  if (utilityTitles[path]) return utilityTitles[path];
  if (/^\/auth(?:\/|$)/.test(path)) return 'Account access';
  if (/^\/admin(?:\/|$)/.test(path)) return 'Administration';
  if (/^\/lab\/(backtest|scenarios|strategies|performance|exercises)$/.test(path)) return 'Trading Lab workspace';
  if (/^\/exercises\/[^/]+$/.test(path)) return 'Exercise workspace';
  if (/^\/survival\/[^/]+$/.test(path)) return 'Survival practice';
  return null;
}

const breadcrumbName = (title) => title.replace(/\s*\|\s*The Pricing Library$/, '');

function structuredData(route, publicRoutes) {
  const canonical = `${SITE_ORIGIN}${route.path}`;
  const organizationId = `${SITE_ORIGIN}/#organization`;
  const websiteId = `${SITE_ORIGIN}/#website`;
  const pageId = `${canonical}#webpage`;
  const graph = [
    { '@type': 'Organization', '@id': organizationId, name: SITE_NAME, url: `${SITE_ORIGIN}/` },
    { '@type': 'WebSite', '@id': websiteId, name: SITE_NAME, url: `${SITE_ORIGIN}/`, inLanguage: 'en', publisher: { '@id': organizationId } },
    { '@type': 'WebPage', '@id': pageId, url: canonical, name: route.title, description: route.description, inLanguage: 'en', isPartOf: { '@id': websiteId }, publisher: { '@id': organizationId } },
  ];

  if (route.path !== '/') {
    const parts = route.path.split('/').filter(Boolean);
    const ancestors = parts.slice(0, -1).map((_, index) => `/${parts.slice(0, index + 1).join('/')}`);
    const crumbs = [
      { name: 'Home', item: `${SITE_ORIGIN}/` },
      ...ancestors.map((path) => publicRoutes.find((item) => item.path === path)).filter(Boolean)
        .map((item) => ({ name: breadcrumbName(item.title), item: `${SITE_ORIGIN}${item.path}` })),
      { name: breadcrumbName(route.title), item: canonical },
    ];
    const breadcrumbId = `${canonical}#breadcrumb`;
    graph[2].breadcrumb = { '@id': breadcrumbId };
    graph.push({
      '@type': 'BreadcrumbList', '@id': breadcrumbId,
      itemListElement: crumbs.map((item, index) => ({ '@type': 'ListItem', position: index + 1, ...item })),
    });
  }
  return { '@context': 'https://schema.org', '@graph': graph };
}

export function getRouteMetadata(rawPath, routes) {
  const path = resolveApplicationPath(rawPath);
  const publicRoutes = [...routes, ...additionalPublicRoutes];
  const route = publicRoutes.find((item) => item.path === path);
  if (route) {
    return {
      ...route, canonical: `${SITE_ORIGIN}${path}`, indexable: true, notFound: false,
      robots: 'index, follow, max-image-preview:large', structuredData: structuredData(route, publicRoutes),
    };
  }

  const title = utilityTitle(path);
  return {
    path, canonical: `${SITE_ORIGIN}${path}`, indexable: false, notFound: !title,
    title: `${title || 'Page not found'} | ${SITE_NAME}`,
    description: title ? `Access the ${title.toLowerCase()} on ${SITE_NAME}.` : `This page is not available. Explore the courses, tools and articles on ${SITE_NAME}.`,
    robots: 'noindex, follow', structuredData: null,
  };
}
