import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileCheck2,
  FileSpreadsheet,
  Loader2,
  Play,
  RotateCcw,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
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
import {
  ESTIMATOR_KEYS,
  REALIZED_VOLATILITY_VERSION,
  TEACHING_CSV,
  buildObservationsCsv,
  buildRollingCsv,
} from '@/lib/realizedVolatility.mjs';
import ToolPageLayout from './ToolPageLayout';

type EstimatorKey = 'closeToClose' | 'parkinson' | 'garmanKlass' | 'rogersSatchell' | 'yangZhang';

interface EstimatorResult {
  key: EstimatorKey;
  label: string;
  sessionCount: number;
  variance: number;
  annualizedVolatility: number;
}

interface RollingPoint {
  startDate: string;
  endDate: string;
  sessionCount: number;
  yangZhangK: number;
  estimators: Record<EstimatorKey, EstimatorResult>;
}

interface QualityWarning {
  code: string;
  severity: 'warning';
  message: string;
  includedInCalculation: boolean;
  date?: string;
  previousDate?: string;
  startDate?: string;
  endDate?: string;
}

interface Observation {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  closeToCloseReturn: number | null;
  overnightReturn: number | null;
  openToCloseReturn: number | null;
  flags: string[];
}

interface AnalysisResult {
  schema: string;
  engineVersion: string;
  analysisId: string;
  source: { filename: string | null; sha256: string; hashBasis: string; adjustmentBasis: string };
  provenance: {
    sourceLabel: string;
    symbolLabel: string;
    filename: string | null;
    priceBasis: string;
    datasetSha256: string;
    provider: null;
    persistence: 'none';
  };
  config: {
    annualization: number;
    rollingWindow: number;
    expectedFrequency: string;
    calendarMode: string;
    priceBasis: string;
  };
  dateRange: { start: string; end: string };
  observationCount: number;
  sessionCount: number;
  yangZhangK: number;
  estimators: Record<EstimatorKey, EstimatorResult>;
  rolling: RollingPoint[];
  observations: Observation[];
  warnings: QualityWarning[];
  diagnostics: {
    status: 'PASS' | 'WARN';
    warnings: Array<{ code: string; message: string }>;
  };
  conventions: Record<string, string | number>;
  limitations: string[];
}

interface HistoryItem {
  id: number;
  source: string;
  symbol: string;
  sessions: number;
  window: number;
  annualization: number;
  yangZhang: number;
  warnings: number;
  sha256: string;
}

const ESTIMATOR_COLORS: Record<EstimatorKey, string> = {
  closeToClose: '#ef4444',
  parkinson: '#f59e0b',
  garmanKlass: '#3b82f6',
  rogersSatchell: '#8b5cf6',
  yangZhang: '#22c55e',
};

const ESTIMATOR_INTERPRETATION: Record<EstimatorKey, string> = {
  closeToClose: 'Baseline using settlement-to-settlement moves; robust and easy to source, but it ignores the intraday range.',
  parkinson: 'Uses the high/low range and is efficient under continuous diffusion; it misses overnight gaps and assumes limited drift.',
  garmanKlass: 'Combines open, high, low and close for greater range efficiency; opening jumps and microstructure can distort it.',
  rogersSatchell: 'Range estimator designed to remain useful with non-zero drift; it still excludes the prior-close overnight move.',
  yangZhang: 'Combines overnight, open-to-close and Rogers-Satchell components; use it as the broad reference when daily OHLC is reliable.',
};

const PRICE_BASIS_OPTIONS = [
  ['unknown', 'Unknown adjustment basis'],
  ['unadjusted_ohlc', 'Unadjusted OHLC'],
  ['split_adjusted_ohlc', 'Split-adjusted OHLC'],
  ['provider_adjusted_ohlc', 'Provider-adjusted OHLC'],
] as const;

const selectClassName = 'h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring';
const formatPercent = (value: number, digits = 2) => `${(value * 100).toFixed(digits)}%`;
const formatVariance = (value: number) => value === 0 ? '0' : value.toExponential(5);
const formatReturn = (value: number | null) => value === null ? 'seed' : `${(value * 100).toFixed(3)}%`;

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

