import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileJson,
  Loader2,
  Play,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import {
  Bar,
  BarChart,
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
  MONTE_CARLO_CONTRACT,
  MONTE_CARLO_ENGINE_VERSION,
  MONTE_CARLO_INPUT_SCHEMA,
  buildMonteCarloJson,
  buildMonteCarloPathsCsv,
  buildMonteCarloTerminalCsv,
  normalizeMonteCarloInput,
} from '@/lib/monteCarlo.mjs';
import ToolPageLayout from './ToolPageLayout';

type Mode = 'risk_physical' | 'pricing_risk_neutral';
type Method = 'none' | 'antithetic' | 'control_variate';
type Position = 'long' | 'short';

interface HistoryItem {
  run: number;
  analysisId: string;
  mode: Mode;
  seed: number;
  paths: number;
  currency: string;
  headline: string;
}

const selectClassName = 'h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring';
const formatNumber = (value: number, digits = 4) => Number(value).toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: Math.min(2, digits) });
const formatMoney = (value: number, currency: string, digits = 2) => `${currency} ${formatNumber(value, digits)}`;
const formatPercent = (value: number, digits = 2) => `${formatNumber(value * 100, digits)}%`;

const downloadTextFile = (fileName: string, content: string, mediaType: string) => {
  const objectUrl = URL.createObjectURL(new Blob([content], { type: `${mediaType};charset=utf-8` }));
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
};

