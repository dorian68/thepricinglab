import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const APP_URL = process.env.TPL_FRONTEND_URL || 'http://127.0.0.1:5173';
const THRESHOLD = Number(process.env.TPL_COURSE_LAYOUT_THRESHOLD || '99.98');
const ROOT = process.cwd();
const COURSE_DIR = path.join(ROOT, 'public', 'course-scripts');

const COURSE_ROUTES = [
  ['black-scholes', 'vanilla-options-quote'],
  ['rates-swaps', 'rates-swaps-dv01'],
  ['yield-curves', 'yield-curve-bootstrapping'],
  ['greeks', 'options-book-greeks-pnl'],
  ['implied-vol', 'implied-volatility-smile'],
  ['vol-products', 'implied-volatility-smile'],
  ['hedging', 'options-book-greeks-pnl'],
  ['exotics', 'barrier-options-gap-risk'],
  ['monte-carlo', 'monte-carlo-pricing'],
  ['stochastic', 'stochastic-calculus-for-hedging'],
  ['structured-products', 'structured-products-autocall'],
  ['credit-derivatives', 'credit-derivatives-cds'],
  ['market-risk-var', 'market-risk-var-stress'],
  ['fixed-income-bonds', 'fixed-income-bonds-duration'],
].map(([id, slug]) => ({ id, slug }));

const REQUIRED_SECTIONS = [
  'Promesse du module',
  'Deroule pratique',
  'Cours redige',
  'Blocs interactifs de finance de marche',
  'Exemple numerique resolu',
  'Exercices corriges',
  'Mini-quiz',
  'Sources RAG a citer',
  'Formules de desk',
];

function step(n, what, status, extra = '') {
  console.log(`[STEP ${n}] ${what} · [STATUS] ${status}${extra ? ` · ${extra}` : ''}`);
}

function stripFrontmatter(markdown = '') {
  return markdown.replace(/^---\s*[\s\S]*?\s*---\s*/, '');
}

function markdownSection(markdown, heading) {
  const marker = `## ${heading}`;
  const start = markdown.indexOf(marker);
  if (start === -1) return '';
  const firstLineBreak = markdown.indexOf('\n', start);
  if (firstLineBreak === -1) return '';
  const rest = markdown.slice(firstLineBreak + 1);
  const next = rest.search(/\n##\s+/);
  return (next === -1 ? rest : rest.slice(0, next)).trim();
}

function splitHeadingBlocks(markdown = '', headingRegex) {
  const matches = [...markdown.matchAll(headingRegex)];
  return matches.map((match, index) => {
    const next = matches[index + 1];
    return {
      number: Number(match[1] || index + 1),
      title: (match[2] || match[1] || '').trim(),
      body: markdown.slice((match.index || 0) + match[0].length, next?.index ?? markdown.length).trim(),
    };
  });
}

function wordCount(text = '') {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function sourceMetrics(slug) {
  const file = path.join(COURSE_DIR, `${slug}.md`);
  const markdown = stripFrontmatter(fs.readFileSync(file, 'utf8'));
  const lessonSection = markdownSection(markdown, 'Cours redige');
  const moduleSection = markdownSection(markdown, 'Deroule pratique');
  const lessons = splitHeadingBlocks(lessonSection, /^### Lecon\s+(\d+)\s+-\s+(.+?)\s*\r?\n/gm);
  const modules = splitHeadingBlocks(moduleSection, /^### Module\s+(\d+)\s+-\s+(.+?)\s*\r?\n/gm);
  const uiBlocks = [...markdown.matchAll(/```uiblock\s*([\s\S]*?)```/g)];
  const missingSections = REQUIRED_SECTIONS.filter((heading) => !markdown.includes(`## ${heading}`));
  return {
    slug,
    file,
    lessonCount: lessons.length,
    moduleCount: modules.length,
    firstLessonWords: wordCount(lessons[0]?.body || ''),
    lessonWords: lessons.map((lesson) => wordCount(lesson.body)),
    totalLessonWords: lessons.reduce((sum, item) => sum + wordCount(item.body), 0),
    uiBlockCount: uiBlocks.length,
    missingSections,
  };
}

function chromePath() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  ].filter(Boolean);
  const found = candidates.find((candidate) => fs.existsSync(candidate));
  if (!found) throw new Error('Chrome/Edge executable not found. Set CHROME_PATH.');
  return found;
}

async function waitJson(url, timeoutMs = 10000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return await response.json();
    } catch {
      // retry
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

function cdp(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let id = 0;
    const pending = new Map();
    ws.onopen = () => resolve({
      send(method, params = {}) {
        const message = { id: ++id, method, params };
        ws.send(JSON.stringify(message));
        return new Promise((res, rej) => pending.set(message.id, { res, rej, method }));
      },
      close() {
        ws.close();
      },
    });
    ws.onerror = reject;
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (!message.id || !pending.has(message.id)) return;
      const request = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) request.rej(new Error(`${request.method}: ${message.error.message}`));
      else request.res(message.result);
    };
  });
}

