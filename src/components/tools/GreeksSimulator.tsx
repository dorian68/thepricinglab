
import { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { Slider } from "@/components/ui/slider";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Info } from "lucide-react";

// Type for the parameter ranges
type ParameterRange = {
  min: number;
  max: number;
  step: number;
  initialValue: number;
};

// Ranges for the parameters
const parameterRanges: Record<string, ParameterRange> = {
  spot: { min: 80, max: 120, step: 1, initialValue: 100 },
  strike: { min: 80, max: 120, step: 1, initialValue: 100 },
  volatility: { min: 0.1, max: 0.5, step: 0.01, initialValue: 0.2 },
  riskFreeRate: { min: 0, max: 0.1, step: 0.001, initialValue: 0.05 },
  timeToMaturity: { min: 0.1, max: 2, step: 0.1, initialValue: 1 }
};

// Types for the option greeks
type Greek = 'delta' | 'gamma' | 'vega' | 'theta' | 'rho';
type OptionGreeks = Record<Greek, number>;
type SimulationPoint = { x: number; delta: number; gamma: number; vega: number; theta: number; rho: number; };

const GreeksSimulator = () => {
  const { t } = useTranslation();
  // State for option parameters
  const [spot, setSpot] = useState<number>(parameterRanges.spot.initialValue);
  const [strike, setStrike] = useState<number>(parameterRanges.strike.initialValue);
  const [volatility, setVolatility] = useState<number>(parameterRanges.volatility.initialValue);
  const [riskFreeRate, setRiskFreeRate] = useState<number>(parameterRanges.riskFreeRate.initialValue);
  const [timeToMaturity, setTimeToMaturity] = useState<number>(parameterRanges.timeToMaturity.initialValue);
  
  // State for simulation
  const [simulationVariable, setSimulationVariable] = useState<string>("spot");
  const [simulationPoints, setSimulationPoints] = useState<SimulationPoint[]>([]);
  const [selectedGreeks, setSelectedGreeks] = useState<Greek[]>(['delta', 'gamma']);
  
  // Calculate Black-Scholes Greeks
  const calculateBS = (s: number, k: number, v: number, r: number, t: number): OptionGreeks => {
    // d1 and d2 for Black-Scholes
    const d1 = (Math.log(s / k) + (r + v * v / 2) * t) / (v * Math.sqrt(t));
    const d2 = d1 - v * Math.sqrt(t);
    
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
    
    // Calculate Greeks
    const delta = normCDF(d1);
    const gamma = normPDF(d1) / (s * v * Math.sqrt(t));
    const vega = s * Math.sqrt(t) * normPDF(d1) / 100; // Divided by 100 for scaling
    const theta = (-s * v * normPDF(d1)) / (2 * Math.sqrt(t)) - r * k * Math.exp(-r * t) * normCDF(d2);
    const rho = k * t * Math.exp(-r * t) * normCDF(d2) / 100; // Divided by 100 for scaling
    
    return { delta, gamma, vega, theta, rho };
  };
  
  // Run simulation when parameters change
  useEffect(() => {
    runSimulation();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spot, strike, volatility, riskFreeRate, timeToMaturity, simulationVariable]);
  
  // Function to run the simulation
  const runSimulation = () => {
    const range = parameterRanges[simulationVariable];
    const points: SimulationPoint[] = [];
    
    // Generate points for the simulation
    const steps = 50; // Number of points in the simulation
    const stepSize = (range.max - range.min) / steps;
    
    for (let i = 0; i <= steps; i++) {
      const x = range.min + i * stepSize;
      
      // Set the proper variable for this simulation point
      let s = spot, k = strike, v = volatility, r = riskFreeRate, t = timeToMaturity;
      
      if (simulationVariable === 'spot') s = x;
      else if (simulationVariable === 'strike') k = x;
      else if (simulationVariable === 'volatility') v = x;
      else if (simulationVariable === 'riskFreeRate') r = x;
      else if (simulationVariable === 'timeToMaturity') t = x;
      
      // Calculate greeks
      const greeks = calculateBS(s, k, v, r, t);
      
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
  
  // Toggle Greek selection
  const toggleGreek = (greek: Greek) => {
    if (selectedGreeks.includes(greek)) {
      if (selectedGreeks.length > 1) { // Ensure at least one Greek is selected
        setSelectedGreeks(selectedGreeks.filter(g => g !== greek));
      }
    } else {
      setSelectedGreeks([...selectedGreeks, greek]);
    }
  };
  
  // Generate dynamic colors for the Greeks
  const greekColors: Record<Greek, string> = {
    delta: '#ea384c',
    gamma: '#4A89DC',
    vega: '#37BC9B',
    theta: '#F6BB42',
    rho: '#967ADC'
  };
  
  return (
    <div className="finance-card p-6">
      <h3 className="text-xl font-medium mb-6">Simulateur de Greeks</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <h4 className="text-finance-offwhite font-medium mb-4">Paramètres de l'option</h4>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-finance-lightgray text-sm">Prix spot: {spot}</label>
                <span className="text-finance-lightgray text-sm">{parameterRanges.spot.min} - {parameterRanges.spot.max}</span>
              </div>
              <Slider
                defaultValue={[spot]}
                min={parameterRanges.spot.min}
                max={parameterRanges.spot.max}
                step={parameterRanges.spot.step}
                onValueChange={(value) => setSpot(value[0])}
              />
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-finance-lightgray text-sm">Prix d'exercice: {strike}</label>
                <span className="text-finance-lightgray text-sm">{parameterRanges.strike.min} - {parameterRanges.strike.max}</span>
              </div>
              <Slider
                defaultValue={[strike]}
                min={parameterRanges.strike.min}
                max={parameterRanges.strike.max}
                step={parameterRanges.strike.step}
                onValueChange={(value) => setStrike(value[0])}
              />
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-finance-lightgray text-sm">Volatilité: {volatility.toFixed(2)}</label>
                <span className="text-finance-lightgray text-sm">{parameterRanges.volatility.min} - {parameterRanges.volatility.max}</span>
              </div>
              <Slider
                defaultValue={[volatility]}
                min={parameterRanges.volatility.min}
                max={parameterRanges.volatility.max}
                step={parameterRanges.volatility.step}
                onValueChange={(value) => setVolatility(value[0])}
              />
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-finance-lightgray text-sm">Taux sans risque: {(riskFreeRate * 100).toFixed(2)}%</label>
                <span className="text-finance-lightgray text-sm">{parameterRanges.riskFreeRate.min * 100}% - {parameterRanges.riskFreeRate.max * 100}%</span>
              </div>
              <Slider
                defaultValue={[riskFreeRate]}
                min={parameterRanges.riskFreeRate.min}
                max={parameterRanges.riskFreeRate.max}
                step={parameterRanges.riskFreeRate.step}
                onValueChange={(value) => setRiskFreeRate(value[0])}
              />
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-finance-lightgray text-sm">Temps jusqu'à maturité: {timeToMaturity.toFixed(1)} année(s)</label>
                <span className="text-finance-lightgray text-sm">{parameterRanges.timeToMaturity.min} - {parameterRanges.timeToMaturity.max}</span>
              </div>
              <Slider
                defaultValue={[timeToMaturity]}
                min={parameterRanges.timeToMaturity.min}
                max={parameterRanges.timeToMaturity.max}
                step={parameterRanges.timeToMaturity.step}
                onValueChange={(value) => setTimeToMaturity(value[0])}
              />
            </div>
          </div>
        </div>
        
        <div>
          <h4 className="text-finance-offwhite font-medium mb-4">Paramètres de simulation</h4>
          
          <div className="mb-4">
            <label className="block text-finance-lightgray text-sm mb-1">Variable à simuler</label>
            <select 
              className="w-full bg-finance-dark border border-finance-steel/30 rounded p-2 text-finance-offwhite"
              value={simulationVariable}
              onChange={(e) => setSimulationVariable(e.target.value)}
            >
              <option value="spot">Prix spot</option>
              <option value="strike">Prix d'exercice</option>
              <option value="volatility">Volatilité</option>
              <option value="riskFreeRate">Taux sans risque</option>
              <option value="timeToMaturity">Temps jusqu'à maturité</option>
            </select>
          </div>
          
          <div>
            <label className="block text-finance-lightgray text-sm mb-1">Greeks à afficher</label>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
              {(Object.keys(greekColors) as Greek[]).map(greek => (
                <label 
                  key={greek} 
                  className={`flex items-center p-2 rounded border cursor-pointer ${
                    selectedGreeks.includes(greek) 
                      ? `border-${greek === 'delta' ? 'finance-accent' : greekColors[greek]} bg-finance-charcoal/50` 
                      : 'border-finance-steel/30 bg-finance-dark'
                  }`}
                >
                  <input 
                    type="checkbox" 
                    checked={selectedGreeks.includes(greek)} 
                    onChange={() => toggleGreek(greek)} 
                    className="mr-2"
                  />
                  <span 
                    className="text-sm capitalize"
                    style={{ color: selectedGreeks.includes(greek) ? greekColors[greek] : '#B4B4B4' }}
                  >
                    {greek}
                  </span>
                </label>
              ))}
            </div>
          </div>
          
          <div className="mt-6">
            <h4 className="text-finance-offwhite font-medium mb-2">Valeurs actuelles</h4>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(greekColors) as Greek[]).map(greek => {
                // Calculate current Greek value
                const currentGreeks = calculateBS(spot, strike, volatility, riskFreeRate, timeToMaturity);
                return (
                  <div 
                    key={greek} 
                    className={`p-3 rounded bg-finance-charcoal/50 border ${
                      selectedGreeks.includes(greek) ? `border-${greekColors[greek]}` : 'border-finance-steel/20'
                    }`}
                  >
                    <p className="text-sm capitalize mb-1" style={{ color: greekColors[greek] }}>{greek}</p>
                    <p className="text-lg font-medium text-finance-offwhite">
                      {greek === 'delta' || greek === 'gamma' ? currentGreeks[greek].toFixed(4) : currentGreeks[greek].toFixed(2)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      
      {/* Chart for Greeks simulation */}
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
                value: simulationVariable, 
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
      
      <div className="bg-finance-charcoal/50 p-4 rounded-lg border border-finance-steel/20 flex items-start">
        <Info className="h-5 w-5 text-finance-accent flex-shrink-0 mt-0.5 mr-3" />
        <div>
          <h4 className="text-finance-offwhite font-medium mb-1">À propos des Greeks</h4>
          <p className="text-finance-lightgray text-sm">
            Les Greeks mesurent la sensibilité du prix d'une option aux changements des paramètres du marché:
            <br />- <span style={{ color: greekColors.delta }}>Delta</span>: Sensibilité au prix du sous-jacent
            <br />- <span style={{ color: greekColors.gamma }}>Gamma</span>: Taux de changement du delta
            <br />- <span style={{ color: greekColors.vega }}>Vega</span>: Sensibilité à la volatilité
            <br />- <span style={{ color: greekColors.theta }}>Theta</span>: Sensibilité au passage du temps
            <br />- <span style={{ color: greekColors.rho }}>Rho</span>: Sensibilité au taux d'intérêt
          </p>
        </div>
      </div>
    </div>
  );
};

export default GreeksSimulator;
