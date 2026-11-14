import React, { useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Download,
  FileJson,
  Plus,
  RotateCcw,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToolRegister } from '@/agent/toolControl';
import {
  PAYOFF_STRATEGY_CONTRACT,
  PAYOFF_STRATEGY_ENGINE_VERSION,
  analyzePayoffStrategy,
  blackScholesLeg,
  buildPayoffCurveCsv,
  buildPayoffJson,
  buildPayoffScenarioCsv,
} from '@/lib/payoffStrategy.mjs';
import ToolPageLayout from './ToolPageLayout';
import { readPayoffPreset } from '@/lib/interviewToolContext.mjs';

type OptionType = 'call' | 'put';
type Side = 'long' | 'short';
type PremiumSource = 'model' | 'manual';

interface LegInput {
  id: string;
  type: OptionType;
  side: Side;
  strike: number;
  quantity: number;
  premiumSource: PremiumSource;
  manualPremium: number | null;
}

interface EnrichedLeg extends LegInput {
  direction: number;
  scale: number;
  modelPremium: number;
  entryPremium: number;
  modelValue: number;
  entryPremiumAmount: number;
  greeks: Record<'delta' | 'gamma' | 'vega' | 'theta' | 'rho', number>;
}

interface StrategyResult {
  schemaVersion: string;
  engineVersion: string;
  analysisId: string;
  input: {
    spot: number;
    volatility: number;
    timeToMaturity: number;
    riskFreeRate: number;
    dividendYield: number;
    currency: string;
    contractMultiplier: number;
    gridPoints: number;
    legs: LegInput[];
  };
  legs: EnrichedLeg[];
  summary: {
    grossPayoffAtSpot: number;
    terminalPnlAtSpot: number;
    netEntryPremium: number;
    entryCashflow: number;
    currentModelValue: number;
    inceptionModelPnl: number;
  };
  greeks: Record<'delta' | 'gamma' | 'vega' | 'theta' | 'rho', number>;
  bounds: {
    maxProfit: { kind: 'finite' | 'unlimited'; amount: number | null };
    maxLoss: { kind: 'finite' | 'unlimited'; amount: number | null };
  };
  breakevens: number[];
  zeroIntervals: Array<{ lowerSpot: number; upperSpot: number | null }>;
  curve: Array<{ terminalSpot: number; grossPayoff: number; terminalPnl: number }>;
  scenarios: Array<{
    terminalSpot: number;
    grossPayoff: number;
    terminalPnl: number;
    legContributions: Array<{ id: string; grossPayoff: number; terminalPnl: number }>;
  }>;
  diagnostics: { warnings: Array<{ code: string; message: string }>; manualPremiumLegCount: number };
  conventions: { priceModel: string; terminalDomain: string; premiumRule: string; marketDataStatus: string; limitations: string[] };
}

interface HistoryItem {
  run: number;
  analysisId: string;
  legs: number;
  currency: string;
  premium: number;
  premiumLabel: 'Net debit' | 'Net credit';
  maxProfit: string;
  maxLoss: string;
}

const selectClassName = 'h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring';
const numberClassName = 'h-9 min-w-[88px]';
const formatNumber = (value: number, digits = 2) => Number.isFinite(value) ? value.toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: digits }) : '—';
const formatMoney = (value: number | null, currency: string, digits = 2) => value === null ? 'Unlimited' : `${currency} ${formatNumber(value, digits)}`;
const formatSigned = (value: number, digits = 3) => `${value > 0 ? '+' : ''}${formatNumber(value, digits)}`;

const downloadTextFile = (fileName: string, content: string, mediaType: string) => {
  const objectUrl = URL.createObjectURL(new Blob([content], { type: `${mediaType};charset=utf-8` }));
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1_000);
};

