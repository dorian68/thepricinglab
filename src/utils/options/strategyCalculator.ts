import { Strategy, StrategyResult, LegResult } from '../../types/strategies';
import { analyzePayoffTerminal } from '../../lib/payoffStrategy.mjs';
import { blackScholes } from './blackScholes';

/**
 * Compatibility adapter for the historical strategy/community screens.
 *
 * Vanilla terminal geometry is delegated to the same exact piecewise engine as
 * `/tools/payoff`; chart sampling never drives breakevens or risk bounds.
 * Path-dependent barriers and structured cash flows deliberately fail closed
 * until a dedicated contractual engine exists.
 */
export function calculateStrategyResults(strategy: Strategy): StrategyResult {
  if (!strategy?.parameters || !Array.isArray(strategy.parameters.legs) || strategy.parameters.legs.length === 0) {
    throw new Error('A strategy requires at least one option leg.');
  }
  const { spotPrice, volatility, timeToMaturity, interestRate, dividendYield, legs, structuredFlows, nominal } = strategy.parameters;
  if (structuredFlows?.length || legs.some((leg) => leg.barrier && leg.barrier.type !== 'none')) {
    throw new Error('Barrier and structured-flow valuation is unavailable in the deterministic vanilla engine; no proxy payoff is produced.');
  }

  const contractMultiplier = nominal == null ? 1 : nominal / 100;
  const perUnit = legs.map((leg) => blackScholes(
    spotPrice,
    leg.strike,
    timeToMaturity,
    interestRate,
    dividendYield,
    volatility,
    leg.type,
    leg.position,
  ));
  const legResults: LegResult[] = perUnit.map((result, index) => {
    const scale = legs[index].quantity * contractMultiplier;
    return {
      price: result.price * scale,
      greeks: {
        delta: result.greeks.delta * scale,
        gamma: result.greeks.gamma * scale,
        vega: result.greeks.vega * scale,
        theta: result.greeks.theta * scale,
        rho: result.greeks.rho * scale,
      },
    };
  });

  const terminal = analyzePayoffTerminal({
    spot: spotPrice,
    volatility,
    timeToMaturity,
    riskFreeRate: interestRate,
    dividendYield,
    currency: 'USD',
    contractMultiplier,
    gridPoints: 401,
    legs: legs.map((leg, index) => ({
      id: `leg-${index + 1}`,
      type: leg.type,
      side: leg.position,
      strike: leg.strike,
      quantity: leg.quantity,
      premiumSource: 'manual',
      manualPremium: Math.abs(perUnit[index].price),
    })),
  });

  const totalPrice = legResults.reduce((sum, leg) => sum + leg.price, 0);
  const totalGreeks = {
    delta: legResults.reduce((sum, leg) => sum + leg.greeks.delta, 0),
    gamma: legResults.reduce((sum, leg) => sum + leg.greeks.gamma, 0),
    vega: legResults.reduce((sum, leg) => sum + leg.greeks.vega, 0),
    theta: legResults.reduce((sum, leg) => sum + leg.greeks.theta, 0),
    rho: legResults.reduce((sum, leg) => sum + leg.greeks.rho, 0),
  };

  return {
    totalPrice,
    totalGreeks,
    legResults,
    payoffPoints: terminal.curve.map((point: { terminalSpot: number; terminalPnl: number }) => ({ x: point.terminalSpot, y: point.terminalPnl })),
    breakEvenPoints: terminal.breakevens,
    maxProfit: terminal.bounds.maxProfit.kind === 'unlimited' ? undefined : terminal.bounds.maxProfit.amount,
    maxLoss: terminal.bounds.maxLoss.kind === 'unlimited' ? undefined : -terminal.bounds.maxLoss.amount,
  };
}
