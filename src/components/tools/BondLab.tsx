import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CalendarDays, CheckCircle2, Download, FileJson, Loader2, Play, RotateCcw, ShieldCheck } from 'lucide-react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToolRegister } from '@/agent/toolControl';
import { BOND_ENGINE_VERSION, BOND_INPUT_SCHEMA, buildBondCashflowsCsv, buildBondJson, buildBondScenariosCsv, normalizeBondInput } from '@/lib/bond.mjs';
import ToolPageLayout from './ToolPageLayout';

type QuoteMode = 'yield' | 'clean_price';
type DayCount = 'ACT/ACT ICMA' | '30E/360';
type Position = 'long' | 'short';
interface HistoryItem { run: number; analysisId: string; maturity: string; currency: string; clean: number; ytm: number; dv01: number; }

const selectClass = 'h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring';
const number = (value: number, digits = 4) => Number(value).toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: Math.min(2, digits) });
const money = (value: number, currency: string, digits = 2) => `${currency} ${number(value, digits)}`;
const pct = (value: number, digits = 4) => `${number(value * 100, digits)}%`;
const download = (name: string, content: string, type: string) => {
  const url = URL.createObjectURL(new Blob([content], { type: `${type};charset=utf-8` }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = name; document.body.appendChild(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url);
};

const BondLab: React.FC = () => {
  const [settlementDate, setSettlementDate] = useState('2026-07-31'); const [maturityDate, setMaturityDate] = useState('2036-07-31');
  const [dayCount, setDayCount] = useState<DayCount>('ACT/ACT ICMA'); const [couponPct, setCouponPct] = useState(5); const [couponFrequency, setCouponFrequency] = useState(2);
  const [quoteMode, setQuoteMode] = useState<QuoteMode>('yield'); const [yieldPct, setYieldPct] = useState(5); const [cleanPrice, setCleanPrice] = useState(98.25);
  const [currency, setCurrency] = useState('EUR'); const [notional, setNotional] = useState(1_000_000); const [position, setPosition] = useState<Position>('long'); const [shockBp, setShockBp] = useState(25);
  const [result, setResult] = useState<any>(null); const [error, setError] = useState<string | null>(null); const [busy, setBusy] = useState(false); const [history, setHistory] = useState<HistoryItem[]>([]);
  const workerRef = useRef<Worker | null>(null); const activeRef = useRef<string | null>(null); const serial = useRef(1); const nextRun = useRef(1);
  useEffect(() => () => workerRef.current?.terminate(), []);
  const invalidate = (action: () => void) => { workerRef.current?.terminate(); workerRef.current = null; activeRef.current = null; setBusy(false); action(); setResult(null); setError(null); };
  const input = useMemo(() => ({ schemaVersion: BOND_INPUT_SCHEMA, settlementDate, maturityDate, dayCount, couponRate: couponPct / 100, couponFrequency, quoteMode, yieldToMaturity: quoteMode === 'yield' ? yieldPct / 100 : null, cleanPrice: quoteMode === 'clean_price' ? cleanPrice : null, currency, notional, position, shockBp }), [settlementDate, maturityDate, dayCount, couponPct, couponFrequency, quoteMode, yieldPct, cleanPrice, currency, notional, position, shockBp]);
  useToolRegister('bond', input, {});

  const run = () => {
    setError(null); let normalized;
    try { normalized = normalizeBondInput(input); } catch (reason) { setResult(null); setError(reason instanceof Error ? reason.message : 'Bond input rejected.'); return; }
    workerRef.current?.terminate(); const worker = new Worker(new URL('../../workers/bond.worker.mjs', import.meta.url), { type: 'module' }); workerRef.current = worker;
    const requestId = `bond-${serial.current++}`; activeRef.current = requestId; setBusy(true); setResult(null);
    worker.onmessage = (event) => {
      if (event.data?.requestId !== activeRef.current) return;
      setBusy(false); activeRef.current = null; worker.terminate(); workerRef.current = null;
      if (event.data.type === 'error') { setResult(null); setError(event.data.error || 'Bond analysis failed.'); return; }
      const analysis = event.data.result; setResult(analysis);
      setHistory((items) => [{ run: nextRun.current++, analysisId: analysis.analysisId, maturity: analysis.input.maturityDate, currency: analysis.input.currency, clean: analysis.quote.cleanPricePer100, ytm: analysis.quote.yieldToMaturity, dv01: analysis.position.dv01 }, ...items].slice(0, 8));
    };
    worker.onerror = () => { if (activeRef.current === requestId) { setBusy(false); activeRef.current = null; setResult(null); setError('The local bond worker stopped unexpectedly.'); } worker.terminate(); workerRef.current = null; };
    worker.postMessage({ type: 'analyze', requestId, input: normalized });
  };
  const preset = (name: 'par' | 'discount' | 'negative') => invalidate(() => {
    setCurrency('EUR'); setNotional(1_000_000); setPosition('long'); setDayCount('ACT/ACT ICMA'); setCouponFrequency(2);
    if (name === 'par') { setSettlementDate('2026-07-31'); setMaturityDate('2036-07-31'); setCouponPct(5); setQuoteMode('yield'); setYieldPct(5); setShockBp(25); }
    if (name === 'discount') { setSettlementDate('2026-10-17'); setMaturityDate('2036-07-31'); setCouponPct(3); setQuoteMode('clean_price'); setCleanPrice(92.5); setShockBp(100); }
    if (name === 'negative') { setSettlementDate('2026-07-31'); setMaturityDate('2031-07-31'); setCouponPct(1); setQuoteMode('yield'); setYieldPct(-0.75); setShockBp(-50); }
  });
  const resultCurrency = result?.input.currency ?? currency;

  return (
    <ToolPageLayout
      title="Fixed-Rate Bond Pricing & Risk Lab"
      metaDescription="Price a fixed-rate bullet bond from yield or clean price, audit accrued interest and cash flows, and measure duration, convexity, DV01 and exact shock P&L."
      headline="Fixed-Rate Bond Pricing & Risk Lab"
      valueProp="Reconcile the quote, the cash flows and the rate risk — down to the cent and the basis point."
      supportingText="Build a regular maturity-anchored coupon schedule, distinguish clean price from dirty price and accrued interest, solve yield-to-maturity from a market clean price, then compare exact shock repricing with duration and convexity. Every result is local, deterministic and tied to one analysis SHA."
      trustSignals={[`Deterministic engine v${BOND_ENGINE_VERSION}`, 'Clean + accrued = dirty', 'YTM ↔ price inversion', 'Exact central DV01', 'JSON + 2 CSV evidence exports']}
      methodology={[
        { label: 'Street quote', content: 'Prices are per 100 nominal. Coupon and yield are annual nominal decimals compounded at coupon frequency; cash flows strictly after settlement are included.' },
        { label: 'Settlement', content: 'ACT/ACT ICMA or 30E/360 determines the elapsed coupon fraction. Dirty price is discounted cash-flow PV; clean price equals dirty less accrued interest.' },
        { label: 'Risk', content: 'Macaulay and modified duration, analytical convexity and exact symmetric ±1 bp DV01 use the same schedule. The selected parallel shock is repriced exactly and compared with first- and second-order approximations.' },
        { label: 'Model limits', content: 'Fixed-rate bullet bonds and regular unadjusted schedules only. No holidays, settlement lag, stubs, optionality, credit, curve, z-spread or OAS is inferred.' },
      ]}
    >
      <div data-bond-lab="true" className="min-w-0 space-y-6">
        <Card className="p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Fixed-income objective</p><h2 className="mt-1 text-lg font-semibold">Quote-to-risk reconciliation</h2><p className="mt-1 text-sm text-muted-foreground">Fixed-rate bullet · price per 100 · user assumptions only</p></div><div className="flex flex-wrap items-center gap-2"><Badge variant="outline">Starter</Badge><Button size="sm" variant="outline" onClick={() => preset('par')}>Par bond</Button><Button size="sm" variant="outline" onClick={() => preset('discount')}>Discount quote</Button><Button size="sm" variant="outline" onClick={() => preset('negative')}>Negative yield</Button></div></div></Card>

        <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
          <div className="self-start space-y-5">
            <Card className="space-y-4 p-5">
              <div className="flex items-center justify-between"><h2 className="font-semibold">Contract & settlement</h2><Badge variant="outline">Regular</Badge></div>
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1 text-xs text-muted-foreground">Settlement<Input aria-label="Bond settlement date" type="date" value={settlementDate} onChange={(e) => invalidate(() => setSettlementDate(e.target.value))} /></label>
                <label className="space-y-1 text-xs text-muted-foreground">Maturity<Input aria-label="Bond maturity date" type="date" value={maturityDate} onChange={(e) => invalidate(() => setMaturityDate(e.target.value))} /></label>
                <label className="space-y-1 text-xs text-muted-foreground">Coupon (%)<Input aria-label="Bond coupon rate" type="number" min="0" max="100" step="0.01" value={couponPct} onChange={(e) => invalidate(() => setCouponPct(Number(e.target.value)))} /></label>
                <label className="space-y-1 text-xs text-muted-foreground">Coupons / year<select aria-label="Bond coupon frequency" className={selectClass} value={couponFrequency} onChange={(e) => invalidate(() => setCouponFrequency(Number(e.target.value)))}><option value={1}>Annual</option><option value={2}>Semi-annual</option><option value={4}>Quarterly</option><option value={12}>Monthly</option></select></label>
              </div>
              <label className="space-y-1 text-xs text-muted-foreground">Day count<select aria-label="Bond day count" className={selectClass} value={dayCount} onChange={(e) => invalidate(() => setDayCount(e.target.value as DayCount))}><option value="ACT/ACT ICMA">ACT/ACT ICMA</option><option value="30E/360">30E/360</option></select></label>
              <p className="rounded-md border bg-secondary/20 p-3 text-xs text-muted-foreground">Coupon dates are generated backwards from maturity with end-of-month preservation. The engine never rounds a fractional maturity or invents a stub/calendar adjustment.</p>
            </Card>

            <Card className="space-y-4 p-5">
              <div className="flex items-center justify-between"><h2 className="font-semibold">Quote & position</h2><Badge variant="outline">per 100</Badge></div>
              <label className="space-y-1 text-xs text-muted-foreground">Quote input<select aria-label="Bond quote mode" className={selectClass} value={quoteMode} onChange={(e) => invalidate(() => setQuoteMode(e.target.value as QuoteMode))}><option value="yield">Yield-to-maturity</option><option value="clean_price">Clean price</option></select></label>
              {quoteMode === 'yield' ? <label className="space-y-1 text-xs text-muted-foreground">Yield-to-maturity (%)<Input aria-label="Bond yield to maturity" type="number" step="0.01" value={yieldPct} onChange={(e) => invalidate(() => setYieldPct(Number(e.target.value)))} /></label> : <label className="space-y-1 text-xs text-muted-foreground">Clean price / 100<Input aria-label="Bond clean price" type="number" min="0.00000001" step="0.01" value={cleanPrice} onChange={(e) => invalidate(() => setCleanPrice(Number(e.target.value)))} /></label>}
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1 text-xs text-muted-foreground">Position<select aria-label="Bond position" className={selectClass} value={position} onChange={(e) => invalidate(() => setPosition(e.target.value as Position))}><option value="long">Long</option><option value="short">Short</option></select></label>
                <label className="space-y-1 text-xs text-muted-foreground">Currency<Input aria-label="Bond currency" maxLength={3} value={currency} onChange={(e) => invalidate(() => setCurrency(e.target.value.toUpperCase()))} /></label>
                <label className="col-span-2 space-y-1 text-xs text-muted-foreground">Nominal<Input aria-label="Bond notional" type="number" min="0.00000001" step="1000" value={notional} onChange={(e) => invalidate(() => setNotional(Number(e.target.value)))} /></label>
                <label className="col-span-2 space-y-1 text-xs text-muted-foreground">Parallel shock (bp)<Input aria-label="Bond shock basis points" type="number" min="-5000" max="5000" step="1" value={shockBp} onChange={(e) => invalidate(() => setShockBp(Number(e.target.value)))} /></label>
              </div>
              <Button variant="finance" size="lg" className="min-h-[44px] w-full" data-bond-run="true" disabled={busy} onClick={run}><Play className="mr-2 h-4 w-4" />{busy ? 'Building schedule in worker…' : 'Price, solve & measure risk'}</Button>
              {error && <Alert variant="destructive" data-bond-error="true"><AlertTriangle className="h-4 w-4" /><AlertTitle>Bond analysis rejected</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
            </Card>
          </div>

          <div className="min-w-0 space-y-5">
            {!result && !busy && <Card className="flex min-h-[430px] items-center justify-center p-8 text-center"><div className="max-w-lg"><CalendarDays className="mx-auto h-10 w-10 text-primary" /><h2 className="mt-4 text-xl font-semibold">One quote, fully reconciled</h2><p className="mt-2 text-sm text-muted-foreground">Start with the par bond to prove the golden identity, then value an off-cycle discount bond or test a negative yield. The schedule, accrued interest, risk and exact shock P&amp;L remain auditable.</p></div></Card>}
            {busy && <Card className="flex min-h-[430px] items-center justify-center p-8"><div className="text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /><p className="mt-3 text-sm text-muted-foreground">Generating contractual cash flows and exact repricings locally…</p></div></Card>}
            {result && <div data-bond-results="true" className="space-y-5">
              <Card className="p-5"><div className="flex min-w-0 flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{result.input.position} {money(result.input.notional, resultCurrency, 0)} nominal · matures {result.input.maturityDate}</p><h2 className="mt-1 text-xl font-semibold">Clean {number(result.quote.cleanPricePer100, 6)} per 100</h2><p className="mt-1 text-sm text-muted-foreground">Yield {pct(result.quote.yieldToMaturity, 6)} · {result.schedule.cashflowCount} future cash flows</p></div><Badge variant="outline" className="max-w-full whitespace-normal break-all text-left font-mono text-[10px] leading-4 sm:text-xs">SHA-256 {result.analysisId}</Badge></div><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[['Dirty price / 100', number(result.quote.dirtyPricePer100, 6)], ['Accrued / 100', number(result.quote.accruedInterestPer100, 6)], ['Clean market value', money(result.position.cleanMarketValue, resultCurrency, 2)], ['Position DV01', `${money(result.position.dv01, resultCurrency, 2)} / bp`]].map(([label, value]) => <div key={label} className="rounded-md border bg-secondary/10 p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-mono text-sm font-semibold">{value}</p></div>)}</div></Card>

              <Tabs defaultValue="quote"><TabsList className="h-auto w-full justify-start overflow-x-auto"><TabsTrigger value="quote">Quote audit</TabsTrigger><TabsTrigger value="risk">Risk & scenarios</TabsTrigger><TabsTrigger value="cashflows">Cash flows</TabsTrigger><TabsTrigger value="method">Conventions</TabsTrigger></TabsList>
                <TabsContent value="quote" className="space-y-4">
                  <Card className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">{[['Previous coupon', result.schedule.previousCouponDate], ['Settlement', result.input.settlementDate], ['Next coupon', result.schedule.nextCouponDate], ['Elapsed period', pct(result.schedule.accruedPeriodFraction, 4)], ['Remaining period', pct(result.schedule.remainingCouponFraction, 4)], ['Coupon / period / 100', number(result.instrument.couponPerPeriodPer100, 6)]].map(([label, value]) => <div key={label}><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-mono text-sm">{value}</p></div>)}</Card>
                  <Alert><CheckCircle2 className="h-4 w-4" /><AlertTitle>Clean + accrued = dirty</AlertTitle><AlertDescription>{number(result.quote.cleanPricePer100, 8)} + {number(result.quote.accruedInterestPer100, 8)} = {number(result.quote.dirtyPricePer100, 8)} per 100.</AlertDescription></Alert>
                  {result.quote.solver && <Alert><ShieldCheck className="h-4 w-4" /><AlertTitle>Yield solved from clean price</AlertTitle><AlertDescription>{result.quote.solver.iterations} bounded iterations; final price residual {result.quote.solver.residualPer100.toExponential(3)} per 100.</AlertDescription></Alert>}
                  {result.diagnostics.map((item: any) => <Alert key={item.code}><CheckCircle2 className="h-4 w-4" /><AlertTitle>{item.code.replaceAll('_', ' ')}</AlertTitle><AlertDescription>{item.message}</AlertDescription></Alert>)}
                </TabsContent>
                <TabsContent value="risk" className="space-y-4">
                  <Card className="p-5"><div className="mb-4"><h3 className="font-semibold">Exact price/yield scenarios</h3><p className="text-xs text-muted-foreground">Exact clean price against parallel yield shocks; duration-convexity is an approximation of the dirty-price change.</p></div><div className="h-[300px] w-full"><ResponsiveContainer width="100%" height="100%"><LineChart data={result.scenarios}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="shockBp" unit="bp" /><YAxis domain={['auto', 'auto']} /><Tooltip /><Legend /><Line type="monotone" dataKey="cleanPricePer100" name="Exact clean price" stroke="#ef4444" dot /><Line type="monotone" dataKey="dirtyPricePer100" name="Exact dirty price" stroke="#3b82f6" dot={false} /></LineChart></ResponsiveContainer></div></Card>
                  <Card className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">{[['Macaulay duration', `${number(result.analytics.macaulayDurationYears, 6)} y`], ['Modified duration', number(result.analytics.modifiedDuration, 6)], ['Convexity', number(result.analytics.convexity, 6)], ['DV01 / 100', number(result.analytics.dv01Per100, 8)], [`Exact P&L (${result.input.shockBp} bp)`, money(result.selectedScenario.exactPnl, resultCurrency)], ['Duration P&L', money(result.selectedScenario.durationPnl, resultCurrency)], ['Duration + convexity', money(result.selectedScenario.durationConvexityPnl, resultCurrency)], ['Approximation error / 100', number(result.selectedScenario.approximationErrorPer100, 8)]].map(([label, value]) => <div key={label}><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-mono text-sm">{value}</p></div>)}</Card>
                  <Card className="overflow-hidden"><div className="max-h-[360px] overflow-auto"><Table data-bond-scenario-table="true"><TableHeader className="sticky top-0 bg-background"><TableRow><TableHead>Shock</TableHead><TableHead>Yield</TableHead><TableHead>Clean</TableHead><TableHead>Exact Δ / 100</TableHead><TableHead>Dur + conv Δ</TableHead><TableHead>Error</TableHead></TableRow></TableHeader><TableBody>{result.scenarios.map((row: any) => <TableRow key={row.shockBp}><TableCell>{row.shockBp >= 0 ? '+' : ''}{row.shockBp} bp</TableCell><TableCell>{pct(row.yield, 5)}</TableCell><TableCell>{number(row.cleanPricePer100, 6)}</TableCell><TableCell>{number(row.exactChangePer100, 6)}</TableCell><TableCell>{number(row.durationConvexityApproxChangePer100, 6)}</TableCell><TableCell>{number(row.approximationErrorPer100, 8)}</TableCell></TableRow>)}</TableBody></Table></div></Card>
                </TabsContent>
                <TabsContent value="cashflows" className="space-y-4"><Card className="overflow-hidden"><div className="max-h-[500px] overflow-auto"><Table data-bond-cashflow-table="true"><TableHeader className="sticky top-0 bg-background"><TableRow><TableHead>Date</TableHead><TableHead>t (years)</TableHead><TableHead>Coupon / 100</TableHead><TableHead>Principal / 100</TableHead><TableHead>Discount factor</TableHead><TableHead>PV / 100</TableHead><TableHead>CF DV01 / 100</TableHead><TableHead>Position DV01</TableHead></TableRow></TableHeader><TableBody>{result.cashflows.map((row: any) => <TableRow key={row.paymentDate}><TableCell>{row.paymentDate}</TableCell><TableCell>{number(row.timeYears, 6)}</TableCell><TableCell>{number(row.couponPer100, 6)}</TableCell><TableCell>{number(row.principalPer100, 2)}</TableCell><TableCell>{number(row.discountFactor, 8)}</TableCell><TableCell>{number(row.presentValuePer100, 8)}</TableCell><TableCell>{number(row.cashflowDv01Per100, 8)}</TableCell><TableCell>{money(row.positionDv01, resultCurrency, 4)}</TableCell></TableRow>)}</TableBody></Table></div></Card><Alert><ShieldCheck className="h-4 w-4" /><AlertTitle>Cash-flow DV01 attribution — not key-rate duration</AlertTitle><AlertDescription>Each row bumps only that cash flow's flat-yield discount exponent by ±1 bp. Row DV01s sum to the parallel DV01 with reconciliation error {result.analytics.cashflowDv01ReconciliationError.toExponential(3)}; this is an attribution, not a curve-node KRD.</AlertDescription></Alert></TabsContent>
                <TabsContent value="method" className="space-y-4"><Card className="space-y-3 p-5"><h3 className="font-semibold">Declared conventions</h3>{Object.entries(result.conventions).map(([key, value]) => <div key={key} className="grid gap-1 border-b pb-3 last:border-0 sm:grid-cols-[180px_1fr]"><span className="font-mono text-xs">{key}</span><span className="text-sm text-muted-foreground">{String(value)}</span></div>)}</Card><Alert><AlertTriangle className="h-4 w-4" /><AlertTitle>Deliberate v1 limits</AlertTitle><AlertDescription><ul className="mt-2 list-disc space-y-1 pl-5">{result.limitations.map((item: string) => <li key={item}>{item}</li>)}</ul></AlertDescription></Alert></TabsContent>
              </Tabs>

              <Card className="p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-semibold">Versioned evidence</h3><p className="text-xs text-muted-foreground">Every file carries engine v{result.engineVersion} and the same analysis SHA-256.</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => download(`bond-${result.analysisId.slice(0, 12)}.json`, buildBondJson(result), 'application/json')}><FileJson className="mr-2 h-4 w-4" />JSON</Button><Button variant="outline" size="sm" onClick={() => download(`bond-cashflows-${result.analysisId.slice(0, 12)}.csv`, buildBondCashflowsCsv(result), 'text/csv')}><Download className="mr-2 h-4 w-4" />Cash flows CSV</Button><Button variant="outline" size="sm" onClick={() => download(`bond-scenarios-${result.analysisId.slice(0, 12)}.csv`, buildBondScenariosCsv(result), 'text/csv')}><Download className="mr-2 h-4 w-4" />Scenarios CSV</Button></div></div></Card>
            </div>}
          </div>
        </div>

        <Card className="p-5"><div className="flex items-center justify-between"><div><h2 className="font-semibold">Successful session history</h2><p className="text-xs text-muted-foreground">Last eight successful local runs; invalid attempts never enter history.</p></div><Button size="sm" variant="ghost" onClick={() => setHistory([])} disabled={!history.length}><RotateCcw className="mr-2 h-4 w-4" />Clear</Button></div>{history.length ? <div className="mt-4 overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Run</TableHead><TableHead>Maturity</TableHead><TableHead>Clean / 100</TableHead><TableHead>YTM</TableHead><TableHead>Position DV01</TableHead><TableHead>Analysis</TableHead></TableRow></TableHeader><TableBody>{history.map((item) => <TableRow key={item.run}><TableCell>Run {item.run}</TableCell><TableCell>{item.maturity}</TableCell><TableCell>{number(item.clean, 6)}</TableCell><TableCell>{pct(item.ytm, 5)}</TableCell><TableCell>{money(item.dv01, item.currency, 2)}</TableCell><TableCell className="font-mono text-xs">{item.analysisId.slice(0, 12)}</TableCell></TableRow>)}</TableBody></Table></div> : <p className="mt-4 text-sm text-muted-foreground">No successful bond analysis in this session yet.</p>}</Card>
      </div>
    </ToolPageLayout>
  );
};

export default BondLab;
