
import { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calculator, Info } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { safeTranslate } from "@/utils/translationUtils";
import ToolPageLayout from './ToolPageLayout';

type Greek = 'delta' | 'gamma' | 'vega' | 'theta' | 'rho';
type OptionGreeks = Record<Greek, number>;
type SimulationPoint = { x: number; delta: number; gamma: number; vega: number; theta: number; rho: number; };

const parameterRanges = {
  spot: { min: 80, max: 120, step: 1 },
  volatility: { min: 0.1, max: 0.5, step: 0.01 },
  timeToMaturity: { min: 0.1, max: 2, step: 0.1 }
};

const greekColors: Record<Greek, string> = {
  delta: '#ea384c',
  gamma: '#4A89DC', 
  vega: '#37BC9B',
  theta: '#F6BB42',
  rho: '#967ADC'
};

const BlackScholesCalculator = () => {
  const { t } = useTranslation();
  const st = (key: string, defaultValue: string) => safeTranslate(t, key, defaultValue);
  const [spot, setSpot] = useState<number>(100);
  const [strike, setStrike] = useState<number>(100);
  const [interestRate, setInterestRate] = useState<number>(0.05);
  const [volatility, setVolatility] = useState<number>(0.2);
  const [timeToMaturity, setTimeToMaturity] = useState<number>(1);
  const [callPrice, setCallPrice] = useState<number>(0);
  const [putPrice, setPutPrice] = useState<number>(0);
  const [delta, setDelta] = useState<number>(0);
  const [gamma, setGamma] = useState<number>(0);
  const [vega, setVega] = useState<number>(0);
  const [theta, setTheta] = useState<number>(0);
  const [rho, setRho] = useState<number>(0);
  const [simulationVariable, setSimulationVariable] = useState<string>("spot");
  const [simulationPoints, setSimulationPoints] = useState<SimulationPoint[]>([]);
  const [selectedGreeks, setSelectedGreeks] = useState<Greek[]>(['delta', 'gamma']);
  
  const calculateBlackScholes = (s: number, k: number, v: number, r: number, t: number): OptionGreeks & { callPrice: number; putPrice: number } => {
    const normCDF = (x: number): number => {
      const t = 1 / (1 + 0.2316419 * Math.abs(x));
      const d = 0.3989423 * Math.exp(-x * x / 2);
      const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
      return x > 0 ? 1 - p : p;
    };
    const normPDF = (x: number): number => (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * x * x);
    const d1 = (Math.log(s / k) + (r + v * v / 2) * t) / (v * Math.sqrt(t));
    const d2 = d1 - v * Math.sqrt(t);
    const callPrice = s * normCDF(d1) - k * Math.exp(-r * t) * normCDF(d2);
    const putPrice = k * Math.exp(-r * t) * normCDF(-d2) - s * normCDF(-d1);
    const delta = normCDF(d1);
    const gamma = normPDF(d1) / (s * v * Math.sqrt(t));
    const vega = s * Math.sqrt(t) * normPDF(d1) / 100;
    const theta = (-s * v * normPDF(d1)) / (2 * Math.sqrt(t)) - r * k * Math.exp(-r * t) * normCDF(d2);
    const rho = k * t * Math.exp(-r * t) * normCDF(d2) / 100;
    return { delta, gamma, vega, theta, rho, callPrice, putPrice };
  };

  const calculate = () => {
    const result = calculateBlackScholes(spot, strike, volatility, interestRate, timeToMaturity);
    setCallPrice(parseFloat(result.callPrice.toFixed(2)));
    setPutPrice(parseFloat(result.putPrice.toFixed(2)));
    setDelta(parseFloat(result.delta.toFixed(4)));
    setGamma(parseFloat(result.gamma.toFixed(4)));
    setVega(parseFloat(result.vega.toFixed(4)));
    setTheta(parseFloat(result.theta.toFixed(4)));
    setRho(parseFloat(result.rho.toFixed(4)));
  };

  const runSimulation = () => {
    const range = parameterRanges[simulationVariable as keyof typeof parameterRanges];
    const points: SimulationPoint[] = [];
    const steps = 50;
    const stepSize = (range.max - range.min) / steps;
    for (let i = 0; i <= steps; i++) {
      const x = range.min + i * stepSize;
      let s = spot, k = strike, v = volatility, r = interestRate, tt = timeToMaturity;
      if (simulationVariable === 'spot') s = x;
      else if (simulationVariable === 'volatility') v = x;
      else if (simulationVariable === 'timeToMaturity') tt = x;
      const greeks = calculateBlackScholes(s, k, v, r, tt);
      points.push({ x, delta: greeks.delta, gamma: greeks.gamma, vega: greeks.vega, theta: greeks.theta, rho: greeks.rho });
    }
    setSimulationPoints(points);
  };

  const toggleGreek = (greek: Greek) => {
    if (selectedGreeks.includes(greek)) {
      if (selectedGreeks.length > 1) setSelectedGreeks(selectedGreeks.filter(g => g !== greek));
    } else {
      setSelectedGreeks([...selectedGreeks, greek]);
    }
  };

  useEffect(() => {
    runSimulation();
    calculate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spot, strike, volatility, interestRate, timeToMaturity, simulationVariable]);

  return (
    <ToolPageLayout
      title="Black-Scholes Option Pricer"
      metaDescription="Price European options and compute Greeks analytically using the Black-Scholes-Merton framework. Interactive sensitivity analysis across spot, vol, and time."
      headline="Black-Scholes Option Pricer"
      valueProp="Price European options and compute Greeks with the analytical BSM framework."
      supportingText="Enter market parameters to compute call and put prices alongside all first-order Greeks (Delta, Gamma, Vega, Theta, Rho). Visualize Greeks sensitivity across spot price, volatility, or time to maturity with interactive charts."
      trustSignals={[
        'Analytical closed-form',
        'European exercise only',
        'Continuous dividend yield',
        'Real-time sensitivity charts',
        'All 5 first-order Greeks',
      ]}
      methodology={[
        { label: 'Model Framework', content: 'Implements the Black-Scholes-Merton (1973) closed-form solution for European options. The underlying follows a Geometric Brownian Motion (GBM) with constant drift and volatility: dS = μS dt + σS dW.' },
        { label: 'Key Assumptions', content: 'Constant volatility and interest rate over the option lifetime. No transaction costs or taxes. Continuous trading. Log-normal distribution of returns. European exercise only (no early exercise). No jumps in the underlying price process.' },
        { label: 'Greeks Computation', content: 'All Greeks are computed analytically from partial derivatives of the BSM formula. Delta = ∂C/∂S = N(d₁), Gamma = ∂²C/∂S² = φ(d₁)/(Sσ√T), Vega = ∂C/∂σ = S√T φ(d₁), Theta = ∂C/∂T, Rho = ∂C/∂r. Vega and Rho are scaled by 1/100 for readability.' },
        { label: 'Limitations', content: 'Does not support American-style options, discrete dividends, stochastic volatility, or jump-diffusion dynamics. For these, consider the Binomial model, Heston model, or Monte Carlo simulation.' },
      ]}
      relatedResources={[
        { title: 'Greeks Deep Dive', description: 'Understand Delta hedging, Gamma scalping, and Vega exposure management.', path: '/courses/fundamentals/greeks', type: 'course' },
        { title: 'Implied Volatility', description: 'Invert the BSM formula to extract market-implied volatility from option prices.', path: '/courses/advanced/implied-vol', type: 'course' },
        { title: 'Payoff Visualizer', description: 'Build multi-leg option strategies and analyze payoff diagrams at expiry.', path: '/tools/payoff-visualizer', type: 'tool' },
        { title: 'Model Calibration', description: 'Calibrate SABR and Heston models to implied volatility surfaces.', path: '/tools/model-calibration', type: 'tool' },
      ]}
      bottomCta={{
        headline: 'Master options pricing theory',
        description: 'From BSM foundations to stochastic volatility — build institutional-grade pricing intuition.',
        primaryLabel: 'Explore the BSM Course',
        primaryPath: '/courses/fundamentals/black-scholes',
        secondaryLabel: 'Try Payoff Visualizer',
        secondaryPath: '/tools/payoff-visualizer',
      }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inputs */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center text-primary text-base">
              <Calculator className="mr-2 h-5 w-5" /> Input Parameters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { id: 'spot', label: 'Spot Price (S)', value: spot, setter: setSpot, step: '1' },
                { id: 'strike', label: 'Strike Price (K)', value: strike, setter: setStrike, step: '1' },
                { id: 'interestRate', label: 'Risk-Free Rate (r)', value: interestRate, setter: setInterestRate, step: '0.01' },
                { id: 'volatility', label: 'Volatility (σ)', value: volatility, setter: setVolatility, step: '0.01' },
                { id: 'timeToMaturity', label: 'Time to Maturity (T, years)', value: timeToMaturity, setter: setTimeToMaturity, step: '0.01' },
              ].map(({ id, label, value, setter, step }) => (
                <div key={id} className="space-y-1">
                  <Label htmlFor={id} className="text-sm">{label}</Label>
                  <Input id={id} type="number" step={step} value={value} onChange={(e) => setter(parseFloat(e.target.value) || 0)} className="bg-secondary border-border" />
                </div>
              ))}
              <Button onClick={calculate} variant="finance" className="w-full mt-4">
                <Calculator className="mr-2 h-4 w-4" /> Compute
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader><CardTitle className="text-primary text-base">Option Prices</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-md bg-secondary/50 border border-border">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Call Price</p>
                  <p className="text-2xl font-bold text-foreground">{callPrice}</p>
                </div>
                <div className="p-4 rounded-md bg-secondary/50 border border-border">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Put Price</p>
                  <p className="text-2xl font-bold text-foreground">{putPrice}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader><CardTitle className="text-primary text-base">Greeks</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { label: 'Delta (Δ)', val: delta, color: greekColors.delta },
                  { label: 'Gamma (Γ)', val: gamma, color: greekColors.gamma },
                  { label: 'Vega (ν)', val: vega, color: greekColors.vega },
                  { label: 'Theta (Θ)', val: theta, color: greekColors.theta },
                  { label: 'Rho (ρ)', val: rho, color: greekColors.rho },
                ] as const).map(({ label, val, color }) => (
                  <div key={label} className="p-3 rounded-md bg-secondary/50 border border-border">
                    <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
                    <p className="text-lg font-semibold" style={{ color }}>{val}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Greeks Charts */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card className="bg-card border-border">
            <CardHeader><CardTitle className="text-primary text-base">Sensitivity Analysis</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div>
                <Label className="text-sm mb-2 block text-muted-foreground">Variable</Label>
                <select value={simulationVariable} onChange={(e) => setSimulationVariable(e.target.value)} className="w-full p-2 bg-secondary border border-border rounded text-foreground text-sm">
                  <option value="spot">Spot Price</option>
                  <option value="volatility">Volatility</option>
                  <option value="timeToMaturity">Time to Maturity</option>
                </select>
              </div>
              <div>
                <Label className="text-sm mb-2 block text-muted-foreground">Greeks to Display</Label>
                <div className="space-y-1.5">
                  {(Object.keys(greekColors) as Greek[]).map(greek => (
                    <label key={greek} className={`flex items-center p-2.5 rounded border cursor-pointer transition-all text-sm ${selectedGreeks.includes(greek) ? 'border-primary/40 bg-card' : 'border-border bg-secondary/30 hover:border-border'}`}>
                      <input type="checkbox" checked={selectedGreeks.includes(greek)} onChange={() => toggleGreek(greek)} className="mr-2.5" />
                      <span className="capitalize font-medium" style={{ color: selectedGreeks.includes(greek) ? greekColors[greek] : undefined }}>{greek}</span>
                    </label>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-primary text-base">
                Greeks Evolution — {simulationVariable === 'spot' ? 'Spot Price' : simulationVariable === 'volatility' ? 'Volatility' : 'Time to Maturity'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80 mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={simulationPoints} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="x" tick={{ fill: 'hsl(var(--muted-foreground))' }} axisLine={{ stroke: 'hsl(var(--border))' }} />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} axisLine={{ stroke: 'hsl(var(--border))' }} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
                    <Legend />
                    {selectedGreeks.map(greek => (
                      <Line key={greek} type="monotone" dataKey={greek} name={greek.charAt(0).toUpperCase() + greek.slice(1)} stroke={greekColors[greek]} strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-secondary/30 p-4 rounded-lg border border-border flex items-start">
                <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5 mr-3" />
                <div>
                  <h4 className="text-foreground font-medium text-sm mb-1">About the Greeks</h4>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    Greeks measure option price sensitivity to market parameters:
                    <br />— <span style={{ color: greekColors.delta }}>Delta</span>: directional exposure to spot
                    <br />— <span style={{ color: greekColors.gamma }}>Gamma</span>: convexity / delta acceleration
                    <br />— <span style={{ color: greekColors.vega }}>Vega</span>: volatility sensitivity
                    <br />— <span style={{ color: greekColors.theta }}>Theta</span>: time decay per day
                    <br />— <span style={{ color: greekColors.rho }}>Rho</span>: interest rate sensitivity
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ToolPageLayout>
  );
};

export default BlackScholesCalculator;
