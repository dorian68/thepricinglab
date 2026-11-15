import React, { useRef, useState } from 'react';
import { AlertCircle, CheckCircle, Download, FileSpreadsheet, RefreshCw, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { BarChart, ComparisonLineChart, LineChart } from '@/components/ui/chart';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  MAX_SURFACE_POINTS,
  MODEL_CALIBRATION_VERSION,
  generateSyntheticVolatilitySurface,
  parseVolatilitySurfaceCsv,
} from '@/lib/modelCalibration.mjs';
import ToolPageLayout from './ToolPageLayout';

type ModelName = 'black' | 'sabr' | 'heston';
type ObjectiveName = 'volatility' | 'price';

interface VolatilityPoint {
  strike: number;
  maturity: number;
  impliedVol: number;
  forward?: number;
  weight?: number;
}

interface CalibrationResult {
  version: string;
  parameters: Record<string, number>;
  parameterBounds: Record<string, [number, number]>;
  calibratedSurface: Array<VolatilityPoint & {
    modelVol: number;
    signedError: number;
    error: number;
    marketPrice: number;
    modelPrice: number;
    priceError: number;
  }>;
  diagnostics: {
    rmse: number;
    priceRmse: number;
    meanAbsoluteError: number;
    maxAbsoluteError: number;
    rSquared: number | null;
    points: number;
    iterations: number;
    evaluations: number;
    converged: boolean;
    objective: ObjectiveName;
    fellerMargin: number | null;
    warnings: string[];
  };
}

interface CalibrationRunHistoryItem {
  id: number;
  model: ModelName;
  objective: ObjectiveName;
  source: string;
  parameters: Record<string, number>;
  rmse: number;
  priceRmse: number;
  rSquared: number | null;
  evaluations: number;
  version: string;
}

const formatNumber = (value: number, digits = 6) => Number.isFinite(value) ? value.toFixed(digits) : 'n/a';
const formatVolBps = (value: number) => `${formatNumber(value * 10_000, 2)} vol bp`;

const downloadTextFile = (fileName: string, content: string, mediaType: string) => {
  const blob = new Blob([content], { type: `${mediaType};charset=utf-8` });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  window.setTimeout(() => {
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
  }, 1_000);
};

const downloadStaticFile = (fileName: string, href: string) => {
  const anchor = document.createElement('a');
  anchor.href = href;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
};

const calibrateInWorker = (model: ModelName, surface: VolatilityPoint[], objective: ObjectiveName) => new Promise<CalibrationResult>((resolve, reject) => {
  const worker = new Worker(new URL('../../workers/modelCalibration.worker.mjs', import.meta.url), { type: 'module' });
  const timeout = window.setTimeout(() => {
    worker.terminate();
    reject(new Error('Calibration exceeded the 45-second browser time limit. Reduce the surface size or use the CLI engine.'));
  }, 45_000);
  const finish = () => {
    window.clearTimeout(timeout);
    worker.terminate();
  };
  worker.onmessage = (event) => {
    finish();
    if (event.data?.ok) resolve(event.data.result as CalibrationResult);
    else reject(new Error(event.data?.error || 'Calibration worker failed.'));
  };
  worker.onerror = () => {
    finish();
    reject(new Error('Calibration worker could not start.'));
  };
  worker.postMessage({ model, surface, options: { objective } });
});

