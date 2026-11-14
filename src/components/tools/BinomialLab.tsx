import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Download, FileJson, GitBranch, Loader2, Play, RotateCcw, ShieldCheck } from 'lucide-react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToolRegister } from '@/agent/toolControl';
import { BINOMIAL_ENGINE_VERSION, BINOMIAL_INPUT_SCHEMA, buildBinomialConvergenceCsv, buildBinomialFrontierCsv, buildBinomialJson, normalizeBinomialInput } from '@/lib/binomial.mjs';
import ToolPageLayout from './ToolPageLayout';

type OptionType = 'call' | 'put';
type ExerciseStyle = 'european' | 'american';
type Position = 'long' | 'short';
interface HistoryItem { run: number; analysisId: string; optionType: OptionType; exerciseStyle: ExerciseStyle; steps: number; currency: string; price: number; premium: number; }

const selectClass = 'h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring';
const number = (value: number, digits = 4) => Number(value).toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: Math.min(2, digits) });
const money = (value: number, currency: string, digits = 4) => `${currency} ${number(value, digits)}`;
const download = (name: string, content: string, type: string) => {
  const url = URL.createObjectURL(new Blob([content], { type: `${type};charset=utf-8` }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = name; document.body.appendChild(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url);
};

const BinomialLab: React.FC = () => {
  const [spot, setSpot] = useState(100); const [strike, setStrike] = useState(100);
  const [volatilityPct, setVolatilityPct] = useState(20); const [maturityDays, setMaturityDays] = useState(365);
  const [ratePct, setRatePct] = useState(5); const [dividendPct, setDividendPct] = useState(0);
  const [steps, setSteps] = useState(300); const [optionType, setOptionType] = useState<OptionType>('put');
  const [exerciseStyle, setExerciseStyle] = useState<ExerciseStyle>('american');
  const [currency, setCurrency] = useState('USD'); const [quantity, setQuantity] = useState(1);
  const [multiplier, setMultiplier] = useState(100); const [position, setPosition] = useState<Position>('long');
  const [result, setResult] = useState<any>(null); const [error, setError] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const workerRef = useRef<Worker | null>(null); const activeRef = useRef<string | null>(null); const serial = useRef(1); const nextRun = useRef(1);
  useEffect(() => () => workerRef.current?.terminate(), []);
  const invalidate = (action: () => void) => { workerRef.current?.terminate(); workerRef.current = null; activeRef.current = null; setBusy(false); action(); setResult(null); setError(null); };
  const input = useMemo(() => ({ schemaVersion: BINOMIAL_INPUT_SCHEMA, spot, strike, volatility: volatilityPct / 100, maturityYears: maturityDays / 365, dayCount: 'ACT/365F', riskFreeRate: ratePct / 100, dividendYield: dividendPct / 100, steps, optionType, exerciseStyle, currency, quantity, contractMultiplier: multiplier, position }), [spot, strike, volatilityPct, maturityDays, ratePct, dividendPct, steps, optionType, exerciseStyle, currency, quantity, multiplier, position]);
  useToolRegister('binomial', input, {});

  const run = () => {
    setError(null); let normalized;
    try { normalized = normalizeBinomialInput(input); } catch (reason) { setResult(null); setError(reason instanceof Error ? reason.message : 'Binomial input rejected.'); return; }
    workerRef.current?.terminate(); const worker = new Worker(new URL('../../workers/binomial.worker.mjs', import.meta.url), { type: 'module' }); workerRef.current = worker;
    const requestId = `binomial-${serial.current++}`; activeRef.current = requestId; setBusy(true); setResult(null);
    worker.onmessage = (event) => {
      if (event.data?.requestId !== activeRef.current) return;
      setBusy(false); activeRef.current = null; worker.terminate(); workerRef.current = null;
      if (event.data.type === 'error') { setResult(null); setError(event.data.error || 'Binomial analysis failed.'); return; }
      const analysis = event.data.result; setResult(analysis);
      const item = { run: nextRun.current++, analysisId: analysis.analysisId, optionType: analysis.input.optionType, exerciseStyle: analysis.input.exerciseStyle, steps: analysis.input.steps, currency: analysis.input.currency, price: analysis.valuation.pricePerUnit, premium: analysis.valuation.earlyExercisePremiumPerUnit };
      setHistory((items) => [item, ...items].slice(0, 8));
    };
    worker.onerror = () => { if (activeRef.current === requestId) { setBusy(false); activeRef.current = null; setResult(null); setError('The local binomial worker stopped unexpectedly.'); } worker.terminate(); workerRef.current = null; };
    worker.postMessage({ type: 'analyze', requestId, input: normalized });
  };
  const preset = (name: 'put' | 'dividend-call' | 'european') => invalidate(() => {
    if (name === 'put') { setSpot(100); setStrike(100); setRatePct(5); setDividendPct(0); setVolatilityPct(20); setMaturityDays(365); setSteps(300); setOptionType('put'); setExerciseStyle('american'); }
    if (name === 'dividend-call') { setSpot(100); setStrike(90); setRatePct(1); setDividendPct(12); setVolatilityPct(20); setMaturityDays(365); setSteps(300); setOptionType('call'); setExerciseStyle('american'); }
    if (name === 'european') { setSpot(100); setStrike(100); setRatePct(5); setDividendPct(0); setVolatilityPct(20); setMaturityDays(365); setSteps(1000); setOptionType('call'); setExerciseStyle('european'); }
  });
  const resultCurrency = result?.input.currency ?? currency;
  const boundary = result?.earlyExercise.boundary ?? [];
  const visibleBoundary = boundary.length > 120 ? boundary.filter((_: any, index: number) => index % Math.ceil(boundary.length / 120) === 0 || index === boundary.length - 1) : boundary;

  return (
    <ToolPageLayout
      title="American Option & CRR Lattice Lab"
      metaDescription="Price European and American options with a deterministic CRR lattice, early-exercise frontier, convergence diagnostics, Greeks and reproducible evidence."
      headline="American Option & CRR Lattice Lab"
      valueProp="See exactly where exercise beats continuation — and whether the lattice has converged."
      supportingText="Price calls and puts under the risk-neutral measure Q with a recombining Cox-Ross-Rubinstein tree. The lab rejects invalid probabilities, separates American value from its European benchmark and ties retained node evidence, Greeks and exports to one analysis."
      trustSignals={[`Deterministic engine v${BINOMIAL_ENGINE_VERSION}`, 'No probability clamping', 'Exercise frontier', 'N vs N−1 convergence', 'JSON + 2 CSV evidence exports']}
      methodology={[
        { label: 'Risk-neutral step', content: 'u = exp(σ√dt), d = 1/u and p* = [exp((r−q)dt)−d]/(u−d). A probability outside [0,1] is a model/input failure, never something to clamp.' },
        { label: 'American exercise', content: 'Each node compares intrinsic value with discounted risk-neutral continuation. The recorded frontier is the outer exercise boundary at each date.' },
        { label: 'Convergence', content: 'Raw N and N−1 prices are both shown because CRR prices can oscillate by parity. The adjacent average is diagnostic, not silently substituted for the raw price.' },
        { label: 'Model limits', content: 'Constant volatility, constant rate and continuous dividend yield only. No discrete dividends, smile/skew, jumps, costs, liquidity or margin; inputs are not live market quotes.' },
      ]}
    >
      <div data-binomial-lab="true" className="space-y-6 min-w-0">
        <Card className="p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Lattice objective</p><h2 className="mt-1 text-lg font-semibold">Exercise-aware option valuation</h2><p className="mt-1 text-sm text-muted-foreground">Measure Q · ACT/365F · user assumptions only</p></div><div className="flex flex-wrap items-center gap-2"><Badge variant="outline">Student</Badge><Button size="sm" variant="outline" onClick={() => preset('put')}>American put</Button><Button size="sm" variant="outline" onClick={() => preset('dividend-call')}>Dividend call</Button><Button size="sm" variant="outline" onClick={() => preset('european')}>European benchmark</Button></div></div></Card>

        <div className="grid gap-5 xl:grid-cols-[350px_minmax(0,1fr)]">
          <div className="space-y-5 self-start">
            <Card className="space-y-4 p-5">
              <div className="flex items-center justify-between"><h2 className="font-semibold">Market & contract</h2><Badge variant="outline">{exerciseStyle === 'american' ? 'American' : 'European'}</Badge></div>
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1 text-xs text-muted-foreground">Spot<Input aria-label="Binomial spot" type="number" min="0.00000001" value={spot} onChange={(e) => invalidate(() => setSpot(Number(e.target.value)))} /></label>
                <label className="space-y-1 text-xs text-muted-foreground">Strike<Input aria-label="Binomial strike" type="number" min="0.00000001" value={strike} onChange={(e) => invalidate(() => setStrike(Number(e.target.value)))} /></label>
                <label className="space-y-1 text-xs text-muted-foreground">Volatility (%)<Input aria-label="Binomial volatility" type="number" min="0" max="500" step="0.1" value={volatilityPct} onChange={(e) => invalidate(() => setVolatilityPct(Number(e.target.value)))} /></label>
                <label className="space-y-1 text-xs text-muted-foreground">Maturity (days)<Input aria-label="Binomial maturity days" type="number" min="0" max="10950" value={maturityDays} onChange={(e) => invalidate(() => setMaturityDays(Number(e.target.value)))} /></label>
                <label className="space-y-1 text-xs text-muted-foreground">Risk-free r (%)<Input aria-label="Binomial risk-free rate" type="number" step="0.1" value={ratePct} onChange={(e) => invalidate(() => setRatePct(Number(e.target.value)))} /></label>
                <label className="space-y-1 text-xs text-muted-foreground">Dividend q (%)<Input aria-label="Binomial dividend yield" type="number" step="0.1" value={dividendPct} onChange={(e) => invalidate(() => setDividendPct(Number(e.target.value)))} /></label>
                <label className="space-y-1 text-xs text-muted-foreground">Option<select aria-label="Binomial option type" className={selectClass} value={optionType} onChange={(e) => invalidate(() => setOptionType(e.target.value as OptionType))}><option value="call">Call</option><option value="put">Put</option></select></label>
                <label className="space-y-1 text-xs text-muted-foreground">Exercise<select aria-label="Binomial exercise style" className={selectClass} value={exerciseStyle} onChange={(e) => invalidate(() => setExerciseStyle(e.target.value as ExerciseStyle))}><option value="european">European</option><option value="american">American</option></select></label>
              </div>
            </Card>
            <Card className="space-y-4 p-5">
              <div className="flex items-center justify-between"><h2 className="font-semibold">Numerical contract</h2><Badge variant="outline">CRR</Badge></div>
              <label className="space-y-1 text-xs text-muted-foreground">Steps N<Input aria-label="Binomial steps" type="number" min="2" max="2000" value={steps} onChange={(e) => invalidate(() => setSteps(Number(e.target.value)))} /></label>
              <div className="grid grid-cols-2 gap-3"><label className="space-y-1 text-xs text-muted-foreground">Position<select aria-label="Binomial position" className={selectClass} value={position} onChange={(e) => invalidate(() => setPosition(e.target.value as Position))}><option value="long">Long</option><option value="short">Short</option></select></label><label className="space-y-1 text-xs text-muted-foreground">Currency<Input aria-label="Binomial currency" maxLength={3} value={currency} onChange={(e) => invalidate(() => setCurrency(e.target.value.toUpperCase()))} /></label><label className="space-y-1 text-xs text-muted-foreground">Quantity<Input aria-label="Binomial quantity" type="number" min="1" value={quantity} onChange={(e) => invalidate(() => setQuantity(Number(e.target.value)))} /></label><label className="space-y-1 text-xs text-muted-foreground">Multiplier<Input aria-label="Binomial multiplier" type="number" min="0.00000001" value={multiplier} onChange={(e) => invalidate(() => setMultiplier(Number(e.target.value)))} /></label></div>
              <p className="rounded-md border bg-secondary/20 p-3 text-xs text-muted-foreground">N is never reduced silently. The engine proves d &lt; exp((r−q)dt) &lt; u or rejects the run. Zero volatility and expiry use explicit deterministic limits.</p>
              <Button variant="finance" size="lg" className="min-h-[44px] w-full" data-binomial-run="true" disabled={busy} onClick={run}><Play className="mr-2 h-4 w-4" />{busy ? 'Building lattice in worker…' : 'Price & audit lattice'}</Button>
              {error && <Alert variant="destructive" data-binomial-error="true"><AlertTriangle className="h-4 w-4" /><AlertTitle>Lattice rejected</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
            </Card>
          </div>

          <div className="min-w-0 space-y-5">
            {!result && !busy && <Card className="flex min-h-[430px] items-center justify-center p-8 text-center"><div className="max-w-lg"><GitBranch className="mx-auto h-10 w-10 text-primary" /><h2 className="mt-4 text-xl font-semibold">An exercise decision you can inspect</h2><p className="mt-2 text-sm text-muted-foreground">Start with the American put, then compare a high-dividend call and a European benchmark. The first six retained tree levels expose intrinsic and continuation value; the full exercise frontier spans all dates.</p></div></Card>}
            {busy && <Card className="flex min-h-[430px] items-center justify-center p-8"><div className="text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /><p className="mt-3 text-sm text-muted-foreground">Running {steps.toLocaleString()} backward-induction steps locally…</p></div></Card>}
            {result && <div data-binomial-results="true" className="space-y-5">
              <Card className="p-5"><div className="flex min-w-0 flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{result.input.exerciseStyle} {result.input.optionType} · {result.input.steps} steps · {result.input.position} {result.input.quantity}×{result.input.contractMultiplier}</p><h2 className="mt-1 text-xl font-semibold">{money(result.valuation.pricePerUnit, resultCurrency)} per unit</h2><p className="mt-1 text-sm text-muted-foreground">Position value {money(result.valuation.positionValue, resultCurrency, 2)}</p></div><Badge variant="outline" className="max-w-full whitespace-normal break-all text-left font-mono text-[10px] leading-4 sm:text-xs">SHA-256 {result.analysisId}</Badge></div><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[['Early-exercise premium', money(result.valuation.earlyExercisePremiumPerUnit, resultCurrency)], ['European same-tree', money(result.valuation.europeanPricePerUnit, resultCurrency)], ['Black-Scholes benchmark', money(result.valuation.blackScholesBenchmark, resultCurrency)], ['N vs N−1 gap', money(result.valuation.adjacentStepGap, resultCurrency)]].map(([label, value]) => <div key={label} className="rounded-md border bg-secondary/10 p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-mono text-sm font-semibold">{value}</p></div>)}</div></Card>

              <Tabs defaultValue="overview"><TabsList className="h-auto w-full justify-start overflow-x-auto"><TabsTrigger value="overview">Convergence</TabsTrigger><TabsTrigger value="exercise">Exercise</TabsTrigger><TabsTrigger value="greeks">Greeks</TabsTrigger><TabsTrigger value="audit">Node audit</TabsTrigger></TabsList>
                <TabsContent value="overview" className="space-y-4"><Card className="p-5"><div className="mb-4"><h3 className="font-semibold">Raw lattice convergence</h3><p className="text-xs text-muted-foreground">The European same-tree series is the only one compared with Black-Scholes for an American contract.</p></div><div className="h-[300px] w-full"><ResponsiveContainer width="100%" height="100%"><LineChart data={result.convergence}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="steps" /><YAxis domain={['auto', 'auto']} /><Tooltip /><Legend /><Line type="monotone" dataKey="pricePerUnit" name="Selected exercise" stroke="#ef4444" dot /><Line type="monotone" dataKey="europeanPricePerUnit" name="European same tree" stroke="#3b82f6" dot /><Line type="monotone" dataKey="blackScholesBenchmark" name="BS benchmark" stroke="#22c55e" strokeDasharray="5 5" dot={false} /></LineChart></ResponsiveContainer></div></Card><Card className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">{[['dt (years)', number(result.model.timeStepYears, 8)], ['u', number(result.model.upFactor, 8)], ['d', number(result.model.downFactor, 8)], ['p*', result.model.riskNeutralUpProbability === null ? 'deterministic' : number(result.model.riskNeutralUpProbability, 8)], ['discount / step', number(result.model.discountFactorPerStep, 8)], ['Adjacent average', money(result.valuation.adjacentStepAverage, resultCurrency)]].map(([label, value]) => <div key={label}><p className="text-xs text-muted-foreground">{label}</p><p className="font-mono text-sm">{value}</p></div>)}</Card>{result.diagnostics.map((item: any) => <Alert key={item.code} className={item.severity === 'warning' ? 'border-amber-500/30' : ''}><CheckCircle2 className="h-4 w-4" /><AlertTitle>{item.code.replaceAll('_', ' ')}</AlertTitle><AlertDescription>{item.message}</AlertDescription></Alert>)}</TabsContent>
                <TabsContent value="exercise" className="space-y-4">{result.input.exerciseStyle === 'european' ? <Alert><ShieldCheck className="h-4 w-4" /><AlertTitle>European exercise</AlertTitle><AlertDescription>Only terminal payoff is exercisable. Switch to American to create and audit an optimal-stopping frontier.</AlertDescription></Alert> : boundary.length === 0 ? <Alert><ShieldCheck className="h-4 w-4" /><AlertTitle>No early-exercise region</AlertTitle><AlertDescription>No pre-maturity node beat continuation on this lattice. This is expected for a non-dividend American call.</AlertDescription></Alert> : <><Card className="p-5"><h3 className="font-semibold">Optimal exercise frontier</h3><p className="mb-4 text-xs text-muted-foreground">{result.earlyExercise.exercisedNodeCount.toLocaleString()} exercise nodes; first at step {result.earlyExercise.firstExerciseStep}. Boundary is {result.input.optionType === 'put' ? 'highest exercised spot' : 'lowest exercised spot'} by date.</p><div className="h-[280px]"><ResponsiveContainer width="100%" height="100%"><LineChart data={visibleBoundary}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="timeYears" /><YAxis domain={['auto', 'auto']} /><Tooltip /><Line type="monotone" dataKey="boundarySpot" name="Exercise boundary" stroke="#ef4444" dot={false} /></LineChart></ResponsiveContainer></div></Card><Card className="overflow-hidden"><div className="max-h-[360px] overflow-auto"><Table><TableHeader className="sticky top-0 bg-background"><TableRow><TableHead>Step</TableHead><TableHead>Time</TableHead><TableHead>Boundary spot</TableHead><TableHead>Exercise nodes</TableHead></TableRow></TableHeader><TableBody>{boundary.slice(-120).map((row: any) => <TableRow key={row.step}><TableCell>{row.step}</TableCell><TableCell>{number(row.timeYears, 4)}y</TableCell><TableCell>{number(row.boundarySpot, 4)}</TableCell><TableCell>{row.exerciseNodeCount}</TableCell></TableRow>)}</TableBody></Table></div></Card></>}</TabsContent>
                <TabsContent value="greeks"><Card className="overflow-hidden"><Table><TableHeader><TableRow><TableHead>Greek</TableHead><TableHead>Per unit</TableHead><TableHead>Signed position</TableHead><TableHead>Convention</TableHead></TableRow></TableHeader><TableBody>{[['Delta','delta','per +1 spot'],['Gamma','gamma','per spot²'],['Vega','vega','per +1 vol point'],['Theta','theta','one calendar day elapsed'],['Rho','rho','per +1 rate point']].map(([label, key, convention]) => <TableRow key={key}><TableCell className="font-medium">{label}</TableCell><TableCell className="font-mono">{number(result.greeks.perUnit[key], 6)}</TableCell><TableCell className="font-mono">{number(result.greeks.position[key], 4)}</TableCell><TableCell className="text-xs text-muted-foreground">{convention}</TableCell></TableRow>)}</TableBody></Table><p className="border-t p-4 text-xs text-muted-foreground">Delta/Gamma/Theta use the first two retained tree levels; Vega and Rho use documented symmetric bumps where admissible. American Greeks may oscillate with N.</p></Card></TabsContent>
                <TabsContent value="audit"><Card className="overflow-hidden"><div className="max-h-[460px] overflow-auto"><Table data-binomial-node-table="true"><TableHeader className="sticky top-0 bg-background"><TableRow><TableHead>Step</TableHead><TableHead>Up moves</TableHead><TableHead>Spot</TableHead><TableHead>Intrinsic</TableHead><TableHead>Continuation</TableHead><TableHead>Option value</TableHead><TableHead>Decision</TableHead></TableRow></TableHeader><TableBody>{result.tree.nodes.map((node: any) => <TableRow key={`${node.step}-${node.upMoves}`}><TableCell>{node.step}</TableCell><TableCell>{node.upMoves}</TableCell><TableCell>{number(node.spot, 4)}</TableCell><TableCell>{number(node.intrinsic, 4)}</TableCell><TableCell>{node.continuation === null ? 'terminal' : number(node.continuation, 4)}</TableCell><TableCell>{number(node.value, 4)}</TableCell><TableCell><Badge variant={node.exercise ? 'destructive' : 'outline'}>{node.exercise ? 'exercise' : 'hold'}</Badge></TableCell></TableRow>)}</TableBody></Table></div></Card></TabsContent>
              </Tabs>

              <Card className="p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-semibold">Versioned evidence</h3><p className="text-xs text-muted-foreground">Every file carries engine v{result.engineVersion} and analysis SHA-256.</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => download(`binomial-${result.analysisId.slice(0, 12)}.json`, buildBinomialJson(result), 'application/json')}><FileJson className="mr-2 h-4 w-4" />JSON</Button><Button variant="outline" size="sm" onClick={() => download(`binomial-convergence-${result.analysisId.slice(0, 12)}.csv`, buildBinomialConvergenceCsv(result), 'text/csv')}><Download className="mr-2 h-4 w-4" />Convergence CSV</Button><Button variant="outline" size="sm" onClick={() => download(`binomial-frontier-${result.analysisId.slice(0, 12)}.csv`, buildBinomialFrontierCsv(result), 'text/csv')}><Download className="mr-2 h-4 w-4" />Frontier CSV</Button></div></div></Card>
            </div>}
          </div>
        </div>

        <Card className="p-5"><div className="flex items-center justify-between"><div><h2 className="font-semibold">Successful session history</h2><p className="text-xs text-muted-foreground">Last eight successful local runs; invalid attempts never enter history.</p></div><Button size="sm" variant="ghost" onClick={() => setHistory([])} disabled={!history.length}><RotateCcw className="mr-2 h-4 w-4" />Clear</Button></div>{history.length ? <div className="mt-4 overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Run</TableHead><TableHead>Contract</TableHead><TableHead>N</TableHead><TableHead>Price</TableHead><TableHead>Exercise premium</TableHead><TableHead>Analysis</TableHead></TableRow></TableHeader><TableBody>{history.map((item) => <TableRow key={item.run}><TableCell>Run {item.run}</TableCell><TableCell>{item.exerciseStyle} {item.optionType}</TableCell><TableCell>{item.steps}</TableCell><TableCell>{money(item.price, item.currency)}</TableCell><TableCell>{money(item.premium, item.currency)}</TableCell><TableCell className="font-mono text-xs">{item.analysisId.slice(0, 12)}</TableCell></TableRow>)}</TableBody></Table></div> : <p className="mt-4 text-sm text-muted-foreground">No successful lattice in this session yet.</p>}</Card>
      </div>
    </ToolPageLayout>
  );
};

export default BinomialLab;
