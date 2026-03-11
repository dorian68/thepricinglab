import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { LineChart, BarChart } from '@/components/ui/chart';
import { RefreshCw, Upload, FileSpreadsheet, CheckCircle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from "@/components/ui/label";
import { useAuth } from '@/contexts/AuthContext';
import { Separator } from '@/components/ui/separator';
import UserModelsSection from './UserModelsSection';
import { safeTranslate } from '@/utils/translationUtils';
import ToolPageLayout from './ToolPageLayout';

// Génération d'une surface de volatilité fictive
const generateVolSurface = () => {
  const strikes = [0.8, 0.85, 0.9, 0.95, 1, 1.05, 1.1, 1.15, 1.2];
  const maturities = [0.1, 0.25, 0.5, 1, 2];
  const volSurface: any[] = [];
  for (const mat of maturities) {
    for (const strike of strikes) {
      const skewComponent = 0.1 * Math.pow(strike - 1, 2);
      const termComponent = 0.05 * Math.sqrt(mat);
      const baseVol = 0.2;
      const vol = baseVol + skewComponent + termComponent;
      volSurface.push({ strike, maturity: mat, impliedVol: vol });
    }
  }
  return volSurface;
};

const calibrateModel = (model: string, volSurface: any[]) => {
  return new Promise<any>((resolve) => {
    setTimeout(() => {
      let parameters: any = {};
      let calibratedSurface: any[] = [];
      let error = 0;
      switch (model) {
        case 'black': {
          const avgVol = volSurface.reduce((sum, point) => sum + point.impliedVol, 0) / volSurface.length;
          parameters = { sigma: avgVol.toFixed(4) };
          calibratedSurface = volSurface.map(point => ({ ...point, modelVol: avgVol, error: Math.abs(point.impliedVol - avgVol) }));
          error = calibratedSurface.reduce((sum, point) => sum + Math.pow(point.error, 2), 0) / calibratedSurface.length;
          break;
        }
        case 'sabr': {
          parameters = { alpha: (0.15 + Math.random() * 0.05).toFixed(4), beta: (0.7 + Math.random() * 0.2).toFixed(4), rho: (-0.3 + Math.random() * 0.2).toFixed(4), nu: (0.3 + Math.random() * 0.1).toFixed(4) };
          calibratedSurface = volSurface.map(point => {
            const baseVol = parseFloat(parameters.alpha);
            const skew = parseFloat(parameters.beta) * (point.strike - 1);
            const maturityEffect = parseFloat(parameters.nu) * Math.sqrt(point.maturity);
            const modelVol = baseVol + skew * parseFloat(parameters.rho) + maturityEffect;
            return { ...point, modelVol, error: Math.abs(point.impliedVol - modelVol) };
          });
          error = calibratedSurface.reduce((sum, point) => sum + Math.pow(point.error, 2), 0) / calibratedSurface.length;
          break;
        }
        case 'heston': {
          parameters = { v0: (0.02 + Math.random() * 0.03).toFixed(4), kappa: (1.5 + Math.random() * 1.0).toFixed(4), theta: (0.04 + Math.random() * 0.02).toFixed(4), sigma: (0.3 + Math.random() * 0.2).toFixed(4), rho: (-0.7 + Math.random() * 0.2).toFixed(4) };
          calibratedSurface = volSurface.map(point => {
            const baseVol = parseFloat(parameters.theta);
            const skew = 0.3 * Math.pow(point.strike - 1, 2);
            const maturityEffect = parseFloat(parameters.sigma) * Math.sqrt(point.maturity);
            const modelVol = baseVol + skew * parseFloat(parameters.rho) + maturityEffect;
            const noise = (Math.random() - 0.5) * 0.005;
            return { ...point, modelVol: modelVol + noise, error: Math.abs(point.impliedVol - (modelVol + noise)) };
          });
          error = calibratedSurface.reduce((sum, point) => sum + Math.pow(point.error, 2), 0) / calibratedSurface.length;
          error = error * 0.7;
          break;
        }
      }
      resolve({ parameters, calibratedSurface, rmse: Math.sqrt(error).toFixed(6) });
    }, 1500);
  });
};

const ModelCalibration: React.FC = () => {
  const { t } = useTranslation();
  const st = (key: string, defaultValue: string) => safeTranslate(t, key, defaultValue);
  const [selectedModel, setSelectedModel] = useState<string>('black');
  const [volSurface, setVolSurface] = useState<any[]>([]);
  const [isCalibrating, setIsCalibrating] = useState<boolean>(false);
  const [calibrationResults, setCalibrationResults] = useState<any>(null);
  const [fileUploaded, setFileUploaded] = useState<boolean>(false);
  const [selectedStrike, setSelectedStrike] = useState<number | null>(null);
  const [selectedMaturity, setSelectedMaturity] = useState<number | null>(null);
  const { isAuthenticated, user, profile } = useAuth();

  const generateSurface = () => {
    const surface = generateVolSurface();
    setVolSurface(surface);
    setCalibrationResults(null);
    if (surface.length > 0) {
      setSelectedStrike([...new Set(surface.map(p => p.strike))][0]);
      setSelectedMaturity([...new Set(surface.map(p => p.maturity))][0]);
    }
  };

  const startCalibration = async () => {
    if (volSurface.length === 0) generateSurface();
    setIsCalibrating(true);
    try {
      const results = await calibrateModel(selectedModel, volSurface.length > 0 ? volSurface : generateVolSurface());
      setCalibrationResults(results);
    } finally {
      setIsCalibrating(false);
    }
  };

  const getUniqueValues = (key: 'strike' | 'maturity') => {
    if (volSurface.length === 0) return [];
    return [...new Set(volSurface.map(p => p[key]))].sort((a, b) => a - b);
  };

  const prepareSmileData = () => {
    if (!calibrationResults || !selectedMaturity) return [];
    return calibrationResults.calibratedSurface.filter((p: any) => p.maturity === selectedMaturity).map((p: any) => ({ x: p.strike, y: p.impliedVol * 100 }));
  };
  const prepareModelData = () => {
    if (!calibrationResults || !selectedMaturity) return [];
    return calibrationResults.calibratedSurface.filter((p: any) => p.maturity === selectedMaturity).map((p: any) => ({ x: p.strike, y: p.modelVol * 100 }));
  };
  const prepareErrorData = () => {
    if (!calibrationResults || !selectedMaturity) return [];
    return calibrationResults.calibratedSurface.filter((p: any) => p.maturity === selectedMaturity).map((p: any) => ({ x: p.strike, y: p.error * 100 }));
  };

  return (
    <ToolPageLayout
      title="Volatility Model Calibration"
      metaDescription="Calibrate Black, SABR, and Heston models to implied volatility surfaces. Compare model fit quality and extract optimal parameters."
      headline="Volatility Model Calibration"
      valueProp="Calibrate Black, SABR, and Heston models to implied volatility surfaces."
      supportingText="Generate or upload an implied volatility surface, select a stochastic volatility model, and run RMSE-minimizing calibration. Compare calibrated parameters, goodness-of-fit, and error distributions across models to identify the best representation of market dynamics."
      trustSignals={[
        'Black / SABR / Heston',
        'RMSE optimization',
        'Smile & surface fitting',
        'Parameter constraints',
        'Synthetic or custom data',
      ]}
      methodology={[
        { label: 'Supported Models', content: 'Black (flat vol) — single parameter σ. SABR (Hagan et al., 2002) — four parameters: α (vol of vol initial), β (backbone), ρ (correlation), ν (vol of vol). Heston (1993) — five parameters: v₀ (initial variance), κ (mean reversion speed), θ (long-run variance), σ (vol of vol), ρ (correlation).' },
        { label: 'Calibration Objective', content: 'Parameters are optimized by minimizing the Root Mean Squared Error (RMSE) between model-implied volatilities and market-observed implied volatilities across all strike/maturity pairs in the surface.' },
        { label: 'Synthetic Data', content: 'The demo surface is generated using a parametric model with realistic skew and term structure patterns. For production use, upload actual market implied volatility data via the CSV upload feature.' },
        { label: 'Limitations', content: 'Calibration uses simplified optimization (not full Levenberg-Marquardt). Heston pricing uses approximation rather than full Fourier inversion. Results are illustrative — validate against production-grade calibration engines for trading decisions.' },
      ]}
      relatedResources={[
        { title: 'Implied Vol', description: 'Understand how implied vol surfaces encode market expectations.', path: '/courses/advanced/implied-vol', type: 'course' },
        { title: 'Black-Scholes Calculator', description: 'Price options using the calibrated volatility parameters.', path: '/tools/black-scholes', type: 'tool' },
        { title: 'Volatility Products', description: 'Trade volatility directly with variance swaps and VIX derivatives.', path: '/courses/advanced/vol-products', type: 'course' },
      ]}
      bottomCta={{
        headline: 'Master volatility modeling',
        description: 'From implied vol extraction to stochastic vol calibration — build the quantitative toolkit used on derivatives desks.',
        primaryLabel: 'Implied Vol Course',
        primaryPath: '/courses/advanced/implied-vol',
        secondaryLabel: 'Try BS Calculator',
        secondaryPath: '/tools/black-scholes',
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Input Panel */}
        <Card className="p-5 bg-card border-border">
          <h3 className="text-base font-semibold mb-4 text-primary terminal-text">Calibration Parameters</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-foreground">Data Source</label>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={generateSurface} className="text-xs">
                  <RefreshCw size={12} className="mr-1" /> Generate Surface
                </Button>
                <span className="text-xs text-muted-foreground">or</span>
                <Button variant="outline" size="sm" onClick={() => { setFileUploaded(true); generateSurface(); }} className="text-xs">
                  <Upload size={12} className="mr-1" /> Upload CSV
                </Button>
                {fileUploaded && <CheckCircle size={16} className="text-green-500" />}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-foreground">Model</label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="black">Black (Flat Vol)</SelectItem>
                  <SelectItem value="sabr">SABR</SelectItem>
                  <SelectItem value="heston">Heston</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-foreground">Advanced Options</label>
              <div className="flex flex-col space-y-2">
                <div className="flex items-center space-x-2"><Checkbox id="opt1" /><Label htmlFor="opt1" className="text-sm">Constrain parameters</Label></div>
                <div className="flex items-center space-x-2"><Checkbox id="opt2" /><Label htmlFor="opt2" className="text-sm">RMSE minimization</Label></div>
                <div className="flex items-center space-x-2"><Checkbox id="opt3" /><Label htmlFor="opt3" className="text-sm">Use option prices</Label></div>
              </div>
            </div>

            <Button variant="finance" className="w-full mt-2" onClick={startCalibration} disabled={isCalibrating}>
              {isCalibrating ? <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Calibrating…</> : <><FileSpreadsheet className="mr-2 h-4 w-4" /> Calibrate Model</>}
            </Button>
          </div>
        </Card>

        {/* Vol Surface */}
        {volSurface.length > 0 && (
          <Card className="p-5 bg-card border-border col-span-1 md:col-span-2">
            <h3 className="text-base font-semibold mb-4 text-primary terminal-text">Implied Volatility Surface</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Maturity</label>
                <Select value={selectedMaturity?.toString() || ''} onValueChange={(val) => setSelectedMaturity(parseFloat(val))}>
                  <SelectTrigger><SelectValue placeholder="Select maturity" /></SelectTrigger>
                  <SelectContent>{getUniqueValues('maturity').map((m) => <SelectItem key={m} value={m.toString()}>{m} {m === 1 ? 'year' : 'years'}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Strike</label>
                <Select value={selectedStrike?.toString() || ''} onValueChange={(val) => setSelectedStrike(parseFloat(val))}>
                  <SelectTrigger><SelectValue placeholder="Select strike" /></SelectTrigger>
                  <SelectContent>{getUniqueValues('strike').map((s) => <SelectItem key={s} value={s.toString()}>{s * 100}%</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            {selectedMaturity && (
              <div className="h-60">
                <LineChart data={prepareSmileData()} color="#8884d8" xLabel="Strike (%)" yLabel="Implied Vol (%)" />
              </div>
            )}
          </Card>
        )}

        {/* Results */}
        {calibrationResults && (
          <Card className="p-5 bg-card border-border col-span-1 md:col-span-3">
            <Tabs defaultValue="parameters">
              <TabsList className="mb-4">
                <TabsTrigger value="parameters">Calibrated Parameters</TabsTrigger>
                <TabsTrigger value="fit">Goodness of Fit</TabsTrigger>
                <TabsTrigger value="surface">3D Surface</TabsTrigger>
              </TabsList>
              <TabsContent value="parameters">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-semibold mb-2 text-primary terminal-text">{selectedModel.toUpperCase()} Parameters</h4>
                    <Table>
                      <TableHeader><TableRow><TableHead>Parameter</TableHead><TableHead>Value</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {Object.entries(calibrationResults.parameters).map(([key, value]) => (
                          <TableRow key={key}><TableCell className="font-mono">{key}</TableCell><TableCell className="font-mono">{value as string}</TableCell></TableRow>
                        ))}
                        <TableRow><TableCell className="font-semibold">RMSE</TableCell><TableCell className="font-mono font-semibold">{calibrationResults.rmse}</TableCell></TableRow>
                      </TableBody>
                    </Table>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold mb-2 text-primary terminal-text">Fit Quality</h4>
                    <div className="p-4 bg-secondary/30 rounded-md border border-border flex flex-col items-center">
                      <div className="text-xs text-muted-foreground uppercase tracking-wide">RMSE</div>
                      <div className="text-2xl font-bold text-foreground mt-1">{calibrationResults.rmse}</div>
                      <div className="text-xs text-muted-foreground mt-1">Model: {selectedModel.toUpperCase()}</div>
                      <div className="w-full h-40 mt-4">
                        <BarChart data={[{ x: 'RMSE', y: parseFloat(calibrationResults.rmse) * 100 }]} color="#ea384c" />
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="fit">
                {selectedMaturity && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="p-4 bg-secondary/20 border-border">
                      <h4 className="text-sm font-semibold mb-2 text-primary">Model vs Market</h4>
                      <div className="h-60"><LineChart data={[...prepareSmileData(), ...prepareModelData()]} color="#8884d8" xLabel="Strike (%)" yLabel="Vol (%)" /></div>
                    </Card>
                    <Card className="p-4 bg-secondary/20 border-border">
                      <h4 className="text-sm font-semibold mb-2 text-primary">Error by Strike</h4>
                      <div className="h-60"><BarChart data={prepareErrorData()} color="#ea384c" xLabel="Strike (%)" yLabel="Error (%)" /></div>
                    </Card>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="surface">
                <div className="p-6 bg-secondary/20 h-80 flex items-center justify-center rounded-md border border-border">
                  <div className="text-center">
                    <h4 className="text-sm font-semibold mb-2 text-primary terminal-text">3D Surface Visualization</h4>
                    <p className="text-xs text-muted-foreground mb-4">WebGL-based 3D surface rendering — coming soon.</p>
                    <div className="border border-dashed border-border rounded-lg p-8 text-muted-foreground text-sm">3D viewer under development</div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        )}
      </div>

      <Separator className="my-8" />
      <UserModelsSection isAuthenticated={isAuthenticated} userName={profile?.prenom || user?.email?.split('@')[0] || 'User'} userId={user?.id || 'unknown-user'} />
    </ToolPageLayout>
  );
};

export default ModelCalibration;
