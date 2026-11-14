import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

// Reproducible route inventory, including an explicitly unavailable API fixture.
// This is local UX evidence; fixture identities never reach a real service.
const phase = process.argv.find((arg) => arg.startsWith('--phase='))?.split('=')[1] || 'after';
if (!['before', 'after'].includes(phase)) throw new Error('Unknown audit phase');
const base = process.env.TPL_AUDIT_BASE_URL || 'http://127.0.0.1:5173';
const output = path.resolve('../../reports/visual-qa-2026-11-09-delivery', phase);
await mkdir(output, { recursive: true });
const publicRoutes = ['/', '/courses', '/courses/black-scholes', '/courses/yield-curves', '/courses/implied-vol', '/courses/exotics', '/courses/not-a-course', '/tools', '/tools/bs-pricer', '/tools/payoff', '/tools/mc', '/tools/iv-calc', '/tools/calib', '/tools/binomial', '/tools/bond', '/tools/curve', '/tools/volsurface', '/tools/not-a-tool', '/exercises', '/lab', '/survival', '/community', '/blog', '/blog/not-an-article', '/dashboard', '/pricing', '/auth/login', '/auth/signup', '/auth/forgot-password', '/practice', '/challenge', '/leaderboard', '/notebooks', '/mentoring', '/jobs', '/bug', '/api', '/admin', '/starter-kit', '/starter-kit/success', '/starter-kit/cancel', '/billing/success', '/billing/cancel', '/terms', '/privacy', '/refund', '/legal', '/contact', '/about', '/cancel', '/not-a-page'];
const memberRoutes = ['/exercises', '/exercises/not-an-exercise', '/lab', '/lab/scenarios', '/lab/strategies', '/lab/performance', '/community/forum', '/survival', '/survival/beginner', '/notebooks', '/dashboard', '/api', '/agent-room'];
const reports = [];
const browser = await chromium.launch({ headless: true });
const now = Math.floor(Date.now() / 1000);
const uid = '00000000-0000-4000-8000-000000000031';
const supabase = 'https://kjybaatgyigpqyywlmnw.supabase.co';
const user = { id: uid, aud: 'authenticated', role: 'authenticated', email: 'audit@example.test', app_metadata: { provider: 'email', providers: ['email'] }, user_metadata: { prenom: 'Audit', nom: 'Local' }, identities: [], created_at: '2026-11-09T00:00:00Z' };
const encode = (v) => Buffer.from(JSON.stringify(v)).toString('base64url');
const token = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: uid, exp: now + 3600, aud: 'authenticated', iss: `${supabase}/auth/v1`, role: 'authenticated', email: user.email })}.local-fixture`;
try {
  for (const role of ['anonymous', 'pro']) {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    if (role === 'pro') await context.addInitScript(({ session, key }) => {
      localStorage.setItem(key, JSON.stringify(session));
      localStorage.setItem(`${key}-user`, JSON.stringify({ user: session.user }));
    }, { key: 'sb-kjybaatgyigpqyywlmnw-auth-token', session: { access_token: token, refresh_token: 'local-fixture', expires_at: now + 3600, expires_in: 3600, token_type: 'bearer', user } });
    await context.route(`${supabase}/**`, (route) => route.fulfill({ status: 200, json: new URL(route.request().url()).pathname.startsWith('/rest/v1/profiles') ? { id: uid, prenom: 'Audit', role: 'user' } : user, headers: { 'Access-Control-Allow-Origin': base, 'Access-Control-Allow-Headers': 'authorization, apikey, content-type, content-profile, x-client-info', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' } }));
    await context.route(/^(?:http:\/\/127\.0\.0\.1:8000|https:\/\/tpl-api\.optiquant-ia\.com)\//, (route) => {
      const headers = { 'Access-Control-Allow-Origin': base, 'Access-Control-Allow-Headers': 'authorization, apikey, content-type, content-profile, x-client-info', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' };
      if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
      if (new URL(route.request().url()).pathname === '/billing/entitlement') return route.fulfill({ status: 200, headers, json: { active: role === 'pro', plan: role === 'pro' ? 'pro' : 'free' } });
      return route.fulfill({ status: 503, headers, json: { detail: 'Audit fixture: service temporarily unavailable' } });
    });
    const page = await context.newPage();
    let errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      for (const route of role === 'anonymous' ? publicRoutes : memberRoutes) {
        errors = [];
        await page.goto(`${base}${route}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.locator('[data-screen-label]').waitFor({ timeout: 10000 }).catch((error) => errors.push(error.message));
        await page.waitForTimeout(600);
        const data = await page.evaluate(() => {
          const visible = (node) => node.getClientRects().length && getComputedStyle(node).visibility !== 'hidden';
          const name = (node) => node.getAttribute('aria-label') || (node.getAttribute('aria-labelledby') || '').split(/\s+/).map((id) => document.getElementById(id)?.textContent || '').join(' ').trim() || [...(node.labels || [])].map((label) => label.textContent).join(' ').trim() || node.getAttribute('title') || '';
          const inputs = [...document.querySelectorAll('input:not([type=hidden]), select, textarea')].filter(visible);
          return {
            title: document.title,
            headings: [...document.querySelectorAll('h1')].filter(visible).map((node) => node.textContent.trim()),
            mainCount: document.querySelectorAll('main, [role=main]').length,
            width: document.documentElement.clientWidth,
            scrollWidth: document.documentElement.scrollWidth,
            unlabelled: inputs.filter((node) => !name(node)).map((node) => ({ tag: node.tagName, type: node.type, placeholder: node.getAttribute('placeholder') })),
            unnamedButtons: [...document.querySelectorAll('button')].filter(visible).filter((node) => !name(node) && !node.textContent.trim()).length,
            brokenImages: [...document.images].filter((img) => !img.complete || img.naturalWidth === 0).map((img) => img.getAttribute('src')),
            links: [...new Set([...document.querySelectorAll('a[href]')].map((node) => node.getAttribute('href')))],
            text: (document.querySelector('main') || document.querySelector('.page') || document.body).innerText.slice(0, 20000),
          };
        });
        const slug = `${role}-${width}-${route.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'home'}`;
        await page.screenshot({ path: path.join(output, `${slug}.png`), fullPage: false, timeout: 10000 });
        const issues = [];
        if (data.headings.length !== 1) issues.push('one-h1');
        if (data.mainCount !== 1) issues.push('one-main');
        if (data.scrollWidth > width + 1) issues.push('horizontal-overflow');
        if (data.unlabelled.length) issues.push('unlabelled-controls');
        if (data.unnamedButtons) issues.push('unnamed-buttons');
        if (data.brokenImages.length) issues.push('broken-images');
        if (errors.length) issues.push('runtime-errors');
        reports.push({ route, role, viewport: width, api: '503 fixture', screenshot: `${slug}.png`, issues, errors: [...errors], ...data });
        await writeFile(path.join(output, 'route-audit.json'), JSON.stringify({ checkedAt: new Date().toISOString(), phase, inProgress: true, pages: reports }, null, 2));
        console.log(`${role} ${width} ${route}: ${issues.join(', ') || 'PASS'}`);
      }
    }
    await context.close();
  }
} finally { await browser.close(); }
const result = { checkedAt: new Date().toISOString(), base, phase, scope: 'Active routes, anonymous and local Pro fixture; API unavailable; 1440/390 px. No real Supabase, billing or public deployment proof.', totals: { pages: reports.length, pagesWithIssues: reports.filter((r) => r.issues.length).length }, pages: reports };
await writeFile(path.join(output, 'route-audit.json'), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result.totals));
if (phase === 'after' && result.totals.pagesWithIssues) process.exitCode = 1;
