
import { useState } from "react";
import { useTranslation } from 'react-i18next';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Info } from "lucide-react";

// Types for yield curve data
type YieldCurveData = {
  maturity: string;
  spotRate: number;
  forwardRate: number;
};

// Sample data for yield curves
const sampleYieldCurveData: YieldCurveData[] = [
  { maturity: "3M", spotRate: 0.45, forwardRate: 0.50 },
  { maturity: "6M", spotRate: 0.80, forwardRate: 1.15 },
  { maturity: "1Y", spotRate: 1.20, forwardRate: 1.60 },
  { maturity: "2Y", spotRate: 1.80, forwardRate: 2.40 },
  { maturity: "3Y", spotRate: 2.10, forwardRate: 2.70 },
  { maturity: "5Y", spotRate: 2.50, forwardRate: 3.30 },
  { maturity: "7Y", spotRate: 2.75, forwardRate: 3.25 },
  { maturity: "10Y", spotRate: 2.95, forwardRate: 3.35 },
  { maturity: "20Y", spotRate: 3.10, forwardRate: 3.30 },
  { maturity: "30Y", spotRate: 3.15, forwardRate: 3.25 },
];

const currencies = ["EUR", "USD", "GBP", "JPY", "CHF"];
const dates = [
  "2025-04-15", // Current date
  "2025-04-01",
  "2025-03-15",
  "2025-03-01",
  "2025-02-15"
];

const YieldCurveVisualizer = () => {
  const { t } = useTranslation();
  const [currency, setCurrency] = useState<string>("EUR");
  const [date, setDate] = useState<string>("2025-04-15");
  const [showSpot, setShowSpot] = useState<boolean>(true);
  const [showForward, setShowForward] = useState<boolean>(true);
  const [yieldCurveData, setYieldCurveData] = useState<YieldCurveData[]>(sampleYieldCurveData);
  
  // Function to handle changes in selected currency or date
  const handleDataChange = () => {
    // In a real application, this would fetch data from an API based on the currency and date
    // For now, we'll just add some random variation to our sample data
    const variation = (Math.random() * 0.5) - 0.25; // Random value between -0.25 and 0.25
    
    const newData = sampleYieldCurveData.map(point => ({
      ...point,
      spotRate: Number((point.spotRate + variation).toFixed(2)),
      forwardRate: Number((point.forwardRate + variation * 1.5).toFixed(2))
    }));
    
    setYieldCurveData(newData);
  };

  return (
    <div className="finance-card p-6">
      <h3 className="text-xl font-medium mb-6">Visualiseur de courbe de taux</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-finance-lightgray text-sm mb-1">Devise</label>
          <select 
            className="w-full bg-finance-dark border border-finance-steel/30 rounded p-2 text-finance-offwhite"
            value={currency}
            onChange={(e) => {
              setCurrency(e.target.value);
              handleDataChange();
            }}
          >
            {currencies.map(curr => (
              <option key={curr} value={curr}>{curr}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-finance-lightgray text-sm mb-1">Date</label>
          <select
            className="w-full bg-finance-dark border border-finance-steel/30 rounded p-2 text-finance-offwhite"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              handleDataChange();
            }}
          >
            {dates.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-finance-lightgray text-sm mb-1">Affichage</label>
          <div className="flex space-x-4 mt-2">
            <label className="inline-flex items-center">
              <input 
                type="checkbox" 
                checked={showSpot} 
                onChange={() => setShowSpot(!showSpot)} 
                className="mr-2"
              />
              <span className="text-finance-lightgray text-sm">Taux spot</span>
            </label>
            <label className="inline-flex items-center">
              <input 
                type="checkbox" 
                checked={showForward} 
                onChange={() => setShowForward(!showForward)} 
                className="mr-2"
              />
              <span className="text-finance-lightgray text-sm">Taux forward</span>
            </label>
          </div>
        </div>
      </div>
      
      <div className="h-80 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={yieldCurveData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis 
              dataKey="maturity" 
              tick={{ fill: '#B4B4B4' }} 
              axisLine={{ stroke: '#444' }}
            />
            <YAxis 
              tickFormatter={(value) => `${value}%`} 
              tick={{ fill: '#B4B4B4' }} 
              axisLine={{ stroke: '#444' }}
              domain={[0, 'auto']}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1F2023', borderColor: '#333', color: '#E5E5E5' }}
              formatter={(value) => [`${value}%`, '']}
            />
            <Legend />
            {showSpot && (
              <Line 
                type="monotone" 
                dataKey="spotRate" 
                name="Taux spot" 
                stroke="#ea384c" 
                strokeWidth={2}
                dot={{ r: 4, fill: '#ea384c' }}
                activeDot={{ r: 6 }}
              />
            )}
            {showForward && (
              <Line 
                type="monotone" 
                dataKey="forwardRate" 
                name="Taux forward" 
                stroke="#4A89DC" 
                strokeWidth={2}
                dot={{ r: 4, fill: '#4A89DC' }}
                activeDot={{ r: 6 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="bg-finance-charcoal/50 p-4 rounded-lg border border-finance-steel/20 flex items-start">
        <Info className="h-5 w-5 text-finance-accent flex-shrink-0 mt-0.5 mr-3" />
        <div>
          <h4 className="text-finance-offwhite font-medium mb-1">À propos des courbes de taux</h4>
          <p className="text-finance-lightgray text-sm">
            Les courbes de taux affichent les rendements des obligations zéro-coupon pour différentes maturités. 
            Les taux spot représentent les rendements actuels tandis que les taux forward anticipent les taux spot futurs.
            Ces courbes sont essentielles pour le pricing des produits de taux et l'analyse macroéconomique.
          </p>
        </div>
      </div>
    </div>
  );
};

export default YieldCurveVisualizer;
