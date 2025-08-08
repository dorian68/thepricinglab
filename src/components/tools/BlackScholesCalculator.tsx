
import { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calculator, Info } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { safeTranslate } from "@/utils/translationUtils";

// Types for Greeks and simulation
type Greek = 'delta' | 'gamma' | 'vega' | 'theta' | 'rho';
type OptionGreeks = Record<Greek, number>;
type SimulationPoint = { x: number; delta: number; gamma: number; vega: number; theta: number; rho: number; };

// Parameter ranges for Greeks charts
const parameterRanges = {
  spot: { min: 80, max: 120, step: 1 },
  volatility: { min: 0.1, max: 0.5, step: 0.01 },
  timeToMaturity: { min: 0.1, max: 2, step: 0.1 }
};

// Colors for each Greek - restored from previous version
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
  
  // Greeks chart state - restored functionality from previous version
  const [simulationVariable, setSimulationVariable] = useState<string>("spot");
  const [simulationPoints, setSimulationPoints] = useState<SimulationPoint[]>([]);
  const [selectedGreeks, setSelectedGreeks] = useState<Greek[]>(['delta', 'gamma']);
  
  // Enhanced Black-Scholes calculation - restored from previous version  
  const calculateBlackScholes = (s: number, k: number, v: number, r: number, t: number): OptionGreeks & { callPrice: number; putPrice: number } => {
    // Standard normal CDF and PDF
    const normCDF = (x: number): number => {
      const t = 1 / (1 + 0.2316419 * Math.abs(x));
      const d = 0.3989423 * Math.exp(-x * x / 2);
      const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
      return x > 0 ? 1 - p : p;
    };
    
    const normPDF = (x: number): number => {
      return (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * x * x);
    };

    // d1 and d2 for Black-Scholes
    const d1 = (Math.log(s / k) + (r + v * v / 2) * t) / (v * Math.sqrt(t));
    const d2 = d1 - v * Math.sqrt(t);
    
    // Option prices
    const callPrice = s * normCDF(d1) - k * Math.exp(-r * t) * normCDF(d2);
    const putPrice = k * Math.exp(-r * t) * normCDF(-d2) - s * normCDF(-d1);
    
    // Calculate Greeks
    const delta = normCDF(d1);
    const gamma = normPDF(d1) / (s * v * Math.sqrt(t));
    const vega = s * Math.sqrt(t) * normPDF(d1) / 100; // Divided by 100 for scaling
    const theta = (-s * v * normPDF(d1)) / (2 * Math.sqrt(t)) - r * k * Math.exp(-r * t) * normCDF(d2);
    const rho = k * t * Math.exp(-r * t) * normCDF(d2) / 100; // Divided by 100 for scaling
    
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

  // Greeks simulation - restored functionality from previous version
  const runSimulation = () => {
    const range = parameterRanges[simulationVariable as keyof typeof parameterRanges];
    const points: SimulationPoint[] = [];
    
    // Generate points for the simulation
    const steps = 50;
    const stepSize = (range.max - range.min) / steps;
    
    for (let i = 0; i <= steps; i++) {
      const x = range.min + i * stepSize;
      
      // Set the proper variable for this simulation point
      let s = spot, k = strike, v = volatility, r = interestRate, t = timeToMaturity;
      
      if (simulationVariable === 'spot') s = x;
      else if (simulationVariable === 'volatility') v = x;
      else if (simulationVariable === 'timeToMaturity') t = x;
      
      // Calculate greeks
      const greeks = calculateBlackScholes(s, k, v, r, t);
      
      // Add to simulation points
      points.push({
        x,
        delta: greeks.delta,
        gamma: greeks.gamma,
        vega: greeks.vega,
        theta: greeks.theta,
        rho: greeks.rho
      });
    }
    
    setSimulationPoints(points);
  };

  // Toggle Greek selection for chart display
  const toggleGreek = (greek: Greek) => {
    if (selectedGreeks.includes(greek)) {
      if (selectedGreeks.length > 1) {
        setSelectedGreeks(selectedGreeks.filter(g => g !== greek));
      }
    } else {
      setSelectedGreeks([...selectedGreeks, greek]);
    }
  };

  // Run simulation when parameters change - restored functionality
  useEffect(() => {
    runSimulation();
    calculate(); // Also update current values
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spot, strike, volatility, interestRate, timeToMaturity, simulationVariable]);

  return (
    <div className="container mx-auto py-6 px-4 md:px-6 lg:px-8 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-finance-accent mb-2">{st('tools.blackScholes.title', 'Calculateur Black-Scholes')}</h1>
        <p className="text-finance-lightgray">{st('tools.blackScholes.description', 'Pricing d\'options européennes et calcul des Greeks')}</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-finance-charcoal border-finance-steel/30">
          <CardHeader>
            <CardTitle className="flex items-center text-finance-accent">
              <Calculator className="mr-2 h-5 w-5" />
              {st('tools.blackScholes.inputParameters', 'Paramètres d\'entrée')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="spot">{st('tools.blackScholes.spotPrice', 'Prix spot')}</Label>
                <Input
                  id="spot"
                  type="number"
                  value={spot}
                  onChange={(e) => setSpot(parseFloat(e.target.value))}
                  className="bg-finance-dark border-finance-steel/30 text-finance-offwhite"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="strike">{st('tools.blackScholes.strikePrice', 'Prix d\'exercice')}</Label>
                <Input
                  id="strike"
                  type="number"
                  value={strike}
                  onChange={(e) => setStrike(parseFloat(e.target.value))}
                  className="bg-finance-dark border-finance-steel/30 text-finance-offwhite"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="interestRate">{st('tools.blackScholes.interestRate', 'Taux d\'intérêt (décimal)')}</Label>
                <Input
                  id="interestRate"
                  type="number"
                  step="0.01"
                  value={interestRate}
                  onChange={(e) => setInterestRate(parseFloat(e.target.value))}
                  className="bg-finance-dark border-finance-steel/30 text-finance-offwhite"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="volatility">{st('tools.blackScholes.volatility', 'Volatilité (décimal)')}</Label>
                <Input
                  id="volatility"
                  type="number"
                  step="0.01"
                  value={volatility}
                  onChange={(e) => setVolatility(parseFloat(e.target.value) || 0)}
                  className="bg-finance-dark border-finance-steel/30 text-finance-offwhite"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="timeToMaturity">{st('tools.blackScholes.timeToMaturity', 'Temps jusqu\'à maturité (années)')}</Label>
                <Input
                  id="timeToMaturity"
                  type="number"
                  step="0.01"
                  value={timeToMaturity}
                  onChange={(e) => setTimeToMaturity(parseFloat(e.target.value) || 0)}
                  className="bg-finance-dark border-finance-steel/30 text-finance-offwhite"
                />
              </div>
              
              <Button
                onClick={calculate}
                variant="finance"
                className="w-full mt-4"
              >
                <Calculator className="mr-2 h-4 w-4" />
                {st('tools.blackScholes.calculate', 'Calculer')}
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <div className="space-y-6">
          <Card className="bg-finance-charcoal border-finance-steel/30">
            <CardHeader>
              <CardTitle className="text-finance-accent">{st('tools.blackScholes.results', 'Résultats')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-finance-dark p-4 rounded-md">
                  <p className="text-finance-lightgray text-sm mb-1">{st('tools.blackScholes.callPrice', 'Prix Call')}</p>
                  <p className="text-2xl font-medium text-finance-offwhite">{callPrice}</p>
                </div>
                
                <div className="bg-finance-dark p-4 rounded-md">
                  <p className="text-finance-lightgray text-sm mb-1">{st('tools.blackScholes.putPrice', 'Prix Put')}</p>
                  <p className="text-2xl font-medium text-finance-offwhite">{putPrice}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-finance-charcoal border-finance-steel/30">
            <CardHeader>
              <CardTitle className="text-finance-accent">{st('tools.blackScholes.greeks', 'Greeks')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-finance-dark p-4 rounded-md">
                  <p className="text-finance-lightgray text-sm mb-1">{st('tools.blackScholes.delta', 'Delta')}</p>
                  <p className="text-xl font-medium text-finance-offwhite">{delta}</p>
                </div>
                
                <div className="bg-finance-dark p-4 rounded-md">
                  <p className="text-finance-lightgray text-sm mb-1">{st('tools.blackScholes.gamma', 'Gamma')}</p>
                  <p className="text-xl font-medium text-finance-offwhite">{gamma}</p>
                </div>
                
                <div className="bg-finance-dark p-4 rounded-md">
                  <p className="text-finance-lightgray text-sm mb-1">{st('tools.blackScholes.vega', 'Vega')}</p>
                  <p className="text-xl font-medium text-finance-offwhite">{vega}</p>
                </div>
                
                <div className="bg-finance-dark p-4 rounded-md">
                  <p className="text-finance-lightgray text-sm mb-1">{st('tools.blackScholes.theta', 'Theta')}</p>
                  <p className="text-xl font-medium text-finance-offwhite">{theta}</p>
                </div>

                <div className="bg-finance-dark p-4 rounded-md">
                  <p className="text-finance-lightgray text-sm mb-1">{st('tools.blackScholes.rho', 'Rho')}</p>
                  <p className="text-xl font-medium text-finance-offwhite">{rho}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Greeks Evolution Charts - restored functionality from previous version */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Controls */}
        <div className="lg:col-span-1">
          <Card className="bg-finance-charcoal border-finance-steel/30">
            <CardHeader>
              <CardTitle className="text-finance-accent">{st('tools.blackScholes.chartParameters', 'Paramètres du Graphique')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-finance-lightgray text-sm mb-2 block">{st('tools.blackScholes.simulationVariable', 'Variable de simulation')}</Label>
                <select 
                  value={simulationVariable}
                  onChange={(e) => setSimulationVariable(e.target.value)}
                  className="w-full p-2 bg-finance-dark border border-finance-steel/30 rounded text-finance-offwhite"
                >
                  <option value="spot">{st('tools.blackScholes.spot', 'Prix Spot')}</option>
                  <option value="volatility">{st('tools.blackScholes.volatility', 'Volatilité')}</option>
                  <option value="timeToMaturity">{st('tools.blackScholes.timeToMaturity', 'Temps jusqu\'à maturité')}</option>
                </select>
              </div>
              
              <div>
                <Label className="text-finance-lightgray text-sm mb-2 block">{st('tools.blackScholes.greeksToDisplay', 'Greeks à afficher')}</Label>
                <div className="grid grid-cols-1 gap-2">
                  {(Object.keys(greekColors) as Greek[]).map(greek => (
                    <label 
                      key={greek} 
                      className={`flex items-center p-3 rounded border cursor-pointer transition-all ${
                        selectedGreeks.includes(greek) 
                          ? 'border-finance-accent bg-finance-charcoal/50' 
                          : 'border-finance-steel/30 bg-finance-dark hover:border-finance-steel/50'
                      }`}
                    >
                      <input 
                        type="checkbox" 
                        checked={selectedGreeks.includes(greek)} 
                        onChange={() => toggleGreek(greek)} 
                        className="mr-3"
                      />
                      <span 
                        className="text-sm capitalize font-medium"
                        style={{ color: selectedGreeks.includes(greek) ? greekColors[greek] : '#B4B4B4' }}
                      >
                        {greek}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chart Display */}
        <div className="lg:col-span-2">
          <Card className="bg-finance-charcoal border-finance-steel/30">
            <CardHeader>
              <CardTitle className="text-finance-accent">
                {st('tools.blackScholes.greeksEvolution', 'Évolution des Greeks')} - {simulationVariable === 'spot' ? st('tools.blackScholes.spot', 'Prix Spot') : simulationVariable === 'volatility' ? st('tools.blackScholes.volatility', 'Volatilité') : st('tools.blackScholes.timeToMaturity', 'Temps jusqu\'à maturité')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80 mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={simulationPoints}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis 
                      dataKey="x" 
                      tick={{ fill: '#B4B4B4' }} 
                      axisLine={{ stroke: '#444' }}
                      label={{ 
                        value: simulationVariable === 'spot' ? st('tools.blackScholes.spot', 'Prix Spot') : simulationVariable === 'volatility' ? st('tools.blackScholes.volatility', 'Volatilité') : st('tools.blackScholes.timeToMaturity', 'Temps (années)'), 
                        position: 'insideBottomRight', 
                        offset: -10, 
                        fill: '#B4B4B4' 
                      }}
                    />
                    <YAxis 
                      tick={{ fill: '#B4B4B4' }} 
                      axisLine={{ stroke: '#444' }}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1F2023', borderColor: '#333', color: '#E5E5E5' }}
                    />
                    <Legend />
                    
                    {/* Render lines for selected Greeks */}
                    {selectedGreeks.map(greek => (
                      <Line 
                        key={greek}
                        type="monotone" 
                        dataKey={greek} 
                        name={greek.charAt(0).toUpperCase() + greek.slice(1)} 
                        stroke={greekColors[greek]} 
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 6 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Greeks Information Panel - restored from previous version */}
              <div className="bg-finance-charcoal/50 p-4 rounded-lg border border-finance-steel/20 flex items-start">
                <Info className="h-5 w-5 text-finance-accent flex-shrink-0 mt-0.5 mr-3" />
                <div>
                  <h4 className="text-finance-offwhite font-medium mb-1">{st('tools.blackScholes.aboutGreeks', 'À propos des Greeks')}</h4>
                  <p className="text-finance-lightgray text-sm">
                    {st('tools.blackScholes.greeksDescription', 'Les Greeks mesurent la sensibilité du prix d\'une option aux changements des paramètres du marché:')}
                    <br />- <span style={{ color: greekColors.delta }}>{st('tools.blackScholes.delta', 'Delta')}</span>: {st('tools.blackScholes.deltaDescription', 'Sensibilité au prix du sous-jacent')}
                    <br />- <span style={{ color: greekColors.gamma }}>{st('tools.blackScholes.gamma', 'Gamma')}</span>: {st('tools.blackScholes.gammaDescription', 'Taux de changement du delta')}
                    <br />- <span style={{ color: greekColors.vega }}>{st('tools.blackScholes.vega', 'Vega')}</span>: {st('tools.blackScholes.vegaDescription', 'Sensibilité à la volatilité')}
                    <br />- <span style={{ color: greekColors.theta }}>{st('tools.blackScholes.theta', 'Theta')}</span>: {st('tools.blackScholes.thetaDescription', 'Sensibilité à la décroissance temporelle')}  
                    <br />- <span style={{ color: greekColors.rho }}>{st('tools.blackScholes.rho', 'Rho')}</span>: {st('tools.blackScholes.rhoDescription', 'Sensibilité au taux d\'intérêt')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BlackScholesCalculator;
