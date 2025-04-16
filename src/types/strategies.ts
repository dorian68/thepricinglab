
export type OptionType = 'call' | 'put';
export type PositionType = 'long' | 'short';

export interface OptionLeg {
  strike: number;
  type: OptionType; 
  position: PositionType;
  quantity: number;
  isSelected?: boolean; // Used for multi-leg editing
}

export interface StrategyParameters {
  spotPrice: number;
  volatility: number;
  timeToMaturity: number;
  interestRate: number;
  dividendYield: number;
  legs: OptionLeg[];
}

export interface Strategy {
  id: string;
  name: string;
  category: 'vanilla' | 'advanced';
  description: string;
  parameters: StrategyParameters;
}

export interface Greeks {
  delta: number;
  gamma: number;
  vega: number;
  theta: number;
  rho: number;
}

export interface LegResult {
  price: number;
  greeks: Greeks;
}

export interface StrategyResult {
  totalPrice: number;
  totalGreeks: Greeks;
  legResults: LegResult[];
  payoffPoints: {x: number; y: number}[];
  breakEvenPoints: number[];
  maxProfit?: number;
  maxLoss?: number;
}
