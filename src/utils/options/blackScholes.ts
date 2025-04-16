
import { OptionType, PositionType, Greeks } from '../../types/strategies';

// Cumulative distribution function (CDF) of the standard normal distribution
export function normCDF(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  // Save the sign
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);

  // A&S formula 7.1.26
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return 0.5 * (1.0 + sign * y);
}

// Normal probability density function (PDF)
export function normPDF(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

// Black-Scholes option pricing model
export function blackScholes(
  S: number,       // Spot price
  K: number,       // Strike price
  T: number,       // Time to maturity in years
  r: number,       // Risk-free interest rate
  q: number,       // Dividend yield
  sigma: number,   // Volatility
  type: OptionType, // 'call' or 'put'
  position: PositionType = 'long' // 'long' or 'short'
): { price: number; greeks: Greeks } {
  // Validate input parameters
  if (S <= 0 || K <= 0 || T <= 0 || sigma <= 0) {
    console.error('Invalid parameters for Black-Scholes model');
    return { 
      price: 0, 
      greeks: { delta: 0, gamma: 0, vega: 0, theta: 0, rho: 0 } 
    };
  }

  // Calculate d1 and d2
  const d1 = (Math.log(S / K) + (r - q + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);

  let price: number;
  let delta: number;
  let gamma: number;
  let vega: number;
  let theta: number;
  let rho: number;

  // Calculate option price
  if (type === 'call') {
    price = S * Math.exp(-q * T) * normCDF(d1) - K * Math.exp(-r * T) * normCDF(d2);
    delta = Math.exp(-q * T) * normCDF(d1);
    rho = K * T * Math.exp(-r * T) * normCDF(d2) / 100;
  } else { // put
    price = K * Math.exp(-r * T) * normCDF(-d2) - S * Math.exp(-q * T) * normCDF(-d1);
    delta = -Math.exp(-q * T) * normCDF(-d1);
    rho = -K * T * Math.exp(-r * T) * normCDF(-d2) / 100;
  }

  // Calculate common Greeks
  gamma = Math.exp(-q * T) * normPDF(d1) / (S * sigma * Math.sqrt(T));
  vega = S * Math.exp(-q * T) * normPDF(d1) * Math.sqrt(T) / 100; // divided by 100 to get % change
  
  // Theta calculation (per calendar day)
  const term1 = -(S * sigma * Math.exp(-q * T) * normPDF(d1)) / (2 * Math.sqrt(T));
  const term2 = type === 'call' 
    ? -(r * K * Math.exp(-r * T) * normCDF(d2)) + (q * S * Math.exp(-q * T) * normCDF(d1))
    : (r * K * Math.exp(-r * T) * normCDF(-d2)) - (q * S * Math.exp(-q * T) * normCDF(-d1));
  
  theta = (term1 + term2) / 365; // per calendar day

  // Adjust sign for short positions
  if (position === 'short') {
    price = -price;
    delta = -delta;
    theta = -theta;
    rho = -rho;
    // Gamma and Vega don't change sign for short positions in their conventional representation
  }

  return {
    price,
    greeks: {
      delta,
      gamma,
      vega,
      theta,
      rho
    }
  };
}
