
import { useState } from "react";

const BlackScholesCalculator = () => {
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
  
  const calculate = () => {
    // This is just a placeholder for the actual Black-Scholes calculation
    // In a real implementation, this would calculate the option prices and Greeks
    
    // Simple Black-Scholes formula approximation for demonstration
    const d1 = (Math.log(spot / strike) + (interestRate + volatility * volatility / 2) * timeToMaturity) / (volatility * Math.sqrt(timeToMaturity));
    const d2 = d1 - volatility * Math.sqrt(timeToMaturity);
    
    // Standard normal CDF approximation
    const normCDF = (x: number) => {
      const t = 1 / (1 + 0.2316419 * Math.abs(x));
      const d = 0.3989423 * Math.exp(-x * x / 2);
      const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
      return x > 0 ? 1 - p : p;
    };
    
    // Call price
    const calculatedCallPrice = spot * normCDF(d1) - strike * Math.exp(-interestRate * timeToMaturity) * normCDF(d2);
    setCallPrice(parseFloat(calculatedCallPrice.toFixed(2)));
    
    // Put price
    const calculatedPutPrice = strike * Math.exp(-interestRate * timeToMaturity) * normCDF(-d2) - spot * normCDF(-d1);
    setPutPrice(parseFloat(calculatedPutPrice.toFixed(2)));
    
    // Greeks
    setDelta(parseFloat(normCDF(d1).toFixed(4)));
    setGamma(parseFloat((Math.exp(-d1 * d1 / 2) / (spot * volatility * Math.sqrt(timeToMaturity) * Math.sqrt(2 * Math.PI))).toFixed(4)));
    setVega(parseFloat((spot * Math.sqrt(timeToMaturity) * Math.exp(-d1 * d1 / 2) / Math.sqrt(2 * Math.PI) / 100).toFixed(4)));
    const thetaValue = (-(spot * volatility * Math.exp(-d1 * d1 / 2)) / (2 * Math.sqrt(timeToMaturity) * Math.sqrt(2 * Math.PI)) - interestRate * strike * Math.exp(-interestRate * timeToMaturity) * normCDF(d2)) / 365;
    setTheta(parseFloat(thetaValue.toFixed(4)));
  };

  return (
    <div className="finance-card p-6">
      <h3 className="text-xl font-medium mb-6">Calculatrice Black-Scholes</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <div className="space-y-4">
            <div>
              <label className="block text-finance-lightgray text-sm mb-1">Prix spot</label>
              <input
                type="number"
                value={spot}
                onChange={(e) => setSpot(parseFloat(e.target.value))}
                className="w-full bg-finance-dark border border-finance-steel/30 rounded p-2 text-finance-offwhite"
              />
            </div>
            
            <div>
              <label className="block text-finance-lightgray text-sm mb-1">Prix d'exercice</label>
              <input
                type="number"
                value={strike}
                onChange={(e) => setStrike(parseFloat(e.target.value))}
                className="w-full bg-finance-dark border border-finance-steel/30 rounded p-2 text-finance-offwhite"
              />
            </div>
            
            <div>
              <label className="block text-finance-lightgray text-sm mb-1">Taux d'intérêt (décimal)</label>
              <input
                type="number"
                step="0.01"
                value={interestRate}
                onChange={(e) => setInterestRate(parseFloat(e.target.value))}
                className="w-full bg-finance-dark border border-finance-steel/30 rounded p-2 text-finance-offwhite"
              />
            </div>
            
            <div>
              <label className="block text-finance-lightgray text-sm mb-1">Volatilité (décimal)</label>
              <input
                type="number"
                step="0.01"
                value={volatility}
                onChange={(e) => setVolatility(parseFloat(e.target.value) || 0)}
                className="w-full bg-finance-dark border border-finance-steel/30 rounded p-2 text-finance-offwhite"
              />
            </div>
            
            <div>
              <label className="block text-finance-lightgray text-sm mb-1">Temps jusqu'à maturité (années)</label>
              <input
                type="number"
                step="0.01"
                value={timeToMaturity}
                onChange={(e) => setTimeToMaturity(parseFloat(e.target.value) || 0)}
                className="w-full bg-finance-dark border border-finance-steel/30 rounded p-2 text-finance-offwhite"
              />
            </div>
            
            <button
              onClick={calculate}
              className="finance-button w-full"
            >
              Calculer
            </button>
          </div>
        </div>
        
        <div>
          <h4 className="text-finance-offwhite font-medium mb-4">Résultats</h4>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="finance-card p-4">
              <p className="text-finance-lightgray text-sm mb-1">Prix Call</p>
              <p className="text-2xl font-medium text-finance-offwhite">{callPrice}</p>
            </div>
            
            <div className="finance-card p-4">
              <p className="text-finance-lightgray text-sm mb-1">Prix Put</p>
              <p className="text-2xl font-medium text-finance-offwhite">{putPrice}</p>
            </div>
          </div>
          
          <h4 className="text-finance-offwhite font-medium mb-4">Greeks</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="finance-card p-3">
              <p className="text-finance-lightgray text-sm mb-1">Delta</p>
              <p className="text-lg font-medium text-finance-offwhite">{delta}</p>
            </div>
            
            <div className="finance-card p-3">
              <p className="text-finance-lightgray text-sm mb-1">Gamma</p>
              <p className="text-lg font-medium text-finance-offwhite">{gamma}</p>
            </div>
            
            <div className="finance-card p-3">
              <p className="text-finance-lightgray text-sm mb-1">Vega</p>
              <p className="text-lg font-medium text-finance-offwhite">{vega}</p>
            </div>
            
            <div className="finance-card p-3">
              <p className="text-finance-lightgray text-sm mb-1">Theta</p>
              <p className="text-lg font-medium text-finance-offwhite">{theta}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlackScholesCalculator;
