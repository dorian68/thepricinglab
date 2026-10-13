import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import routes from '../seo-routes.json';

const site = 'https://thepricinglibrary.com';
const fallback = routes[0];
const courseAliases: Record<string, string> = {
  'exotic-options': 'exotics',
  'stochastic-calculus': 'stochastic',
  'hedging-strategies': 'hedging',
};
const aliases: Record<string, string> = {
  '/survival-mode': '/survival',
  '/projects': '/community/projects',
  '/tools/black-scholes': '/tools/bs-pricer',
  '/tools/monte-carlo': '/tools/mc',
  '/tools/volatility-calculator': '/tools/iv-calc',
  '/tools/model-calibration': '/tools/calib',
  '/tools/payoff-visualizer': '/tools/payoff',
  '/courses/complex/exotic-options': '/courses/exotics',
  '/blog/understanding-black-scholes-model': '/blog/understanding-vega',
  '/blog/monte-carlo-vs-binomial-trees': '/blog/understanding-vega',
  '/blog/quant-interview-questions': '/blog/understanding-vega',
  '/blog/exotic-options-guide': '/blog/understanding-vega',
  '/blog/implied-volatility-options-trading': '/blog/understanding-vega',
  '/blog/yield-curves-guide': '/blog/understanding-vega',
  '/blog/greeks-explained': '/blog/understanding-vega',
  '/blog/vol-products': '/blog/understanding-vega',
};

export default function RouteMetadata() {
  const { pathname } = useLocation();

  useEffect(() => {
    const requestedPath = pathname === '/' ? '/' : pathname.replace(/\/+$/, '');
    const course = requestedPath.match(/^\/courses\/(?:fundamentals\/|advanced\/|complex\/)?([^/]+)$/);
    const path = aliases[requestedPath] ?? (course ? `/courses/${courseAliases[course[1]] ?? course[1]}` : requestedPath);
    const route = routes.find((item) => item.path === path) ?? fallback;
    const canonical = `${site}${path}`;
    document.title = route.title;

    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (description) description.content = route.description;

    let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = canonical;

    for (const [selector, value] of [
      ['meta[property="og:url"]', canonical],
      ['meta[name="twitter:url"]', canonical],
      ['meta[property="og:title"]', route.title],
      ['meta[name="twitter:title"]', route.title],
      ['meta[property="og:description"]', route.description],
      ['meta[name="twitter:description"]', route.description],
    ] as const) {
      const element = document.querySelector<HTMLMetaElement>(selector);
      if (element) element.content = value;
    }
  }, [pathname]);

  return null;
}
