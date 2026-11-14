import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, CheckCircle2, Download, FileJson, Loader2, Play, RotateCcw, ShieldCheck } from 'lucide-react';
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToolRegister } from '@/agent/toolControl';
import {
  BLACK_SCHOLES_ENGINE_VERSION,
  BLACK_SCHOLES_INPUT_SCHEMA,
  buildBlackScholesJson,
  buildBlackScholesScenarioCsv,
  buildBlackScholesSensitivityCsv,
  normalizeBlackScholesInput,
} from '@/lib/blackScholes.mjs';
import ToolPageLayout from './ToolPageLayout';

type QuoteMode = 'volatility' | 'market_price';
type OptionType = 'call' | 'put';
type Position = 'long' | 'short';
type SensitivityAxis = 'spot' | 'volatility' | 'maturity';

interface HistoryItem {
  run: number;
  analysisId: string;
  optionType: OptionType;
  quoteMode: QuoteMode;
  unitPrice: number;
  impliedVolatility: number;
  currency: string;
}

const selectClassName = 'h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring';
const formatNumber = (value: number, digits = 4) => Number(value).toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: Math.min(2, digits) });
const formatMoney = (value: number, currency: string, digits = 4) => `${currency} ${formatNumber(value, digits)}`;
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

const BlackScholesLab: React.FC = () => {
  const [quoteMode, setQuoteMode] = useState<QuoteMode>('volatility');
  const [optionType, setOptionType] = useState<OptionType>('call');
  const [spot, setSpot] = useState(100);
  const [strike, setStrike] = useState(100);
  const [maturityDays, setMaturityDays] = useState(365);
  const [riskFreeRatePercent, setRiskFreeRatePercent] = useState(5);
  const [dividendYieldPercent, setDividendYieldPercent] = useState(0);
  const [volatilityPercent, setVolatilityPercent] = useState(20);
  const [marketPrice, setMarketPrice] = useState(10.4505756);
  const [currency, setCurrency] = useState('USD');
  const [position, setPosition] = useState<Position>('long');
  const [quantity, setQuantity] = useState(1);
  const [multiplier, setMultiplier] = useState(100);
  const [spotShockPercent, setSpotShockPercent] = useState(10);
  const [volShockPointsPercent, setVolShockPointsPercent] = useState(5);
  const [daysShock, setDaysShock] = useState(30);
  const [sensitivityAxis, setSensitivityAxis] = useState<SensitivityAxis>('spot');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const workerRef = useRef<Worker | null>(null);
  const activeRequestRef = useRef<string | null>(null);
  const requestSerial = useRef(1);
  const nextRun = useRef(1);

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
  const setAgentNumber = (value: unknown, setter: (next: number) => void, scale: number, label: string) => {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      invalidate(() => {});
      setError(`${label} from the agent must be a finite JSON number.`);
      return;
    }
    invalidate(() => setter(value * scale));
  };

  const input = useMemo(() => ({
    schemaVersion: BLACK_SCHOLES_INPUT_SCHEMA,
    quoteMode,
    optionType,
    spot,
    strike,
    maturityYears: maturityDays / 365,
    dayCount: 'ACT/365F',
    riskFreeRate: riskFreeRatePercent / 100,
    dividendYield: dividendYieldPercent / 100,
    volatility: quoteMode === 'volatility' ? volatilityPercent / 100 : null,
    marketPrice: quoteMode === 'market_price' ? marketPrice : null,
    currency,
    position,
    quantity,
    multiplier,
    shocks: { spotPct: spotShockPercent, volPoints: volShockPointsPercent, days: daysShock },
  }), [quoteMode, optionType, spot, strike, maturityDays, riskFreeRatePercent, dividendYieldPercent, volatilityPercent, marketPrice, currency, position, quantity, multiplier, spotShockPercent, volShockPointsPercent, daysShock]);

  useToolRegister('bs-pricer', input, {
    quoteMode: (value: QuoteMode) => invalidate(() => setQuoteMode(value)),
    optionType: (value: OptionType) => invalidate(() => setOptionType(value)),
    spot: (value: unknown) => setAgentNumber(value, setSpot, 1, 'spot'),
    strike: (value: unknown) => setAgentNumber(value, setStrike, 1, 'strike'),
    maturityYears: (value: unknown) => setAgentNumber(value, setMaturityDays, 365, 'maturityYears'),
    riskFreeRate: (value: unknown) => setAgentNumber(value, setRiskFreeRatePercent, 100, 'riskFreeRate'),
    dividendYield: (value: unknown) => setAgentNumber(value, setDividendYieldPercent, 100, 'dividendYield'),
    volatility: (value: unknown) => setAgentNumber(value, setVolatilityPercent, 100, 'volatility'),
    marketPrice: (value: unknown) => setAgentNumber(value, setMarketPrice, 1, 'marketPrice'),
  });

  const run = () => {
    workerRef.current?.terminate();
    setResult(null);
    setError(null);
    setBusy(true);
    let validatedInput: any;
    try {
      validatedInput = normalizeBlackScholesInput(input);
    } catch (validationError) {
      setError(validationError instanceof Error ? validationError.message : 'Black-Scholes input validation failed.');
      setBusy(false);
      activeRequestRef.current = null;
      workerRef.current = null;
      return;
    }
    const requestId = `bs-${requestSerial.current++}`;
    activeRequestRef.current = requestId;
    const worker = new Worker(new URL('../../workers/blackScholes.worker.mjs', import.meta.url), { type: 'module' });
    workerRef.current = worker;
    worker.onmessage = (event) => {
      if (event.data?.requestId !== activeRequestRef.current) return;
      if (event.data.type === 'error') {
        setError(event.data.error || 'Black-Scholes analysis failed.');
      } else if (event.data.type === 'result') {
        const analysis = event.data.result;
        setResult(analysis);
        setHistory((current) => [{
          run: nextRun.current++,
          analysisId: analysis.analysisId,
          optionType: analysis.input.optionType,
          quoteMode: analysis.input.quoteMode,
          unitPrice: analysis.selected.unitPrice,
          impliedVolatility: analysis.quote.impliedVolatility,
          currency: analysis.input.currency,
        }, ...current].slice(0, 8));
      }
      setBusy(false);
      activeRequestRef.current = null;
      worker.terminate();
      if (workerRef.current === worker) workerRef.current = null;
    };
    worker.onerror = (event) => {
      if (requestId === activeRequestRef.current) {
        setError(event.message || 'Black-Scholes worker failed.');
        setBusy(false);
        activeRequestRef.current = null;
      }
      worker.terminate();
      if (workerRef.current === worker) workerRef.current = null;
    };
    worker.postMessage({ type: 'analyze', requestId, input: validatedInput });
  };

  const resultCurrency = result?.input.currency ?? currency;
  const sensitivityRows = result?.sensitivities?.[sensitivityAxis] ?? [];
  const sensitivityLabel = sensitivityAxis === 'spot' ? 'Spot' : sensitivityAxis === 'volatility' ? 'Volatility' : 'Maturity';
  const xFormatter = (value: number) => sensitivityAxis === 'volatility' ? formatPercent(value, 1) : sensitivityAxis === 'maturity' ? `${formatNumber(value, 2)}y` : formatNumber(value, 1);

  return (
    <ToolPageLayout
      title="Black-Scholes Pricing & IV Lab"
      metaDescription="Price European calls and puts, invert strict implied volatility, inspect signed Greeks and scenarios, and export SHA-bound evidence."
      headline="Black-Scholes Pricing & IV Lab"
      valueProp="A desk-grade closed-form reference for prices, implied volatility, Greeks and position scenarios."
      supportingText="Run the canonical European Black-Scholes-Merton engine with continuous rates and dividend yield. Every successful analysis is computed locally in a worker, bound to its normalized inputs by SHA-256, and exportable as JSON plus scenario and sensitivity CSV evidence."
      trustSignals={[`Canonical engine ${BLACK_SCHOLES_ENGINE_VERSION}`, 'Strict IV bounds', 'T=0 and σ=0 limits', 'ACT/365F', 'Anonymous & free', 'JSON + 2 CSV exports']}
    >
      <div data-black-scholes-lab="true" className="space-y-6">
        <Card className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Quote objective</p><p className="mt-1 text-sm text-muted-foreground">{quoteMode === 'volatility' ? 'Price from declared volatility' : 'Implied volatility from observed option price'}</p></div>
            <div className="flex flex-wrap items-center gap-2"><Badge variant="outline">Free</Badge><div className="flex rounded-md border p-1"><Button size="sm" variant={quoteMode === 'volatility' ? 'secondary' : 'ghost'} onClick={() => invalidate(() => setQuoteMode('volatility'))}>Price</Button><Button size="sm" variant={quoteMode === 'market_price' ? 'secondary' : 'ghost'} onClick={() => invalidate(() => setQuoteMode('market_price'))}>Implied vol</Button></div></div>
          </div>
        </Card>

        <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
          <div className="space-y-5 self-start">
            <Card className="space-y-4 p-5">
              <div className="flex items-center justify-between"><h2 className="font-semibold">Market & contract</h2><Badge variant="outline">European</Badge></div>
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1.5 text-xs text-muted-foreground">Option<select aria-label="BS option type" className={selectClassName} value={optionType} onChange={(event) => invalidate(() => setOptionType(event.target.value as OptionType))}><option value="call">Call</option><option value="put">Put</option></select></label>
                <label className="space-y-1.5 text-xs text-muted-foreground">Currency<Input aria-label="BS currency" maxLength={3} value={currency} onChange={(event) => invalidate(() => setCurrency(event.target.value.toUpperCase()))} /></label>
                <label className="space-y-1.5 text-xs text-muted-foreground">Spot<Input aria-label="BS spot" type="number" min="0.00000001" value={spot} onChange={(event) => invalidate(() => setSpot(Number(event.target.value)))} /></label>
                <label className="space-y-1.5 text-xs text-muted-foreground">Strike<Input aria-label="BS strike" type="number" min="0.00000001" value={strike} onChange={(event) => invalidate(() => setStrike(Number(event.target.value)))} /></label>
                <label className="space-y-1.5 text-xs text-muted-foreground">Maturity (days)<Input aria-label="BS maturity days" type="number" min="0" max="10950" value={maturityDays} onChange={(event) => invalidate(() => setMaturityDays(Number(event.target.value)))} /></label>
                <label className="space-y-1.5 text-xs text-muted-foreground">Day-count<Input value="ACT/365F" readOnly aria-label="BS day count" /></label>
                <label className="space-y-1.5 text-xs text-muted-foreground">Risk-free r (%)<Input aria-label="BS risk-free rate" type="number" step="0.1" value={riskFreeRatePercent} onChange={(event) => invalidate(() => setRiskFreeRatePercent(Number(event.target.value)))} /></label>
                <label className="space-y-1.5 text-xs text-muted-foreground">Dividend q (%)<Input aria-label="BS dividend yield" type="number" step="0.1" value={dividendYieldPercent} onChange={(event) => invalidate(() => setDividendYieldPercent(Number(event.target.value)))} /></label>
              </div>
              {quoteMode === 'volatility' ? <label className="block space-y-1.5 text-xs text-muted-foreground">Volatility σ (%)<Input aria-label="BS volatility" type="number" min="0" max="500" step="0.1" value={volatilityPercent} onChange={(event) => invalidate(() => setVolatilityPercent(Number(event.target.value)))} /></label> : <label className="block space-y-1.5 text-xs text-muted-foreground">Observed option price<Input aria-label="BS market price" type="number" min="0" step="0.0001" value={marketPrice} onChange={(event) => invalidate(() => setMarketPrice(Number(event.target.value)))} /></label>}
              <p className="rounded-md border bg-secondary/20 p-3 text-xs text-muted-foreground">Rates and dividend yield are continuously compounded. Maturity is converted exactly as days ÷ 365. IV inversion rejects prices outside no-arbitrage and engine bounds.</p>
            </Card>

            <Card className="space-y-4 p-5">
              <h2 className="font-semibold">Position & exact shocks</h2>
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1.5 text-xs text-muted-foreground">Position<select aria-label="BS position" className={selectClassName} value={position} onChange={(event) => invalidate(() => setPosition(event.target.value as Position))}><option value="long">Long</option><option value="short">Short</option></select></label>
                <label className="space-y-1.5 text-xs text-muted-foreground">Quantity<Input aria-label="BS quantity" type="number" min="1" step="1" value={quantity} onChange={(event) => invalidate(() => setQuantity(Number(event.target.value)))} /></label>
                <label className="space-y-1.5 text-xs text-muted-foreground">Multiplier<Input aria-label="BS multiplier" type="number" min="0.00000001" value={multiplier} onChange={(event) => invalidate(() => setMultiplier(Number(event.target.value)))} /></label>
                <label className="space-y-1.5 text-xs text-muted-foreground">Spot shock ± (%)<Input aria-label="BS spot shock" type="number" min="0" max="95" step="0.1" value={spotShockPercent} onChange={(event) => invalidate(() => setSpotShockPercent(Number(event.target.value)))} /></label>
                <label className="space-y-1.5 text-xs text-muted-foreground">Vol shock ± (pts)<Input aria-label="BS volatility shock" type="number" min="0" max="500" step="0.1" value={volShockPointsPercent} onChange={(event) => invalidate(() => setVolShockPointsPercent(Number(event.target.value)))} /></label>
                <label className="space-y-1.5 text-xs text-muted-foreground">Time forward (days)<Input aria-label="BS days shock" type="number" min="0" max="10950" step="1" value={daysShock} onChange={(event) => invalidate(() => setDaysShock(Number(event.target.value)))} /></label>
              </div>
              <Button variant="finance" size="lg" className="min-h-[44px] w-full" onClick={run} disabled={busy} data-bs-run="true"><Play className="mr-2 h-4 w-4" />{busy ? 'Calculating in worker…' : 'Run pricing analysis'}</Button>
              {error && <Alert variant="destructive" data-bs-error="true"><AlertTriangle className="h-4 w-4" /><AlertTitle>Analysis rejected</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
            </Card>
          </div>

          <div className="min-w-0 space-y-5">
            {!result && !busy && <Card className="flex min-h-[420px] items-center justify-center p-8 text-center"><div className="max-w-lg"><ShieldCheck className="mx-auto h-10 w-10 text-primary" /><h2 className="mt-4 text-xl font-semibold">One canonical price, fully auditable</h2><p className="mt-2 text-sm text-muted-foreground">Run the contract to reconcile call, put, parity, signed portfolio Greeks and exact spot, volatility and time shocks.</p></div></Card>}
            {busy && <Card className="flex min-h-[420px] items-center justify-center p-8"><div className="text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /><p className="mt-3 text-sm text-muted-foreground">Pricing and binding evidence locally…</p></div></Card>}
            {result && <div data-bs-results="true" className="space-y-5">
              <Card className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-semibold">Canonical analysis</h2><Badge variant="secondary">{result.input.optionType.toUpperCase()}</Badge><Badge variant="outline">Engine {result.engineVersion}</Badge>{result.selected.limit !== 'regular' && <Badge variant="outline">{result.selected.limit.replaceAll('_', ' ')}</Badge>}</div><p className="mt-1 break-all font-mono text-xs text-muted-foreground">SHA-256 {result.analysisId}</p></div>
                  <div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => downloadTextFile(`tpl-bs-${result.analysisId.slice(0, 10)}.json`, buildBlackScholesJson(result), 'application/json')}><FileJson className="mr-2 h-4 w-4" />JSON</Button><Button size="sm" variant="outline" onClick={() => downloadTextFile(`tpl-bs-scenarios-${result.analysisId.slice(0, 10)}.csv`, buildBlackScholesScenarioCsv(result), 'text/csv')}><Download className="mr-2 h-4 w-4" />Scenarios CSV</Button><Button size="sm" variant="outline" onClick={() => downloadTextFile(`tpl-bs-sensitivities-${result.analysisId.slice(0, 10)}.csv`, buildBlackScholesSensitivityCsv(result), 'text/csv')}><Download className="mr-2 h-4 w-4" />Sensitivities CSV</Button></div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4"><Card className="p-4"><p className="text-xs uppercase text-muted-foreground">Selected unit price</p><p className="mt-2 text-xl font-semibold">{formatMoney(result.selected.unitPrice, resultCurrency)}</p></Card><Card className="p-4"><p className="text-xs uppercase text-muted-foreground">Portfolio value</p><p className={`mt-2 text-xl font-semibold ${result.selected.portfolioValue >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{formatMoney(result.selected.portfolioValue, resultCurrency, 2)}</p></Card><Card className="p-4"><p className="text-xs uppercase text-muted-foreground">Effective volatility</p><p className="mt-2 text-xl font-semibold">{formatPercent(result.quote.impliedVolatility, 4)}</p></Card><Card className="p-4"><p className="text-xs uppercase text-muted-foreground">Put-call parity</p><p className={`mt-2 text-xl font-semibold ${result.parity.holds ? 'text-emerald-500' : 'text-red-500'}`}>{result.parity.holds ? 'PASS' : 'FAIL'}</p><p className="mt-1 font-mono text-xs text-muted-foreground">residual {formatNumber(result.parity.residual, 10)}</p></Card></div>
              </Card>

              <Card className="p-5" data-bs-next-steps="true">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><h3 className="font-semibold">Continue from this analysis</h3><p className="mt-1 text-xs text-muted-foreground">Turn the free European benchmark into a strategy, a simulation or a richer volatility workflow.</p></div>
                  <Button asChild size="sm" variant="outline"><Link to="/courses/black-scholes">Review the free course<ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-md border p-4"><Badge variant="secondary">Starter</Badge><p className="mt-2 text-sm font-medium">Move from one option to portfolio decisions</p><p className="mt-1 text-xs text-muted-foreground">Build exact terminal payoffs or simulate path-dependent pricing and P/L risk.</p><div className="mt-3 flex flex-wrap gap-2"><Button asChild size="sm"><Link to="/tools/payoff">Payoff Strategy</Link></Button><Button asChild size="sm" variant="outline"><Link to="/tools/mc">Monte Carlo</Link></Button></div></div>
                  <div className="rounded-md border p-4"><Badge>Student</Badge><p className="mt-2 text-sm font-medium">Go beyond the closed-form assumptions</p><p className="mt-1 text-xs text-muted-foreground">Inspect American exercise, calibrate models and audit the implied-volatility surface.</p><div className="mt-3 flex flex-wrap gap-2"><Button asChild size="sm"><Link to="/tools/binomial">American CRR</Link></Button><Button asChild size="sm" variant="outline"><Link to="/tools/calib">Calibration</Link></Button><Button asChild size="sm" variant="outline"><Link to="/tools/volsurface">Vol Surface</Link></Button></div></div>
                </div>
              </Card>
              <p className="text-xs text-muted-foreground">Boundary policy: volatility sensitivities are clipped to [0%, 500%], maturity is floored at expiry, and the zero-volatility forward-ATM kink uses the declared symmetric half-Greek convention shown in Audit.</p>
              <Tabs defaultValue="prices">
                <TabsList className="grid h-auto w-full grid-cols-2 sm:grid-cols-5"><TabsTrigger value="prices">Call & put</TabsTrigger><TabsTrigger value="greeks">Greeks</TabsTrigger><TabsTrigger value="scenarios">Scenarios</TabsTrigger><TabsTrigger value="sensitivities">Sensitivities</TabsTrigger><TabsTrigger value="audit">Audit</TabsTrigger></TabsList>
                <TabsContent value="prices" className="mt-4"><div className="grid gap-4 lg:grid-cols-2">{[result.call, result.put].map((option: any) => <Card className={`p-5 ${option.type === result.input.optionType ? 'border-primary/50' : ''}`} key={option.type}><div className="flex items-center justify-between"><h3 className="font-semibold capitalize">European {option.type}</h3>{option.type === result.input.optionType && <Badge>Selected</Badge>}</div><p className="mt-4 text-3xl font-semibold">{formatMoney(option.unitPrice, resultCurrency)}</p><p className="mt-2 text-sm text-muted-foreground">Signed position value: <span className="font-mono text-foreground">{formatMoney(option.portfolioValue, resultCurrency, 2)}</span></p></Card>)}</div>{result.quote.solver && <Alert className="mt-4 border-emerald-500/30 bg-emerald-500/5"><CheckCircle2 className="h-4 w-4 text-emerald-500" /><AlertTitle>Strict implied volatility converged</AlertTitle><AlertDescription>{result.quote.solver.method.replaceAll('_', ' ')} · {result.quote.solver.iterations} iterations · residual {formatNumber(result.quote.solver.residual, 12)}.</AlertDescription></Alert>}</TabsContent>
                <TabsContent value="greeks" className="mt-4"><Card className="p-5"><h3 className="font-semibold">Selected option Greeks</h3><p className="mt-1 text-xs text-muted-foreground">Unit and signed portfolio exposure. Vega and rho are per 1 percentage point; theta is per calendar day.</p><div className="mt-4 overflow-x-auto rounded-md border"><Table><TableHeader><TableRow><TableHead>Greek</TableHead><TableHead>Unit convention</TableHead><TableHead className="text-right">Unit</TableHead><TableHead className="text-right">Portfolio</TableHead></TableRow></TableHeader><TableBody>{Object.entries(result.selected.greeks).map(([greek, value]) => <TableRow key={greek}><TableCell className="capitalize font-medium">{greek}</TableCell><TableCell className="text-xs text-muted-foreground">{result.conventions[greek]}</TableCell><TableCell className="text-right font-mono">{formatNumber(value as number, 8)}</TableCell><TableCell className="text-right font-mono">{formatNumber(result.selected.portfolioGreeks[greek], 6)}</TableCell></TableRow>)}</TableBody></Table></div></Card></TabsContent>
                <TabsContent value="scenarios" className="mt-4"><Card className="p-5"><h3 className="font-semibold">Exact one-factor shocks</h3><p className="mt-1 text-xs text-muted-foreground">Every row reprices the selected option; unshocked factors stay at base, volatility floors explicitly at zero and time floors explicitly at expiry.</p><div className="mt-4 overflow-x-auto rounded-md border"><Table><TableHeader><TableRow><TableHead>Scenario</TableHead><TableHead className="text-right">Spot</TableHead><TableHead className="text-right">Vol</TableHead><TableHead className="text-right">T years</TableHead><TableHead className="text-right">Unit price</TableHead><TableHead className="text-right">Portfolio P&amp;L</TableHead></TableRow></TableHeader><TableBody>{result.scenarios.map((row: any) => <TableRow key={row.scenario}><TableCell className="font-medium">{row.scenario.replaceAll('_', ' ')}</TableCell><TableCell className="text-right font-mono">{formatNumber(row.spot, 4)}</TableCell><TableCell className="text-right font-mono">{formatPercent(row.volatility, 2)}</TableCell><TableCell className="text-right font-mono">{formatNumber(row.maturityYears, 6)}</TableCell><TableCell className="text-right font-mono">{formatNumber(row.unitPrice, 6)}</TableCell><TableCell className={`text-right font-mono ${row.pnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{formatMoney(row.pnl, resultCurrency, 2)}</TableCell></TableRow>)}</TableBody></Table></div></Card></TabsContent>
                <TabsContent value="sensitivities" className="mt-4"><Card className="min-w-0 p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-semibold">Position sensitivity</h3><p className="mt-1 text-xs text-muted-foreground">21 canonical points; signed portfolio value uses quantity × multiplier × position.</p></div><select aria-label="BS sensitivity axis" className={`${selectClassName} w-48`} value={sensitivityAxis} onChange={(event) => setSensitivityAxis(event.target.value as SensitivityAxis)}><option value="spot">Spot 60%–140%</option><option value="volatility">Volatility ±10 pts</option><option value="maturity">Maturity horizon</option></select></div><div className="mt-4 h-[340px]" data-bs-sensitivity-chart="true"><ResponsiveContainer width="100%" height="100%"><LineChart data={sensitivityRows}><CartesianGrid strokeDasharray="3 3" opacity={0.25} /><XAxis dataKey="x" tickFormatter={xFormatter} /><YAxis tickFormatter={(value) => formatNumber(Number(value), 0)} /><Tooltip labelFormatter={(value) => `${sensitivityLabel}: ${xFormatter(Number(value))}`} formatter={(value) => [formatMoney(Number(value), resultCurrency, 2), 'Portfolio value']} /><ReferenceLine x={sensitivityAxis === 'spot' ? result.input.spot : sensitivityAxis === 'volatility' ? result.quote.impliedVolatility : result.input.maturityYears} stroke="#94a3b8" strokeDasharray="4 4" /><Line type="monotone" dataKey="portfolioValue" stroke="#3b82f6" strokeWidth={2} dot={false} isAnimationActive={false} /></LineChart></ResponsiveContainer></div></Card></TabsContent>
                <TabsContent value="audit" className="mt-4"><div className="grid gap-4 lg:grid-cols-2"><Card className="p-5"><h3 className="font-semibold">Conventions & evidence</h3><Alert className="mt-3 border-emerald-500/30 bg-emerald-500/5"><CheckCircle2 className="h-4 w-4 text-emerald-500" /><AlertTitle>Input-bound output</AlertTitle><AlertDescription>The SHA-256 identifier is computed from the exact normalized input contract before pricing.</AlertDescription></Alert><div className="mt-3 rounded-md border p-3 text-xs text-muted-foreground"><p>European exercise · risk-neutral Q · continuously compounded rates and continuous dividend yield.</p><p className="mt-2">Day-count: {result.conventions.dayCount}. User-supplied educational inputs; no live market quote is fetched.</p><ul className="mt-2 list-disc space-y-1 pl-5"><li>Constant volatility and rates.</li><li>No smile, jumps, liquidity, transaction costs or early exercise.</li><li>Scenario shocks are exact one-factor repricings.</li></ul></div></Card><Card className="p-5" data-bs-history="true"><div className="flex items-center justify-between"><h3 className="font-semibold">Successful session runs</h3><Button size="sm" variant="ghost" onClick={() => setHistory([])}><RotateCcw className="mr-2 h-4 w-4" />Clear</Button></div>{history.length ? <div className="mt-3 space-y-2">{history.map((item) => <div key={`${item.run}-${item.analysisId}`} className="rounded-md border p-3 text-xs"><div className="flex justify-between gap-2"><span className="font-mono">Run {item.run} · {item.optionType.toUpperCase()} · {item.quoteMode}</span><span className="font-mono text-muted-foreground">{item.analysisId.slice(0, 10)}</span></div><p className="mt-1 text-muted-foreground">{formatMoney(item.unitPrice, item.currency)} · IV {formatPercent(item.impliedVolatility, 4)}</p></div>)}</div> : <p className="mt-3 text-sm text-muted-foreground">No successful run in this browser session.</p>}</Card></div></TabsContent>
              </Tabs>
            </div>}
          </div>
        </div>
      </div>
    </ToolPageLayout>
  );
};

export default BlackScholesLab;
