
import { 
  Strategy, 
  StrategyResult, 
  LegResult, 
  OptionLeg,
  StructuredProductFlow
} from '../../types/strategies';
import { blackScholes } from './blackScholes';

export function calculateStrategyResults(strategy: Strategy): StrategyResult {
  const { spotPrice, volatility, timeToMaturity, interestRate, dividendYield, legs } = strategy.parameters;
  
  // Calculate results for each leg
  const legResults: LegResult[] = legs.map(leg => {
    // Consider barriers if present
    const barrierAdjustment = leg.barrier ? calculateBarrierAdjustment(leg, spotPrice) : 1.0;
    
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
    
    // Adjust for quantity and barriers
    return {
      price: result.price * leg.quantity * barrierAdjustment,
      greeks: {
        delta: result.greeks.delta * leg.quantity * barrierAdjustment,
        gamma: result.greeks.gamma * leg.quantity * barrierAdjustment,
        vega: result.greeks.vega * leg.quantity * barrierAdjustment,
        theta: result.greeks.theta * leg.quantity * barrierAdjustment,
        rho: result.greeks.rho * leg.quantity * barrierAdjustment
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
  
  // Calculate VaR and CVaR (simplified)
  const var95 = calculateVaR(payoffPoints, 0.95);
  const cvar95 = calculateCVaR(payoffPoints, 0.95);
  
  return {
    totalPrice,
    totalGreeks,
    legResults,
    payoffPoints,
    breakEvenPoints,
    maxProfit: isFinite(maxProfit) ? maxProfit : undefined,
    maxLoss: isFinite(maxLoss) ? maxLoss : undefined,
    var: var95,
    cvar: cvar95
  };
}

/**
 * Calculate barrier adjustment factor (simplified)
 * In reality, this would use more complex barrier option pricing
 */
function calculateBarrierAdjustment(leg: OptionLeg, spotPrice: number): number {
  if (!leg.barrier) return 1.0;
  
  const barrierLevel = leg.barrier.level;
  const barrierType = leg.barrier.type;
  
  // Simple adjustment factors - this is a simplification
  if (barrierType === 'knock-in') {
    // For knock-in, price is reduced if spot is far from barrier
    const distance = Math.abs(spotPrice - barrierLevel) / spotPrice;
    return 0.7 + 0.3 * (1 - Math.min(distance, 1));
  } else if (barrierType === 'knock-out') {
    // For knock-out, price is reduced if spot is close to barrier
    const distance = Math.abs(spotPrice - barrierLevel) / spotPrice;
    return Math.min(distance * 1.5, 0.95);
  }
  
  return 1.0;
}

function calculatePayoffPoints(strategy: Strategy): { x: number, y: number }[] {
  const { spotPrice, legs, structuredFlows } = strategy.parameters;
  
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
        leg.quantity,
        leg.barrier
      );
      payoff += legPayoff;
    });
    
    // Add payoff from structured flows if any
    if (structuredFlows && structuredFlows.length > 0) {
      const flowPayoff = calculateStructuredFlowsPayoff(
        structuredFlows,
        expirationPrice,
        strategy
      );
      payoff += flowPayoff;
    }
    
    // Subtract the premium paid/received for the strategy
    const premium = calculateStrategyPremium(strategy);
    payoff -= premium;
    
    // If nominal is specified, scale the payoff
    const nominal = strategy.parameters.nominal;
    if (nominal && nominal !== 0) {
      payoff = (payoff / 100) * nominal;
    }
    
    return { x: expirationPrice, y: payoff };
  });
}

/**
 * Calculate payoff contribution from structured flows
 * This is a simplified calculation
 */