const presetLegs = (name: string, spot: number): LegInput[] => {
  const strike = (ratio: number) => Number((spot * ratio).toPrecision(8));
  const model = (id: string, type: OptionType, side: Side, ratio: number, quantity = 1): LegInput => ({
    id, type, side, strike: strike(ratio), quantity, premiumSource: 'model', manualPremium: null,
  });
  const presets: Record<string, LegInput[]> = {
    'Bull call spread': [model('long-call', 'call', 'long', 1), model('short-call', 'call', 'short', 1.1)],
    'Long straddle': [model('long-call', 'call', 'long', 1), model('long-put', 'put', 'long', 1)],
    Butterfly: [model('wing-low', 'call', 'long', 0.95), model('body', 'call', 'short', 1, 2), model('wing-high', 'call', 'long', 1.05)],
    'Iron condor': [model('put-wing', 'put', 'long', 0.85), model('short-put', 'put', 'short', 0.95), model('short-call', 'call', 'short', 1.05), model('call-wing', 'call', 'long', 1.15)],
    'Naked short call': [model('short-call', 'call', 'short', 1)],
    'Long call': [model('long-call', 'call', 'long', 1)],
    'Bear put spread': [model('long-put', 'put', 'long', 1), model('short-put', 'put', 'short', 0.9)],
    'Short strangle': [model('short-put', 'put', 'short', 0.95), model('short-call', 'call', 'short', 1.05)],
  };
  return presets[name].map((leg) => ({ ...leg }));
};

const defaultLegs = () => presetLegs('Bull call spread', 100);

