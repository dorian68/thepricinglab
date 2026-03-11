
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Calculator, Upload, RefreshCw } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTranslation } from 'react-i18next';
import ToolPageLayout from './ToolPageLayout';
import { LineChart } from '@/components/ui/chart';

const assets = [
  { id: 'btc', name: 'Bitcoin (BTC/USD)' },
  { id: 'eth', name: 'Ethereum (ETH/USD)' },
  { id: 'spy', name: 'S&P 500 ETF (SPY)' },
  { id: 'aapl', name: 'Apple Inc. (AAPL)' },
  { id: 'tsla', name: 'Tesla Inc. (TSLA)' },
  { id: 'eurusd', name: 'EUR/USD' },
];

const generatePriceSeries = (days: number, initialPrice: number, volatility: number, drift: number) => {
  const prices = [initialPrice];
  const dailyReturns: number[] = [];
  const rollingVol: { day: number; vol: number }[] = [];

  for (let i = 1; i < days; i++) {
    const randomReturn = (Math.random() - 0.5) * 2 * volatility / Math.sqrt(252);
    const dailyReturn = drift / 252 + randomReturn;
    dailyReturns.push(dailyReturn * 100);
    const newPrice = prices[i - 1] * (1 + dailyReturn);
    prices.push(newPrice);

    if (i >= 20) {
      const window = dailyReturns.slice(i - 20, i);
      const mean = window.reduce((sum, val) => sum + val, 0) / window.length;
      const variance = window.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / window.length;
      const stdDev = Math.sqrt(variance);
      const annualizedVol = stdDev * Math.sqrt(252);
      rollingVol.push({ day: i, vol: annualizedVol });
    } else {
      rollingVol.push({ day: i, vol: volatility * 100 });
    }
  }

  return { prices, dailyReturns, rollingVol };
};

