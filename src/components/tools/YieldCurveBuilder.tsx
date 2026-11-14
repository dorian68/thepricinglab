import React, { useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ComparisonLineChart, LineChart } from '@/components/ui/chart';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  YIELD_CURVE_VERSION,
  buildYieldCurve,
  createYieldCurveExport,
  parseYieldCurveCsv,
} from '@/lib/yieldCurve.mjs';
import ToolPageLayout from './ToolPageLayout';

type InstrumentType = 'deposit' | 'fra' | 'future' | 'swap';

interface EditableInstrument {
  id: number;
  type: InstrumentType;
  startYears: string;
  maturityYears: string;
  quoteValue: string;
  convexityBp: string;
}

interface CurveNode {
  time: number;
  intervalStart: number;
  intervalEnd: number;
  intervalYears: number;
  intervalLabel: string;
  source: 'market-pillar' | 'interpolated-cashflow';
  instrumentId: string | null;
  discountFactor: number;
  zeroContinuous: number;
  zeroAnnual: number;
  forwardContinuous: number;
  forwardSimple: number;
  forwardAnnualCompounded: number;
}

interface RepricingItem {
  instrumentId: string;
  type: InstrumentType;
  start: number;
  maturity: number;
  marketQuote: number;
  impliedQuote: number;
  quoteResidual: number;
  pvResidual: number;
  discountStart: number;
  discountEnd: number;
  annuity: number | null;
  marketFuturePrice?: number;
  futuresRate?: number;
  convexityAdjustment?: number;
  fraEquivalentRate?: number;
  impliedFuturePrice?: number;
  futurePriceResidual?: number;
}

interface CurveResult {
  schema: string;
  engineVersion: string;
  conventions: Record<string, string | number>;
  limitations: string[];
  inputs: Array<Record<string, unknown>>;
  anchors: Array<{ time: number; discountFactor: number; instrumentId: string }>;
  curve: CurveNode[];
  repricing: RepricingItem[];
  diagnostics: {
    converged: boolean;
    positiveDiscountFactors: boolean;
    instrumentCount: number;
    marketPillarCount: number;
    curveNodeCount: number;
    interpolatedCouponCount: number;
    totalRootIterations: number;
    maxAbsPvResidual: number;
    maxAbsQuoteResidual: number;
    negativeForwardIntervals: string[];
    risingDiscountFactorIntervals: string[];
    largeForwardIntervals: string[];
    warnings: string[];
  };
}

interface CurveHistoryItem {
  id: number;
  source: string;
  frequency: number;
  instruments: number;
  finalMaturity: number;
  finalDiscountFactor: number;
  maxPvResidual: number;
  warnings: number;
  version: string;
}

const DEFAULT_ROWS: EditableInstrument[] = [
  { id: 1, type: 'deposit', startYears: '', maturityYears: '0.25', quoteValue: '4.20', convexityBp: '' },
  { id: 2, type: 'future', startYears: '0.25', maturityYears: '0.50', quoteValue: '95.70', convexityBp: '5' },
  { id: 3, type: 'fra', startYears: '0.50', maturityYears: '1.00', quoteValue: '4.30', convexityBp: '' },
  { id: 4, type: 'swap', startYears: '', maturityYears: '2.00', quoteValue: '4.35', convexityBp: '' },
  { id: 5, type: 'swap', startYears: '', maturityYears: '3.00', quoteValue: '4.40', convexityBp: '' },
  { id: 6, type: 'swap', startYears: '', maturityYears: '5.00', quoteValue: '4.50', convexityBp: '' },
  { id: 7, type: 'swap', startYears: '', maturityYears: '10.00', quoteValue: '4.60', convexityBp: '' },
];

