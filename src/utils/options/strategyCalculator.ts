
import { Strategy, StrategyResult, LegResult } from '../../types/strategies';
import { blackScholes } from './blackScholes';

export function calculateStrategyResults(strategy: Strategy): StrategyResult {
  const { spotPrice, volatility, timeToMaturity, interestRate, dividendYield, legs } = strategy.parameters;
  
  // Calculate results for each leg
  const legResults: LegResult[] = legs.map(leg => {
    const result = blackScholes(
      spotPrice,
      leg.strike,
      timeToMaturity,
      interestRate,
      dividendYield,
      volatility,
      leg.type,
      leg.position
    );
    
    // Adjust for quantity
    return {
      price: result.price * leg.quantity,
      greeks: {
        delta: result.greeks.delta * leg.quantity,
        gamma: result.greeks.gamma * leg.quantity,
        vega: result.greeks.vega * leg.quantity,
        theta: result.greeks.theta * leg.quantity,
        rho: result.greeks.rho * leg.quantity
      }
    };
  });
  
  // Calculate total price and Greeks
  const totalPrice = legResults.reduce((sum, leg) => sum + leg.price, 0);
  const totalGreeks = {
    delta: legResults.reduce((sum, leg) => sum + leg.greeks.delta, 0),
    gamma: legResults.reduce((sum, leg) => sum + leg.greeks.gamma, 0),
    vega: legResults.reduce((sum, leg) => sum + leg.greeks.vega, 0),
    theta: legResults.reduce((sum, leg) => sum + leg.greeks.theta, 0),
    rho: legResults.reduce((sum, leg) => sum + leg.greeks.rho, 0)
  };
  
  // Calculate payoff points for payoff diagram
  const payoffPoints = calculatePayoffPoints(strategy);
  
  // Calculate break-even points (approximate)
  const breakEvenPoints = findBreakEvenPoints(payoffPoints);
  
  // Find max profit/loss
  const profits = payoffPoints.map(point => point.y);
  const maxProfit = Math.max(...profits);
  const maxLoss = Math.min(...profits);
  
  return {
    totalPrice,
    totalGreeks,
    legResults,
    payoffPoints,
    breakEvenPoints,
    maxProfit: isFinite(maxProfit) ? maxProfit : undefined,
    maxLoss: isFinite(maxLoss) ? maxLoss : undefined
  };
}

function calculatePayoffPoints(strategy: Strategy): { x: number, y: number }[] {
  const { spotPrice, legs } = strategy.parameters;
  
  // Create range of potential expiration prices
  // Range is from 50% to 150% of spot price with 50 points
  const minPrice = spotPrice * 0.5;
  const maxPrice = spotPrice * 1.5;
  const step = (maxPrice - minPrice) / 49;
  
  const expirationPrices = Array.from({ length: 50 }, (_, i) => minPrice + i * step);
  
  // Calculate payoff for each expiration price
  return expirationPrices.map(expirationPrice => {
    let payoff = 0;
    
    // Calculate payoff for each leg
    legs.forEach(leg => {
      const legPayoff = calculateLegPayoff(
        expirationPrice,
        leg.strike,
        leg.type,
        leg.position,
        leg.quantity
      );
      payoff += legPayoff;
    });
    
    // Subtract the premium paid/received for the strategy
    const premium = calculateStrategyPremium(strategy);
    payoff -= premium;
    
    return { x: expirationPrice, y: payoff };
  });
}

function calculateLegPayoff(
  expirationPrice: number,
  strike: number,
  type: 'call' | 'put',
  position: 'long' | 'short',
  quantity: number
): number {
  let payoff = 0;
  
  if (type === 'call') {
    payoff = Math.max(0, expirationPrice - strike);
  } else { // put
    payoff = Math.max(0, strike - expirationPrice);
  }
  
  // Adjust for position direction
  if (position === 'short') {
    payoff = -payoff;
  }
  
  // Adjust for quantity
  return payoff * quantity;
}

function calculateStrategyPremium(strategy: Strategy): number {
  const { spotPrice, volatility, timeToMaturity, interestRate, dividendYield, legs } = strategy.parameters;
  
  return legs.reduce((sum, leg) => {
    const result = blackScholes(
      spotPrice,
      leg.strike,
      timeToMaturity,
      interestRate,
      dividendYield,
      volatility,
      leg.type,
      leg.position
    );
    
    // For long positions, premium is negative (paid)
    // For short positions, premium is positive (received)
    return sum + (leg.position === 'long' ? result.price : -result.price) * leg.quantity;
  }, 0);
}

function findBreakEvenPoints(payoffPoints: { x: number, y: number }[]): number[] {
  const breakEvenPoints = [];
  
  // Find points where payoff crosses zero
  for (let i = 0; i < payoffPoints.length - 1; i++) {
    const current = payoffPoints[i];
    const next = payoffPoints[i + 1];
    
    // If the payoff crosses zero between these points
    if ((current.y >= 0 && next.y <= 0) || (current.y <= 0 && next.y >= 0)) {
      // Linear interpolation to find the break-even point
      const slope = (next.y - current.y) / (next.x - current.x);
      const breakEven = current.x - (current.y / slope);
      
      // Round to 2 decimal places
      breakEvenPoints.push(Math.round(breakEven * 100) / 100);
    }
  }
  
  return breakEvenPoints;
}