async function waitForReady(dev) {
  const deadline = Date.now() + 8000;
  while (Date.now() < deadline) {
    const ready = await dev.send('Runtime.evaluate', {
      returnByValue: true,
      expression: `Boolean(document.querySelector('.course-written-lesson') && document.querySelectorAll('.course-module-uiblocks .panel').length >= 1)`,
    });
    if (ready.result.value) return;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error('Course reader did not become ready.');
}

async function navigateAndMeasure(dev, courseId, viewport) {
  if (viewport.mobile) {
    await dev.send('Emulation.setDeviceMetricsOverride', {
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: 1,
      mobile: true,
    });
  } else {
    await dev.send('Emulation.clearDeviceMetricsOverride');
  }
  await dev.send('Page.navigate', { url: `${APP_URL}/courses/${courseId}` });
  await waitForReady(dev);
  const result = await dev.send('Runtime.evaluate', {
    returnByValue: true,
    awaitPromise: true,
    expression: `(async () => {
      const words = (s) => (s || '').trim().split(/\\s+/).filter(Boolean).length;
      const genericList = ['Start from a real market task', 'Calculate, check signs', 'Risk snapshot', 'Produce a calculation usable'];
      const measureActive = (index) => {
        const deskTexts = [...document.querySelectorAll('.desk-field p')].map((node) => node.innerText);
        const genericPhrases = genericList.filter((phrase) => deskTexts.some((text) => text.includes(phrase)));
        const interactiveBadges = [...document.querySelectorAll('.course-module-reader .badge')]
          .filter((node) => node.innerText.toLowerCase().includes('interactive'));
        const lesson = document.querySelector('.course-written-lesson');
        return {
          index,
          title: document.querySelector('.course-module-reader h2')?.innerText || '',
          lessonWords: words(lesson?.innerText || ''),
          cockpit: Boolean(document.querySelector('.course-written-lesson-cockpit')),
          situationCards: document.querySelectorAll('.course-written-lesson .lesson-situation-card').length,
          conceptCards: document.querySelectorAll('.course-written-lesson .lesson-concept-card').length,
          equationDemo: Boolean(document.querySelector('.course-written-lesson .course-equation-demo')),
          derivationSteps: document.querySelectorAll('.course-written-lesson .course-derivation-step').length,
          uiBlockPanels: document.querySelectorAll('.course-written-lesson .course-module-uiblocks .panel').length,
          interactiveBadges: interactiveBadges.length,
          equations: document.querySelectorAll('.course-written-lesson .katex-display').length,
          dataTables: document.querySelectorAll('.course-written-lesson table.data').length,
          actionCards: document.querySelectorAll('.course-written-lesson .lesson-action-card').length,
          rawDirectMarkdown: document.querySelectorAll('.course-written-lesson > .course-script-markdown').length,
          genericPhrases,
        };
      };
      window.scrollTo(0, 0);
      await new Promise((resolve) => setTimeout(resolve, 80));
      const initialModuleReader = document.querySelector('.course-module-reader');
      const initialSidebar = document.querySelector('.course-sidebar');
      const initialModuleTop = Math.round(initialModuleReader?.getBoundingClientRect().top || -1);
      const initialSidebarTop = Math.round(initialSidebar?.getBoundingClientRect().top || -1);
      const moduleCount = document.querySelectorAll('.course-lesson-item').length;
      const modules = [];
      for (let index = 0; index < moduleCount; index += 1) {
        const button = document.querySelectorAll('.course-lesson-item')[index];
        const expectedTitle = button?.querySelector('.course-lesson-title')?.innerText || '';
        button?.scrollIntoView({block: 'center'});
        button?.click();
        const deadline = Date.now() + 2500;
        while (Date.now() < deadline) {
          const currentTitle = document.querySelector('.course-module-reader h2')?.innerText || '';
          if (!expectedTitle || currentTitle === expectedTitle) break;
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
        modules.push(measureActive(index));
      }
      const moduleReader = document.querySelector('.course-module-reader');
      const sidebar = document.querySelector('.course-sidebar');
      return {
        activeTab: document.querySelector('.tab-btn.on')?.innerText || '',
        moduleItems: moduleCount,
        modules,
        lessonWords: Math.min(...modules.map((item) => item.lessonWords)),
        uiBlockPanels: Math.min(...modules.map((item) => item.uiBlockPanels)),
        interactiveBadges: Math.min(...modules.map((item) => item.interactiveBadges)),
        equations: Math.min(...modules.map((item) => item.equations)),
        dataTables: Math.min(...modules.map((item) => item.dataTables)),
        genericPhrases: modules.flatMap((item) => item.genericPhrases),
        moduleTop: Math.round(moduleReader?.getBoundingClientRect().top || -1),
        sidebarTop: Math.round(sidebar?.getBoundingClientRect().top || -1),
        initialModuleTop,
        initialSidebarTop,
        viewportWidth: window.innerWidth,
        documentScrollWidth: document.documentElement.scrollWidth,
      };
    })()`,
  });
  return result.result.value;
}

function scoreCourse({ source, desktop, mobile }) {
  const visiblePcts = desktop.modules.map((module, index) => (
    Math.min(100, (module.lessonWords / Math.max(source.lessonWords[index] || source.firstLessonWords, 1)) * 100)
  ));
  const visiblePct = Math.min(...visiblePcts);
  const everyDesktopModule = (predicate) => desktop.modules.length > 0 && desktop.modules.every(predicate);
  const everyMobileModule = (predicate) => mobile.modules.length > 0 && mobile.modules.every(predicate);
  const checks = {
    sourceQuality: source.lessonCount >= 8 && source.moduleCount >= 8 && source.totalLessonWords >= 3000 && source.uiBlockCount >= 5,
    noRubricLoss: source.missingSections.length === 0,
    visibleDepth: visiblePct >= THRESHOLD,
    moduleCount: desktop.moduleItems === source.moduleCount,
    lessonCockpit: everyDesktopModule((module) => module.cockpit && module.situationCards >= 3 && module.conceptCards >= 3),
    equationDemonstration: everyDesktopModule((module) => module.equationDemo && module.derivationSteps >= 3 && module.equations >= 1),
    uiBlocksInWrittenCourse: everyDesktopModule((module) => module.uiBlockPanels >= 2 && module.interactiveBadges >= 2),
    practicalVisual: everyDesktopModule((module) => module.uiBlockPanels >= 2),
    actionCard: everyDesktopModule((module) => module.actionCards >= 1),
    notRawProse: everyDesktopModule((module) => module.rawDirectMarkdown === 0),
    noGenericFallback: desktop.genericPhrases.length === 0,
    mobileOrder: mobile.initialModuleTop > 0 && mobile.initialSidebarTop > 0 && mobile.initialModuleTop < mobile.initialSidebarTop,
    mobileCockpit: everyMobileModule((module) => module.cockpit && module.uiBlockPanels >= 2 && module.equationDemo),
    noHorizontalOverflow:
      desktop.documentScrollWidth <= desktop.viewportWidth + 4 &&
      mobile.documentScrollWidth <= mobile.viewportWidth + 4,
  };
  const failed = Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name);
  const score = failed.length ? Math.max(0, 100 - failed.length * 8) : 100;
  return {
    visiblePct: Number(visiblePct.toFixed(2)),
    minVisiblePct: Number(visiblePct.toFixed(2)),
    checks,
    failed,
    studentPersona: score,
    youngProfessionalPersona: score,
  };
}

