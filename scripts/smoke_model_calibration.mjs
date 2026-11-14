import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  MODEL_CALIBRATION_VERSION,
  MAX_SURFACE_POINTS,
  black76Call,
  calibrateVolatilityModel,
  generateSyntheticVolatilitySurface,
  hestonForwardCall,
  impliedBlackVolatility,
  parseVolatilitySurfaceCsv,
  sabrHaganLognormalVolatility,
} from '../src/lib/modelCalibration.mjs';

const step = async (number, name, input, action, next) => {
  try {
    const output = await action();
    console.log(`[STEP ${number}] ${name} · [STATUS] ok · [REQUEST] local calibration engine · [INPUT] ${input} · [OUTPUT] ${output} · [ERROR] none · [NEXT] ${next}`);
  } catch (error) {
    console.error(`[STEP ${number}] ${name} · [STATUS] fail · [REQUEST] local calibration engine · [INPUT] ${input} · [OUTPUT] none · [ERROR] ${error instanceof Error ? error.message : String(error)} · [NEXT] release blocked`);
    throw error;
  }
};

await step(1, 'Black-76 golden value and implied-vol inversion', 'F=100 K=100 T=1 sigma=20%', () => {
  const price = black76Call(100, 100, 1, 0.2);
  assert.ok(Math.abs(price - 7.965579) < 2e-6, `unexpected Black price ${price}`);
  const implied = impliedBlackVolatility(price, 100, 100, 1);
  assert.ok(Math.abs(implied - 0.2) < 1e-8, `unexpected implied volatility ${implied}`);
  return `price=${price.toFixed(6)}, impliedVol=${implied.toFixed(8)}`;
}, 'verify model formulas');

await step(2, 'SABR Hagan golden point', 'F=K=1 T=1 alpha=.2 beta=.72 rho=-.28 nu=.48', () => {
  const value = sabrHaganLognormalVolatility(1, 1, 1, { alpha: 0.2, beta: 0.72, rho: -0.28, nu: 0.48 });
  assert.ok(Math.abs(value - 0.20244686933333336) < 1e-12, `unexpected SABR volatility ${value}`);
  return `impliedVol=${value.toFixed(12)}`;
}, 'verify deterministic surface generation');

await step(3, 'Heston characteristic-function golden price', 'F=K=100 T=1 v0=.04 kappa=2 theta=.04 sigma=.3 rho=-.7', () => {
  const price = hestonForwardCall(100, 100, 1, { v0: 0.04, kappa: 2, theta: 0.04, sigma: 0.3, rho: -0.7 }, { upper: 120, intervals: 256 });
  assert.ok(Math.abs(price - 7.61573) < 2e-4, `unexpected Heston price ${price}`);
  return `price=${price.toFixed(6)}`;
}, 'verify calibration reproducibility');

await step(4, 'Deterministic calibration and fit improvement', '45-point synthetic SABR surface, Black/SABR/Heston', () => {
  const surface = generateSyntheticVolatilitySurface();
  assert.equal(surface.length, 45);
  const black = calibrateVolatilityModel('black', surface);
  const sabrFirst = calibrateVolatilityModel('sabr', surface);
  const sabrSecond = calibrateVolatilityModel('sabr', surface);
  const hestonFirst = calibrateVolatilityModel('heston', surface);
  const hestonSecond = calibrateVolatilityModel('heston', surface);
  assert.deepEqual(sabrFirst.parameters, sabrSecond.parameters, 'SABR parameters changed across identical runs');
  assert.deepEqual(hestonFirst.parameters, hestonSecond.parameters, 'Heston parameters changed across identical runs');
  assert.equal(sabrFirst.rmse, sabrSecond.rmse, 'SABR RMSE changed across identical runs');
  assert.equal(hestonFirst.rmse, hestonSecond.rmse, 'Heston RMSE changed across identical runs');
  assert.ok(sabrFirst.rmse < 0.001, `SABR RMSE too high: ${sabrFirst.rmse}`);
  assert.ok(sabrFirst.rmse < black.rmse * 0.1, 'SABR did not materially improve over flat Black');
  assert.ok(hestonFirst.rmse < black.rmse, 'Heston did not improve over flat Black');
  assert.equal(sabrFirst.diagnostics.converged, true, 'SABR exhausted its iteration budget');
  assert.equal(hestonFirst.diagnostics.converged, true, 'Heston exhausted its iteration budget');
  for (const [parameter, value] of Object.entries(hestonFirst.parameters)) {
    const [lower, upper] = hestonFirst.parameterBounds[parameter];
    assert.ok(value >= lower && value <= upper, `${parameter} escaped its bounds`);
  }
  return `Black=${black.rmse.toFixed(6)}, SABR=${sabrFirst.rmse.toFixed(6)}, Heston=${hestonFirst.rmse.toFixed(6)}, converged=true`;
}, 'validate the CSV contract');

