
import { useState, useEffect, useMemo } from 'react';
import { StrategyParameters, OptionLeg, OptionType, PositionType, StrategyResult } from '@/types/strategies';
import { blackScholes } from '@/utils/options/blackScholes';

export const usePayoffCalculator = (parameters: StrategyParameters) => {
  const [result, setResult] = useState<StrategyResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Calculate payoff for a given spot price
  const calculatePayoffAtSpot = (spotPrice: number, leg: OptionLeg): number => {
    const { strike, type, position, quantity } = leg;
    
    // For options at expiry
    let payoff = 0;
    
    if (type === 'call') {
      payoff = Math.max(0, spotPrice - strike);
    } else {
      payoff = Math.max(0, strike - spotPrice);
    }
    
    // Adjust for position type and quantity
    if (position === 'short') {
      payoff = -payoff;
    }
    
    return payoff * quantity;
  };
  
  // Calculate option price and Greeks using Black-Scholes
  const calculateLegResult = (spotPrice: number, leg: OptionLeg) => {
    const { type, position, strike, quantity } = leg;
    
    const result = blackScholes(
      spotPrice,
      strike,
      parameters.timeToMaturity,
      parameters.interestRate,
      parameters.dividendYield,
      parameters.volatility,
      type,
      position
    );
    
    // Adjust for quantity
    const price = result.price * quantity;
    const greeks = {
      delta: result.greeks.delta * quantity,
      gamma: result.greeks.gamma * quantity,
      vega: result.greeks.vega * quantity,
      theta: result.greeks.theta * quantity,
      rho: result.greeks.rho * quantity
    };
    
    return { price, greeks };
  };
  
  // Generate payoff curve points
  const generatePayoffCurve = useMemo(() => {
    // Skip if no legs
    if (parameters.legs.length === 0) return [];
    
    // Generate range of spot prices from 0.5x to 1.5x the current spot price
    const minSpot = parameters.spotPrice * 0.5;
    const maxSpot = parameters.spotPrice * 1.5;
    const step = (maxSpot - minSpot) / 100;
    
    const points: {x: number, y: number}[] = [];
    
    for (let spot = minSpot; spot <= maxSpot; spot += step) {
      let totalPayoff = 0;
      
      // Calculate payoff for each leg and sum them
      parameters.legs.forEach(leg => {
        totalPayoff += calculatePayoffAtSpot(spot, leg);
      });
      
      points.push({ x: spot, y: totalPayoff });
    }
    
    return points;
  }, [parameters]);
  
  // Calculate break-even points
  const calculateBreakEvenPoints = (payoffPoints: {x: number, y: number}[]): number[] => {
    const breakEvenPoints: number[] = [];
    
    // Find where the payoff curve crosses the x-axis (y=0)
    for (let i = 1; i < payoffPoints.length; i++) {
      const prev = payoffPoints[i - 1];
      const curr = payoffPoints[i];
      
      // Check if the line segment crosses the x-axis
      if ((prev.y <= 0 && curr.y >= 0) || (prev.y >= 0 && curr.y <= 0)) {
        // Linear interpolation to find the exact break-even point
        const ratio = Math.abs(prev.y) / (Math.abs(prev.y) + Math.abs(curr.y));
        const breakEvenX = prev.x + ratio * (curr.x - prev.x);
        breakEvenPoints.push(parseFloat(breakEvenX.toFixed(2)));
      }
    }
    
    return breakEvenPoints;
  };
  
  // Calculate max profit and loss
  const calculateMaxProfitLoss = (payoffPoints: {x: number, y: number}[]): {maxProfit: number, maxLoss: number} => {
    if (payoffPoints.length === 0) return { maxProfit: 0, maxLoss: 0 };
    
    let maxProfit = payoffPoints[0].y;
    let maxLoss = payoffPoints[0].y;
    
    payoffPoints.forEach(point => {
      if (point.y > maxProfit) maxProfit = point.y;
      if (point.y < maxLoss) maxLoss = point.y;
    });
    
    return { 
      maxProfit: maxProfit > 0 ? maxProfit : 0, 
      maxLoss: maxLoss < 0 ? Math.abs(maxLoss) : 0 
    };
  };
  
  // Main calculation function
  useEffect(() => {
    if (parameters.legs.length === 0) {
      setResult(null);
      return;
    }
    
    const calculateStrategy = async () => {
      setIsCalculating(true);
      
      try {
        // Calculate payoff curve
        const payoffPoints = generatePayoffCurve;
        
        // Calculate break-even points
        const breakEvenPoints = calculateBreakEvenPoints(payoffPoints);
        
        // Calculate max profit and loss
        const { maxProfit, maxLoss } = calculateMaxProfitLoss(payoffPoints);
        
        // Calculate individual leg results
        const legResults = parameters.legs.map(leg => 
          calculateLegResult(parameters.spotPrice, leg)
        );
        
        // Calculate total price and Greeks
        const totalPrice = legResults.reduce((sum, result) => sum + result.price, 0);
        
        const totalGreeks = {
          delta: legResults.reduce((sum, result) => sum + result.greeks.delta, 0),
          gamma: legResults.reduce((sum, result) => sum + result.greeks.gamma, 0),
          vega: legResults.reduce((sum, result) => sum + result.greeks.vega, 0),
          theta: legResults.reduce((sum, result) => sum + result.greeks.theta, 0),
          rho: legResults.reduce((sum, result) => sum + result.greeks.rho, 0)
        };
        
        // Set final result
        setResult({
          totalPrice,
          totalGreeks,
          legResults,
          payoffPoints,
          breakEvenPoints,
          maxProfit,
          maxLoss
        });
      } catch (error) {
        console.error("Error calculating strategy:", error);
      } finally {
        setIsCalculating(false);
      }
    };
    
    calculateStrategy();
  }, [parameters, generatePayoffCurve]);
  
  return {
    result,
    isCalculating
  };
};

export default usePayoffCalculator;