const downsampleRolling = (points: RollingPoint[], maximum = 1_800) => {
  if (points.length <= maximum) return points;
  const extremaPerBucket = ESTIMATOR_KEYS.length * 2;
  const buckets = Math.max(1, Math.floor((maximum - 2) / extremaPerBucket));
  const bucketSize = Math.ceil(points.length / buckets);
  const selected = new Set<number>([0, points.length - 1]);
  for (let start = 0; start < points.length; start += bucketSize) {
    const end = Math.min(points.length, start + bucketSize);
    for (const key of ESTIMATOR_KEYS) {
      let minimum = start;
      let maximumIndex = start;
      for (let index = start + 1; index < end; index += 1) {
        const value = points[index].estimators[key].annualizedVolatility;
        if (value < points[minimum].estimators[key].annualizedVolatility) minimum = index;
        if (value > points[maximumIndex].estimators[key].annualizedVolatility) maximumIndex = index;
      }
      selected.add(minimum);
      selected.add(maximumIndex);
    }
  }
  return [...selected].sort((left, right) => left - right).map((index) => points[index]);
};

const RealizedVolatilityLab: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const runCounterRef = useRef(0);
  const [csvText, setCsvText] = useState(TEACHING_CSV);
  const [filename, setFilename] = useState('tpl_realized_volatility_teaching_fixture.csv');
  const [sourceLabel, setSourceLabel] = useState('Deterministic teaching fixture');
  const [symbolLabel, setSymbolLabel] = useState('TEACHING-OHLC');
  const [priceBasis, setPriceBasis] = useState('unknown');
  const [calendarMode, setCalendarMode] = useState('weekday_sessions');
  const [annualization, setAnnualization] = useState(252);
  const [rollingWindow, setRollingWindow] = useState(5);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [activeTab, setActiveTab] = useState('estimates');
  const [visibleEstimatorKeys, setVisibleEstimatorKeys] = useState<EstimatorKey[]>([...ESTIMATOR_KEYS] as EstimatorKey[]);

  useEffect(() => () => workerRef.current?.terminate(), []);

  const invalidateResult = () => {
    runCounterRef.current += 1;
    setResult(null);
    setError('');
    setBusy(false);
  };

  const updateConfiguration = (action: () => void) => {
    action();
    invalidateResult();
  };

  const useTeachingFixture = () => {
    setCsvText(TEACHING_CSV);
    setFilename('tpl_realized_volatility_teaching_fixture.csv');
    setSourceLabel('Deterministic teaching fixture');
    setSymbolLabel('TEACHING-OHLC');
    setPriceBasis('unknown');
    setCalendarMode('weekday_sessions');
    setAnnualization(252);
    setRollingWindow(5);
    invalidateResult();
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const text = await file.text();
      setCsvText(text);
      setFilename(file.name);
      setSourceLabel('User-provided local CSV');
      setSymbolLabel('USER-SERIES');
      invalidateResult();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    }
  };

  const ensureWorker = () => {
    if (workerRef.current) return workerRef.current;
    const worker = new Worker(new URL('../../workers/realizedVolatility.worker.mjs', import.meta.url), { type: 'module' });
    workerRef.current = worker;
    return worker;
  };

  const analyze = () => {
    const normalizedWindow = Number(rollingWindow);
    if (!Number.isSafeInteger(normalizedWindow) || normalizedWindow < 5 || normalizedWindow > 252) {
      setError('Rolling window must be an integer between 5 and 252 sessions.');
      setResult(null);
      return;
    }
    const runId = runCounterRef.current + 1;
    runCounterRef.current = runId;
    setBusy(true);
    setError('');
    setResult(null);
    const worker = ensureWorker();
    worker.onmessage = (event: MessageEvent) => {
      const message = event.data;
      if (!message || message.runId !== runCounterRef.current) return;
      setBusy(false);
      if (message.type === 'error') {
        setError(String(message.error || 'Analysis failed explicitly.'));
        return;
      }
      const nextResult = message.result as AnalysisResult;
      setResult(nextResult);
      setActiveTab('estimates');
      setHistory((current) => [{
        id: runId,
        source: nextResult.provenance.sourceLabel,
        symbol: nextResult.provenance.symbolLabel,
        sessions: nextResult.sessionCount,
        window: nextResult.config.rollingWindow,
        annualization: nextResult.config.annualization,
        yangZhang: nextResult.estimators.yangZhang.annualizedVolatility,
        warnings: nextResult.warnings.length,
        sha256: nextResult.source.sha256,
      }, ...current].slice(0, 10));
    };
    worker.onerror = (event) => {
      if (runId !== runCounterRef.current) return;
      setBusy(false);
      setResult(null);
      setError(event.message || 'The local analysis worker failed.');
    };
    worker.postMessage({
      type: 'analyze',
      runId,
      csvText,
      filename,
      config: { annualization, window: normalizedWindow, calendarMode, priceBasis, sourceLabel, symbolLabel },
    });
  };

  const chartData = useMemo(() => downsampleRolling(result?.rolling ?? []).map((point) => ({
    date: point.endDate,
    closeToClose: point.estimators.closeToClose.annualizedVolatility * 100,
    parkinson: point.estimators.parkinson.annualizedVolatility * 100,
    garmanKlass: point.estimators.garmanKlass.annualizedVolatility * 100,
    rogersSatchell: point.estimators.rogersSatchell.annualizedVolatility * 100,
    yangZhang: point.estimators.yangZhang.annualizedVolatility * 100,
  })), [result]);

  const chartDomain = useMemo<[number, number]>(() => {
    const values = chartData.flatMap((point) => visibleEstimatorKeys.map((key) => point[key])).filter(Number.isFinite);
    if (values.length === 0) return [0, 1];
    const minimum = Math.min(...values);
    const maximum = Math.max(...values);
    const padding = Math.max((maximum - minimum) * 0.12, Math.abs(maximum) * 0.03, 0.05);
    return [Math.max(0, minimum - padding), maximum + padding];
  }, [chartData, visibleEstimatorKeys]);

  const headlineWarnings = useMemo(() => result?.diagnostics.warnings.slice(0, 2) ?? [], [result]);

  const toggleEstimator = (key: EstimatorKey) => {
    setVisibleEstimatorKeys((current) => current.includes(key)
      ? (current.length === 1 ? current : current.filter((candidate) => candidate !== key))
      : (ESTIMATOR_KEYS.filter((candidate) => [...current, key].includes(candidate)) as EstimatorKey[]));
  };

  const visibleObservations = useMemo(() => result?.observations.slice(-100) ?? [], [result]);

  return (
    <ToolPageLayout
      title="Realized Volatility & Data Quality Lab"
      metaDescription="Compute five realized-volatility estimators on a local OHLC CSV with strict quality diagnostics and reproducible exports."
      headline="Realized Volatility & Data Quality Lab"
      valueProp="Five estimators, one aligned sample, zero hidden data repair."
      supportingText="Load a daily OHLC series, declare its adjustment and calendar conventions, then compare close-to-close, Parkinson, Garman-Klass, Rogers-Satchell and Yang-Zhang estimates. The file stays in your browser and every warning remains traceable to the retained observation."
      trustSignals={[
        `Deterministic engine v${REALIZED_VOLATILITY_VERSION}`,
        'Local worker · no OHLC upload',
        'SHA-256 provenance',
        'JSON + 2 CSV evidence exports',
      ]}
      methodology={[
        { label: 'Aligned sample', content: 'The first row seeds the prior close. Every estimator uses exactly the same subsequent sessions; changing estimator never changes the sample.' },
        { label: 'Annualization', content: 'Daily variances remain decimal values. Displayed volatility is sqrt(A × daily variance), where A is the explicit integer convention selected by the user.' },
        { label: 'Quality policy', content: 'Invalid schema, dates, prices and OHLC relationships stop the run. Gaps, jumps, outliers, flat bars and unknown adjustment basis remain included and are reported by date.' },
        { label: 'Model limits', content: 'These are descriptive historical estimates, not forecasts or trading signals. No exchange holiday calendar, corporate-action repair, resampling or market-data provider is inferred.' },
      ]}
    >
      <div data-realized-volatility-lab="true" className="space-y-6 min-w-0">
        <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
          <Card className="p-5 h-fit space-y-5 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Input contract</p>
                <h2 className="mt-1 text-lg font-semibold">Daily OHLC CSV</h2>
              </div>
              <Badge variant="outline">Starter</Badge>
            </div>

            <Alert className="border-emerald-500/30 bg-emerald-500/5">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <AlertTitle>Local processing only</AlertTitle>
              <AlertDescription>Your prices are parsed and analyzed inside a dedicated browser worker. They are never sent to an API.</AlertDescription>
            </Alert>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              data-realized-vol-file-input="true"
              onChange={(event) => void handleFile(event.target.files?.[0])}
            />
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" /> Upload CSV
              </Button>
              <Button variant="outline" onClick={() => downloadTextFile('tpl_realized_volatility_teaching_fixture.csv', TEACHING_CSV, 'text/csv')}>
                <Download className="mr-2 h-4 w-4" /> Sample
              </Button>
            </div>
            <Button variant="ghost" className="w-full" onClick={useTeachingFixture}>
              <RotateCcw className="mr-2 h-4 w-4" /> Restore teaching fixture
            </Button>

            <div className="rounded-md border border-border bg-secondary/30 p-3" data-realized-vol-source="true">
              <div className="flex items-start gap-2">
                <FileSpreadsheet className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{filename}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Required: date, open, high, low, close. Optional trailing volume. Max 10 MiB / 50,001 rows.</p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <label className="space-y-1.5 text-sm">
                <span className="text-xs font-medium text-muted-foreground">Source label</span>
                <Input value={sourceLabel} maxLength={200} onChange={(event) => updateConfiguration(() => setSourceLabel(event.target.value))} />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="text-xs font-medium text-muted-foreground">Symbol / series label</span>
                <Input value={symbolLabel} maxLength={120} onChange={(event) => updateConfiguration(() => setSymbolLabel(event.target.value))} />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="text-xs font-medium text-muted-foreground">Price basis</span>
                <select className={selectClassName} value={priceBasis} onChange={(event) => updateConfiguration(() => setPriceBasis(event.target.value))}>
                  {PRICE_BASIS_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="text-xs font-medium text-muted-foreground">Expected sessions</span>
                <select className={selectClassName} value={calendarMode} onChange={(event) => updateConfiguration(() => setCalendarMode(event.target.value))}>
                  <option value="weekday_sessions">Weekday sessions · no holiday DB</option>
                  <option value="calendar_daily">Calendar daily · 7 days</option>
                </select>
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="text-xs font-medium text-muted-foreground">Annualization sessions</span>
                <Input type="number" min={1} max={366} step={1} value={annualization} onChange={(event) => updateConfiguration(() => setAnnualization(Number(event.target.value)))} />
                <span className="block text-[11px] text-muted-foreground">Quick conventions: 252 trading sessions or 365 calendar days.</span>
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="text-xs font-medium text-muted-foreground">Rolling window</span>
                <Input type="number" min={5} max={252} step={1} value={rollingWindow} onChange={(event) => updateConfiguration(() => setRollingWindow(Number(event.target.value)))} />
                <span className="block text-[11px] text-muted-foreground">Sessions per rolling point; requires window + one seed row.</span>
              </label>
            </div>

            <Button variant="finance" size="lg" className="w-full" onClick={analyze} disabled={busy || !csvText.trim()} data-realized-vol-run="true">
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
              {busy ? 'Analyzing locally…' : 'Analyze & compare estimators'}
            </Button>
          </Card>

          <div className="space-y-5 min-w-0">
            {!result && !error && (
              <Card className="p-8 min-h-[340px] grid place-items-center text-center border-dashed" data-realized-vol-empty="true">
                <div className="max-w-lg">
                  <FileCheck2 className="mx-auto h-9 w-9 text-primary" />
                  <h2 className="mt-4 text-xl font-semibold">Evidence starts with declared data</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Use the included deterministic fixture or upload your own OHLC file. The run stops on structural defects and never repairs observations silently.</p>
                </div>
              </Card>
            )}

            {error && (
              <Alert variant="destructive" data-realized-vol-error="true">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Analysis stopped — no result was retained</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {result && (
              <div data-realized-vol-results="true" className="space-y-5 min-w-0">
                <Card className="p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className={result.warnings.length ? 'h-7 bg-amber-500/15 text-amber-400 border-amber-500/30' : 'h-7 bg-emerald-500/15 text-emerald-400 border-emerald-500/30'}
                          onClick={() => setActiveTab('diagnostics')}
                          data-open-realized-vol-diagnostics="true"
                        >
                          {result.warnings.length ? `WARN · ${result.warnings.length} · review` : 'PASS · review diagnostics'}
                        </Button>
                        <Badge variant="outline">{result.sessionCount} aligned sessions</Badge>
                        <Badge variant="outline">A={result.config.annualization}</Badge>
                        <Badge variant="outline">window={result.config.rollingWindow}</Badge>
                      </div>
                      <h2 className="mt-3 text-xl font-semibold">Analysis completed without hidden data repair</h2>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {result.provenance.symbolLabel} · {result.dateRange.start} → {result.dateRange.end} · {result.config.priceBasis}
                      </p>
                      <p className="mt-1 text-xs font-mono text-muted-foreground break-all">SHA-256 {result.source.sha256}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => downloadTextFile('realized_volatility_evidence.json', `${JSON.stringify(result, null, 2)}\n`, 'application/json')}>
                        <Download className="mr-2 h-4 w-4" /> JSON evidence
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => downloadTextFile('realized_volatility_rolling.csv', buildRollingCsv(result), 'text/csv')}>
                        <Download className="mr-2 h-4 w-4" /> Rolling CSV
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => downloadTextFile('realized_volatility_observations.csv', buildObservationsCsv(result), 'text/csv')}>
                        <Download className="mr-2 h-4 w-4" /> Observations + flags CSV
                      </Button>
                    </div>
                  </div>
                  {headlineWarnings.length > 0 && (
                    <div className="mt-4 grid gap-2 md:grid-cols-2" data-headline-realized-vol-warnings="true">
                      {headlineWarnings.map((warning) => (
                        <button key={warning.code} type="button" onClick={() => setActiveTab('diagnostics')} className="rounded-md border border-amber-500/25 bg-amber-500/5 p-3 text-left hover:border-amber-500/50">
                          <span className="text-[11px] font-mono font-semibold text-amber-400">{warning.code}</span>
                          <span className="mt-1 block text-xs text-muted-foreground">{warning.message}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </Card>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5" data-realized-vol-estimators="true">
                  {(ESTIMATOR_KEYS as EstimatorKey[]).map((key) => {
                    const estimator = result.estimators[key];
                    return (
                      <Card key={key} className={`p-4 border-l-2 ${key === 'yangZhang' ? 'bg-emerald-500/5' : ''}`} style={{ borderLeftColor: ESTIMATOR_COLORS[key] }} data-estimator={key}>
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{estimator.label}</p>
                        <p className="mt-2 text-2xl font-mono font-semibold text-foreground">{formatPercent(estimator.annualizedVolatility)}</p>
                        <p className="mt-1 text-[11px] font-mono text-muted-foreground">daily var {formatVariance(estimator.variance)}</p>
                      </Card>
                    );
                  })}
                </div>

                <Card className="p-5" data-realized-vol-interpretation="true">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h3 className="font-semibold">Which estimator should I read?</h3>
                      <p className="text-xs text-muted-foreground">Choose by data quality and use case, not by the most convenient number.</p>
                    </div>
                    <span className="text-[11px] text-muted-foreground">Δ vs Yang-Zhang = annualized-volatility difference in percentage points</span>
                  </div>
                  <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-5">
                    {(ESTIMATOR_KEYS as EstimatorKey[]).map((key) => (
                      <div key={key} className="rounded-md border border-border bg-secondary/20 p-3" style={{ borderTopColor: ESTIMATOR_COLORS[key] }}>
                        <p className="text-xs font-semibold">{result.estimators[key].label}</p>
                        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{ESTIMATOR_INTERPRETATION[key]}</p>
                      </div>
                    ))}
                  </div>
                </Card>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="min-w-0">
                  <TabsList className="grid h-auto w-full grid-cols-2 lg:grid-cols-4">
                    <TabsTrigger value="estimates">Estimates & rolling</TabsTrigger>
                    <TabsTrigger value="observations">Observations</TabsTrigger>
                    <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
                    <TabsTrigger value="history">Run history</TabsTrigger>
                  </TabsList>

                  <TabsContent value="estimates" className="space-y-5">
                    <Card className="p-5 min-w-0">
                      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                          <h3 className="font-semibold">Rolling annualized volatility</h3>
                          <p className="text-xs text-muted-foreground">All five estimators · percent · {result.config.rollingWindow}-session windows</p>
                        </div>
                        <span className="text-[11px] text-muted-foreground">{chartData.length}/{result.rolling.length} plotted · all exported</span>
                      </div>
                      <div className="mb-3 flex flex-wrap gap-1.5" aria-label="Visible volatility estimators">
                        {(ESTIMATOR_KEYS as EstimatorKey[]).map((key) => {
                          const visible = visibleEstimatorKeys.includes(key);
                          return (
                            <button
                              key={key}
                              type="button"
                              aria-pressed={visible}
                              onClick={() => toggleEstimator(key)}
                              className={`rounded-full border px-2.5 py-1 text-[10px] font-medium transition-colors ${visible ? 'bg-secondary text-foreground' : 'border-border text-muted-foreground opacity-60'}`}
                              style={visible ? { borderColor: ESTIMATOR_COLORS[key] } : undefined}
                            >
                              {result.estimators[key].label}
                            </button>
                          );
                        })}
                      </div>
                      <div className="h-[330px] w-full min-w-0" data-realized-vol-chart="true">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData} margin={{ top: 12, right: 12, bottom: 24, left: 4 }}>
                            <CartesianGrid stroke="#374151" strokeDasharray="3 3" />
                            <XAxis dataKey="date" minTickGap={32} tick={{ fontSize: 10 }} />
                            <YAxis width={52} domain={chartDomain} tickFormatter={(value: number) => `${value.toFixed(1)}%`} tick={{ fontSize: 10 }} />
                            <Tooltip formatter={(value: number) => `${value.toFixed(3)}%`} />
                            <Legend wrapperStyle={{ fontSize: '10px' }} />
                            {visibleEstimatorKeys.map((key) => (
                              <Line key={key} name={result.estimators[key].label} type="monotone" dataKey={key} stroke={ESTIMATOR_COLORS[key]} strokeWidth={key === 'yangZhang' ? 2.5 : 1.5} dot={chartData.length <= 2} isAnimationActive={false} />
                            ))}
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>

                    <Card className="p-5 min-w-0">
                      <h3 className="font-semibold">Estimator audit table</h3>
                      <p className="mt-1 text-[11px] text-muted-foreground lg:hidden">Swipe horizontally for annualized volatility and Δ; the estimator name stays pinned.</p>
                      <div className="mt-4 overflow-x-auto rounded-md border border-border">
                        <Table className="min-w-[760px]">
                          <TableHeader><TableRow><TableHead className="sticky left-0 z-20 bg-card">Estimator</TableHead><TableHead>Sessions</TableHead><TableHead>Daily variance</TableHead><TableHead>Daily vol</TableHead><TableHead>Annualized vol</TableHead><TableHead>Δ vs Yang-Zhang</TableHead></TableRow></TableHeader>
                          <TableBody>
                            {(ESTIMATOR_KEYS as EstimatorKey[]).map((key) => {
                              const item = result.estimators[key];
                              const dailyVol = Math.sqrt(item.variance);
                              return <TableRow key={key}><TableCell className="sticky left-0 z-10 bg-card font-medium" data-sticky-estimator="true">{item.label}</TableCell><TableCell>{item.sessionCount}</TableCell><TableCell className="font-mono">{formatVariance(item.variance)}</TableCell><TableCell className="font-mono">{formatPercent(dailyVol, 4)}</TableCell><TableCell className="font-mono">{formatPercent(item.annualizedVolatility, 4)}</TableCell><TableCell className="font-mono">{formatPercent(item.annualizedVolatility - result.estimators.yangZhang.annualizedVolatility, 4)}</TableCell></TableRow>;
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </Card>
                  </TabsContent>

                  <TabsContent value="observations">
                    <Card className="p-5 min-w-0">
                      <div className="flex items-end justify-between gap-4">
                        <div><h3 className="font-semibold">Retained observations</h3><p className="text-xs text-muted-foreground">Showing the latest {visibleObservations.length}; the export contains all {result.observationCount} rows.</p></div>
                      </div>
                      <div className="mt-4 overflow-x-auto rounded-md border border-border">
                        <Table className="min-w-[920px]">
                          <TableHeader><TableRow><TableHead className="sticky left-0 z-20 bg-card">Date</TableHead><TableHead>Close</TableHead><TableHead>Close/close</TableHead><TableHead>Overnight</TableHead><TableHead>Open/close</TableHead><TableHead>Flags</TableHead></TableRow></TableHeader>
                          <TableBody>{visibleObservations.map((item) => <TableRow key={item.date} data-observation-date={item.date}><TableCell className="sticky left-0 z-10 bg-card font-mono">{item.date}</TableCell><TableCell className="font-mono">{item.close}</TableCell><TableCell className="font-mono">{formatReturn(item.closeToCloseReturn)}</TableCell><TableCell className="font-mono">{formatReturn(item.overnightReturn)}</TableCell><TableCell className="font-mono">{formatReturn(item.openToCloseReturn)}</TableCell><TableCell>{item.flags.length ? <div className="flex flex-wrap gap-1">{item.flags.map((flag) => <Badge key={flag} variant="outline" className="text-[10px]">{flag}</Badge>)}</div> : <span className="text-muted-foreground">none</span>}</TableCell></TableRow>)}</TableBody>
                        </Table>
                      </div>
                    </Card>
                  </TabsContent>

                  <TabsContent value="diagnostics">
                    <Card className="p-5 space-y-5" data-realized-vol-diagnostics="true">
                      <div className="flex items-start justify-between gap-4">
                        <div><h3 className="font-semibold">Data-quality diagnostics</h3><p className="text-xs text-muted-foreground">Warnings never remove the affected row. Structural defects stop before this panel exists.</p></div>
                        <Badge variant="outline">{result.warnings.length ? 'WARN' : 'PASS'}</Badge>
                      </div>
                      {result.warnings.length ? (
                        <div className="space-y-2">
                          {result.warnings.map((warning, index) => (
                            <div key={`${warning.code}-${index}`} className="rounded-md border border-amber-500/25 bg-amber-500/5 p-3">
                              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"><span className="text-xs font-mono font-semibold text-amber-400">{warning.code}</span><span className="text-[11px] text-muted-foreground">{warning.date ?? `${warning.startDate ?? ''} → ${warning.endDate ?? ''}`}</span></div>
                              <p className="mt-1 text-sm text-muted-foreground">{warning.message}</p>
                            </div>
                          ))}
                        </div>
                      ) : <Alert><CheckCircle2 className="h-4 w-4 text-emerald-500" /><AlertTitle>No quality warning under declared gates</AlertTitle><AlertDescription>This is not a guarantee that the source is complete or correctly adjusted.</AlertDescription></Alert>}
                      <div className="grid gap-3 md:grid-cols-2">
                        {result.limitations.map((limit) => <div key={limit} className="rounded-md border border-border bg-secondary/20 p-3 text-sm text-muted-foreground">{limit}</div>)}
                      </div>
                    </Card>
                  </TabsContent>

                  <TabsContent value="history">
                    <Card className="p-5 min-w-0">
                      <h3 className="font-semibold">Successful runs in this browser session</h3>
                      <p className="mt-1 text-xs text-muted-foreground">No remote persistence. Failed or stale worker runs never create history.</p>
                      <div className="mt-4 overflow-x-auto rounded-md border border-border">
                        <Table className="min-w-[820px]"><TableHeader><TableRow><TableHead>Run</TableHead><TableHead>Series</TableHead><TableHead>Sessions</TableHead><TableHead>Window / A</TableHead><TableHead>Yang-Zhang</TableHead><TableHead>Warnings</TableHead><TableHead>SHA-256</TableHead></TableRow></TableHeader><TableBody>{history.map((item) => <TableRow key={item.id}><TableCell>#{item.id}</TableCell><TableCell>{item.symbol}</TableCell><TableCell>{item.sessions}</TableCell><TableCell>{item.window} / {item.annualization}</TableCell><TableCell className="font-mono">{formatPercent(item.yangZhang)}</TableCell><TableCell>{item.warnings}</TableCell><TableCell className="font-mono">{item.sha256.slice(0, 12)}…</TableCell></TableRow>)}</TableBody></Table>
                      </div>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>
        </div>
      </div>
    </ToolPageLayout>
  );
};

export default RealizedVolatilityLab;