const ModelCalibration: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const runCounterRef = useRef(0);
  const [selectedModel, setSelectedModel] = useState<ModelName>('black');
  const [objective, setObjective] = useState<ObjectiveName>('volatility');
  const [volSurface, setVolSurface] = useState<VolatilityPoint[]>([]);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationResults, setCalibrationResults] = useState<CalibrationResult | null>(null);
  const [calibrationError, setCalibrationError] = useState('');
  const [dataSource, setDataSource] = useState({ kind: 'none', label: 'No surface loaded' });
  const [selectedStrike, setSelectedStrike] = useState<number | null>(null);
  const [selectedMaturity, setSelectedMaturity] = useState<number | null>(null);
  const [runHistory, setRunHistory] = useState<CalibrationRunHistoryItem[]>([]);

  const loadSurface = (surface: VolatilityPoint[], source: { kind: string; label: string }) => {
    setVolSurface(surface);
    setCalibrationResults(null);
    setCalibrationError('');
    setDataSource(source);
    setSelectedStrike([...new Set(surface.map((point) => point.strike))].sort((a, b) => a - b)[0] ?? null);
    setSelectedMaturity([...new Set(surface.map((point) => point.maturity))].sort((a, b) => a - b)[0] ?? null);
  };

  const generateSurface = () => {
    loadSurface(generateSyntheticVolatilitySurface(), {
      kind: 'synthetic',
      label: 'Deterministic SABR reference surface (45 points)',
    });
  };

  const downloadSampleCsv = () => {
    downloadStaticFile('tpl-volatility-surface-example.csv', '/examples/tpl-volatility-surface-example.csv');
  };

  const handleCsvUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setCalibrationError('');
    if (file.size > 2 * 1024 * 1024) {
      setCalibrationError('CSV rejected: maximum file size is 2 MB.');
      return;
    }
    try {
      const surface = parseVolatilitySurfaceCsv(await file.text());
      loadSurface(surface, { kind: 'csv', label: `CSV: ${file.name} (${surface.length} points)` });
    } catch (error) {
      setCalibrationError(error instanceof Error ? error.message : 'CSV could not be parsed.');
    }
  };

  const startCalibration = async () => {
    const surface = volSurface.length > 0 ? volSurface : generateSyntheticVolatilitySurface();
    const runModel = selectedModel;
    const runObjective = objective;
    const sourceLabel = volSurface.length > 0
      ? dataSource.label
      : 'Deterministic SABR reference surface (45 points)';
    if (volSurface.length === 0) {
      loadSurface(surface, { kind: 'synthetic', label: 'Deterministic SABR reference surface (45 points)' });
    }
    setIsCalibrating(true);
    setCalibrationError('');
    setCalibrationResults(null);
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 20));
      const results = await calibrateInWorker(runModel, surface, runObjective);
      setCalibrationResults(results);
      runCounterRef.current += 1;
      const historyItem: CalibrationRunHistoryItem = {
        id: runCounterRef.current,
        model: runModel,
        objective: runObjective,
        source: sourceLabel,
        parameters: results.parameters,
        rmse: results.diagnostics.rmse,
        priceRmse: results.diagnostics.priceRmse,
        rSquared: results.diagnostics.rSquared,
        evaluations: results.diagnostics.evaluations,
        version: results.version,
      };
      setRunHistory((current) => [historyItem, ...current].slice(0, 12));
    } catch (error) {
      setCalibrationError(error instanceof Error ? error.message : 'Calibration failed.');
    } finally {
      setIsCalibrating(false);
    }
  };

  const getUniqueValues = (key: 'strike' | 'maturity') => (
    [...new Set(volSurface.map((point) => point[key]))].sort((a, b) => a - b)
  );

  const selectedPoint = volSurface.find((point) => point.strike === selectedStrike && point.maturity === selectedMaturity);

  const prepareSmileData = () => {
    if (selectedMaturity === null) return [];
    return volSurface
      .filter((point) => point.maturity === selectedMaturity)
      .map((point) => ({ x: point.strike, y: point.impliedVol * 100 }));
  };

  const prepareComparisonData = () => {
    if (!calibrationResults || selectedMaturity === null) return [];
    return calibrationResults.calibratedSurface
      .filter((point) => point.maturity === selectedMaturity)
      .map((point) => ({ x: point.strike, market: point.impliedVol * 100, model: point.modelVol * 100 }));
  };

  const prepareErrorData = () => {
    if (!calibrationResults || selectedMaturity === null) return [];
    return calibrationResults.calibratedSurface
      .filter((point) => point.maturity === selectedMaturity)
      .map((point) => ({ x: point.strike, y: point.signedError * 10_000 }));
  };

  const downloadCalibrationReport = () => {
    if (!calibrationResults) return;
    const report = {
      schema: 'tpl.model-calibration.export.v1',
      engineVersion: calibrationResults.version,
      model: selectedModel,
      objective,
      dataSource: { ...dataSource },
      conventions: {
        measure: 'forward',
        discountFactor: 1,
        maturityUnit: 'years',
        volatilityUnit: 'decimal',
        strikeAndForwardUnits: 'same units',
        residualDefinition: 'model implied volatility minus market implied volatility',
      },
      inputs: volSurface,
      parameters: calibrationResults.parameters,
      parameterBounds: calibrationResults.parameterBounds,
      calibratedSurface: calibrationResults.calibratedSurface,
      diagnostics: calibrationResults.diagnostics,
    };
    downloadTextFile(
      `tpl-calibration-${selectedModel}-${objective}-v${calibrationResults.version}.json`,
      `${JSON.stringify(report, null, 2)}\n`,
      'application/json',
    );
  };

  return (
    <ToolPageLayout
      title="Volatility Model Calibration"
      metaDescription="Deterministically calibrate Black, SABR, and Heston models to an implied-volatility surface with bounded parameters and reproducible diagnostics."
      headline="Volatility Model Calibration"
      valueProp="Fit Black, Hagan SABR, and Fourier-priced Heston models without random parameters or simulated success."
      supportingText="Load a validated CSV or the deterministic reference surface, choose a documented objective, and inspect parameters, constraints, residuals, convergence and model-risk warnings. Every run is reproducible in the browser and from the CLI smoke."
      trustSignals={[
        'Deterministic engine',
        'Real CSV validation',
        'Bounded calibration',
        'Residual diagnostics',
        `Engine v${MODEL_CALIBRATION_VERSION}`,
      ]}
      methodology={[
        { label: 'Supported Models', content: 'Black fits one flat volatility. SABR uses the Hagan lognormal asymptotic formula and calibrates α, β, ρ and ν. Heston prices normalized-forward European calls by deterministic characteristic-function integration, converts prices to Black implied volatilities, then calibrates v₀, κ, θ, σ and ρ.' },
        { label: 'Calibration Objective', content: 'A deterministic bounded pattern search minimizes weighted RMSE either in implied volatility or normalized option price. No random seed, noise term, hidden market feed or server round-trip is used.' },
        { label: 'Input Contract', content: `CSV columns: strike, maturity, impliedVol; optional forward and weight. Volatility is decimal (0.20 = 20%), maturity is in years, and strike and forward use the same units. If forward is omitted, F=1 and strike is forward moneyness. Runs are capped at ${MAX_SURFACE_POINTS} points.` },
        { label: 'Limitations', content: 'Rates and discounting are expressed in forward measure with discount factor 1. SABR is an asymptotic approximation; Heston integration is educational/research-grade. Parameters can be non-identifiable on sparse surfaces. Reconcile production trades with independent libraries, conventions and market data.' },
      ]}
      relatedResources={[
        { title: 'Implied Vol', description: 'Understand how implied-volatility surfaces encode market expectations.', path: '/courses/advanced/implied-vol', type: 'course' },
        { title: 'Black-Scholes Calculator', description: 'Price options using a calibrated volatility.', path: '/tools/black-scholes', type: 'tool' },
        { title: 'Volatility Products', description: 'Connect smile dynamics to volatility products and hedging.', path: '/courses/advanced/vol-products', type: 'course' },
      ]}
      bottomCta={{
        headline: 'Master volatility modeling',
        description: 'Move from surface diagnostics to model choice, calibration and independent validation.',
        primaryLabel: 'Implied Vol Course',
        primaryPath: '/courses/advanced/implied-vol',
        secondaryLabel: 'Try BS Calculator',
        secondaryPath: '/tools/black-scholes',
      }}
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="p-5 bg-card border-border">
          <h3 className="text-base font-semibold mb-4 text-primary terminal-text">Calibration controls</h3>
          <div className="space-y-5">
            <div>
              <Label className="block text-sm font-medium mb-2">Surface data</Label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 md:grid-cols-1 xl:grid-cols-3">
                <Button variant="outline" size="sm" onClick={generateSurface} className="text-xs" disabled={isCalibrating}>
                  <RefreshCw size={12} className="mr-1" /> Reference surface
                </Button>
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="text-xs" disabled={isCalibrating}>
                  <Upload size={12} className="mr-1" /> Upload CSV
                </Button>
                <Button variant="outline" size="sm" onClick={downloadSampleCsv} className="text-xs">
                  <Download size={12} className="mr-1" /> Sample CSV
                </Button>
                <input
                  ref={fileInputRef}
                  className="hidden"
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleCsvUpload}
                  disabled={isCalibrating}
                  aria-label="Upload implied-volatility CSV"
                />
              </div>
              <div className="mt-2 flex items-start gap-2 text-xs text-muted-foreground">
                {dataSource.kind !== 'none' && <CheckCircle size={14} className="mt-0.5 shrink-0 text-green-500" />}
                <span>{dataSource.label}</span>
              </div>
            </div>

            <div>
              <Label htmlFor="calibration-model" className="block text-sm font-medium mb-1">Model</Label>
              <Select value={selectedModel} disabled={isCalibrating} onValueChange={(value) => { setSelectedModel(value as ModelName); setCalibrationResults(null); setCalibrationError(''); }}>
                <SelectTrigger id="calibration-model"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="black">Black — flat volatility</SelectItem>
                  <SelectItem value="sabr">SABR — Hagan lognormal</SelectItem>
                  <SelectItem value="heston">Heston — Fourier integration</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="calibration-objective" className="block text-sm font-medium mb-1">Objective</Label>
              <Select value={objective} disabled={isCalibrating} onValueChange={(value) => { setObjective(value as ObjectiveName); setCalibrationResults(null); setCalibrationError(''); }}>
                <SelectTrigger id="calibration-objective"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="volatility">Implied-volatility RMSE</SelectItem>
                  <SelectItem value="price">Normalized-price RMSE</SelectItem>
                </SelectContent>
              </Select>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {objective === 'volatility'
                  ? 'Use volatility RMSE to compare quoted implied-volatility errors consistently across strikes and maturities.'
                  : 'Use normalized-price RMSE when monetary fit matters; ATM and higher-vega quotes influence price errors differently.'}
              </p>
            </div>

            <div>
              <Label className="block text-sm font-medium mb-2">Enforced controls</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2"><Checkbox id="bounded" checked disabled /><Label htmlFor="bounded" className="text-sm">Parameter bounds</Label></div>
                <div className="flex items-center space-x-2"><Checkbox id="deterministic" checked disabled /><Label htmlFor="deterministic" className="text-sm">Deterministic optimization</Label></div>
                <div className="flex items-center space-x-2"><Checkbox id="residuals" checked disabled /><Label htmlFor="residuals" className="text-sm">Residual diagnostics</Label></div>
              </div>
            </div>

            <Button variant="finance" className="w-full" onClick={startCalibration} disabled={isCalibrating}>
              {isCalibrating
                ? <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Calibrating…</>
                : <><FileSpreadsheet className="mr-2 h-4 w-4" /> Calibrate model</>}
            </Button>
          </div>
        </Card>

        <Card className="p-5 bg-card border-border md:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
            <div>
              <h3 className="text-base font-semibold text-primary terminal-text">Implied-volatility surface</h3>
              <p className="text-xs text-muted-foreground mt-1">Forward measure · volatility in % · no live-market claim</p>
            </div>
            <span className="rounded border border-border bg-secondary/30 px-2 py-1 text-xs font-mono">
              {volSurface.length} points
            </span>
          </div>
          {volSurface.length === 0 ? (
            <div className="h-72 rounded-md border border-dashed border-border flex items-center justify-center p-8 text-center text-sm text-muted-foreground">
              Load the deterministic reference surface or a validated CSV. Calibration will never fabricate an upload or a result.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 mb-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="calibration-maturity" className="block text-sm font-medium mb-1">Maturity</Label>
                  <Select value={selectedMaturity?.toString() ?? ''} onValueChange={(value) => setSelectedMaturity(Number(value))}>
                    <SelectTrigger id="calibration-maturity"><SelectValue /></SelectTrigger>
                    <SelectContent>{getUniqueValues('maturity').map((maturity) => <SelectItem key={maturity} value={maturity.toString()}>{maturity}y</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="calibration-strike" className="block text-sm font-medium mb-1">Strike / moneyness</Label>
                  <Select value={selectedStrike?.toString() ?? ''} onValueChange={(value) => setSelectedStrike(Number(value))}>
                    <SelectTrigger id="calibration-strike"><SelectValue /></SelectTrigger>
                    <SelectContent>{getUniqueValues('strike').map((strike) => <SelectItem key={strike} value={strike.toString()}>{strike}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="h-60"><LineChart data={prepareSmileData()} color="#22c55e" xLabel="Strike / moneyness" yLabel="Implied vol (%)" /></div>
              {selectedPoint && (
                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded border border-border p-2"><div className="text-muted-foreground">Selected vol</div><div className="font-mono font-semibold">{formatNumber(selectedPoint.impliedVol * 100, 3)}%</div></div>
                  <div className="rounded border border-border p-2"><div className="text-muted-foreground">Forward</div><div className="font-mono font-semibold">{selectedPoint.forward ?? 1}</div></div>
                  <div className="rounded border border-border p-2"><div className="text-muted-foreground">Weight</div><div className="font-mono font-semibold">{selectedPoint.weight ?? 1}</div></div>
                </div>
              )}
            </>
          )}
        </Card>

        {calibrationError && (
          <Alert variant="destructive" className="md:col-span-3">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Calibration input rejected</AlertTitle>
            <AlertDescription>{calibrationError}</AlertDescription>
          </Alert>
        )}

        {calibrationResults && (
          <Card className="p-5 pb-24 bg-card border-border md:col-span-3 md:pb-5" data-calibration-results="true">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-primary terminal-text">Calibration result</h3>
                <p className="mt-1 text-xs text-muted-foreground">{dataSource.label} · engine v{calibrationResults.version}</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={downloadCalibrationReport}>
                <Download className="mr-2 h-4 w-4" /> Export JSON
              </Button>
            </div>
            <Tabs defaultValue="parameters">
              <TabsList className="mb-4 grid h-auto w-full grid-cols-2 md:grid-cols-4">
                <TabsTrigger value="parameters">Parameters</TabsTrigger>
                <TabsTrigger value="fit">Fit & residuals</TabsTrigger>
                <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
                <TabsTrigger value="history">Run history</TabsTrigger>
              </TabsList>
              <TabsContent value="parameters">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <h4 className="text-sm font-semibold mb-2 text-primary terminal-text">{selectedModel.toUpperCase()} bounded solution</h4>
                    <Table>
                      <TableHeader><TableRow><TableHead>Parameter</TableHead><TableHead>Value</TableHead><TableHead>Allowed range</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {Object.entries(calibrationResults.parameters).map(([key, value]) => (
                          <TableRow key={key}>
                            <TableCell className="font-mono">{key}</TableCell>
                            <TableCell className="font-mono">{formatNumber(value, 6)}</TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground">[{calibrationResults.parameterBounds[key].join(', ')}]</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="grid grid-cols-2 gap-3 content-start">
                    <div className="rounded-md border border-border bg-secondary/20 p-4">
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">Vol RMSE</div>
                      <div className="text-2xl font-bold mt-1">{formatVolBps(calibrationResults.diagnostics.rmse)}</div>
                      <div className="text-xs text-muted-foreground mt-1">decimal: {formatNumber(calibrationResults.diagnostics.rmse)}</div>
                    </div>
                    <div className="rounded-md border border-border bg-secondary/20 p-4">
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">R²</div>
                      <div className="text-2xl font-bold mt-1">{calibrationResults.diagnostics.rSquared === null ? 'n/a' : formatNumber(calibrationResults.diagnostics.rSquared, 4)}</div>
                      <div className="text-xs text-muted-foreground mt-1">descriptive, not a model approval</div>
                    </div>
                    <div className="col-span-2 h-40 rounded-md border border-border p-2">
                      <BarChart data={[{ x: 'Vol RMSE (bp)', y: calibrationResults.diagnostics.rmse * 10_000 }]} color="#ea384c" />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="fit">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <Card className="p-4 bg-secondary/20 border-border">
                    <h4 className="text-sm font-semibold mb-2 text-primary">Market vs model · {selectedMaturity}y</h4>
                    <div className="h-64"><ComparisonLineChart data={prepareComparisonData()} xLabel="Strike / moneyness" yLabel="Vol (%)" /></div>
                  </Card>
                  <Card className="p-4 bg-secondary/20 border-border">
                    <h4 className="text-sm font-semibold mb-2 text-primary">Signed residual · {selectedMaturity}y</h4>
                    <div className="h-64"><BarChart data={prepareErrorData()} color="#ea384c" xLabel="Strike / moneyness" yLabel="Vol bp" /></div>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="diagnostics">
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {[
                    ['Engine', `v${calibrationResults.version}`],
                    ['Objective', calibrationResults.diagnostics.objective === 'price' ? 'Price RMSE' : 'Vol RMSE'],
                    ['Points', calibrationResults.diagnostics.points.toString()],
                    ['Converged', calibrationResults.diagnostics.converged ? 'Yes' : 'No — review warning'],
                    ['Evaluations', calibrationResults.diagnostics.evaluations.toString()],
                    ['Iterations', calibrationResults.diagnostics.iterations.toString()],
                    ['Mean abs. error', formatVolBps(calibrationResults.diagnostics.meanAbsoluteError)],
                    ['Max abs. error', formatVolBps(calibrationResults.diagnostics.maxAbsoluteError)],
                    ['Price RMSE', formatNumber(calibrationResults.diagnostics.priceRmse, 7)],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-md border border-border bg-secondary/20 p-3">
                      <div className="text-xs text-muted-foreground">{label}</div>
                      <div className="font-mono font-semibold mt-1 break-words">{value}</div>
                    </div>
                  ))}
                </div>
                {calibrationResults.diagnostics.fellerMargin !== null && (
                  <div className="mt-4 rounded-md border border-border p-3 text-sm">
                    Heston Feller margin 2κθ − σ²: <span className="font-mono font-semibold">{formatNumber(calibrationResults.diagnostics.fellerMargin, 6)}</span>
                  </div>
                )}
                {calibrationResults.diagnostics.warnings.map((warning) => (
                  <Alert key={warning} className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Model-risk note</AlertTitle>
                    <AlertDescription>{warning}</AlertDescription>
                  </Alert>
                ))}
              </TabsContent>

              <TabsContent value="history">
                <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-semibold text-primary terminal-text">Session comparison</h4>
                    <p className="mt-1 text-xs text-muted-foreground">Only successful runs completed in this browser session are shown; no result is fabricated or persisted remotely.</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setRunHistory([])} disabled={runHistory.length === 0}>
                    <Trash2 className="mr-2 h-4 w-4" /> Clear history
                  </Button>
                </div>
                <div className="overflow-x-auto rounded-md border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Run</TableHead>
                        <TableHead>Model</TableHead>
                        <TableHead>Objective</TableHead>
                        <TableHead>Parameters</TableHead>
                        <TableHead>Vol RMSE</TableHead>
                        <TableHead>Price RMSE</TableHead>
                        <TableHead>R²</TableHead>
                        <TableHead>Evaluations</TableHead>
                        <TableHead>Source</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {runHistory.map((run) => (
                        <TableRow key={run.id}>
                          <TableCell className="font-mono">#{run.id}</TableCell>
                          <TableCell className="font-semibold uppercase">{run.model}</TableCell>
                          <TableCell>{run.objective === 'price' ? 'Price' : 'Volatility'}</TableCell>
                          <TableCell className="min-w-64 font-mono text-xs">
                            {Object.entries(run.parameters).map(([key, value]) => `${key}=${formatNumber(value, 4)}`).join(' · ')}
                          </TableCell>
                          <TableCell className="font-mono whitespace-nowrap">{formatVolBps(run.rmse)}</TableCell>
                          <TableCell className="font-mono">{formatNumber(run.priceRmse, 7)}</TableCell>
                          <TableCell className="font-mono">{run.rSquared === null ? 'n/a' : formatNumber(run.rSquared, 4)}</TableCell>
                          <TableCell className="font-mono">{run.evaluations}</TableCell>
                          <TableCell className="min-w-56 text-xs text-muted-foreground">{run.source} · v{run.version}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        )}
      </div>

    </ToolPageLayout>
  );
};

export default ModelCalibration;
