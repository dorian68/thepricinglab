import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { getRouteMetadata, resolveApplicationPath, SITE_NAME, SITE_ORIGIN } from '../src/lib/route-metadata.mjs';

const routes = JSON.parse(readFileSync(new URL('../src/seo-routes.json', import.meta.url), 'utf8'));
const source = readFileSync(new URL('../src/claude/ClaudeFrontend.jsx', import.meta.url), 'utf8');
const extensions = readFileSync(new URL('../src/claude/practiceEngine.js', import.meta.url), 'utf8');
const sitemap = readFileSync(new URL('../public/sitemap.xml', import.meta.url), 'utf8');

function registryIds(code, declaration) {
  const body = code.split(declaration)[1]?.split('\n];')[0];
  assert.ok(body, `Missing registry: ${declaration}`);
  return [...body.matchAll(/\bid:\s*'([^']+)'/g)].map((match) => match[1]);
}

test('all 40 published routes preserve their metadata, indexability and sitemap URLs', () => {
  assert.equal(routes.length, 40);
  assert.equal(new Set(routes.map((route) => route.path)).size, 40);
  assert.equal(new Set(routes.map((route) => route.title)).size, 40);
  const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  assert.deepEqual(locations.sort(), routes.map((route) => `${SITE_ORIGIN}${route.path}`).sort());
  for (const route of routes) {
    const metadata = getRouteMetadata(route.path, routes);
    assert.equal(metadata.title, route.title, route.path);
    assert.equal(metadata.description, route.description, route.path);
    assert.equal(metadata.canonical, `${SITE_ORIGIN}${route.path}`, route.path);
    assert.equal(metadata.indexable, true, route.path);
    assert.equal(metadata.notFound, false, route.path);
    assert.match(metadata.robots, /^index, follow/, route.path);
  }
});

test('all real courses, articles and nine tools are distinguished from missing pages', () => {
  const courseIds = [...registryIds(source, 'const COURSES = ['), ...registryIds(extensions, 'export const PRACTICE_COURSE_EXTENSIONS = [')];
  const articleIds = registryIds(source, 'const POSTS = [');
  const toolIds = registryIds(source, 'const TOOLS = [');
  assert.equal(courseIds.length, 14);
  assert.equal(articleIds.length, 6);
  assert.equal(toolIds.length, 9);
  assert.deepEqual(routes.filter((route) => route.path.startsWith('/courses/')).map((route) => route.path.split('/')[2]).sort(), courseIds.sort());
  assert.deepEqual(routes.filter((route) => route.path.startsWith('/blog/')).map((route) => route.path.split('/')[2]).sort(), articleIds.sort());
  for (const [prefix, ids] of [['/courses/', courseIds], ['/blog/', articleIds], ['/tools/', toolIds]]) {
    for (const id of ids) {
      const metadata = getRouteMetadata(`${prefix}${id}`, routes);
      assert.equal(metadata.notFound, false, `${prefix}${id}`);
      assert.equal(metadata.indexable, true, `${prefix}${id}`);
    }
  }
});

test('legacy routes resolve to the same application page and canonical metadata', () => {
  const fixtures = [
    ['/courses/complex/exotic-options', '/courses/exotics'],
    ['/courses/advanced/hedging-strategies', '/courses/hedging'],
    ['/courses/advanced/stochastic-calculus', '/courses/stochastic'],
    ['/courses/fundamentals/rates-swaps', '/courses/rates-swaps'],
    ['/courses/advanced/credit-derivatives', '/courses/credit-derivatives'],
    ['/courses/complex/structured-products', '/courses/structured-products'],
    ['/courses/advanced', '/courses'],
    ['/tools/black-scholes', '/tools/bs-pricer'],
    ['/tools/monte-carlo', '/tools/mc'],
    ['/tools/vol-surface', '/tools/volsurface'],
    ['/VolSurface', '/tools/volsurface'],
    ['/projects', '/community/projects'],
    ['/community/chat', '/community/forum'],
    ['/community/article/example', '/community/publications'],
    ['/community/notebook-workspace', '/notebooks'],
    ['/quant-pro-tools', '/tools'],
    ['/exercices', '/exercises'],
    ['/survival-mode', '/survival'],
    ['/blog/exotic-options-guide', '/blog/understanding-vega'],
    ['/blog/understanding-black-scholes-model', '/blog/understanding-vega'],
  ];
  for (const [requested, expected] of fixtures) {
    assert.equal(resolveApplicationPath(requested), expected, requested);
    const metadata = getRouteMetadata(requested, routes);
    assert.equal(metadata.path, expected, requested);
    assert.equal(metadata.canonical, `${SITE_ORIGIN}${expected}`, requested);
    assert.equal(metadata.indexable, true, requested);
  }
});