const PayoffStrategyLab: React.FC<{initialPreset?: string}> = ({initialPreset}) => {
  const [spot, setSpot] = useState(100);
  const [volatilityPercent, setVolatilityPercent] = useState(20);
  const [maturityDays, setMaturityDays] = useState(90);
  const [riskFreeRatePercent, setRiskFreeRatePercent] = useState(2);
  const [dividendYieldPercent, setDividendYieldPercent] = useState(0);
  const [currency, setCurrency] = useState('USD');
  const [contractMultiplier, setContractMultiplier] = useState(100);
  const [legs, setLegs] = useState<LegInput[]>(() => presetLegs(readPayoffPreset(initialPreset || new URLSearchParams(window.location.search).get('preset')), 100));
  const [result, setResult] = useState<StrategyResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showGross, setShowGross] = useState(true);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const nextId = useRef(1);
  const nextRun = useRef(1);

  const invalidate = (action: () => void) => {
    action();
    setResult(null);
    setError(null);
  };

  const currentMarket = useMemo(() => ({
    spot,
    volatility: volatilityPercent / 100,
    timeToMaturity: maturityDays / 365,
    riskFreeRate: riskFreeRatePercent / 100,
    dividendYield: dividendYieldPercent / 100,
  }), [spot, volatilityPercent, maturityDays, riskFreeRatePercent, dividendYieldPercent]);

  const modelPremium = (leg: LegInput) => {
    try {
      return blackScholesLeg({ ...currentMarket, strike: leg.strike, type: leg.type }).price;
    } catch {
      return 0;
    }
  };

  const updateLeg = (id: string, patch: Partial<LegInput>) => invalidate(() => setLegs((current) => current.map((leg) => leg.id === id ? { ...leg, ...patch } : leg)));
  const removeLeg = (id: string) => invalidate(() => setLegs((current) => current.filter((leg) => leg.id !== id)));
  const addLeg = () => invalidate(() => setLegs((current) => current.length >= PAYOFF_STRATEGY_CONTRACT.limits.maxLegs ? current : [...current, {
    id: `leg-${nextId.current++}`,
    type: 'call',
    side: 'long',
    strike: Number(spot) || 100,
    quantity: 1,
    premiumSource: 'model',
    manualPremium: null,
  }]));
  const loadPreset = (name: string) => invalidate(() => setLegs(presetLegs(name, Number(spot) > 0 ? Number(spot) : 100)));

  useToolRegister('payoff', {
    spot, volatility: volatilityPercent / 100, timeToMaturity: maturityDays / 365,
    riskFreeRate: riskFreeRatePercent / 100, dividendYield: dividendYieldPercent / 100,
    currency, contractMultiplier, legs,
  }, {
    spot: (value: number) => invalidate(() => setSpot(Number(value))),
    volatility: (value: number) => invalidate(() => setVolatilityPercent(Number(value) * 100)),
    timeToMaturity: (value: number) => invalidate(() => setMaturityDays(Number(value) * 365)),
    riskFreeRate: (value: number) => invalidate(() => setRiskFreeRatePercent(Number(value) * 100)),
    dividendYield: (value: number) => invalidate(() => setDividendYieldPercent(Number(value) * 100)),
    contractMultiplier: (value: number) => invalidate(() => setContractMultiplier(Number(value))),
    legs: (value: Array<Record<string, unknown>>) => invalidate(() => setLegs((value || []).map((raw, index) => ({
      id: String(raw.id || `agent-leg-${index + 1}`),
      type: (raw.type || 'call') as OptionType,
      side: (raw.side || 'long') as Side,
      strike: Number(raw.strike ?? raw.K ?? spot),
      quantity: Number(raw.quantity ?? raw.qty ?? 1),
      premiumSource: raw.premiumSource === 'model' ? 'model' : 'manual',
      manualPremium: raw.premiumSource === 'model' ? null : Number(raw.manualPremium ?? raw.prem ?? 0),
    })))),
  });

  const analyze = async () => {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const analysis = await analyzePayoffStrategy({
        spot,
        volatility: volatilityPercent / 100,
        timeToMaturity: maturityDays / 365,
        riskFreeRate: riskFreeRatePercent / 100,
        dividendYield: dividendYieldPercent / 100,
        currency,
        contractMultiplier,
        gridPoints: 401,
        legs,
      }) as StrategyResult;
      setResult(analysis);
      setHistory((current) => [{
        run: nextRun.current++,
        analysisId: analysis.analysisId,
        legs: analysis.legs.length,
        currency: analysis.input.currency,
        premium: Math.abs(analysis.summary.netEntryPremium),
        premiumLabel: analysis.summary.netEntryPremium >= 0 ? 'Net debit' : 'Net credit',
        maxProfit: analysis.bounds.maxProfit.kind === 'unlimited' ? 'Unlimited' : formatMoney(analysis.bounds.maxProfit.amount, analysis.input.currency),
        maxLoss: analysis.bounds.maxLoss.kind === 'unlimited' ? 'Unlimited' : formatMoney(analysis.bounds.maxLoss.amount, analysis.input.currency),
      }, ...current].slice(0, 8));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Strategy analysis failed.');
    } finally {
      setBusy(false);
    }
  };

  const chartDomain = useMemo(() => {
    if (!result) return [-1, 1];
    const values = result.curve.flatMap((point) => showGross ? [point.terminalPnl, point.grossPayoff] : [point.terminalPnl]);
    const minimum = Math.min(...values);
    const maximum = Math.max(...values);
    const padding = Math.max((maximum - minimum) * 0.1, 1);
    return [minimum - padding, maximum + padding];
  }, [result, showGross]);

  const resultCurrency = result?.input.currency ?? currency;
  const netPremiumLabel = result ? (result.summary.netEntryPremium >= 0 ? 'Net debit' : 'Net credit') : 'Net premium';
  const netPremiumAmount = result ? Math.abs(result.summary.netEntryPremium) : 0;

  return (
    <ToolPageLayout
      title="Option Strategy & Terminal P&L Lab"
      metaDescription="Build European vanilla option strategies with exact terminal P&L bounds, signed Black-Scholes Greeks and reproducible evidence exports."
      headline="Option Strategy & Terminal P&L Lab"
      valueProp="Exact tails and breakevens — never inferred from the chart window."
      supportingText="Declare market assumptions, contract units and the entry premium source for every call or put. The engine separates gross intrinsic payoff from net terminal P&L, solves finite or unlimited risk analytically over Sₜ ≥ 0, and signs every Greek at portfolio level."
      trustSignals={[
        `Deterministic engine v${PAYOFF_STRATEGY_ENGINE_VERSION}`,
        'Analytical tails & roots',
        'Signed BSM Greeks',
        'JSON + 2 CSV evidence exports',
      ]}
      methodology={[
        { label: 'Terminal P&L', content: 'For every leg: signed quantity × multiplier × (intrinsic value − entry premium). Gross payoff excludes the premium; the two are never conflated.' },
        { label: 'Exact risk bounds', content: 'The engine constructs the piecewise-linear strategy over the full non-negative terminal-price domain. Max profit/loss and breakevens do not depend on the plotted range.' },
        { label: 'Greeks', content: 'European Black-Scholes-Merton sensitivities use the visible spot, volatility, maturity, rates and dividend yield. Delta/Gamma are per spot unit, Vega/Rho per one percentage point and Theta per calendar day.' },
        { label: 'Model limits', content: 'No live market quote is claimed. The lab excludes early exercise, smile/skew, path dependence, transaction costs, margin and liquidity.' },
      ]}
    >
      <div data-payoff-strategy-lab="true" className="space-y-6 min-w-0">
        <div className="grid gap-5 xl:grid-cols-[390px_minmax(0,1fr)]">
          <Card className="h-fit space-y-5 p-5 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Input contract</p>
                <h2 className="mt-1 text-lg font-semibold">Market & contract</h2>
              </div>
              <Badge variant="outline">Starter</Badge>
            </div>
            <Alert className="border-emerald-500/30 bg-emerald-500/5">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <AlertTitle>User assumptions only</AlertTitle>
              <AlertDescription>No live market data or quote is requested. Model premiums are transparent BSM reference values; manual premiums remain visibly labelled.</AlertDescription>
            </Alert>
            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1.5 text-xs text-muted-foreground">Spot
                <Input type="number" min="0.000001" value={spot} onChange={(event) => invalidate(() => setSpot(Number(event.target.value)))} />
              </label>
              <label className="space-y-1.5 text-xs text-muted-foreground">Volatility (%)
                <Input type="number" min="0.0001" max="500" step="0.1" value={volatilityPercent} onChange={(event) => invalidate(() => setVolatilityPercent(Number(event.target.value)))} />
              </label>
              <label className="space-y-1.5 text-xs text-muted-foreground">Maturity (days)
                <Input type="number" min="1" max="36500" step="1" value={maturityDays} onChange={(event) => invalidate(() => setMaturityDays(Number(event.target.value)))} />
              </label>
              <label className="space-y-1.5 text-xs text-muted-foreground">Risk-free rate (%)
                <Input type="number" min="-100" max="100" step="0.1" value={riskFreeRatePercent} onChange={(event) => invalidate(() => setRiskFreeRatePercent(Number(event.target.value)))} />
              </label>
              <label className="space-y-1.5 text-xs text-muted-foreground">Dividend yield (%)
                <Input type="number" min="-100" max="100" step="0.1" value={dividendYieldPercent} onChange={(event) => invalidate(() => setDividendYieldPercent(Number(event.target.value)))} />
              </label>
              <label className="space-y-1.5 text-xs text-muted-foreground">Contract multiplier
                <Input type="number" min="0.000001" step="1" value={contractMultiplier} onChange={(event) => invalidate(() => setContractMultiplier(Number(event.target.value)))} />
              </label>
              <label className="col-span-2 space-y-1.5 text-xs text-muted-foreground">Currency
                <Input value={currency} maxLength={3} onChange={(event) => invalidate(() => setCurrency(event.target.value.toUpperCase()))} />
              </label>
            </div>
            <div className="rounded-md border bg-secondary/20 p-3 text-xs text-muted-foreground">
              Price, strike and premium are {currency || 'currency'} per underlying unit. Quantity counts contracts; multiplier converts to portfolio currency amounts.
            </div>
            <Button variant="finance" size="lg" className="w-full" data-payoff-run="true" disabled={busy || legs.length === 0} onClick={() => void analyze()}>
              <BarChart3 className="mr-2 h-4 w-4" /> {busy ? 'Analyzing…' : 'Analyze exact strategy'}
            </Button>
          </Card>

          <div className="space-y-5 min-w-0">
            <Card className="p-5 space-y-4 min-w-0" data-payoff-legs="true">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Strategy definition</p>
                  <h2 className="mt-1 text-lg font-semibold">Option legs ({legs.length}/{PAYOFF_STRATEGY_CONTRACT.limits.maxLegs})</h2>
                </div>
                <Button variant="outline" size="sm" onClick={addLeg} disabled={legs.length >= PAYOFF_STRATEGY_CONTRACT.limits.maxLegs}><Plus className="mr-2 h-4 w-4" /> Add leg</Button>
              </div>
              <div className="flex flex-wrap gap-2" aria-label="Strategy presets">
                {['Bull call spread', 'Long straddle', 'Butterfly', 'Iron condor', 'Naked short call', 'Long call', 'Bear put spread', 'Short strangle'].map((preset) => (
                  <Button key={preset} variant="secondary" size="sm" onClick={() => loadPreset(preset)}>{preset}</Button>
                ))}
              </div>
              {!legs.length && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>No option leg</AlertTitle><AlertDescription>Add at least one validated call or put before analysis.</AlertDescription></Alert>}
              <div className="overflow-x-auto rounded-md border" data-payoff-leg-table="true">
                <Table className="min-w-[900px]">
                  <TableHeader><TableRow>
                    <TableHead className="sticky left-0 z-20 bg-background min-w-[130px]">Leg</TableHead>
                    <TableHead>Side</TableHead><TableHead>Type</TableHead><TableHead className="text-right">Strike</TableHead><TableHead className="text-right">Qty</TableHead><TableHead>Premium source</TableHead><TableHead className="text-right">Entry premium</TableHead><TableHead className="text-right">BSM reference</TableHead><TableHead aria-label="Remove leg" />
                  </TableRow></TableHeader>
                  <TableBody>{legs.map((leg) => {
                    const reference = modelPremium(leg);
                    return <TableRow key={leg.id}>
                      <TableCell className="sticky left-0 z-10 bg-background font-mono text-xs">{leg.id}</TableCell>
                      <TableCell><select className={selectClassName} value={leg.side} onChange={(event) => updateLeg(leg.id, { side: event.target.value as Side })}><option value="long">Long</option><option value="short">Short</option></select></TableCell>
                      <TableCell><select className={selectClassName} value={leg.type} onChange={(event) => updateLeg(leg.id, { type: event.target.value as OptionType })}><option value="call">Call</option><option value="put">Put</option></select></TableCell>
                      <TableCell><Input className={numberClassName} type="number" min="0.000001" value={leg.strike} onChange={(event) => updateLeg(leg.id, { strike: Number(event.target.value) })} /></TableCell>
                      <TableCell><Input className={numberClassName} type="number" min="1" step="1" value={leg.quantity} onChange={(event) => updateLeg(leg.id, { quantity: Number(event.target.value) })} /></TableCell>
                      <TableCell><select className={selectClassName} value={leg.premiumSource} onChange={(event) => {
                        const source = event.target.value as PremiumSource;
                        updateLeg(leg.id, { premiumSource: source, manualPremium: source === 'manual' ? Number(reference.toFixed(6)) : null });
                      }}><option value="model">BSM model</option><option value="manual">Manual entry</option></select></TableCell>
                      <TableCell>{leg.premiumSource === 'manual'
                        ? <Input className={numberClassName} type="number" min="0" step="0.01" value={leg.manualPremium ?? 0} onChange={(event) => updateLeg(leg.id, { manualPremium: Number(event.target.value) })} />
                        : <span className="block text-right text-xs text-muted-foreground">model</span>}</TableCell>
                      <TableCell className="text-right font-mono text-xs">{formatNumber(reference, 4)}</TableCell>
                      <TableCell><Button variant="ghost" size="icon" aria-label={`Remove ${leg.id}`} onClick={() => removeLeg(leg.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                    </TableRow>;
                  })}</TableBody>
                </Table>
              </div>
              <p className="text-xs text-muted-foreground sm:hidden">Swipe horizontally; the leg identifier stays pinned.</p>
            </Card>

            {error && <Alert variant="destructive" data-payoff-error="true"><AlertTriangle className="h-4 w-4" /><AlertTitle>Analysis rejected</AlertTitle><AlertDescription>{error} No prior result is retained.</AlertDescription></Alert>}
            {!result && !error && <Card className="min-h-[260px] border-dashed p-8 grid place-items-center text-center" data-payoff-empty="true"><div className="max-w-md"><BarChart3 className="mx-auto h-9 w-9 text-primary" /><h3 className="mt-3 font-semibold">Ready for a fail-closed analysis</h3><p className="mt-2 text-sm text-muted-foreground">Choose a preset or edit the legs, then run the exact terminal-domain engine. Input edits invalidate prior results.</p></div></Card>}

            {result && <div className="space-y-5 min-w-0" data-payoff-results="true">
              <Card className="p-5 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap gap-2"><Badge className="bg-emerald-600"><CheckCircle2 className="mr-1 h-3 w-3" /> Validated</Badge><Badge variant="outline">Sₜ ≥ 0 exact tails</Badge><Badge variant="outline">{result.legs.length} legs</Badge></div>
                    <h2 className="mt-3 text-xl font-semibold">Terminal P&L analyzed without chart-bound inference</h2>
                    <p className="mt-1 text-xs text-muted-foreground">S={formatNumber(result.input.spot)} · σ={(result.input.volatility * 100).toFixed(2)}% · T={(result.input.timeToMaturity * 365).toFixed(0)}d · r={(result.input.riskFreeRate * 100).toFixed(2)}% · q={(result.input.dividendYield * 100).toFixed(2)}% · multiplier={formatNumber(result.input.contractMultiplier, 0)}</p>
                    <p className="mt-1 break-all font-mono text-[10px] text-muted-foreground">SHA-256 {result.analysisId}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => downloadTextFile(`tpl-payoff-${result.analysisId.slice(0, 10)}.json`, buildPayoffJson(result), 'application/json')}><FileJson className="mr-2 h-4 w-4" /> JSON evidence</Button>
                    <Button variant="outline" size="sm" onClick={() => downloadTextFile(`tpl-payoff-curve-${result.analysisId.slice(0, 10)}.csv`, buildPayoffCurveCsv(result), 'text/csv')}><Download className="mr-2 h-4 w-4" /> Curve CSV</Button>
                    <Button variant="outline" size="sm" onClick={() => downloadTextFile(`tpl-payoff-scenarios-${result.analysisId.slice(0, 10)}.csv`, buildPayoffScenarioCsv(result), 'text/csv')}><Download className="mr-2 h-4 w-4" /> Scenarios CSV</Button>
                  </div>
                </div>
              </Card>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  [netPremiumLabel, formatMoney(netPremiumAmount, resultCurrency), result.summary.netEntryPremium < 0 ? 'text-emerald-500' : ''],
                  ['Maximum profit', result.bounds.maxProfit.kind === 'unlimited' ? 'Unlimited ↑' : formatMoney(result.bounds.maxProfit.amount, resultCurrency), 'text-emerald-500'],
                  ['Maximum loss', result.bounds.maxLoss.kind === 'unlimited' ? 'Unlimited ↓' : formatMoney(result.bounds.maxLoss.amount, resultCurrency), 'text-red-500'],
                  ['Breakevens', result.breakevens.length ? result.breakevens.map((value) => formatNumber(value, 3)).join(' · ') : 'None', ''],
                ].map(([label, value, color]) => <Card key={label} className="p-4"><p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p><p className={`mt-2 text-xl font-semibold ${color}`}>{value}</p></Card>)}
              </div>

              <Tabs defaultValue="profile" className="min-w-0">
                <TabsList className="grid h-auto w-full grid-cols-2 md:grid-cols-4"><TabsTrigger value="profile">P&L profile</TabsTrigger><TabsTrigger value="scenarios">Scenarios</TabsTrigger><TabsTrigger value="greeks">Greeks</TabsTrigger><TabsTrigger value="audit">Audit & history</TabsTrigger></TabsList>
                <TabsContent value="profile" className="mt-4">
                  <Card className="p-5 min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold">Terminal strategy profile</h3><p className="mt-1 text-xs text-muted-foreground">Net P&L includes entry premiums. Gross signed intrinsic payoff is optional.</p></div><Button variant={showGross ? 'secondary' : 'outline'} size="sm" onClick={() => setShowGross((current) => !current)}>{showGross ? 'Hide gross payoff' : 'Show gross payoff'}</Button></div>
                    <div className="mt-4 h-[340px] min-w-0" data-payoff-chart="true"><ResponsiveContainer width="100%" height="100%"><LineChart data={result.curve} margin={{ top: 12, right: 20, left: 16, bottom: 8 }}><CartesianGrid strokeDasharray="3 3" opacity={0.25} /><XAxis dataKey="terminalSpot" type="number" domain={['dataMin', 'dataMax']} tickFormatter={(value) => formatNumber(value, 0)} /><YAxis domain={chartDomain} tickFormatter={(value) => formatNumber(value, 0)} width={76} /><Tooltip formatter={(value: number, name: string) => [formatMoney(Number(value), resultCurrency), name]} labelFormatter={(value) => `Terminal spot ${formatNumber(Number(value), 3)}`} /><Legend /><ReferenceLine y={0} stroke="#94a3b8" />{result.breakevens.map((value) => <ReferenceLine key={value} x={value} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: `BE ${formatNumber(value, 2)}`, position: 'insideTopRight', fill: '#f59e0b', fontSize: 10 }} />)}<Line type="linear" dataKey="terminalPnl" name="Net terminal P&L" stroke="#ef4444" strokeWidth={2.5} dot={false} isAnimationActive={false} />{showGross && <Line type="linear" dataKey="grossPayoff" name="Gross signed payoff" stroke="#3b82f6" strokeDasharray="5 4" dot={false} isAnimationActive={false} />}</LineChart></ResponsiveContainer></div>
                  </Card>
                </TabsContent>
                <TabsContent value="scenarios" className="mt-4"><Card className="p-5 min-w-0"><h3 className="font-semibold">Exact scenario decomposition</h3><p className="mt-1 text-xs text-muted-foreground">Includes zero, spot-relative levels, every strike and every breakeven.</p><div className="mt-4 overflow-x-auto rounded-md border"><Table className="min-w-[760px]"><TableHeader><TableRow><TableHead className="sticky left-0 bg-background">Terminal spot</TableHead><TableHead className="text-right">Gross payoff</TableHead><TableHead className="text-right">Net P&L</TableHead>{result.legs.map((leg) => <TableHead key={leg.id} className="text-right">{leg.id}</TableHead>)}</TableRow></TableHeader><TableBody>{result.scenarios.map((scenario) => <TableRow key={scenario.terminalSpot}><TableCell className="sticky left-0 bg-background font-mono">{formatNumber(scenario.terminalSpot, 3)}</TableCell><TableCell className="text-right font-mono">{formatMoney(scenario.grossPayoff, resultCurrency)}</TableCell><TableCell className={`text-right font-mono ${scenario.terminalPnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{formatMoney(scenario.terminalPnl, resultCurrency)}</TableCell>{scenario.legContributions.map((leg) => <TableCell key={leg.id} className="text-right font-mono text-xs">{formatSigned(leg.terminalPnl, 2)}</TableCell>)}</TableRow>)}</TableBody></Table></div></Card></TabsContent>
                <TabsContent value="greeks" className="mt-4"><div className="space-y-4"><Card className="p-5"><h3 className="font-semibold">Signed portfolio Greeks</h3><p className="mt-1 text-xs text-muted-foreground">Delta/Gamma per +1 spot unit · Vega/Rho per +1 percentage point · Theta per calendar day.</p><div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">{Object.entries(result.greeks).map(([key, value]) => <div key={key} className="rounded-md border bg-secondary/20 p-3"><p className="text-xs uppercase text-muted-foreground">{key}</p><p className={`mt-1 font-mono font-semibold ${value >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{formatSigned(value, 4)}</p></div>)}</div></Card><Card className="p-5 min-w-0"><h3 className="font-semibold">Per-leg valuation audit</h3><div className="mt-4 overflow-x-auto rounded-md border"><Table className="min-w-[900px]"><TableHeader><TableRow><TableHead className="sticky left-0 bg-background">Leg</TableHead><TableHead className="text-right">Entry premium</TableHead><TableHead className="text-right">BSM premium</TableHead>{['Delta', 'Gamma', 'Vega', 'Theta', 'Rho'].map((name) => <TableHead key={name} className="text-right">{name}</TableHead>)}</TableRow></TableHeader><TableBody>{result.legs.map((leg) => <TableRow key={leg.id}><TableCell className="sticky left-0 bg-background font-mono text-xs">{leg.side} {leg.quantity}× {leg.type} K={formatNumber(leg.strike, 2)}</TableCell><TableCell className="text-right font-mono">{formatNumber(leg.entryPremium, 4)}</TableCell><TableCell className="text-right font-mono">{formatNumber(leg.modelPremium, 4)}</TableCell>{(['delta', 'gamma', 'vega', 'theta', 'rho'] as const).map((key) => <TableCell key={key} className="text-right font-mono text-xs">{formatSigned(leg.greeks[key], 4)}</TableCell>)}</TableRow>)}</TableBody></Table></div></Card></div></TabsContent>
                <TabsContent value="audit" className="mt-4"><div className="grid gap-4 lg:grid-cols-2"><Card className="p-5"><h3 className="font-semibold">Conventions & limits</h3><div className="mt-3 space-y-3 text-sm">{result.diagnostics.warnings.map((warning) => <Alert key={warning.code} className="border-amber-500/30 bg-amber-500/5"><AlertTriangle className="h-4 w-4 text-amber-500" /><AlertTitle>{warning.code.replaceAll('_', ' ')}</AlertTitle><AlertDescription>{warning.message}</AlertDescription></Alert>)}<div className="rounded-md border p-3 text-xs text-muted-foreground"><p>{result.conventions.premiumRule}</p><p className="mt-2">{result.conventions.marketDataStatus}</p><ul className="mt-2 list-disc space-y-1 pl-5">{result.conventions.limitations.map((limit) => <li key={limit}>{limit}</li>)}</ul></div></div></Card><Card className="p-5" data-payoff-history="true"><div className="flex items-center justify-between gap-3"><h3 className="font-semibold">Successful session runs</h3><Button variant="ghost" size="sm" onClick={() => setHistory([])}><RotateCcw className="mr-2 h-4 w-4" /> Clear</Button></div>{history.length ? <div className="mt-3 space-y-2">{history.map((item) => <div key={`${item.run}-${item.analysisId}`} className="rounded-md border p-3 text-xs" data-payoff-history-run={item.run}><div className="flex items-center justify-between gap-2"><span className="font-mono">Run {item.run} · {item.legs} legs</span><span className="font-mono text-muted-foreground">{item.analysisId.slice(0, 10)}</span></div><p className="mt-1 text-muted-foreground">{item.premiumLabel} {formatMoney(item.premium, item.currency)} · max profit {item.maxProfit} · max loss {item.maxLoss}</p></div>)}</div> : <p className="mt-3 text-sm text-muted-foreground">No successful analysis in this browser session.</p>}</Card></div></TabsContent>
              </Tabs>
            </div>}
          </div>
        </div>
      </div>
    </ToolPageLayout>
  );
};

export default PayoffStrategyLab;
