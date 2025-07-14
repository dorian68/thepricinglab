
import { useState } from "react";
import { useTranslation } from 'react-i18next';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type BondData = {
  rate: number;
  price: number;
  duration: number;
  convexity: number;
};

const BondCalculator = () => {
  const { t } = useTranslation();
  const [faceValue, setFaceValue] = useState<number>(1000);
  const [couponRate, setCouponRate] = useState<number>(0.05);
  const [yieldToMaturity, setYieldToMaturity] = useState<number>(0.05);
  const [maturity, setMaturity] = useState<number>(10);
  const [frequency, setFrequency] = useState<number>(2);
  const [bondPrice, setBondPrice] = useState<number | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [modifiedDuration, setModifiedDuration] = useState<number | null>(null);
  const [convexity, setConvexity] = useState<number | null>(null);
  const [yieldCurve, setYieldCurve] = useState<{rate: number, price: number}[]>([]);
  
  const calculateBondPrice = (
    fv: number, 
    cr: number, 
    ytm: number, 
    mat: number, 
    freq: number
  ): number => {
    // Number of periods
    const periods = mat * freq;
    
    // Coupon payment per period
    const couponPerPeriod = (cr * fv) / freq;
    
    // Discount rate per period
    const ratePerPeriod = ytm / freq;
    
    // Calculate present value of coupon payments
    let pv = 0;
    for (let i = 1; i <= periods; i++) {
      pv += couponPerPeriod / Math.pow(1 + ratePerPeriod, i);
    }
    
    // Add present value of face value
    pv += fv / Math.pow(1 + ratePerPeriod, periods);
    
    return pv;
  };
  
  const calculateDuration = (
    fv: number, 
    cr: number, 
    ytm: number, 
    mat: number, 
    freq: number
  ): { macaulay: number, modified: number } => {
    // Number of periods
    const periods = mat * freq;
    
    // Coupon payment per period
    const couponPerPeriod = (cr * fv) / freq;
    
    // Discount rate per period
    const ratePerPeriod = ytm / freq;
    
    // Bond price
    const price = calculateBondPrice(fv, cr, ytm, mat, freq);
    
    // Calculate weighted payments
    let weightedTime = 0;
    for (let i = 1; i <= periods; i++) {
      const pv = couponPerPeriod / Math.pow(1 + ratePerPeriod, i);
      weightedTime += (i / freq) * pv;
    }
    
    // Add weighted principal
    weightedTime += (periods / freq) * (fv / Math.pow(1 + ratePerPeriod, periods));
    
    // Macaulay duration
    const macaulay = weightedTime / price;
    
    // Modified duration
    const modified = macaulay / (1 + ratePerPeriod);
    
    return { macaulay, modified };
  };
  
  const calculateConvexity = (
    fv: number, 
    cr: number, 
    ytm: number, 
    mat: number, 
    freq: number
  ): number => {
    // Number of periods
    const periods = mat * freq;
    
    // Coupon payment per period
    const couponPerPeriod = (cr * fv) / freq;
    
    // Discount rate per period
    const ratePerPeriod = ytm / freq;
    
    // Bond price
    const price = calculateBondPrice(fv, cr, ytm, mat, freq);
    
    // Calculate convexity
    let convexity = 0;
    for (let i = 1; i <= periods; i++) {
      convexity += (i * (i + 1)) * couponPerPeriod / Math.pow(1 + ratePerPeriod, i + 2);
    }
    
    // Add principal component
    convexity += (periods * (periods + 1)) * fv / Math.pow(1 + ratePerPeriod, periods + 2);
    
    // Normalize
    convexity = convexity / (price * Math.pow(1 + ratePerPeriod, 2));
    
    // Adjust for frequency
    convexity = convexity / (freq * freq);
    
    return convexity;
  };
  
  const calculate = () => {
    // Calculate bond price
    const price = calculateBondPrice(faceValue, couponRate, yieldToMaturity, maturity, frequency);
    setBondPrice(price);
    
    // Calculate duration
    const { macaulay, modified } = calculateDuration(faceValue, couponRate, yieldToMaturity, maturity, frequency);
    setDuration(macaulay);
    setModifiedDuration(modified);
    
    // Calculate convexity
    const cvx = calculateConvexity(faceValue, couponRate, yieldToMaturity, maturity, frequency);
    setConvexity(cvx);
    
    // Generate yield curve data
    const yieldData: {rate: number, price: number}[] = [];
    const baseYield = yieldToMaturity;
    
    for (let i = -10; i <= 10; i++) {
      const ytm = baseYield + (i * 0.005);
      if (ytm > 0) { // Avoid negative yields for simplicity
        const price = calculateBondPrice(faceValue, couponRate, ytm, maturity, frequency);
        yieldData.push({ rate: ytm * 100, price });
      }
    }
    
    setYieldCurve(yieldData);
  };
  
  // Function to generate price sensitivity data
  const generatePriceSensitivityData = () => {
    if (bondPrice === null || duration === null || convexity === null) return [];
    
    const data = [];
    const currentYtm = yieldToMaturity * 100; // Convert to percentage
    
    for (let i = -200; i <= 200; i += 20) {
      const yieldChange = i / 100; // Convert basis points to percentage
      
      // Linear approximation (duration only)
      const linearApprox = bondPrice * (1 - modifiedDuration! * (yieldChange / 100));
      
      // Quadratic approximation (duration + convexity)
      const quadraticApprox = bondPrice * (1 - modifiedDuration! * (yieldChange / 100) + 0.5 * convexity * Math.pow(yieldChange / 100, 2));
      
      // Actual price
      const actualPrice = calculateBondPrice(
        faceValue, 
        couponRate, 
        (currentYtm + yieldChange) / 100, 
        maturity, 
        frequency
      );
      
      data.push({
        yieldChange: i,
        linear: linearApprox,
        quadratic: quadraticApprox,
        actual: actualPrice
      });
    }
    
    return data;
  };
  
  return (
    <div className="finance-card p-6">
      <h3 className="text-xl font-medium mb-6">{t('tools.bond.title')}</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <div className="space-y-4">
            <div>
              <label className="block text-finance-lightgray text-sm mb-1">{t('tools.bond.faceValue')}</label>
              <input
                type="number"
                value={faceValue}
                onChange={(e) => setFaceValue(parseFloat(e.target.value) || 0)}
                className="w-full bg-finance-dark border border-finance-steel/30 rounded p-2 text-finance-offwhite"
              />
            </div>
            
            <div>
              <label className="block text-finance-lightgray text-sm mb-1">{t('tools.bond.couponRate')}</label>
              <input
                type="number"
                step="0.001"
                value={couponRate}
                onChange={(e) => setCouponRate(parseFloat(e.target.value) || 0)}
                className="w-full bg-finance-dark border border-finance-steel/30 rounded p-2 text-finance-offwhite"
              />
            </div>
            
            <div>
              <label className="block text-finance-lightgray text-sm mb-1">{t('tools.bond.yieldToMaturity')}</label>
              <input
                type="number"
                step="0.001"
                value={yieldToMaturity}
                onChange={(e) => setYieldToMaturity(parseFloat(e.target.value) || 0)}
                className="w-full bg-finance-dark border border-finance-steel/30 rounded p-2 text-finance-offwhite"
              />
            </div>
            
            <div>
              <label className="block text-finance-lightgray text-sm mb-1">{t('tools.bond.maturity')}</label>
              <input
                type="number"
                step="1"
                value={maturity}
                onChange={(e) => setMaturity(parseFloat(e.target.value) || 0)}
                className="w-full bg-finance-dark border border-finance-steel/30 rounded p-2 text-finance-offwhite"
              />
            </div>
            
            <div>
              <label className="block text-finance-lightgray text-sm mb-1">{t('tools.bond.frequency')}</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(parseInt(e.target.value))}
                className="w-full bg-finance-dark border border-finance-steel/30 rounded p-2 text-finance-offwhite"
              >
                <option value={1}>{t('tools.bond.annual')}</option>
                <option value={2}>{t('tools.bond.semiannual')}</option>
                <option value={4}>{t('tools.bond.quarterly')}</option>
              </select>
            </div>
            
            <button
              onClick={calculate}
              className="finance-button w-full"
            >
              {t('tools.bond.calculate')}
            </button>
          </div>
        </div>
        
        <div>
          <h4 className="text-finance-offwhite font-medium mb-4">{t('tools.bond.results')}</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="finance-card p-4">
              <p className="text-finance-lightgray text-sm mb-1">{t('tools.bond.bondPrice')}</p>
              <p className="text-2xl font-medium text-finance-offwhite">
                {bondPrice !== null ? bondPrice.toFixed(2) : "—"}
              </p>
            </div>
            
            <div className="finance-card p-4">
              <p className="text-finance-lightgray text-sm mb-1">{t('tools.bond.duration')}</p>
              <p className="text-lg font-medium text-finance-offwhite">
                {duration !== null ? duration.toFixed(2) : "—"}
              </p>
            </div>
            
            <div className="finance-card p-4">
              <p className="text-finance-lightgray text-sm mb-1">{t('tools.bond.modifiedDuration')}</p>
              <p className="text-lg font-medium text-finance-offwhite">
                {modifiedDuration !== null ? modifiedDuration.toFixed(4) : "—"}
              </p>
            </div>
            
            <div className="finance-card p-4">
              <p className="text-finance-lightgray text-sm mb-1">{t('tools.bond.convexity')}</p>
              <p className="text-lg font-medium text-finance-offwhite">
                {convexity !== null ? convexity.toFixed(4) : "—"}
              </p>
            </div>
          </div>
          
          {bondPrice !== null && (
            <div className="mt-6">
              <h5 className="text-finance-offwhite font-medium mb-3">{t('tools.bond.yieldPriceRelation')}</h5>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={yieldCurve}
                    margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis 
                      dataKey="rate" 
                      tick={{ fill: '#B4B4B4' }} 
                      axisLine={{ stroke: '#444' }}
                    />
                    <YAxis 
                      domain={['auto', 'auto']}
                      tick={{ fill: '#B4B4B4' }} 
                      axisLine={{ stroke: '#444' }}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1F2023', borderColor: '#333', color: '#E5E5E5' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="price" 
                      stroke="#ea384c" 
                      dot={false} 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-finance-charcoal/50 p-4 rounded-lg border border-finance-steel/20">
        <p className="text-finance-lightgray text-sm">
          {t('tools.bond.priceYieldChart')}
        </p>
      </div>
    </div>
  );
};

export default BondCalculator;