const MonteCarloLab: React.FC = () => {
  const [mode, setMode] = useState<Mode>('pricing_risk_neutral');
  const [spot, setSpot] = useState(100);
  const [volatilityPercent, setVolatilityPercent] = useState(20);
  const [maturityDays, setMaturityDays] = useState(365);
  const [paths, setPaths] = useState(10_000);
  const [timeSteps, setTimeSteps] = useState(12);
  const [seed, setSeed] = useState(7);
  const [method, setMethod] = useState<Method>('antithetic');
  const [currency, setCurrency] = useState('USD');
  const [quantity, setQuantity] = useState(1);
  const [contractMultiplier, setContractMultiplier] = useState(100);
  const [position, setPosition] = useState<Position>('long');
  const [physicalDriftPercent, setPhysicalDriftPercent] = useState(6);
  const [confidence, setConfidence] = useState(0.99);
  const [riskFreeRatePercent, setRiskFreeRatePercent] = useState(5);
  const [dividendYieldPercent, setDividendYieldPercent] = useState(0);
  const [strike, setStrike] = useState(100);
  const [optionType, setOptionType] = useState<'call' | 'put'>('call');
  const [payoffType, setPayoffType] = useState<'european' | 'arithmetic_asian'>('european');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const workerRef = useRef<Worker | null>(null);
  const activeRequestRef = useRef<string | null>(null);
  const nextRun = useRef(1);
  const requestSerial = useRef(1);

  useEffect(() => () => workerRef.current?.terminate(), []);

  const invalidate = (action: () => void) => {
    workerRef.current?.terminate();
    workerRef.current = null;
    activeRequestRef.current = null;
    setBusy(false);
    action();
    setResult(null);
    setError(null);
  };

  const changeMode = (nextMode: Mode) => invalidate(() => {
    setMode(nextMode);
    if (nextMode === 'risk_physical' && method === 'control_variate') setMethod('antithetic');
  });

  const input = useMemo(() => {
    const common = {
      schemaVersion: MONTE_CARLO_INPUT_SCHEMA,
      mode,
      spot,
      volatility: volatilityPercent / 100,
      maturityYears: maturityDays / 365,
      dayCount: 'ACT/365F',
      paths,
      timeSteps,
      seed,
      method,
      samplePaths: Math.min(12, paths),
      histogramBins: 30,
      currency,
      quantity,
      contractMultiplier,
      position,
    };
    return mode === 'risk_physical'
      ? { ...common, physicalDrift: physicalDriftPercent / 100, confidence }
      : { ...common, riskFreeRate: riskFreeRatePercent / 100, dividendYield: dividendYieldPercent / 100, strike, optionType, payoffType };
  }, [mode, spot, volatilityPercent, maturityDays, paths, timeSteps, seed, method, currency, quantity, contractMultiplier, position, physicalDriftPercent, confidence, riskFreeRatePercent, dividendYieldPercent, strike, optionType, payoffType]);

  useToolRegister('mc', input, {
    mode: (value: Mode) => changeMode(value),
    spot: (value: number) => invalidate(() => setSpot(Number(value))),
    volatility: (value: number) => invalidate(() => setVolatilityPercent(Number(value) * 100)),
    maturityYears: (value: number) => invalidate(() => setMaturityDays(Number(value) * 365)),
    paths: (value: number) => invalidate(() => setPaths(Number(value))),
    timeSteps: (value: number) => invalidate(() => setTimeSteps(Number(value))),
    seed: (value: number) => invalidate(() => setSeed(Number(value))),
    method: (value: Method) => invalidate(() => setMethod(value)),
  });

  const run = () => {
    workerRef.current?.terminate();
    setResult(null);
    setError(null);
    setBusy(true);
    let validatedInput: any;
    try {
      validatedInput = normalizeMonteCarloInput(input);
    } catch (validationError) {
      setError(validationError instanceof Error ? validationError.message : 'Monte Carlo input validation failed.');
      setBusy(false);
      activeRequestRef.current = null;
      workerRef.current = null;
      return;
    }
    const requestId = `mc-${requestSerial.current++}`;
    activeRequestRef.current = requestId;
    const worker = new Worker(new URL('../../workers/monteCarlo.worker.mjs', import.meta.url), { type: 'module' });
    workerRef.current = worker;
    worker.onmessage = (event) => {
      if (event.data?.requestId !== activeRequestRef.current) return;
      if (event.data.type === 'error') {
        setError(event.data.error || 'Monte Carlo analysis failed.');
      } else if (event.data.type === 'result') {
        const analysis = event.data.result;
        setResult(analysis);
        const headline = analysis.mode === 'risk_physical'
          ? `VaR ${formatMoney(analysis.risk.valueAtRisk, analysis.input.currency)}`
          : `Price ${formatMoney(analysis.pricing.price, analysis.input.currency, 4)}`;
        setHistory((current) => [{
          run: nextRun.current++, analysisId: analysis.analysisId, mode: analysis.mode,
          seed: analysis.input.seed, paths: analysis.input.paths, currency: analysis.input.currency, headline,
        }, ...current].slice(0, 8));
      }
      setBusy(false);
      activeRequestRef.current = null;
      worker.terminate();
      if (workerRef.current === worker) workerRef.current = null;
    };
    worker.onerror = (event) => {
      if (requestId === activeRequestRef.current) {
        setError(event.message || 'Monte Carlo worker failed.');
        setBusy(false);
        activeRequestRef.current = null;
      }
      worker.terminate();
      if (workerRef.current === worker) workerRef.current = null;
    };
    worker.postMessage({ type: 'analyze', requestId, input: validatedInput });
  };

  const pathChartData = useMemo(() => {
    if (!result) return [];
    const rows = new Map<number, Record<string, number>>();
    result.samplePaths.forEach((path: any) => path.points.forEach((point: any) => {
      const row = rows.get(point.step) || { step: point.step, timeYears: point.timeYears };
      row[`path${path.pathIndex}`] = point.spot;
      rows.set(point.step, row);
    }));
    return [...rows.values()];
  }, [result]);

  const resultCurrency = result?.input.currency ?? currency;
  const inputSummary = mode === 'risk_physical'
    ? 'Physical measure P · declared expected return · loss VaR/ES'
    : 'Risk-neutral measure Q · drift r−q · discounted payoff pricing';

  return (
    <ToolPageLayout
      title="Monte Carlo Pricing & Risk Lab"
      metaDescription="Run reproducible GBM pricing and physical-risk simulations with explicit P/Q measures, confidence intervals, VaR/ES and evidence exports."
      headline="Monte Carlo Pricing & Risk Lab"
      valueProp="One seeded distribution for paths, price, uncertainty and loss risk — with no hidden second simulation."
      supportingText="Separate physical risk from risk-neutral pricing, keep every displayed path inside the same seeded run, and audit convergence, uncertainty and evidence without sending inputs to a server."
      trustSignals={['Engine calculation validated', 'Physical P vs risk-neutral Q', 'Seeded worker simulation', 'SE, CI & convergence', 'JSON + 2 CSV evidence exports']}
    >
      <div data-monte-carlo-lab="true" className="space-y-6">
        <Card className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Analysis objective</p><p className="mt-1 text-sm text-muted-foreground">{inputSummary}</p></div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Badge variant="outline">Starter</Badge>
              <div className="flex rounded-md border p-1">
                <Button size="sm" variant={mode === 'pricing_risk_neutral' ? 'secondary' : 'ghost'} onClick={() => changeMode('pricing_risk_neutral')} data-mc-mode-pricing="true">Option pricing (Q)</Button>
                <Button size="sm" variant={mode === 'risk_physical' ? 'secondary' : 'ghost'} onClick={() => changeMode('risk_physical')} data-mc-mode-risk="true">Position risk (P)</Button>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
          <div className="space-y-5 self-start">
            <Card className="space-y-4 p-5">
              <div className="flex items-center justify-between"><h2 className="font-semibold">Market & contract</h2><Badge variant="outline">{mode === 'risk_physical' ? 'Measure P' : 'Measure Q'}</Badge></div>
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1.5 text-xs text-muted-foreground">Spot
                  <Input aria-label="MC spot" type="number" min="0.00000001" value={spot} onChange={(event) => invalidate(() => setSpot(Number(event.target.value)))} />
                </label>
                <label className="space-y-1.5 text-xs text-muted-foreground">Volatility (%)
                  <Input aria-label="MC volatility" type="number" min="0" max="500" step="0.1" value={volatilityPercent} onChange={(event) => invalidate(() => setVolatilityPercent(Number(event.target.value)))} />
                </label>
                <label className="space-y-1.5 text-xs text-muted-foreground">Horizon (days)
                  <Input aria-label="MC horizon days" type="number" min="1" max="10950" value={maturityDays} onChange={(event) => invalidate(() => setMaturityDays(Number(event.target.value)))} />
                </label>
                <label className="space-y-1.5 text-xs text-muted-foreground">Time steps
                  <Input aria-label="MC time steps" type="number" min="1" max="366" value={timeSteps} onChange={(event) => invalidate(() => setTimeSteps(Number(event.target.value)))} />
                </label>
              </div>

              {mode === 'pricing_risk_neutral' ? <div className="space-y-3 rounded-md border bg-secondary/10 p-3" data-mc-pricing-inputs="true">
                <div className="grid grid-cols-2 gap-3">
                  <label className="space-y-1 text-xs text-muted-foreground">Strike<Input aria-label="MC strike" type="number" min="0.00000001" value={strike} onChange={(event) => invalidate(() => setStrike(Number(event.target.value)))} /></label>
                  <label className="space-y-1 text-xs text-muted-foreground">Option<select aria-label="MC option type" className={selectClassName} value={optionType} onChange={(event) => invalidate(() => setOptionType(event.target.value as 'call' | 'put'))}><option value="call">Call</option><option value="put">Put</option></select></label>
                  <label className="space-y-1 text-xs text-muted-foreground">Risk-free r (%)<Input aria-label="MC risk-free rate" type="number" step="0.1" value={riskFreeRatePercent} onChange={(event) => invalidate(() => setRiskFreeRatePercent(Number(event.target.value)))} /></label>
                  <label className="space-y-1 text-xs text-muted-foreground">Dividend q (%)<Input aria-label="MC dividend yield" type="number" step="0.1" value={dividendYieldPercent} onChange={(event) => invalidate(() => setDividendYieldPercent(Number(event.target.value)))} /></label>
                </div>
                <label className="space-y-1 text-xs text-muted-foreground">Payoff<select aria-label="MC payoff type" className={selectClassName} value={payoffType} onChange={(event) => invalidate(() => setPayoffType(event.target.value as 'european' | 'arithmetic_asian'))}><option value="european">European terminal payoff</option><option value="arithmetic_asian">Arithmetic Asian average</option></select></label>
              </div> : <div className="space-y-3 rounded-md border bg-secondary/10 p-3" data-mc-risk-inputs="true">
                <label className="space-y-1 text-xs text-muted-foreground">Expected return μ (%)<Input aria-label="MC physical drift" type="number" step="0.1" value={physicalDriftPercent} onChange={(event) => invalidate(() => setPhysicalDriftPercent(Number(event.target.value)))} /></label>
                <label className="space-y-1 text-xs text-muted-foreground">Loss confidence<select aria-label="MC confidence" className={selectClassName} value={confidence} onChange={(event) => invalidate(() => setConfidence(Number(event.target.value)))}><option value="0.95">95%</option><option value="0.99">99%</option></select></label>
                <p className="rounded-md border border-amber-500/25 bg-amber-500/5 p-2 text-xs text-muted-foreground">Underlying-position risk: P&amp;L = position sign × quantity × multiplier × (S<sub>T</sub> − S<sub>0</sub>). Strike and option payoff are not used in P mode.</p>
              </div>}

              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1.5 text-xs text-muted-foreground">Position<select aria-label="MC position" className={selectClassName} value={position} onChange={(event) => invalidate(() => setPosition(event.target.value as Position))}><option value="long">Long</option><option value="short">Short</option></select></label>
                <label className="space-y-1.5 text-xs text-muted-foreground">Currency<Input aria-label="MC currency" maxLength={3} value={currency} onChange={(event) => invalidate(() => setCurrency(event.target.value.toUpperCase()))} /></label>
                <label className="space-y-1.5 text-xs text-muted-foreground">Quantity<Input aria-label="MC quantity" type="number" min="1" value={quantity} onChange={(event) => invalidate(() => setQuantity(Number(event.target.value)))} /></label>
                <label className="space-y-1.5 text-xs text-muted-foreground">Multiplier<Input aria-label="MC multiplier" type="number" min="0.00000001" value={contractMultiplier} onChange={(event) => invalidate(() => setContractMultiplier(Number(event.target.value)))} /></label>
              </div>
            </Card>

            <Card className="space-y-4 p-5">
              <div className="flex items-center justify-between"><h2 className="font-semibold">Simulation contract</h2><Badge variant="outline">ACT/365F</Badge></div>
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1.5 text-xs text-muted-foreground">Paths N<Input aria-label="MC paths" type="number" min="100" max="50000" step="100" value={paths} onChange={(event) => invalidate(() => setPaths(Number(event.target.value)))} /></label>
                <label className="space-y-1.5 text-xs text-muted-foreground">Seed<Input aria-label="MC seed" type="number" min="1" max="2147483646" value={seed} onChange={(event) => invalidate(() => setSeed(Number(event.target.value)))} /></label>
              </div>
              <label className="space-y-1.5 text-xs text-muted-foreground">Variance method
                <select aria-label="MC method" className={selectClassName} value={method} onChange={(event) => invalidate(() => setMethod(event.target.value as Method))}>
                  <option value="none">Plain Monte Carlo</option>
                  <option value="antithetic">Antithetic pairs</option>
                  {mode === 'pricing_risk_neutral' && <option value="control_variate">Terminal-spot control variate</option>}
                </select>
              </label>
              <div className="rounded-md border bg-secondary/20 p-3 text-xs text-muted-foreground">Requested paths equal simulated paths. Seed, RNG, measure, day-count and method are recorded in every result and export. Antithetic standard errors use pair means.</div>
              <Button variant="finance" size="lg" className="min-h-[44px] w-full scroll-mb-20" onClick={run} disabled={busy} data-mc-run="true"><Play className="mr-2 h-4 w-4" />{busy ? 'Running in worker…' : 'Run reproducible simulation'}</Button>
              {error && <Alert variant="destructive" data-mc-error="true"><AlertTriangle className="h-4 w-4" /><AlertTitle>Simulation rejected</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
            </Card>
          </div>

          <div className="min-w-0 space-y-5">
            {!result && !busy && <Card className="flex min-h-[420px] items-center justify-center p-8 text-center"><div className="max-w-lg"><ShieldCheck className="mx-auto h-10 w-10 text-primary" /><h2 className="mt-4 text-xl font-semibold">A simulation you can replay and challenge</h2><p className="mt-2 text-sm text-muted-foreground">Choose P for portfolio loss risk or Q for discounted option pricing. The engine never silently changes N, the measure or the seed.</p></div></Card>}
            {busy && <Card className="flex min-h-[420px] items-center justify-center p-8"><div className="text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /><p className="mt-3 text-sm text-muted-foreground">Simulating {paths.toLocaleString()} paths locally…</p></div></Card>}
            {result && <div data-mc-results="true" className="space-y-5">
              <Card className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-semibold">Reproducible run</h2><Badge variant="secondary">Measure {result.measure}</Badge><Badge variant="outline">Engine {result.engineVersion}</Badge></div><p className="mt-1 font-mono text-xs text-muted-foreground">SHA-256 {result.analysisId}</p></div>
                  <div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => downloadTextFile(`tpl-mc-${result.analysisId.slice(0, 10)}.json`, buildMonteCarloJson(result), 'application/json')}><FileJson className="mr-2 h-4 w-4" />JSON evidence</Button><Button size="sm" variant="outline" onClick={() => downloadTextFile(`tpl-mc-terminals-${result.analysisId.slice(0, 10)}.csv`, buildMonteCarloTerminalCsv(result), 'text/csv')}><Download className="mr-2 h-4 w-4" />Terminals CSV</Button><Button size="sm" variant="outline" onClick={() => downloadTextFile(`tpl-mc-paths-${result.analysisId.slice(0, 10)}.csv`, buildMonteCarloPathsCsv(result), 'text/csv')}><Download className="mr-2 h-4 w-4" />Sample paths CSV</Button></div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                  {result.mode === 'pricing_risk_neutral' ? <>
                    <Card className="p-4"><p className="text-xs uppercase text-muted-foreground">MC price / unit</p><p className="mt-2 text-xl font-semibold">{formatMoney(result.pricing.price, resultCurrency, 4)}</p></Card>
                    <Card className="p-4"><p className="text-xs uppercase text-muted-foreground">Standard error</p><p className="mt-2 text-xl font-semibold">{formatMoney(result.pricing.standardError, resultCurrency, 4)}</p></Card>
                    <Card className="p-4"><p className="text-xs uppercase text-muted-foreground">95% CI</p><p className="mt-2 text-sm font-semibold">[{formatNumber(result.pricing.ci95.lower, 4)} · {formatNumber(result.pricing.ci95.upper, 4)}]</p></Card>
                    <Card className="p-4"><p className="text-xs uppercase text-muted-foreground">Portfolio value</p><p className={`mt-2 text-xl font-semibold ${result.pricing.portfolioValue >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{formatMoney(result.pricing.portfolioValue, resultCurrency)}</p></Card>
                  </> : <>
                    <Card className="p-4"><p className="text-xs uppercase text-muted-foreground">Loss VaR {formatPercent(result.risk.confidence, 0)}</p><p className="mt-2 text-xl font-semibold text-red-500">{formatMoney(result.risk.valueAtRisk, resultCurrency)}</p></Card>
                    <Card className="p-4"><p className="text-xs uppercase text-muted-foreground">Expected Shortfall</p><p className="mt-2 text-xl font-semibold text-red-500">{formatMoney(result.risk.expectedShortfall, resultCurrency)}</p></Card>
                    <Card className="p-4"><p className="text-xs uppercase text-muted-foreground">Probability of loss</p><p className="mt-2 text-xl font-semibold">{formatPercent(result.risk.probabilityOfLoss)}</p></Card>
                    <Card className="p-4"><p className="text-xs uppercase text-muted-foreground">Mean P&amp;L</p><p className={`mt-2 text-xl font-semibold ${result.risk.pnlMean >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{formatMoney(result.risk.pnlMean, resultCurrency)}</p></Card>
                  </>}
                </div>
              </Card>

              <Tabs defaultValue="distribution" className="min-w-0">
                <TabsList className="grid h-auto w-full grid-cols-2 md:grid-cols-4"><TabsTrigger value="distribution">Distribution</TabsTrigger><TabsTrigger value="paths">Same-run paths</TabsTrigger><TabsTrigger value="uncertainty">Uncertainty</TabsTrigger><TabsTrigger value="audit">Audit & history</TabsTrigger></TabsList>
                <TabsContent value="distribution" className="mt-4"><div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]"><Card className="p-5 min-w-0"><h3 className="font-semibold">Canonical terminal distribution</h3><p className="mt-1 text-xs text-muted-foreground">All {result.run.simulatedPaths.toLocaleString()} requested paths; no hidden 5× sample or second seed.</p><div className="mt-4 h-[320px]" data-mc-histogram="true"><ResponsiveContainer width="100%" height="100%"><BarChart data={result.distribution.histogram}><CartesianGrid strokeDasharray="3 3" opacity={0.25} /><XAxis dataKey="midpoint" tickFormatter={(value) => formatNumber(value, 0)} /><YAxis /><Tooltip labelFormatter={(value) => `Terminal spot ${formatNumber(Number(value), 3)}`} /><Bar dataKey="count" name="Path count" fill="#3b82f6" /></BarChart></ResponsiveContainer></div></Card><Card className="p-5"><h3 className="font-semibold">Distribution audit</h3><div className="mt-4 space-y-3 text-sm">{[['Simulated mean', formatNumber(result.distribution.terminalMean, 4)], ['Analytical GBM mean', formatNumber(result.distribution.analyticalTerminalMean, 4)], ['Mean relative error', formatPercent(result.distribution.meanRelativeError, 3)], ['Simulated standard deviation', formatNumber(result.distribution.terminalStdDev, 4)], ['Analytical standard deviation', formatNumber(result.distribution.analyticalTerminalStdDev, 4)], ['P01 / P99', `${formatNumber(result.distribution.quantiles.p01, 3)} / ${formatNumber(result.distribution.quantiles.p99, 3)}`]].map(([label, value]) => <div key={label} className="flex justify-between gap-3 border-b pb-2"><span className="text-muted-foreground">{label}</span><span className="font-mono text-right">{value}</span></div>)}</div></Card></div></TabsContent>
                <TabsContent value="paths" className="mt-4"><Card className="p-5 min-w-0"><h3 className="font-semibold">Sampled paths from this exact run</h3><p className="mt-1 text-xs text-muted-foreground">Path indices and terminal values reconcile with the exported canonical distribution.</p><div className="mt-4 h-[360px]" data-mc-path-chart="true"><ResponsiveContainer width="100%" height="100%"><LineChart data={pathChartData}><CartesianGrid strokeDasharray="3 3" opacity={0.25} /><XAxis dataKey="timeYears" tickFormatter={(value) => formatNumber(value, 2)} /><YAxis domain={['auto', 'auto']} tickFormatter={(value) => formatNumber(value, 0)} /><Tooltip labelFormatter={(value) => `Time ${formatNumber(Number(value), 4)} years`} /><ReferenceLine y={result.input.spot} stroke="#94a3b8" strokeDasharray="4 4" />{result.samplePaths.map((path: any, index: number) => <Line key={path.pathIndex} type="linear" dataKey={`path${path.pathIndex}`} name={`Path ${path.pathIndex}`} stroke={['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'][index % 6]} strokeWidth={1.2} dot={false} isAnimationActive={false} />)}<Legend /></LineChart></ResponsiveContainer></div></Card></TabsContent>
                <TabsContent value="uncertainty" className="mt-4">{result.mode === 'pricing_risk_neutral' ? <div className="space-y-4"><Card className="p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold">Estimator convergence</h3><p className="mt-1 text-xs text-muted-foreground">Nested prefixes N/4, N/2 and N use the same seeded run.</p></div>{result.pricing.blackScholesBenchmark !== null && <Badge variant={result.pricing.benchmarkInsideCi95 ? 'secondary' : 'destructive'}>{result.pricing.benchmarkInsideCi95 ? 'BS benchmark inside CI' : 'BS benchmark outside CI'}</Badge>}</div><div className="mt-4 overflow-x-auto rounded-md border"><Table><TableHeader><TableRow><TableHead>Paths</TableHead><TableHead>Effective samples</TableHead><TableHead className="text-right">Price</TableHead><TableHead className="text-right">SE</TableHead><TableHead className="text-right">95% CI</TableHead></TableRow></TableHeader><TableBody>{result.pricing.convergence.map((row: any) => <TableRow key={row.paths}><TableCell>{row.paths.toLocaleString()}</TableCell><TableCell>{row.effectiveSamples.toLocaleString()}</TableCell><TableCell className="text-right font-mono">{formatNumber(row.price, 5)}</TableCell><TableCell className="text-right font-mono">{formatNumber(row.standardError, 5)}</TableCell><TableCell className="text-right font-mono">[{formatNumber(row.ci95.lower, 4)}; {formatNumber(row.ci95.upper, 4)}]</TableCell></TableRow>)}</TableBody></Table></div></Card><Card className="p-5"><h3 className="font-semibold">Benchmark & variance reduction</h3><div className="mt-3 grid gap-3 sm:grid-cols-2">{[['Method', result.input.method], ['Effective samples', result.pricing.effectiveSamples.toLocaleString()], ['Variance reduction ratio', `${formatNumber(result.pricing.varianceReductionRatio, 2)}×`], ['Black-Scholes benchmark', result.pricing.blackScholesBenchmark === null ? 'Not available for arithmetic Asian' : formatNumber(result.pricing.blackScholesBenchmark, 6)], ['Bias vs benchmark', result.pricing.bias === null ? 'Not applicable' : formatNumber(result.pricing.bias, 6)], ['z-score', result.pricing.zScore === null ? 'Not applicable' : formatNumber(result.pricing.zScore, 3)]].map(([label, value]) => <div key={label} className="rounded-md border p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-mono font-semibold">{value}</p></div>)}</div></Card></div> : <Card className="p-5"><h3 className="font-semibold">Loss-tail convention</h3><p className="mt-2 text-sm text-muted-foreground">{result.risk.convention}</p><div className="mt-4 grid gap-3 sm:grid-cols-3"><div className="rounded-md border p-3"><p className="text-xs text-muted-foreground">Raw loss quantile</p><p className="mt-1 font-mono">{formatMoney(result.risk.rawLossQuantile, resultCurrency)}</p></div><div className="rounded-md border p-3"><p className="text-xs text-muted-foreground">Tail observations</p><p className="mt-1 font-mono">{result.risk.tailCount.toLocaleString()}</p></div><div className="rounded-md border p-3"><p className="text-xs text-muted-foreground">Loss sign</p><p className="mt-1 font-mono">Loss = −P&amp;L</p></div></div></Card>}</TabsContent>
                <TabsContent value="audit" className="mt-4"><div className="grid gap-4 lg:grid-cols-2"><Card className="p-5"><h3 className="font-semibold">Conventions & limitations</h3><div className="mt-3 space-y-3 text-sm"><Alert className="border-emerald-500/30 bg-emerald-500/5"><CheckCircle2 className="h-4 w-4 text-emerald-500" /><AlertTitle>Reproducible contract</AlertTitle><AlertDescription>{result.conventions.measure} {result.conventions.rng}</AlertDescription></Alert><div className="rounded-md border p-3 text-xs text-muted-foreground"><p>Day-count: {result.conventions.dayCount}. Requested paths: {result.run.requestedPaths.toLocaleString()}; simulated: {result.run.simulatedPaths.toLocaleString()}.</p><ul className="mt-2 list-disc space-y-1 pl-5">{result.conventions.limitations.map((limit: string) => <li key={limit}>{limit}</li>)}</ul></div></div></Card><Card className="p-5" data-mc-history="true"><div className="flex items-center justify-between"><h3 className="font-semibold">Successful session runs</h3><Button size="sm" variant="ghost" onClick={() => setHistory([])}><RotateCcw className="mr-2 h-4 w-4" />Clear</Button></div>{history.length ? <div className="mt-3 space-y-2">{history.map((item) => <div key={`${item.run}-${item.analysisId}`} className="rounded-md border p-3 text-xs"><div className="flex justify-between gap-2"><span className="font-mono">Run {item.run} · {item.mode === 'risk_physical' ? 'P risk' : 'Q pricing'}</span><span className="font-mono text-muted-foreground">{item.analysisId.slice(0, 10)}</span></div><p className="mt-1 text-muted-foreground">seed {item.seed} · {item.paths.toLocaleString()} paths · {item.headline}</p></div>)}</div> : <p className="mt-3 text-sm text-muted-foreground">No successful run in this browser session.</p>}</Card></div></TabsContent>
              </Tabs>
            </div>}
          </div>
        </div>
      </div>
    </ToolPageLayout>
  );
};

export default MonteCarloLab;