const SAMPLE_CURVE_CSV = `# ThePricingLibrary single-curve example — deterministic teaching inputs, not live market data
# Units: year fractions in years; quotePercent in percent; futurePrice in price points; convexityAdjustmentBp in basis points
# Futures convention: FRA-equivalent rate = (100 - futurePrice) / 100 - convexityAdjustmentBp / 10000
instrument,startYears,maturityYears,quotePercent,futurePrice,convexityAdjustmentBp
deposit,,0.25,4.20,,
future,0.25,0.50,,95.70,5
fra,0.50,1.00,4.30,,
swap,,2.00,4.35,,
swap,,3.00,4.40,,
swap,,5.00,4.50,,
swap,,10.00,4.60,,
`;

const cloneDefaultRows = () => DEFAULT_ROWS.map((row) => ({ ...row }));
const formatNumber = (value: number, digits = 6) => Number.isFinite(value) ? value.toFixed(digits) : 'n/a';
const formatPercent = (value: number, digits = 4) => `${formatNumber(value * 100, digits)}%`;
const formatBp = (value: number, digits = 4) => `${formatNumber(value * 10_000, digits)} bp`;
const formatResidual = (value: number) => Number.isFinite(value) ? value.toExponential(2) : 'n/a';

const downloadTextFile = (fileName: string, content: string, mediaType: string) => {
  const blob = new Blob([content], { type: `${mediaType};charset=utf-8` });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1_000);
};

const rowsToEngineInputs = (rows: EditableInstrument[]) => rows.map((row) => {
  const maturity = Number(row.maturityYears);
  if (row.type === 'future') {
    return {
      type: row.type,
      start: Number(row.startYears),
      maturity,
      futurePrice: Number(row.quoteValue),
      convexityAdjustment: Number(row.convexityBp) / 10_000,
    };
  }
  return {
    type: row.type,
    start: row.type === 'fra' ? Number(row.startYears) : 0,
    maturity,
    quote: Number(row.quoteValue) / 100,
  };
});

const engineInputsToRows = (inputs: Array<Record<string, number | string | null>>, startId: number) => inputs.map((input, index) => {
  const type = input.type as InstrumentType;
  return {
    id: startId + index,
    type,
    startYears: type === 'fra' || type === 'future' ? String(input.start ?? '') : '',
    maturityYears: String(input.maturity),
    quoteValue: type === 'future' ? String(input.futurePrice) : String(Number(input.quote) * 100),
    convexityBp: type === 'future' ? String(Number(input.convexityAdjustment) * 10_000) : '',
  };
});

