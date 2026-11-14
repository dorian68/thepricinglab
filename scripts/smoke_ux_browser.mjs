import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

// Production-preview UX journey. Run `npm run build` first; no auth or fixtures
// are injected: the free starting point must work for a real anonymous visitor.
const baseUrl = 'http://127.0.0.1:4191';
const shots = path.resolve(process.env.TPL_UX_EVIDENCE_DIR || `../../reports/visual-qa-${new Date().toISOString().slice(0, 10)}-brand-navbar`);
const results = [];
let browser;
const server = spawn(process.execPath, [path.resolve('node_modules/vite/bin/vite.js'), 'preview', '--host', '127.0.0.1', '--port', '4191', '--strictPort'], { stdio: ['ignore', 'pipe', 'pipe'] });
let serverError = '';
server.stderr.on('data', (chunk) => { serverError += chunk; });
const serverFailure = new Promise((_, reject) => server.once('error', reject));
const step = async (name, action) => {
  const output = await action();
  results.push({ name, status: 'PASS', output });
  console.log(`[STEP ${results.length}] ${name} · [STATUS] ok · [REQUEST] local production preview · [INPUT] anonymous browser · [OUTPUT] ${output} · [ERROR] none · [NEXT] continue UX journey`);
};
const ready = async () => {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (server.exitCode !== null) throw new Error(`Preview exited: ${serverError}`);
    try { if ((await fetch(baseUrl)).ok) return; } catch (error) {
      if (error.cause?.message === 'bad port') throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('Production preview did not start.');
};

try {
  await Promise.race([ready(), serverFailure]);
  await mkdir(shots, { recursive: true });
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  page.setDefaultTimeout(12_000);
  const pageErrors = [];
  const consoleErrors = [];
  const failedAssets = [];
  const canceledAssets = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('requestfailed', (request) => {
    if (!/\.(js|css)(\?|$)/.test(request.url())) return;
    // This suite deliberately navigates away while lazy chunks may be loading.
    // Verify canceled resources still exist; keep genuine load errors fatal.
    (request.failure()?.errorText === 'net::ERR_ABORTED' ? canceledAssets : failedAssets).push(request.url());
  });
  const go = async (route) => {
    await page.goto(`${baseUrl}${route}`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('heading', { level: 1 }).waitFor();
    await page.locator('header [data-brand-logo]').evaluate(image=>image.decode());
    await page.evaluate(()=>document.fonts.ready);
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
  };

  await step('Clear starting point and quieter hierarchy', async () => {
    await go('/');
    assert.equal(await page.locator('.hero-ctas a').count(), 2);
    assert.equal(await page.locator('.hero-ctas .btn-primary').count(), 1);
    assert.equal(await page.locator('.hero-ctas .btn-primary').getAttribute('href'), '/tools/bs-pricer');
    assert.ok(await page.getByText('Free calculator · no account required', { exact: true }).isVisible());
    const appearance = await page.evaluate(() => {
      const selectors = ['.home-hero', '.hero-left', '.hero-terminal', '.hero-chart-wrap', '.hero-path-stats', '.hero-trust-row span'];
      const framed = selectors.filter((selector) => Array.from(document.querySelectorAll(selector)).some((element) => {
        const style = getComputedStyle(element);
        return ['Top', 'Right', 'Bottom', 'Left'].some((side) => parseFloat(style[`border${side}Width`]) > 0);
      }));
      return {
        framed,
        newsletterAfter: Boolean(document.querySelector('.final-cta-section').compareDocumentPosition(document.querySelector('.home-news-strip')) & Node.DOCUMENT_POSITION_FOLLOWING),
        tickerMotion: getComputedStyle(document.querySelector('.ticker-track')).animationName,
      };
    });
    assert.deepEqual(appearance.framed, []);
    assert.equal(await page.locator('.brand-mark, .brand-wordmark, header .brand svg').count(), 0);
    assert.equal(await page.locator('header [data-brand-logo]').getAttribute('alt'), 'The Pricing Library');
    assert.equal(await page.locator('header [data-brand-logo]').getAttribute('src'), '/brand/thepricinglibrary-horizontal.svg');
    assert.equal(await page.locator('.home-hero').getAttribute('data-hero-layout'),'signature');
    const composition = await page.evaluate(()=>{
      const hero = document.querySelector('.home-hero');
      const intro = hero.querySelector('.hero-left').getBoundingClientRect();
      const visual = hero.querySelector('.hero-demo-stage').getBoundingClientRect();
      const style = getComputedStyle(hero);
      const terminal = getComputedStyle(hero.querySelector('.hero-terminal'));
      return {direction:style.flexDirection, stacked:visual.top>=intro.bottom, width:visual.width/hero.getBoundingClientRect().width, shadow:terminal.boxShadow, background:terminal.backgroundColor};
    });
    assert.equal(composition.direction,'column');
    assert.equal(composition.stacked,true);
    assert.ok(composition.width>=0.95);
    assert.equal(composition.shadow,'none');
    assert.equal(composition.background,'rgba(0, 0, 0, 0)');
    assert.equal(await page.locator('.hero-chart-wrap svg line').count(),0);
    assert.equal(appearance.newsletterAfter, true);
    assert.equal(appearance.tickerMotion, 'none');
    assert.ok(await page.getByText('DETERMINISTIC DEMO', { exact: true }).isVisible());
    assert.ok(await page.getByText('NOT LIVE MARKET DATA', { exact: true }).isVisible());
    assert.ok(await page.getByText('Illustrative scenario · not a market feed', { exact: true }).isVisible());
    return 'two entry actions; one primary; decorative frames absent; newsletter follows value; reduced motion and demo labels preserved';
  });

  await step('Original brand artwork fidelity', async () => {
    const original = await readFile(path.resolve('../../Visuels/ThePricingLibrary_logo.png'));
    const sourceHash = createHash('sha256').update(original).digest('hex');
    const response = await page.request.get(`${baseUrl}/brand/thepricinglibrary.svg`);
    assert.equal(response.status(),200);
    const svg = await response.text();
    assert.ok(Buffer.byteLength(svg)<50_000);
    assert.doesNotMatch(svg,/<script|<foreignObject|https?:\/\/(?!www\.w3\.org)/);
    const metadata = JSON.parse(svg.match(/<metadata>(.*?)<\/metadata>/s)[1]);
    assert.equal(metadata.sha256,sourceHash);
    const horizontalResponse = await page.request.get(`${baseUrl}/brand/thepricinglibrary-horizontal.svg`);
    assert.equal(horizontalResponse.status(),200);
    const horizontal = await horizontalResponse.text();
    const contours = text => [...text.matchAll(/ d="([^"]+)"/g)].flatMap(match=>match[1].match(/M[^M]+/g)).sort();
    assert.deepEqual(contours(horizontal),contours(svg),'Horizontal navbar must reuse every original contour without new glyphs');
    const fidelity = await page.evaluate(async originalUrl=>{
      const originalImage = new Image(); originalImage.src=originalUrl; await originalImage.decode();
      const logo = new Image(); logo.src='/brand/thepricinglibrary.svg'; await logo.decode();
      const pixels = image=>{
        const canvas=document.createElement('canvas');canvas.width=841;canvas.height=401;
        const context=canvas.getContext('2d',{willReadFrequently:true});context.fillStyle='#050d18';context.fillRect(0,0,841,401);
        if(image===originalImage)context.drawImage(image,200,398,841,401,0,0,841,401);else context.drawImage(image,0,0,841,401);
        return context.getImageData(0,0,841,401).data;
      };
      const source=pixels(originalImage),render=pixels(logo);
      const red=(a,i)=>a[i]>100&&a[i]>a[i+1]*1.5&&a[i]>a[i+2]*1.4;
      const white=(a,i)=>Math.min(a[i],a[i+1],a[i+2])>160&&Math.max(a[i],a[i+1],a[i+2])-Math.min(a[i],a[i+1],a[i+2])<50;
      const iou=mask=>{let union=0,intersection=0;for(let i=0;i<source.length;i+=4){const a=mask(source,i),b=mask(render,i);if(a||b)union++;if(a&&b)intersection++;}return intersection/union;};
      return {symbolIoU:iou(red),letterIoU:iou(white)};
    },`data:image/png;base64,${original.toString('base64')}`);
    assert.ok(fidelity.symbolIoU>.98 && fidelity.letterIoU>.98,JSON.stringify(fidelity));
    await writeFile(path.join(shots,'brand-fidelity.json'),JSON.stringify({sourceHash,svgBytes:Buffer.byteLength(svg),...fidelity},null,2));
    return `source SHA verified; SVG=${Buffer.byteLength(svg)} bytes; original symbol/letter contour IoU=${fidelity.symbolIoU.toFixed(4)}/${fidelity.letterIoU.toFixed(4)}`;
  });

  await step('Restored market chart and reproducible paths', async () => {
    assert.ok(await page.locator('[data-hero-market-chart="true"]').isVisible());
    assert.equal(await page.locator('[data-hero-pricer], .hero-pricing-controls, .hero-floating-stat').count(), 0);
    const spot = Number(await page.locator('[data-hero-spot]').getAttribute('data-hero-spot'));
    assert.equal(spot, 5872.34);
    await page.locator('.hero-evidence-details summary').click();
    const stat = async label => Number((await page.locator(`[data-hero-stat="${label}"] strong`).innerText()).replaceAll(',', ''));
    const [open,high,low] = await Promise.all(['Open','High','Low'].map(stat));
    assert.deepEqual([open,high,low],[5153.16,5918.93,5153.16]);
    assert.ok(low <= open && open <= high && low <= spot && spot <= high);
    await page.locator('.hero-evidence-details summary').click();
    const red = page.locator('[data-hero-scenario-path="true"]');
    const reference = page.locator('[data-hero-reference-path="true"]');
    assert.equal(await red.getAttribute('stroke'),'#FF3654');
    assert.equal(await reference.getAttribute('stroke'),'#8C96A6');
    const before = [await red.getAttribute('d'), await reference.getAttribute('d')];
    assert.ok(before.every(value=>value?.startsWith('M ')));
    assert.notEqual(before[0], before[1]);
    await go('/');
    assert.deepEqual([await red.getAttribute('d'), await reference.getAttribute('d')],before);
    assert.equal(Number(await page.locator('[data-hero-spot]').getAttribute('data-hero-spot')),spot);
    return 'two stable SPX price paths restored; headline=5872.34; Open/High/Low bound the same scenario; mini-pricer, sliders and Delta tile absent';
  });

  await step('Keyboard disclosure of chart provenance', async () => {
    const details = page.locator('.hero-evidence-details');
    const summary = details.locator('summary');
    assert.equal(await details.getAttribute('open'), null);
    assert.equal(await page.locator('.hero-secondary-grid').isVisible(), false);
    await summary.focus();
    const focus = await summary.evaluate((element) => ({ width: getComputedStyle(element).outlineWidth, style: getComputedStyle(element).outlineStyle }));
    assert.equal(focus.width, '2px');
    assert.equal(focus.style, 'solid');
    await page.keyboard.press('Enter');
    assert.notEqual(await details.getAttribute('open'), null);
    const evidence = await page.locator('.hero-secondary-grid').innerText();
    assert.match(evidence,/reproducible, simulated paths/);
    assert.match(evidence,/not historical observations or current SPX quotes/);
    assert.match(evidence,/not a forecast/);
    await page.screenshot({ path: path.join(shots, 'after-home-expanded-1440.png'), fullPage: true });
    await page.keyboard.press('Enter');
    assert.equal(await details.getAttribute('open'), null);
    return 'Enter opens/closes chart context; 2px focus; simulated/non-historical/non-live/non-forecast status explicit';
  });

  await step('Anonymous activation from the home action', async () => {
    await page.locator('.hero-ctas .btn-primary').click();
    await page.locator('[data-black-scholes-lab="true"]').waitFor();
    await page.getByRole('button', { name: 'Run pricing analysis', exact: true }).click();
    await page.locator('[data-bs-results="true"]').waitFor();
    const output = await page.locator('[data-bs-results="true"]').innerText();
    assert.match(output, /USD 10\.4506/);
    assert.match(output, /PUT-CALL PARITY\s+PASS/i);
    return 'home CTA reaches the actual free calculator; anonymous ATM call=USD 10.4506 with parity PASS';
  });

  await step('Course search, filters, recovery and free reading', async () => {
    await go('/courses');
    const all = await page.locator('.catalogue-grid .course-card').count();
    assert.equal(all, 12);
    await page.getByRole('button', { name: /^Fundamentals/ }).click();
    const filtered = await page.locator('.catalogue-grid .course-card').count();
    assert.ok(filtered > 0 && filtered < all);
    assert.equal(await page.getByRole('button', { name: /^Fundamentals/ }).getAttribute('aria-pressed'), 'true');
    await page.getByRole('searchbox', { name: 'Search courses' }).fill('no-matching-course-987');
    assert.ok(await page.getByText('No course matches this search.', { exact: true }).isVisible());
    await page.getByRole('button', { name: 'Reset', exact: true }).click();
    assert.equal(await page.locator('.catalogue-grid .course-card').count(), all);
    assert.equal(await page.getByRole('searchbox', { name: 'Search courses' }).inputValue(), '');
    await page.getByRole('link', { name: 'Open free preview', exact: true }).click();
    await page.getByRole('heading', { name: 'Black-Scholes Model', exact: true, level: 1 }).waitFor();
    await page.getByText('Read the option ticket', { exact: true }).first().waitFor();
    assert.ok(await page.getByRole('heading', { name: 'Starter plan required', exact: true }).isVisible());
    return '12 courses; tier filter and announced selection; empty search/reset; real preview opens and full-course entitlement stays explicit';
  });

  await step('Tool discovery and usable category filters', async () => {
    await go('/tools');
    const all = await page.locator('.catalogue-grid .course-card').count();
    assert.equal(all, 9);
    await page.getByRole('button', { name: /^Visualizers/ }).click();
    assert.ok(await page.locator('.catalogue-grid .course-card').count() > 0);
    assert.ok(await page.locator('.catalogue-grid .course-card').count() < all);
    await page.getByRole('button', { name: /^All Tools/ }).click();
    assert.equal(await page.locator('.catalogue-grid .course-card').count(), all);
    assert.ok(await page.getByRole('link', { name: 'Open Black-Scholes', exact: true }).isVisible());
    assert.ok(await page.getByText('Starter required', { exact: true }).first().isVisible());
    return 'nine tools; category filters work; free start and paid requirements remain clear';
  });

  await step('Compact desktop navigation and Explore disclosure', async () => {
    await go('/');
    const trigger = page.getByRole('button', { name: 'Explore', exact: true });
    assert.equal(await page.locator('.nav-links > a').count(), 3);
    await trigger.focus();
    await page.keyboard.press('Enter');
    assert.equal(await trigger.getAttribute('aria-expanded'), 'true');
    assert.equal(await page.locator('.nav-explore-panel a').count(), 5);
    await page.keyboard.press('Tab');
    assert.ok(await page.locator('.nav-explore-panel a').first().evaluate(element=>element===document.activeElement));
    await page.keyboard.press('Escape');
    assert.equal(await trigger.getAttribute('aria-expanded'), 'false');
    assert.ok(await trigger.evaluate(element=>element===document.activeElement));
    await trigger.click();
    await page.getByRole('link', { name: 'Plans & pricing', exact: true }).click();
    await page.waitForURL('**/pricing');
    assert.equal(await page.locator('.nav-explore-panel').count(), 0);
    await trigger.click();
    assert.equal(await page.getByRole('link', { name: 'Plans & pricing', exact: true }).getAttribute('aria-current'), 'page');
    await page.getByRole('heading', { level: 1 }).click();
    assert.equal(await trigger.getAttribute('aria-expanded'), 'false');
    return 'three main destinations; five secondary links; Enter/Tab/Escape/outside click and actual pricing navigation work with active route announced';
  });

  await step('Responsive visual matrix', async () => {
    const matrix = [];
    for (const width of [1440, 1080, 760, 480, 390]) {
      await page.setViewportSize({ width, height: width > 760 ? 1000 : 844 });
      for (const [route, name] of [['/', 'home'], ['/courses', 'courses'], ['/tools', 'tools']]) {
        await go(route);
        const dimensions = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, document: document.documentElement.scrollWidth }));
        assert.deepEqual(dimensions, { viewport: width, document: width }, `${name} overflows at ${width}px`);
        const action = page.locator(route === '/' ? '.hero-ctas .btn-primary' : '.catalogue-start .btn');
        const box = await action.boundingBox();
        assert.ok(box && box.height >= 44 && box.x >= 0 && box.x + box.width <= width, `${name} CTA size/position at ${width}px`);
        if (name === 'home') {
          assert.ok(box.y + box.height < (width > 760 ? 1000 : 844), `primary CTA below first screen at ${width}px`);
          await page.screenshot({ path: path.join(shots, `after-home-${width}-top.png`) });
        }
        await page.screenshot({ path: path.join(shots, `after-${name}-${width}.png`), fullPage: true });
        matrix.push(`${name}@${width}`);
      }
    }
    return `${matrix.length} home/catalogue layouts fit exactly at 1440/1080/760/480/390px; 44px actions; home activation above the fold`;
  });

  await step('Accepted Courbe signature, anchored quote and responsive original branding', async () => {
    const geometryEvidence = [];
    for (const width of [1440,1080,960,800,760,480,390,320]) {
      await page.setViewportSize({width,height:width>760?1100:844});
      await go('/');
      assert.equal(await page.locator('.home-hero').getAttribute('data-hero-layout'),'signature');
      const dimensions = await page.evaluate(()=>({viewport:document.documentElement.clientWidth,document:document.documentElement.scrollWidth,graph:document.querySelector('.hero-chart-wrap').getBoundingClientRect().height,border:getComputedStyle(document.querySelector('.hero-terminal')).borderTopWidth}));
      if(dimensions.document!==width){
        await page.screenshot({path:path.join(shots,`signature-overflow-${width}.png`),fullPage:true});
        await writeFile(path.join(shots,`signature-overflow-${width}.json`),JSON.stringify(await page.evaluate(()=>[...document.querySelectorAll('body *')].filter(e=>!e.closest('.top-strip')&&e.getBoundingClientRect().width>0&&(e.getBoundingClientRect().right>innerWidth+.5||e.getBoundingClientRect().left<-.5)).map(e=>({tag:e.tagName,cls:e.getAttribute('class'),text:e.textContent.slice(0,80),left:e.getBoundingClientRect().left,right:e.getBoundingClientRect().right}))),null,2));
      }
      assert.equal(dimensions.document,width);
      assert.ok(dimensions.graph>150);
      assert.equal(dimensions.border,'0px');
      assert.equal(await page.evaluate(()=>window.scrollY),0);
      const button = await page.locator('.hero-ctas .btn-primary').boundingBox();
      assert.ok(button && button.height>=44 && button.y+button.height<(width>760?1100:844));
      const logo = await page.locator('header [data-brand-logo]').boundingBox();
      assert.ok(logo && logo.width>=180 && logo.height>=22 && logo.width/logo.height>7 && logo.x>=0 && logo.x+logo.width<=width);
      assert.ok((await page.locator('header .brand').boundingBox()).height>=44);
      const geometry = await page.evaluate(()=>{
        const graph = document.querySelector('.hero-chart-wrap');
        const svg = graph.querySelector('svg');
        const marker = svg.querySelector('[data-hero-endpoint]');
        const point = svg.createSVGPoint(); point.x=Number(marker.getAttribute('cx')); point.y=Number(marker.getAttribute('cy'));
        const endpoint = point.matrixTransform(svg.getScreenCTM());
        const box = element=>{const rect=element.getBoundingClientRect();return {left:rect.left,right:rect.right,top:rect.top,bottom:rect.bottom,width:rect.width,height:rect.height};};
        const appearance=getComputedStyle(graph);
        return {width:innerWidth,endpoint:{x:endpoint.x,y:endpoint.y},quote:box(document.querySelector('[data-hero-quote]')),copy:box(document.querySelector('.hero-left')),plot:box(graph),hero:box(document.querySelector('.home-hero')),opacity:appearance.opacity,mask:appearance.maskImage,stroke:getComputedStyle(svg.querySelector('[data-hero-scenario-path]')).strokeWidth};
      });
      assert.equal(geometry.opacity,'1');
      assert.equal(geometry.mask,'none');
      assert.equal(geometry.stroke,'2.6px');
      assert.ok(geometry.plot.top>=geometry.copy.bottom,`Graph crosses intro at ${width}px`);
      assert.ok(geometry.quote.top>=geometry.copy.bottom,`Quote crosses intro at ${width}px`);
      assert.ok(geometry.quote.left>=0&&geometry.quote.right<=width,`Quote clipped at ${width}px`);
      if(width>1000){
        assert.ok(Math.abs(geometry.quote.left-geometry.endpoint.x-16)<2,`Quote not attached to point at ${width}px`);
        assert.ok(Math.abs((geometry.quote.top+geometry.quote.bottom)/2-geometry.endpoint.y)<2,`Quote y anchor drift at ${width}px`);
      } else {
        assert.ok(Math.abs(geometry.quote.right-geometry.endpoint.x)<2,`Mobile quote x anchor drift at ${width}px`);
        assert.ok(Math.abs(geometry.quote.bottom-geometry.endpoint.y+12)<2,`Mobile quote y anchor drift at ${width}px`);
      }
      geometryEvidence.push(geometry);
      await page.screenshot({path:path.join(shots,`home-${width}.png`)});
      await page.locator('header.nav').screenshot({path:path.join(shots,`navbar-${width}.png`)});
    }
    await writeFile(path.join(shots,'signature-geometry.json'),JSON.stringify(geometryEvidence,null,2));
    await page.emulateMedia({reducedMotion:'no-preference'});
    await page.setViewportSize({width:1440,height:1100});
    await go('/');
    await page.locator('.hero-left').evaluate(element=>Promise.all(element.getAnimations().map(animation=>animation.finished)));
    await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
    assert.ok((await page.locator('.hero-chart-wrap').boundingBox()).height>150);
    await page.screenshot({path:path.join(shots,'home-motion-1440.png')});
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.setViewportSize({width:390,height:844});
    await go('/');
    return 'Courbe signature is the default; full-contrast curve, exact endpoint quote anchors and original logo fit 1440/1080/960/800/760/480/390/320px; normal/reduced motion; working calculator and course actions';
  });

  await step('Mobile navigation, focus and assistant clearance', async () => {
    await go('/');
    const trigger = page.getByRole('button', { name: 'Open menu', exact: true });
    const menuBox = await trigger.boundingBox();
    const assistantBox = await page.getByRole('button', { name: "Ouvrir l'assistant", exact: true }).boundingBox();
    assert.ok(menuBox && assistantBox && menuBox.x + menuBox.width <= assistantBox.x);
    await trigger.focus();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog', { name: 'Mobile navigation' });
    await dialog.waitFor();
    assert.equal(await trigger.getAttribute('aria-expanded'), 'true');
    assert.equal(await page.evaluate(() => document.body.style.overflow), 'hidden');
    assert.ok(await dialog.getByRole('button', { name: 'Close menu' }).evaluate((element) => element === document.activeElement));
    const items = dialog.locator('a[href], button:not([disabled])');
    await items.last().focus();
    await page.keyboard.press('Tab');
    assert.ok(await items.first().evaluate((element) => element === document.activeElement));
    await page.keyboard.press('Shift+Tab');
    assert.ok(await items.last().evaluate((element) => element === document.activeElement));
    await page.keyboard.press('Escape');
    assert.equal(await dialog.count(), 0);
    assert.ok(await trigger.evaluate((element) => element === document.activeElement));
    assert.equal(await page.evaluate(() => document.body.style.overflow), '');
    await page.keyboard.press('Enter');
    await dialog.getByRole('link', { name: 'Tools', exact: true }).click();
    await page.getByRole('heading', { name: 'Quantitative Tools', exact: true }).waitFor();
    assert.equal(await dialog.count(), 0);
    await trigger.click();
    assert.equal(await dialog.getByRole('link', { name: 'Tools', exact: true }).getAttribute('aria-current'), 'page');
    await page.keyboard.press('Escape');
    return 'menu and assistant do not overlap; keyboard opens; focus is contained/restored; Escape and route links close; active route announced';
  });

  await step('Runtime integrity', async () => {
    assert.deepEqual(pageErrors, []);
    assert.deepEqual(consoleErrors, []);
    assert.deepEqual(failedAssets, []);
    for (const url of new Set(canceledAssets)) {
      const resource = await page.request.get(url);
      assert.equal(resource.status(),200,`Canceled lazy resource must be available: ${url}`);
      assert.match(resource.headers()['content-type'] || '', /javascript|css/);
    }
    return `zero uncaught page/console errors or failed assets; ${new Set(canceledAssets).size} navigation-canceled lazy resources verified HTTP 200`;
  });
  await writeFile(path.join(shots, 'ux-browser-results.json'), JSON.stringify({ verdict: 'PASS', checkedAt: new Date().toISOString(), scope: 'local production preview, F-WEB-11 accepted Courbe signature and existing brand/free journeys', results }, null, 2));
  console.log('[VERDICT] PASS · F-WEB-11 Courbe signature, anchored price, original artwork and existing journeys verified');
} catch (error) {
  await mkdir(shots, { recursive: true });
  await writeFile(path.join(shots, 'ux-browser-results.json'), JSON.stringify({ verdict: 'FAIL', checkedAt: new Date().toISOString(), results, error: error.message }, null, 2));
  console.error(`[VERDICT] FAIL · ${error.stack}`);
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  if (server.exitCode === null) {
    const stopped = new Promise((resolve) => server.once('exit', resolve));
    server.kill();
    await stopped;
  }
}
