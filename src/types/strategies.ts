
export type OptionType = 'call' | 'put';
export type PositionType = 'long' | 'short';
export type AssetType = 'stock' | 'bond' | 'index' | 'future' | 'option';
export type BarrierType = 'knock-in' | 'knock-out' | 'none';
export type CouponType = 'fixed' | 'variable' | 'digital';

export interface OptionLeg {
  strike: number;
  type: OptionType; 
  position: PositionType;
  quantity: number;
  isSelected?: boolean; // Used for multi-leg editing
  barrier?: {
    type: BarrierType;
    level: number;
  };
}

export interface UnderlyingAsset {
  id: string;
  name: string;
  type: AssetType;
  price: number;
  volatility: number;
  dividendYield?: number;
  maturityDate?: Date;
  interestRate?: number;
}

export interface Coupon {
  type: CouponType;
  value: number;
  condition?: {
    assetId: string;
    threshold: number;
    operator: '>' | '<' | '>=' | '<=' | '=';
  };
}

export interface StructuredProductFlow {
  id: string;
  type: 'barrier' | 'coupon' | 'autocall' | 'redemption';
  description: string;
  condition?: {
    assetId: string;
    threshold: number;
    operator: '>' | '<' | '>=' | '<=' | '=';
    observationDate?: Date;
    isPeriodic?: boolean;
    frequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  };
  outcome: {
    type: 'payment' | 'redemption' | 'continuation';
    value: number | string;
  };
}

export interface StrategyParameters {
  spotPrice: number;
  volatility: number;
  timeToMaturity: number;
  interestRate: number;
  dividendYield: number;
  legs: OptionLeg[];
  underlyingAssets?: UnderlyingAsset[];
  structuredFlows?: StructuredProductFlow[];
  coupons?: Coupon[];
  nominal?: number;
}

export interface Strategy {
  id: string;
  name: string;
  category: 'vanilla' | 'advanced' | 'structured';
  description: string;
  parameters: StrategyParameters;
  isDraft?: boolean;
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
  var?: number;  // Value at Risk
  cvar?: number; // Conditional Value at Risk
}

export interface StressTestScenario {
  name: string;
  description: string;
  parameters: {
    volatilityChange: number;
    interestRateChange: number;
    spotPriceChange: number;
  };
  result?: StrategyResult;
}