async function main() {
  step(1, 'frontend availability', 'running', `[REQUEST] ${APP_URL}/course-scripts/_index.json`);
  const indexResponse = await fetch(`${APP_URL}/course-scripts/_index.json`);
  if (!indexResponse.ok) throw new Error(`Frontend is not serving course scripts: HTTP ${indexResponse.status}`);
  const uniqueSlugs = new Set(COURSE_ROUTES.map((course) => course.slug));
  const sources = Object.fromEntries([...uniqueSlugs].map((slug) => [slug, sourceMetrics(slug)]));
  step(2, 'source course scripts parsed', 'ok', `[OUTPUT] scripts=${uniqueSlugs.size}`);

  const port = 9231 + Math.floor(Math.random() * 200);
  const userDataDir = path.join(ROOT, 'node_modules', '.cache', `course-layout-audit-${port}`);
  const chrome = spawn(chromePath(), [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--disable-background-networking',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    '--window-size=1440,1400',
    'about:blank',
  ], { stdio: 'ignore' });

  try {
    await waitJson(`http://127.0.0.1:${port}/json/version`);
    const tabs = await waitJson(`http://127.0.0.1:${port}/json/list`);
    const tab = tabs.find((item) => item.type === 'page');
    const dev = await cdp(tab.webSocketDebuggerUrl);
    await dev.send('Page.enable');
    await dev.send('Runtime.enable');
    await dev.send('Emulation.setEmulatedMedia', { media: 'screen' });

    const results = [];
    for (const route of COURSE_ROUTES) {
      const desktop = await navigateAndMeasure(dev, route.id, { width: 1440, height: 1400, mobile: false });
      const mobile = await navigateAndMeasure(dev, route.id, { width: 390, height: 1200, mobile: true });
      const source = sources[route.slug];
      const verdict = scoreCourse({ source, desktop, mobile });
      results.push({ route, source, desktop, mobile, verdict });
      step(
        3,
        `layout gate ${route.id}`,
        verdict.failed.length ? 'fail' : 'ok',
        `[OUTPUT] visible=${verdict.visiblePct}% student=${verdict.studentPersona} pro=${verdict.youngProfessionalPersona} failures=${verdict.failed.join(',') || 'none'}`,
      );
    }
    dev.close();

    const failed = results.filter((item) =>
      item.verdict.studentPersona < THRESHOLD ||
      item.verdict.youngProfessionalPersona < THRESHOLD ||
      item.verdict.failed.length
    );
    const aggregate = {
      threshold: THRESHOLD,
      routesAudited: results.length,
      uniqueCourseScripts: uniqueSlugs.size,
      routesPassing: results.length - failed.length,
      studentPersona: failed.length ? Math.min(...results.map((item) => item.verdict.studentPersona)) : 100,
      youngProfessionalPersona: failed.length ? Math.min(...results.map((item) => item.verdict.youngProfessionalPersona)) : 100,
      gate: failed.length ? 'FAIL' : 'PASS',
    };
    console.log(JSON.stringify({ aggregate, failed: failed.map((item) => ({
      id: item.route.id,
      slug: item.route.slug,
      failed: item.verdict.failed,
      desktop: item.desktop,
      mobile: item.mobile,
      source: item.source,
    })) }, null, 2));
    step(4, 'course layout persona gate', failed.length ? 'fail' : 'ok', `[OUTPUT] ${aggregate.gate}`);
    if (failed.length) process.exitCode = 1;
  } finally {
    chrome.kill();
  }
}

main().catch((error) => {
  console.error(`[ERROR] ${error.stack || error.message}`);
  process.exit(1);
});