const YieldCurveBuilder: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const rowCounterRef = useRef(20);
  const runCounterRef = useRef(0);
  const [rows, setRows] = useState<EditableInstrument[]>(cloneDefaultRows);
  const [fixedLegFrequency, setFixedLegFrequency] = useState(1);
  const [dataSource, setDataSource] = useState('Deterministic teaching reference curve (7 instruments)');
  const [result, setResult] = useState<CurveResult | null>(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<CurveHistoryItem[]>([]);
  const [activeResultTab, setActiveResultTab] = useState('curve');

  const invalidateResult = () => {
    setResult(null);
    setError('');
  };

  const updateRow = (id: number, patch: Partial<EditableInstrument>) => {
    setRows((current) => current.map((row) => row.id === id ? { ...row, ...patch } : row));
    setDataSource((current) => current.startsWith('User CSV:') ? `${current} — edited` : 'User-edited deterministic reference curve');
    invalidateResult();
  };

  const removeRow = (id: number) => {
    setRows((current) => current.filter((row) => row.id !== id));
    setDataSource('User-edited deterministic reference curve');
    invalidateResult();
  };

  const addRow = () => {
    const lastMaturity = Number(rows[rows.length - 1]?.maturityYears);
    const maturity = Number.isFinite(lastMaturity) ? Math.min(50, Math.ceil(lastMaturity) + 1) : 1;
    const priorQuote = rows[rows.length - 1]?.type === 'future' ? '4.50' : rows[rows.length - 1]?.quoteValue || '4.50';
    rowCounterRef.current += 1;
    setRows((current) => [...current, {
      id: rowCounterRef.current,
      type: 'swap',
      startYears: '',
      maturityYears: String(maturity),
      quoteValue: priorQuote,
      convexityBp: '',
    }]);
    setDataSource('User-edited deterministic reference curve');
    invalidateResult();
  };

  const resetReference = () => {
    setRows(cloneDefaultRows());
    setFixedLegFrequency(1);
    setDataSource('Deterministic teaching reference curve (7 instruments)');
    setResult(null);
    setError('');
  };

  const runBuild = () => {
    try {
      const nextResult = buildYieldCurve(rowsToEngineInputs(rows), {
        fixedLegFrequency,
        interpolation: 'log-linear discount factors',
        extrapolation: 'forbidden',
      }) as CurveResult;
      setResult(nextResult);
      setError('');
      setActiveResultTab('curve');
      runCounterRef.current += 1;
      const finalAnchor = nextResult.anchors[nextResult.anchors.length - 1];
      setHistory((current) => [{
        id: runCounterRef.current,
        source: dataSource,
        frequency: fixedLegFrequency,
        instruments: nextResult.diagnostics.instrumentCount,
        finalMaturity: finalAnchor.time,
        finalDiscountFactor: finalAnchor.discountFactor,
        maxPvResidual: nextResult.diagnostics.maxAbsPvResidual,
        warnings: nextResult.diagnostics.warnings.length,
        version: nextResult.engineVersion,
      }, ...current].slice(0, 8));
    } catch (buildError) {
      setResult(null);
      setError(buildError instanceof Error ? buildError.message : String(buildError));
    }
  };

  const downloadSampleCsv = () => {
    downloadTextFile('tpl-yield-curve-example.csv', SAMPLE_CURVE_CSV, 'text/csv');
  };

  const handleCsvUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const parsed = parseYieldCurveCsv(await file.text(), { fixedLegFrequency }) as Array<Record<string, number | string | null>>;
      rowCounterRef.current += parsed.length + 1;
      setRows(engineInputsToRows(parsed, rowCounterRef.current));
      setDataSource(`User CSV: ${file.name} (${parsed.length} instruments)`);
      setResult(null);
      setError('');
    } catch (uploadError) {
      setResult(null);
      setError(uploadError instanceof Error ? uploadError.message : String(uploadError));
    }
  };

  const exportResult = () => {
    if (!result) return;
    const payload = createYieldCurveExport(result, dataSource);
    downloadTextFile('tpl-yield-curve-result.json', `${JSON.stringify(payload, null, 2)}\n`, 'application/json');
  };

  const changeFrequency = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setFixedLegFrequency(Number(event.target.value));
    setDataSource((current) => current.startsWith('User CSV:') ? `${current} — convention edited` : 'User-edited deterministic reference curve');
    invalidateResult();
  };

  return (
    <ToolPageLayout
      title="Yield Curve Builder"
      metaDescription="Bootstrap a deterministic mono-curve from deposits, FRAs, explicitly adjusted STIR futures and sparse par swaps, with exact repricing and audit diagnostics."
      headline="Yield Curve Builder"
      valueProp="Build every discount factor — and prove every market instrument reprices."
      supportingText="Use explicit teaching quotes or upload your own CSV. Sparse swap coupons are constructed with declared log-DF interpolation; futures require a visible convexity assumption. This is a transparent mono-curve lab, not a hidden production multi-curve approximation."
      trustSignals={[
        `Deterministic engine v${YIELD_CURVE_VERSION}`,
        'Exact instrument repricing',
        'No extrapolation or implicit stubs',
        'Versioned JSON evidence',
      ]}
      methodology={[
        {
          label: 'Deposits, FRAs and futures',
          content: 'Deposits and FRAs use simple compounding: DF(E)=DF(S)/(1+L×accrual). A STIR future is converted from price to rate, then reduced by the explicit convexity adjustment before the same FRA identity is applied.',
        },
        {
          label: 'Sparse par-swap bootstrap',
          content: 'Each spot-starting swap satisfies K×Σ(accrual×DF)=1−DF(T). Missing coupon dates between market pillars are log-linearly interpolated in discount factors while a bounded deterministic root solve finds the terminal DF.',
        },
        {
          label: 'Zeros, forwards and diagnostics',
          content: 'Continuous zeros are −ln(DF)/T. Every forward is annualized over its displayed start/end interval. Positive finite DFs and repricing are hard gates; negative forwards and rising DFs remain visible shape diagnostics rather than false automatic failures.',
        },
        {
          label: 'Deliberate model boundary',
          content: 'Inputs are ACT/365F year fractions with regular fixed schedules. Calendar dates, business-day rules, settlement lags, stubs, collateral and separate OIS/projection curves are outside this educational v1 and are never silently approximated.',
        },
      ]}
      relatedResources={[
        {
          title: 'Yield Curves & Bootstrapping',
          description: 'Connect discount factors, zero rates, forwards and swap valuation.',
          path: '/courses/yield-curves',
          type: 'course',
        },
        {
          title: 'Bond Calculator',
          description: 'Use yield and cash-flow sensitivities after constructing the curve.',
          path: '/tools/bond',
          type: 'tool',
        },
      ]}
      bottomCta={{
        headline: 'Turn the curve into a pricing decision',
        description: 'Continue with the rates course, then use the repriced discount factors to explain PV and DV01.',
        primaryLabel: 'Open the yield-curve course',
        primaryPath: '/courses/yield-curves',
        secondaryLabel: 'Browse all tools',
        secondaryPath: '/tools',
      }}
    >
      <div className="space-y-6" data-yield-curve-builder="true">
        <Card className="p-4 md:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold terminal-text">Market instruments</h2>
                <Badge variant="outline">{rows.length} rows</Badge>
                <Badge variant="secondary">Reference / user-provided</Badge>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {dataSource}. Rates are entered in percent; future quotes are price points and convexity is in bp.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={downloadSampleCsv} data-curve-download-sample="true">
                <Download className="mr-2 h-4 w-4" /> Sample CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" /> Upload CSV
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={handleCsvUpload}
                data-curve-csv-input="true"
                aria-label="Upload yield curve CSV"
              />
              <Button variant="ghost" size="sm" onClick={resetReference}>
                <RefreshCw className="mr-2 h-4 w-4" /> Reset
              </Button>
            </div>
          </div>

          <div className="mt-5 overflow-x-auto rounded-md border border-border">
            <Table className="min-w-[860px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 z-20 w-[130px] border-r border-border bg-card">Instrument</TableHead>
                  <TableHead>Start (Y)</TableHead>
                  <TableHead>Maturity (Y)</TableHead>
                  <TableHead>Rate % / future price</TableHead>
                  <TableHead>Convexity (bp)</TableHead>
                  <TableHead className="w-[52px]"><span className="sr-only">Remove</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => {
                  const hasStart = row.type === 'fra' || row.type === 'future';
                  const isFuture = row.type === 'future';
                  return (
                    <TableRow key={row.id} data-curve-input-row={row.type}>
                      <TableCell className="sticky left-0 z-10 border-r border-border bg-card">
                        <select
                          value={row.type}
                          onChange={(event) => {
                            const type = event.target.value as InstrumentType;
                            updateRow(row.id, {
                              type,
                              startYears: type === 'fra' || type === 'future' ? row.startYears || '0' : '',
                              quoteValue: type === 'future' ? '95.00' : row.type === 'future' ? '5.00' : row.quoteValue,
                              convexityBp: type === 'future' ? row.convexityBp || '0' : '',
                            });
                          }}
                          className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                          aria-label={`Instrument type at ${row.maturityYears} years`}
                        >
                          <option value="deposit">Deposit</option>
                          <option value="fra">FRA</option>
                          <option value="future">STIR future</option>
                          <option value="swap">Par swap</option>
                        </select>
                      </TableCell>
                      <TableCell>
                        {hasStart ? (
                          <Input
                            type="number"
                            step="0.01"
                            value={row.startYears}
                            onChange={(event) => updateRow(row.id, { startYears: event.target.value })}
                            className="h-9 min-w-[90px]"
                            aria-label={`${row.type} start in years`}
                          />
                        ) : <span className="text-muted-foreground">spot</span>}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          value={row.maturityYears}
                          onChange={(event) => updateRow(row.id, { maturityYears: event.target.value })}
                          className="h-9 min-w-[90px]"
                          aria-label={`${row.type} maturity in years`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="relative min-w-[150px]">
                          <Input
                            type="number"
                            step={isFuture ? '0.01' : '0.001'}
                            value={row.quoteValue}
                            onChange={(event) => updateRow(row.id, { quoteValue: event.target.value })}
                            className="h-9 pr-14"
                            aria-label={`${row.type} ${isFuture ? 'future price' : 'rate percent'} at ${row.maturityYears} years`}
                            data-curve-quote-maturity={row.maturityYears}
                          />
                          <span className="pointer-events-none absolute right-3 top-2.5 text-xs text-muted-foreground">
                            {isFuture ? 'price' : '%'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {isFuture ? (
                          <Input
                            type="number"
                            step="0.1"
                            value={row.convexityBp}
                            onChange={(event) => updateRow(row.id, { convexityBp: event.target.value })}
                            className="h-9 min-w-[100px]"
                            aria-label="Future convexity adjustment in basis points"
                          />
                        ) : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeRow(row.id)}
                          disabled={rows.length <= 2}
                          aria-label={`Remove ${row.type} at ${row.maturityYears} years`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-wrap items-end gap-3">
              <Button variant="outline" size="sm" onClick={addRow}>
                <Plus className="mr-2 h-4 w-4" /> Add instrument
              </Button>
              <div className="max-w-[360px]">
                <label className="block text-xs text-muted-foreground">
                  Fixed-leg payments/year
                  <select
                    value={fixedLegFrequency}
                    onChange={changeFrequency}
                    className="mt-1 h-9 min-w-[150px] rounded-md border border-input bg-background px-3 text-sm text-foreground"
                    aria-label="Fixed leg payments per year"
                  >
                    <option value={1}>1 · annual</option>
                    <option value={2}>2 · semi-annual</option>
                    <option value={4}>4 · quarterly</option>
                  </select>
                </label>
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                  Applied to every par swap: annual, semi-annual or quarterly regular coupons. Maturities off that grid are rejected; no stub is inferred.
                </p>
              </div>
            </div>
            <Button variant="finance" onClick={runBuild} data-curve-build="true">
              <RefreshCw className="mr-2 h-4 w-4" /> Build & reprice curve
            </Button>
          </div>
        </Card>

        {error && (
          <Alert variant="destructive" role="alert" data-curve-error="true">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Curve construction stopped</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!result && !error && (
          <Card className="p-6 text-center">
            <FileSpreadsheet className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <h3 className="font-semibold">No stale result is displayed</h3>
            <p className="mt-1 text-sm text-muted-foreground">Build the curve after reviewing the instruments and conventions.</p>
          </Card>
        )}

        {result && (
          <Card className="overflow-hidden pb-5" data-yield-curve-results="true">
            <div className="flex flex-col gap-3 border-b border-border p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                  <h2 className="font-bold terminal-text">Curve converged and repriced</h2>
                  <Badge variant="success">DF &gt; 0</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{dataSource} · engine v{result.engineVersion}</p>
              </div>
              <Button variant="outline" size="sm" onClick={exportResult} data-curve-export="true">
                <Download className="mr-2 h-4 w-4" /> Export JSON evidence
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3 p-4 md:grid-cols-4">
              <div className="rounded-md border border-border bg-background/40 p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Final DF · {result.anchors.at(-1)?.time}Y</p>
                <p className="mt-1 text-xl font-bold terminal-text">{formatNumber(result.anchors.at(-1)?.discountFactor ?? Number.NaN, 6)}</p>
              </div>
              <div className="rounded-md border border-border bg-background/40 p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Max PV residual</p>
                <p className="mt-1 text-xl font-bold terminal-text" data-max-pv-residual={result.diagnostics.maxAbsPvResidual}>
                  {formatResidual(result.diagnostics.maxAbsPvResidual)}
                </p>
              </div>
              <div className="rounded-md border border-border bg-background/40 p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Interpolated coupons</p>
                <p className="mt-1 text-xl font-bold terminal-text">{result.diagnostics.interpolatedCouponCount}</p>
              </div>
              <button
                type="button"
                className="rounded-md border border-border bg-background/40 p-3 text-left transition-colors hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => setActiveResultTab('diagnostics')}
                aria-label={`Open ${result.diagnostics.warnings.length} curve diagnostics`}
                data-curve-open-diagnostics="true"
              >
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Visible notices</p>
                <p className="mt-1 text-xl font-bold terminal-text">{result.diagnostics.warnings.length}</p>
                <p className="mt-1 text-[10px] text-primary">Open diagnostics →</p>
              </button>
            </div>

            <Tabs value={activeResultTab} onValueChange={setActiveResultTab} className="px-4">
              <TabsList className="grid h-auto w-full grid-cols-2 md:grid-cols-4">
                <TabsTrigger value="curve">Curve & forwards</TabsTrigger>
                <TabsTrigger value="repricing">Repricing</TabsTrigger>
                <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
                <TabsTrigger value="history">Run history</TabsTrigger>
              </TabsList>

              <TabsContent value="curve" className="space-y-4 pt-4">
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-md border border-border p-3">
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">Continuous zero vs interval forward</h3>
                    <div className="h-64">
                      <ComparisonLineChart
                        data={result.curve.map((node) => ({
                          x: node.time,
                          market: node.zeroContinuous * 100,
                          model: node.forwardContinuous * 100,
                        }))}
                        xLabel="Maturity (years)"
                        yLabel="Rate (%)"
                        marketLabel="Zero cont."
                        modelLabel="Forward cont."
                      />
                    </div>
                  </div>
                  <div className="rounded-md border border-border p-3">
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">Discount factors</h3>
                    <div className="h-64">
                      <LineChart
                        data={result.curve.map((node) => ({ x: node.time, y: node.discountFactor }))}
                        xLabel="Maturity (years)"
                        yLabel="DF"
                        color="#22c55e"
                        animate={false}
                      />
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto rounded-md border border-border">
                  <Table className="min-w-[980px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="sticky left-0 z-20 border-r border-border bg-card">Time</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead className="text-right">DF</TableHead>
                        <TableHead className="text-right">Zero cont.</TableHead>
                        <TableHead className="text-right">Zero annual</TableHead>
                        <TableHead>Forward interval</TableHead>
                        <TableHead className="text-right">Forward cont.</TableHead>
                        <TableHead className="text-right">Forward simple</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.curve.map((node) => (
                        <TableRow key={node.time} data-curve-node-time={node.time}>
                          <TableCell className="sticky left-0 z-10 border-r border-border bg-card font-mono">{node.time}Y</TableCell>
                          <TableCell>
                            <Badge variant={node.source === 'market-pillar' ? 'success' : 'outline'}>
                              {node.source === 'market-pillar' ? 'market pillar' : 'log-DF interpolation'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono">{formatNumber(node.discountFactor, 8)}</TableCell>
                          <TableCell className="text-right font-mono">{formatPercent(node.zeroContinuous)}</TableCell>
                          <TableCell className="text-right font-mono">{formatPercent(node.zeroAnnual)}</TableCell>
                          <TableCell className="font-mono">{node.intervalLabel}</TableCell>
                          <TableCell className="text-right font-mono">{formatPercent(node.forwardContinuous)}</TableCell>
                          <TableCell className="text-right font-mono">{formatPercent(node.forwardSimple)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="repricing" className="pt-4">
                <div className="overflow-x-auto rounded-md border border-border">
                  <Table className="min-w-[900px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="sticky left-0 z-20 border-r border-border bg-card">Instrument</TableHead>
                        <TableHead>Interval</TableHead>
                        <TableHead className="text-right">Market quote</TableHead>
                        <TableHead className="text-right">Implied quote</TableHead>
                        <TableHead className="text-right">Quote residual</TableHead>
                        <TableHead className="text-right">PV residual</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.repricing.map((item) => (
                        <TableRow key={item.instrumentId} data-repricing-instrument={item.instrumentId}>
                          <TableCell className="sticky left-0 z-10 border-r border-border bg-card font-mono uppercase">{item.type}</TableCell>
                          <TableCell className="font-mono">{item.start}Y→{item.maturity}Y</TableCell>
                          <TableCell className="text-right font-mono">
                            {item.type === 'future' ? `${formatNumber(item.marketFuturePrice ?? Number.NaN, 4)} price` : formatPercent(item.marketQuote)}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {item.type === 'future' ? `${formatNumber(item.impliedFuturePrice ?? Number.NaN, 4)} price` : formatPercent(item.impliedQuote)}
                          </TableCell>
                          <TableCell className="text-right font-mono">{formatBp(item.quoteResidual)}</TableCell>
                          <TableCell className="text-right font-mono">{formatResidual(item.pvResidual)}</TableCell>
                          <TableCell><Badge variant="success">repriced</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="diagnostics" className="space-y-4 pt-4">
                <div className="grid gap-3 md:grid-cols-2">
                  {Object.entries(result.conventions).map(([key, value]) => (
                    <div key={key} className="rounded-md border border-border bg-background/40 p-3">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{key}</p>
                      <p className="mt-1 text-sm font-medium">{String(value)}</p>
                    </div>
                  ))}
                </div>
                {result.diagnostics.warnings.length ? (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Visible shape/model warnings</AlertTitle>
                    <AlertDescription>
                      <ul className="mt-2 list-disc space-y-1 pl-5">
                        {result.diagnostics.warnings.map((warning) => <li key={warning}>{warning}</li>)}
                      </ul>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertTitle>No curve-shape warning triggered</AlertTitle>
                    <AlertDescription>All DFs are positive and every instrument reprices within the hard tolerance.</AlertDescription>
                  </Alert>
                )}
                <div className="rounded-md border border-border p-4">
                  <h3 className="text-sm font-semibold">Model boundary — exported with every result</h3>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                    {result.limitations.map((limitation) => <li key={limitation}>{limitation}</li>)}
                  </ul>
                </div>
              </TabsContent>

              <TabsContent value="history" className="pt-4">
                {history.length ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">Up to eight successful builds in this browser session only; no remote persistence.</p>
                      <Button variant="ghost" size="sm" onClick={() => setHistory([])}>
                        <Trash2 className="mr-2 h-4 w-4" /> Clear
                      </Button>
                    </div>
                    <div className="overflow-x-auto rounded-md border border-border">
                      <Table className="min-w-[760px]">
                        <TableHeader>
                          <TableRow>
                            <TableHead>Run</TableHead>
                            <TableHead>Source</TableHead>
                            <TableHead>Frequency</TableHead>
                            <TableHead className="text-right">Instruments</TableHead>
                            <TableHead className="text-right">Final DF</TableHead>
                            <TableHead className="text-right">Max PV residual</TableHead>
                            <TableHead className="text-right">Warnings</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {history.map((item) => (
                            <TableRow key={item.id} data-curve-history-run={item.id}>
                              <TableCell className="font-mono">#{item.id}</TableCell>
                              <TableCell>{item.source}</TableCell>
                              <TableCell>{item.frequency}/year</TableCell>
                              <TableCell className="text-right">{item.instruments}</TableCell>
                              <TableCell className="text-right font-mono">{formatNumber(item.finalDiscountFactor, 6)} @ {item.finalMaturity}Y</TableCell>
                              <TableCell className="text-right font-mono">{formatResidual(item.maxPvResidual)}</TableCell>
                              <TableCell className="text-right">{item.warnings}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                    No successful curve build in this session yet.
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </Card>
        )}
      </div>
    </ToolPageLayout>
  );
};

export default YieldCurveBuilder;
