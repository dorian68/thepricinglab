import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import routes from '../seo-routes.json';
import { getRouteMetadata } from '../lib/route-metadata.mjs';

function setMeta(attribute: 'name' | 'property', key: string, content: string) {
  const matches = [...document.querySelectorAll<HTMLMetaElement>(`meta[${attribute}="${key}"]`)];
  const element = matches.shift() || document.createElement('meta');
  element.setAttribute(attribute, key);
  element.content = content;
  if (!element.parentNode) document.head.appendChild(element);
  matches.forEach((duplicate) => duplicate.remove());
}

export default function RouteMetadata() {
  const { pathname } = useLocation();

  useEffect(() => {
    const route = getRouteMetadata(pathname, routes);
    document.title = route.title;
    setMeta('name', 'description', route.description);
    setMeta('name', 'robots', route.robots);

    let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = route.canonical;
    document.querySelectorAll('link[rel="canonical"]').forEach((duplicate) => {
      if (duplicate !== link) duplicate.remove();
    });

    setMeta('property', 'og:url', route.canonical);
    setMeta('name', 'twitter:url', route.canonical);
    setMeta('property', 'og:title', route.title);
    setMeta('name', 'twitter:title', route.title);
    setMeta('property', 'og:description', route.description);
    setMeta('name', 'twitter:description', route.description);

    const existing = document.getElementById('tpl-route-structured-data');
    if (route.structuredData) {
      const script = existing || document.createElement('script');
      script.id = 'tpl-route-structured-data';
      script.setAttribute('type', 'application/ld+json');
      script.textContent = JSON.stringify(route.structuredData);
      if (!script.parentNode) document.head.appendChild(script);
    } else {
      existing?.remove();
    }
  }, [pathname]);

  return null;
}