function calculateStructuredFlowsPayoff(
  flows: StructuredProductFlow[],
  expirationPrice: number,
  strategy: Strategy
): number {
  let payoff = 0;
  
  // Process redemption flows first as they're the base case
  const redemptionFlows = flows.filter(flow => flow.type === 'redemption');
  if (redemptionFlows.length > 0) {
    // Default redemption is 100% of nominal
    payoff = 100;
    
    // Check for conditional redemption
    for (const flow of redemptionFlows) {
      if (!flow.condition) continue;
      
      // Get the asset price - for now just use the expiration price 
      // In a real implementation, we'd look up the correct asset
      const assetPrice = expirationPrice;
      const threshold = flow.condition.threshold;
      
      // Check if condition is met
      const conditionMet = evaluateCondition(assetPrice, threshold, flow.condition.operator);
      if (conditionMet) {
        // Parse the outcome value - could be a percentage or fixed amount
        const outcomeValue = flow.outcome.value;
        if (typeof outcomeValue === 'string' && outcomeValue.endsWith('%')) {
          // Percentage of nominal
          payoff = parseFloat(outcomeValue) || 100;
        } else if (typeof outcomeValue === 'number') {
          // Fixed amount - convert to percentage of nominal
          const nominal = strategy.parameters.nominal || 100;
          payoff = (outcomeValue / nominal) * 100;
        }
      }
    }
  }
  
  // Process coupon flows
  const couponFlows = flows.filter(flow => flow.type === 'coupon');
  for (const flow of couponFlows) {
    if (!flow.condition) {
      // Unconditional coupon
      const couponValue = typeof flow.outcome.value === 'number' 
        ? flow.outcome.value 
        : parseFloat(flow.outcome.value as string) || 0;
      payoff += couponValue;
    } else {
      // Conditional coupon
      const assetPrice = expirationPrice;
      const threshold = flow.condition.threshold;
      const conditionMet = evaluateCondition(assetPrice, threshold, flow.condition.operator);
      
      if (conditionMet) {
        const couponValue = typeof flow.outcome.value === 'number' 
          ? flow.outcome.value 
          : parseFloat(flow.outcome.value as string) || 0;
        payoff += couponValue;
      }
    }
  }
  
  // Barrier events can modify payoff
  const barrierFlows = flows.filter(flow => flow.type === 'barrier');
  for (const flow of barrierFlows) {
    if (!flow.condition) continue;
    
    const assetPrice = expirationPrice;
    const threshold = flow.condition.threshold;
    const conditionMet = evaluateCondition(assetPrice, threshold, flow.condition.operator);
    
    if (conditionMet) {
      // Barrier is triggered, apply the outcome
      if (flow.outcome.type === 'payment') {
        const paymentValue = typeof flow.outcome.value === 'number' 
          ? flow.outcome.value 
          : parseFloat(flow.outcome.value as string) || 0;
        payoff += paymentValue;
      } else if (flow.outcome.type === 'redemption') {
        // Override redemption value
        const redemptionValue = typeof flow.outcome.value === 'number' 
          ? flow.outcome.value 
          : parseFloat(flow.outcome.value as string) || 100;
        payoff = redemptionValue;
      }
    }
  }
  
  return payoff;
}

/**
 * Evaluate a condition like "price > threshold"
 */
function evaluateCondition(
  price: number, 
  threshold: number, 
  operator: string
): boolean {
  switch (operator) {
    case '>': return price > threshold;
    case '<': return price < threshold;
    case '>=': return price >= threshold;
    case '<=': return price <= threshold;
    case '=': return price === threshold;
    default: return false;
  }
}

function calculateLegPayoff(
  expirationPrice: number,
  strike: number,
  type: 'call' | 'put',
  position: 'long' | 'short',
  quantity: number,
  barrier?: { type: string; level: number }
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
  
  // Apply barrier effect (simplified)
  if (barrier) {
    const barrierTriggered = 
      (barrier.type === 'knock-in' && Math.abs(expirationPrice - barrier.level) < strike * 0.05) ||
      (barrier.type === 'knock-out' && Math.abs(expirationPrice - barrier.level) > strike * 0.05);
    
    if ((barrier.type === 'knock-in' && !barrierTriggered) || 
        (barrier.type === 'knock-out' && barrierTriggered)) {
      payoff = 0;
    }
  }
  
  // Adjust for quantity
  return payoff * quantity;
}

function calculateStrategyPremium(strategy: Strategy): number {
  const { spotPrice, volatility, timeToMaturity, interestRate, dividendYield, legs } = strategy.parameters;
  
  return legs.reduce((sum, leg) => {
    const barrierAdjustment = leg.barrier ? calculateBarrierAdjustment(leg, spotPrice) : 1.0;
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
    return sum + (leg.position === 'long' ? result.price : -result.price) * leg.quantity * barrierAdjustment;
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

/**
 * Calculate Value at Risk (VaR) for the given confidence level
 * Simplified implementation
 */
function calculateVaR(payoffPoints: { x: number, y: number }[], confidence: number): number {
  // Sort profits in ascending order
  const profits = payoffPoints.map(point => point.y).sort((a, b) => a - b);
  
  // Calculate VaR index
  const varIndex = Math.floor(profits.length * (1 - confidence));
  
  // Return VaR (negative because it's a loss)
  return -Math.min(profits[varIndex], 0);
}

/**
 * Calculate Conditional Value at Risk (CVaR) for the given confidence level
 * Simplified implementation
 */
function calculateCVaR(payoffPoints: { x: number, y: number }[], confidence: number): number {
  // Sort profits in ascending order
  const profits = payoffPoints.map(point => point.y).sort((a, b) => a - b);
  
  // Calculate VaR index
  const varIndex = Math.floor(profits.length * (1 - confidence));
  
  // Calculate average of profits below VaR
  const tailProfits = profits.slice(0, varIndex + 1);
  const tailAverage = tailProfits.reduce((sum, profit) => sum + profit, 0) / tailProfits.length;
  
  // Return CVaR (negative because it's a loss)
  return -Math.min(tailAverage, 0);
}
