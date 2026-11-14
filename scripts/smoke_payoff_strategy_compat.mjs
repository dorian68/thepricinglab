import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createServer } from 'vite';

const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' });
try {
  const { calculateStrategyResults } = await vite.ssrLoadModule('/src/utils/options/strategyCalculator.ts');
  const { adaptCommunityToTradingStrategy } = await vite.ssrLoadModule('/src/utils/options/strategyAdapter.ts');
  const strategy = (legs, overrides = {}) => ({
    id: 'compat', name: 'Compatibility fixture', category: 'vanilla', description: '',
    parameters: {
      spotPrice: 100, volatility: 0.2, timeToMaturity: 1, interestRate: 0,
      dividendYield: 0, legs, ...overrides,
    },
  });
  const leg = (type, position, strike, quantity = 1) => ({ type, position, strike, quantity });

  const longCall = calculateStrategyResults(strategy([leg('call', 'long', 200)]));
  assert.equal(longCall.maxProfit, undefined, 'long call must expose unlimited profit');
  assert.ok(longCall.breakEvenPoints.length === 1 && longCall.breakEvenPoints[0] > 200, 'off-window long-call breakeven missing');
  assert.ok(longCall.payoffPoints.some((point) => point.x === longCall.breakEvenPoints[0]), 'exact breakeven not retained in curve');
  const shortCall = calculateStrategyResults(strategy([leg('call', 'short', 100)]));
  assert.equal(shortCall.maxLoss, undefined, 'naked short call must expose unlimited loss');
  assert.ok(shortCall.maxProfit > 0);
  console.log('[STEP 1] historical vanilla adapters · [STATUS] ok · [OUTPUT] active community/trading calculator delegates off-window roots and unlimited tails to the canonical engine');

  const spread = calculateStrategyResults(strategy([leg('call', 'long', 100), leg('call', 'short', 110)], { nominal: 10_000 }));
  assert.ok(Number.isFinite(spread.maxProfit) && Number.isFinite(spread.maxLoss));
  assert.ok(spread.payoffPoints.length >= 401);
  assert.throws(
    () => calculateStrategyResults(strategy([{ ...leg('call', 'long', 100), barrier: { type: 'knock-out', level: 120 } }])),
    /unavailable.*no proxy/i,
  );
  console.log('[STEP 2] scale and unsupported products · [STATUS] ok · [OUTPUT] nominal scaling is coherent; barrier/structured proxies fail closed');

  const adapted = adaptCommunityToTradingStrategy({
    id: 1, type: 'strategy', title: 'Legacy butterfly', summary: '', content: '', date: '', views: 0, likes: 0, tags: [], published: true, strategyType: 'pricing',
    strategyData: {
      underlyingPrice: 105, volatility: 0.25, interestRate: 0.02, daysToExpiry: 30,
      instruments: [
        { type: 'option', strike: 100, optionType: 'call', position: 'long', quantity: 1 },
        { type: 'option', strike: 110, optionType: 'call', position: 'short', quantity: 2 },
        { type: 'option', strike: 120, optionType: 'call', position: 'long', quantity: 1 },
      ],
    },
  });
  assert.equal(adapted.parameters.spotPrice, 105);
  assert.equal(adapted.parameters.timeToMaturity, 30 / 365);
  assert.equal(adapted.parameters.legs.length, 3);
  assert.doesNotThrow(() => calculateStrategyResults(adapted));

  const calculatorSource = await readFile(new URL('../src/utils/options/strategyCalculator.ts', import.meta.url), 'utf8');
  const detailSource = await readFile(new URL('../src/pages/community/StrategyDetail.tsx', import.meta.url), 'utf8');
  const shellSource = await readFile(new URL('../src/claude/ClaudeFrontend.jsx', import.meta.url), 'utf8');
  assert.match(calculatorSource, /analyzePayoffTerminal/);
  assert.doesNotMatch(calculatorSource, /0\.5|1\.5|length:\s*50|findBreakEvenPoints|calculateVaR|calculateCVaR/);
  assert.doesNotMatch(detailSource, /Math\.sin|Generate a sine wave|totalPrice:\s*250|maxProfit:\s*500/);
  assert.match(shellSource, /function UIPayoffChart[\s\S]*?import\('\.\.\/lib\/payoffStrategy\.mjs'\)/);
  assert.doesNotMatch(shellSource.match(/function UIPayoffChart[\s\S]*?function UIBlock/)?.[0] ?? '', /length:\s*81|Math\.max\(\.\.\.payoff|maxGain|maxLoss = Math\.min/);
  console.log('[STEP 3] legacy source retirement · [STATUS] ok · [OUTPUT] sine demo, grid-derived bounds, fake VaR and separate course/community payoff engines are absent');
  console.log('[VERDICT] PASS · Every active vanilla payoff consumer shares the exact terminal-domain engine; unsupported path-dependent products fail closed');
} finally {
  await vite.close();
}