await step(5, 'CSV parsing and adversarial validation', 'comma/semicolon files plus duplicate/bad data', () => {
  const comma = parseVolatilitySurfaceCsv('strike,maturity,impliedVol,forward,weight\n0.9,1,0.22,1,2\n0.95,1,0.21,1,1\n1,1,0.20,1,1\n1.05,1,0.205,1,1\n1.1,1,0.215,1,2');
  const semicolon = parseVolatilitySurfaceCsv('moneyness;tenor;iv\n0.9;1;0.22\n0.95;1;0.21\n1;1;0.20\n1.05;1;0.205\n1.1;1;0.215');
  assert.equal(comma.length, 5);
  assert.equal(semicolon[0].forward, 1);
  assert.throws(() => parseVolatilitySurfaceCsv('strike,maturity,impliedVol\n1,1,0.2\n1,1,0.2\n0.9,1,0.21\n1.1,1,0.22\n1.2,1,0.23'), /duplicates/);
  assert.throws(() => parseVolatilitySurfaceCsv('strike,maturity,impliedVol\n0.8,1,0.2\n0.9,1,-0.1\n1,1,0.2\n1.1,1,0.2\n1.2,1,0.2'), /implied volatility/);
  const oversized = ['strike,maturity,impliedVol', ...Array.from({ length: MAX_SURFACE_POINTS + 1 }, (_, index) => `${0.5 + index / 1000},1,0.2`)].join('\n');
  assert.throws(() => parseVolatilitySurfaceCsv(oversized), /at most 250/);
  return 'valid=2, rejected=3, defaultForward=1, pointCap=250';
}, 'audit the browser adapter for fake behavior');

await step(6, 'Browser source trust contract', `engine=${MODEL_CALIBRATION_VERSION}`, async () => {
  const component = await readFile(new URL('../src/components/tools/ModelCalibration.tsx', import.meta.url), 'utf8');
  const engine = await readFile(new URL('../src/lib/modelCalibration.mjs', import.meta.url), 'utf8');
  const sampleCsv = await readFile(new URL('../public/examples/tpl-volatility-surface-example.csv', import.meta.url), 'utf8');
  const activeApp = await readFile(new URL('../src/claude/ClaudeFrontend.jsx', import.meta.url), 'utf8');
  const applicationShell = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8');
  assert.ok(!component.includes('Math.random'), 'browser calibration still uses Math.random');
  assert.ok(!engine.includes('Math.random'), 'calibration engine uses Math.random');
  assert.ok(!component.includes('coming soon'), 'unfinished placeholder remains in calibration tool');
  assert.match(component, /parseVolatilitySurfaceCsv\(await file\.text\(\)\)/, 'CSV button does not parse the selected file');
  assert.match(component, /new Worker\(new URL/, 'calibration is not isolated from the UI thread');
  assert.ok(!component.includes('UserModelsSection'), 'fake contributive models are still rendered');
  assert.match(component, /<Select value=\{selectedModel\} disabled=\{isCalibrating\}/, 'model selector can race an active worker');
  assert.match(component, /<Select value=\{objective\} disabled=\{isCalibrating\}/, 'objective selector can race an active worker');
  assert.match(component, /Feller margin/, 'Heston model-risk diagnostic is not exposed');
  assert.match(component, /ComparisonLineChart/, 'market/model comparison is not rendered');
  assert.match(component, /tpl-volatility-surface-example\.csv/, 'downloadable CSV example is absent');
  assert.match(sampleCsv, /maturity=years; impliedVol=decimal/, 'CSV example does not document units');
  assert.equal(sampleCsv.split(/\r?\n/).filter((line) => line && !line.startsWith('#')).length, 11, 'CSV example must contain ten data rows');
  assert.match(component, /Use volatility RMSE to compare quoted implied-volatility errors/, 'volatility-objective guidance is absent');
  assert.match(component, /Use normalized-price RMSE when monetary fit matters/, 'price-objective guidance is absent');
  assert.match(component, /tpl\.model-calibration\.export\.v1/, 'auditable calibration export contract is absent');
  assert.match(component, /parameterBounds: calibrationResults\.parameterBounds/, 'export does not include parameter bounds');
  assert.match(component, /calibratedSurface: calibrationResults\.calibratedSurface/, 'export does not include fitted surface and residuals');
  assert.match(component, /Session comparison/, 'successful-run comparison is absent');
  assert.match(component, /Only successful runs completed in this browser session/, 'run-history provenance is not disclosed');
  assert.match(activeApp, /React\.lazy\(\(\) => import\('\.\.\/components\/tools\/ModelCalibration'\)\)/, 'active application does not lazy-load the calibrated tool');
  assert.match(activeApp, /calib:[\s\S]{0,500}<ModelCalibrationTool\/>/, 'active calibration route does not render the new component');
  assert.match(applicationShell, /<HelmetProvider>/, 'active application does not provide the SEO context required by the calibration page');
  assert.ok(!activeApp.includes('Smile Calibration (least-squares)'), 'legacy quadratic calibration remains in the active application');
  assert.ok(!activeApp.includes('function CalibrationTool()'), 'legacy calibration function remains bundled');
  return 'active route, no random parameters, real CSV read/example, worker isolation, export/history, diagnostics visible';
}, 'allow technical build and browser verification');

console.log(`[SUMMARY] Model calibration · [STATUS] PASS · [OUTPUT] engine v${MODEL_CALIBRATION_VERSION} deterministic and CLI-testable`);