test('account and workspace routes stay reachable without becoming homepage search results', () => {
  const paths = ['/login', '/signup', '/auth/login', '/auth/signup', '/auth/reset-password', '/dashboard', '/rapports', '/quizzes', '/admin', '/admin-login', '/admin-dashboard', '/bug', '/practice', '/challenge', '/lab/backtest', '/trading/scenarios', '/survival-mode/wave/advanced', '/exercises/generated-case'];
  for (const path of paths) {
    const metadata = getRouteMetadata(path, routes);
    assert.equal(metadata.indexable, false, path);
    assert.equal(metadata.notFound, false, path);
    assert.equal(metadata.robots, 'noindex, follow', path);
    assert.notEqual(metadata.title, routes[0].title, path);
    assert.equal(metadata.structuredData, null, path);
  }
});

test('unknown pages and missing course/article/tool slugs are noindex with explicit 404 metadata', () => {
  for (const path of ['/404', '/missing-page', '/courses/not-a-course', '/blog/not-an-article', '/tools/not-a-tool', '/notebooks/missing-page', '/courses/constructor', '/tools/__proto__', '/community/toString']) {
    const metadata = getRouteMetadata(path, routes);
    assert.equal(metadata.notFound, true, path);
    assert.equal(metadata.indexable, false, path);
    assert.equal(metadata.robots, 'noindex, follow', path);
    assert.match(metadata.title, /^Page not found/, path);
    assert.equal(metadata.structuredData, null, path);
    assert.equal(metadata.path, path);
  }
});

test('canonical URLs omit query strings and trailing slash duplicates', () => {
  for (const path of ['/courses/?utm_source=example', '/courses///', '/courses#catalogue']) {
    const metadata = getRouteMetadata(path, routes);
    assert.equal(metadata.path, '/courses', path);
    assert.equal(metadata.canonical, `${SITE_ORIGIN}/courses`, path);
  }
  const account = getRouteMetadata('/auth/login?token=private-test-value', routes);
  assert.equal(JSON.stringify(account).includes('private-test-value'), false);
  assert.equal(account.canonical, `${SITE_ORIGIN}/auth/login`);
});

test('identity graph contains only supported facts and coherent public breadcrumbs', () => {
  for (const route of routes) {
    const metadata = getRouteMetadata(route.path, routes);
    const data = JSON.parse(JSON.stringify(metadata.structuredData));
    assert.equal(data['@context'], 'https://schema.org');
    const organization = data['@graph'].find((node) => node['@type'] === 'Organization');
    const website = data['@graph'].find((node) => node['@type'] === 'WebSite');
    const page = data['@graph'].find((node) => node['@type'] === 'WebPage');
    assert.equal(organization.name, SITE_NAME);
    assert.equal(organization.url, `${SITE_ORIGIN}/`);
    assert.deepEqual(Object.keys(organization).sort(), ['@id', '@type', 'name', 'url'].sort());
    assert.equal(website.publisher['@id'], organization['@id']);
    assert.equal(page.isPartOf['@id'], website['@id']);
    assert.equal(page.url, metadata.canonical);
    assert.equal(page.name, metadata.title);
    assert.equal(/sameAs|SearchAction|AggregateRating|Review|EducationalOrganization|foundingDate|priceCurrency/.test(JSON.stringify(data)), false);
    const breadcrumb = data['@graph'].find((node) => node['@type'] === 'BreadcrumbList');
    if (route.path === '/') {
      assert.equal(breadcrumb, undefined);
    } else {
      assert.equal(page.breadcrumb['@id'], breadcrumb['@id']);
      assert.equal(breadcrumb.itemListElement[0].item, `${SITE_ORIGIN}/`);
      assert.equal(breadcrumb.itemListElement.at(-1).item, metadata.canonical);
      breadcrumb.itemListElement.forEach((item, index) => {
        assert.equal(item.position, index + 1);
        assert.ok(routes.some((candidate) => `${SITE_ORIGIN}${candidate.path}` === item.item), item.item);
      });
    }
  }
});

test('public navigation keeps the learning and sign-in journeys while removing admin/error destinations', () => {
  const footer = source.split('function Footer() {')[1].split('function ChatFab() {')[0];
  assert.doesNotMatch(footer, /to="\/(admin|404)"/);
  for (const path of ['/courses', '/tools', '/blog', '/pricing', '/community']) {
    assert.ok(footer.includes(`to="${path}"`), path);
  }
  for (const path of ['/auth/login', '/auth/signup', '/dashboard']) assert.ok(source.includes(`to="${path}"`), path);
});