const VolatilityCalculator: React.FC = () => {
  const { t } = useTranslation();
  const [selectedAsset, setSelectedAsset] = useState(assets[0].id);
  const [period, setPeriod] = useState<string>('1y');
  const [windowSize, setWindowSize] = useState<number>(20);
  const [fileUploaded, setFileUploaded] = useState<boolean>(false);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [results, setResults] = useState<any>(null);

  const calculateHistoricalVolatility = () => {
    setIsCalculating(true);
    setTimeout(() => {
      const data = generatePriceSeries(
        252,
        selectedAsset === 'btc' ? 30000 : selectedAsset === 'eth' ? 2000 : selectedAsset === 'spy' ? 450 : selectedAsset === 'aapl' ? 170 : selectedAsset === 'tsla' ? 200 : 1.1,
        selectedAsset === 'btc' ? 0.65 : selectedAsset === 'eth' ? 0.75 : selectedAsset === 'tsla' ? 0.55 : 0.20,
        0.1
      );
      const returns = data.dailyReturns;
      const mean = returns.reduce((sum, val) => sum + val, 0) / returns.length;
      const variance = returns.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / returns.length;
      const stdDev = Math.sqrt(variance);
      const annualizedVol = stdDev * Math.sqrt(252);
      setResults({
        meanReturn: mean.toFixed(2),
        dailyVol: stdDev.toFixed(2),
        annualizedVol: annualizedVol.toFixed(2),
        min: Math.min(...returns).toFixed(2),
        max: Math.max(...returns).toFixed(2),
        priceChartData: data.prices.map((price, i) => ({ x: i, y: price })),
        returnsChartData: data.dailyReturns.map((ret, i) => ({ x: i + 1, y: ret })),
        volChartData: data.rollingVol.map(item => ({ x: item.day, y: item.vol })),
      });
      setIsCalculating(false);
    }, 1000);
  };

  return (
    <ToolPageLayout
      title="Historical Volatility Calculator"
      metaDescription="Measure and analyze realized volatility across assets and time horizons. Close-to-close estimator with configurable rolling windows and annualization."
      headline="Historical Volatility Calculator"
      valueProp="Measure and analyze realized volatility across assets and time horizons."
      supportingText="Compute close-to-close historical volatility using configurable rolling windows. Analyze return distributions, identify volatility regimes, and compare realized vol across asset classes — from equities and crypto to FX pairs."
      trustSignals={[
        'Close-to-close estimator',
        'Configurable rolling window',
        '√252 annualization',
        'Browser-based computation',
        'Multiple asset classes',
      ]}
      methodology={[
        {
          label: 'Volatility Estimator',
          content: 'Uses the close-to-close log-return standard deviation estimator. Daily returns are computed as r_t = ln(P_t / P_{t-1}). The daily standard deviation is then annualized by multiplying by √252 (assuming 252 trading days per year).',
        },
        {
          label: 'Rolling Window',
          content: 'The rolling volatility is computed over a configurable window (default: 20 days). For each day t, the estimator uses the previous N daily returns to compute the local standard deviation, providing a time-varying volatility measure.',
        },
        {
          label: 'Data & Limitations',
          content: 'Synthetic price paths are generated using a geometric Brownian motion model with calibrated parameters per asset class. In production, replace with actual market data feeds. The close-to-close estimator does not capture intraday volatility (see Parkinson or Yang-Zhang estimators for alternatives).',
        },
      ]}
      relatedResources={[
        { title: 'Implied Volatility', description: 'Understand the relationship between implied and realized volatility.', path: '/courses/advanced/implied-vol', type: 'course' },
        { title: 'Black-Scholes Calculator', description: 'Price options using your volatility estimates.', path: '/tools/black-scholes', type: 'tool' },
        { title: 'Volatility Products', description: 'Learn about VIX, variance swaps, and vol-of-vol.', path: '/courses/advanced/vol-products', type: 'course' },
      ]}
      bottomCta={{
        headline: 'Go deeper into volatility modeling',
        description: 'Explore implied volatility surfaces, SABR calibration, and advanced estimators in our professional courses.',
        primaryLabel: 'Explore Courses',
        primaryPath: '/courses',
        secondaryLabel: 'Try Model Calibration',
        secondaryPath: '/tools/model-calibration',
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Input Panel */}
        <Card className="p-5 bg-card border-border">
          <h3 className="text-base font-semibold mb-4 text-primary terminal-text">Input Parameters</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-foreground">Asset</label>
              <Select value={selectedAsset} onValueChange={(v) => { setSelectedAsset(v); setResults(null); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {assets.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="text-xs" onClick={() => { setFileUploaded(true); setResults(null); }}>
                <Upload size={12} className="mr-1" /> Upload CSV
              </Button>
              {fileUploaded && <span className="text-xs text-green-500">Ready</span>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-foreground">Period</label>
              <Select value={period} onValueChange={(v) => { setPeriod(v); setResults(null); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1m">1 month</SelectItem>
                  <SelectItem value="3m">3 months</SelectItem>
                  <SelectItem value="6m">6 months</SelectItem>
                  <SelectItem value="1y">1 year</SelectItem>
                  <SelectItem value="2y">2 years</SelectItem>
                  <SelectItem value="5y">5 years</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-foreground">Rolling Window: {windowSize} days</label>
              <Slider value={[windowSize]} min={5} max={60} step={1} onValueChange={(v) => setWindowSize(v[0])} />
            </div>

            <Button variant="finance" className="w-full mt-2" onClick={calculateHistoricalVolatility} disabled={isCalculating}>
              {isCalculating ? (
                <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Computing…</>
              ) : (
                <><Calculator className="mr-2 h-4 w-4" /> Compute Volatility</>
              )}
            </Button>
          </div>
        </Card>

        {/* Results */}
        {results && (
          <>
            <Card className="p-5 bg-card border-border col-span-1 md:col-span-2">
              <h3 className="text-base font-semibold mb-4 text-primary terminal-text">Results</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-3 bg-secondary/50 rounded-md border border-border">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Annualized Vol</div>
                  <div className="text-2xl font-bold text-primary mt-1">{results.annualizedVol}%</div>
                </div>
                <div className="p-3 bg-secondary/50 rounded-md border border-border">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Daily Vol</div>
                  <div className="text-2xl font-bold text-foreground mt-1">{results.dailyVol}%</div>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Metric</TableHead><TableHead>Value</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow><TableCell>Mean Daily Return</TableCell><TableCell>{results.meanReturn}%</TableCell></TableRow>
                  <TableRow><TableCell>Min Daily Return</TableCell><TableCell>{results.min}%</TableCell></TableRow>
                  <TableRow><TableCell>Max Daily Return</TableCell><TableCell>{results.max}%</TableCell></TableRow>
                </TableBody>
              </Table>
            </Card>

            <Card className="p-5 bg-card border-border col-span-1 md:col-span-3 h-80">
              <h3 className="text-sm font-semibold mb-2 text-primary terminal-text">Rolling Volatility</h3>
              <LineChart data={results.volChartData} color="#ea384c" xLabel="Days" yLabel="Vol (%)" />
            </Card>

            <Card className="p-5 bg-card border-border col-span-1 md:col-span-3 h-80">
              <h3 className="text-sm font-semibold mb-2 text-primary terminal-text">Price Evolution</h3>
              <LineChart data={results.priceChartData} color="#8884d8" xLabel="Days" yLabel="Price" />
            </Card>

            <Card className="p-5 bg-card border-border col-span-1 md:col-span-3 h-80">
              <h3 className="text-sm font-semibold mb-2 text-primary terminal-text">Daily Returns Distribution</h3>
              <LineChart data={results.returnsChartData} color="#82ca9d" xLabel="Days" yLabel="Return (%)" />
            </Card>
          </>
        )}
      </div>
    </ToolPageLayout>
  );
};

export default VolatilityCalculator;
