
import { useState } from "react";
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calculator } from "lucide-react";

const BlackScholesCalculator = () => {
  const { t } = useTranslation();
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
    <div className="container mx-auto py-6 px-4 md:px-6 lg:px-8 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-finance-accent mb-2">Calculatrice Black-Scholes</h1>
        <p className="text-finance-lightgray">Pricing d'options européennes et calcul des Greeks</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-finance-charcoal border-finance-steel/30">
          <CardHeader>
            <CardTitle className="flex items-center text-finance-accent">
              <Calculator className="mr-2 h-5 w-5" />
              Paramètres d'entrée
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="spot">Prix spot</Label>
                <Input
                  id="spot"
                  type="number"
                  value={spot}
                  onChange={(e) => setSpot(parseFloat(e.target.value))}
                  className="bg-finance-dark border-finance-steel/30 text-finance-offwhite"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="strike">Prix d'exercice</Label>
                <Input
                  id="strike"
                  type="number"
                  value={strike}
                  onChange={(e) => setStrike(parseFloat(e.target.value))}
                  className="bg-finance-dark border-finance-steel/30 text-finance-offwhite"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="interestRate">Taux d'intérêt (décimal)</Label>
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
                <Label htmlFor="volatility">Volatilité (décimal)</Label>
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
                <Label htmlFor="timeToMaturity">Temps jusqu'à maturité (années)</Label>
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
                Calculer
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <div className="space-y-6">
          <Card className="bg-finance-charcoal border-finance-steel/30">
            <CardHeader>
              <CardTitle className="text-finance-accent">Résultats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-finance-dark p-4 rounded-md">
                  <p className="text-finance-lightgray text-sm mb-1">Prix Call</p>
                  <p className="text-2xl font-medium text-finance-offwhite">{callPrice}</p>
                </div>
                
                <div className="bg-finance-dark p-4 rounded-md">
                  <p className="text-finance-lightgray text-sm mb-1">Prix Put</p>
                  <p className="text-2xl font-medium text-finance-offwhite">{putPrice}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-finance-charcoal border-finance-steel/30">
            <CardHeader>
              <CardTitle className="text-finance-accent">Greeks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-finance-dark p-4 rounded-md">
                  <p className="text-finance-lightgray text-sm mb-1">Delta</p>
                  <p className="text-xl font-medium text-finance-offwhite">{delta}</p>
                </div>
                
                <div className="bg-finance-dark p-4 rounded-md">
                  <p className="text-finance-lightgray text-sm mb-1">Gamma</p>
                  <p className="text-xl font-medium text-finance-offwhite">{gamma}</p>
                </div>
                
                <div className="bg-finance-dark p-4 rounded-md">
                  <p className="text-finance-lightgray text-sm mb-1">Vega</p>
                  <p className="text-xl font-medium text-finance-offwhite">{vega}</p>
                </div>
                
                <div className="bg-finance-dark p-4 rounded-md">
                  <p className="text-finance-lightgray text-sm mb-1">Theta</p>
                  <p className="text-xl font-medium text-finance-offwhite">{theta}</p>
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
