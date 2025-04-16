
import { useTranslation } from "react-i18next";

export type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'expert' | 'master' | 'legendary';
export type SubscriptionPlan = 'freemium' | 'student' | 'pro';

export interface SurvivalWave {
  id: number;
  name: string;
  description: string;
  difficulty: DifficultyLevel;
  challenges: number;
  time: number;
  topics: string[];
  requiredPlan: SubscriptionPlan;
  image: string;
}

// Custom hook to get localized survival waves
export const useSurvivalWaves = (userPlan: SubscriptionPlan = 'freemium') => {
  const { t } = useTranslation();

  const survivalWaves: SurvivalWave[] = [
    {
      id: 1,
      name: t('survivalMode.waves.beginner.title'),
      description: t('survivalMode.waves.beginner.description'),
      difficulty: 'easy',
      challenges: 10,
      time: 15,
      topics: ["Black-Scholes", "Vanilla Options", "Basic Greeks"],
      requiredPlan: 'freemium',
      image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3"
    },
    {
      id: 2,
      name: t('survivalMode.waves.intermediate.title'),
      description: t('survivalMode.waves.intermediate.description'),
      difficulty: 'medium',
      challenges: 15,
      time: 20,
      topics: ["Binomial Trees", "American Options", "Hedging Strategies"],
      requiredPlan: 'student',
      image: "https://images.unsplash.com/photo-1642104704074-907c0698cbd9"
    },
    {
      id: 3,
      name: t('survivalMode.waves.advanced.title'),
      description: t('survivalMode.waves.advanced.description'),
      difficulty: 'hard',
      challenges: 20,
      time: 25,
      topics: ["Stochastic Volatility", "Monte Carlo", "European Exotics"],
      requiredPlan: 'student',
      image: "https://images.unsplash.com/photo-1569025743873-ea3a9ade89f9"
    },
    {
      id: 4,
      name: t('survivalMode.waves.expert.title'),
      description: t('survivalMode.waves.expert.description'),
      difficulty: 'expert',
      challenges: 25,
      time: 30,
      topics: ["Path-Dependent Options", "Barrier Options", "Asian Options", "Lookbacks"],
      requiredPlan: 'pro',
      image: "https://images.unsplash.com/photo-1605792657660-596af9009e82"
    },
    {
      id: 5,
      name: t('survivalMode.waves.master.title'),
      description: t('survivalMode.waves.master.description'),
      difficulty: 'master',
      challenges: 30,
      time: 35,
      topics: ["Structured Products", "Multi-Asset Options", "Callable/Puttable Structures"],
      requiredPlan: 'pro',
      image: "https://images.unsplash.com/photo-1516245834210-c4c142787335"
    },
    {
      id: 6,
      name: t('survivalMode.waves.legendary.title'),
      description: t('survivalMode.waves.legendary.description'),
      difficulty: 'legendary',
      challenges: 35,
      time: 40,
      topics: ["Stochastic Rates", "Market Calibration", "XVA", "Machine Learning Models"],
      requiredPlan: 'pro',
      image: "https://images.unsplash.com/photo-1534951009808-766178b47a4f"
    }
  ];

  // Map each wave to include whether it's unlocked based on the user's plan
  return survivalWaves.map(wave => ({
    ...wave,
    unlocked: 
      wave.requiredPlan === 'freemium' ||
      (wave.requiredPlan === 'student' && (userPlan === 'student' || userPlan === 'pro')) ||
      (wave.requiredPlan === 'pro' && userPlan === 'pro')
  }));
};

// Exercise interfaces
export interface SurvivalExercise {
  id: number;
  type: string;
  question: string;
  parameters: Record<string, any>;
  solution: number | string;
  explanation: string;
  difficulty: number; // 1-10 scale
}

// Challenge types for different waves
export const survivalChallengeTypes = {
  beginner: [
    "Calculate Call Option Price using Black-Scholes",
    "Calculate Put Option Price using Black-Scholes",
    "Find Implied Volatility from Option Price",
    "Calculate Delta of a Call Option",
    "Calculate Gamma of an Option",
    "Calculate Break-Even Points",
    "Determine Option Moneyness",
    "Apply Put-Call Parity",
    "Calculate Option Time Value",
    "Calculate Option Intrinsic Value"
  ],
  intermediate: [
    "Price American Option using Binomial Tree",
    "Calculate Option Price with Dividend Yield",
    "Create Delta Hedging Strategy",
    "Price Option with Binomial Tree (n steps)",
    "Find Optimal Exercise Boundary",
    "Calculate Vega Exposure",
    "Price Digital Option",
    "Calculate Theta Decay",
    "Design Covered Call Strategy",
    "Design Protective Put Strategy"
  ],
  advanced: [
    "Price Option with Stochastic Volatility",
    "Calculate Monte Carlo Price (with control variate)",
    "Price Knock-Out Barrier Option",
    "Calculate VaR for Option Portfolio",
    "Price Rainbow Option",
    "Price Quanto Option",
    "Determine Volatility Surface",
    "Implement Local Volatility Model",
    "Price Spread Option",
    "Calculate CVA for Option"
  ],
  expert: [
    "Price Asian Option (Arithmetic Average)",
    "Price Asian Option (Geometric Average)",
    "Price Double Barrier Option",
    "Price Lookback Option (Floating Strike)",
    "Price Lookback Option (Fixed Strike)",
    "Model Jump Diffusion Process",
    "Price Parisian Option",
    "Calculate Path-Dependent Delta",
    "Price Compound Option",
    "Calculate Portfolio Greeks"
  ],
  master: [
    "Price Autocallable Structure",
    "Price Worst-of Basket Option",
    "Calculate Correlation Risk",
    "Price TARFs (Target Redemption Forwards)",
    "Price Callable/Puttable Bond",
    "Price Mountain Range Option",
    "Design Volatility Trading Strategy",
    "Calibrate Local Stochastic Volatility",
    "Price Power Option",
    "Design Cross-Asset Hedging Strategy"
  ],
  legendary: [
    "Create Full XVA Framework",
    "Implement Hull-White Interest Rate Model",
    "Implement Heston Stochastic Volatility",
    "Calibrate SABR Model to Market",
    "Implement Neural Network for Option Pricing",
    "Design Algorithmic Delta-Hedging Strategy",
    "Create Multi-Factor Interest Rate Model",
    "Price Bermudan Swaption",
    "Implement Regime-Switching Model",
    "Design Reinforcement Learning Trading Algorithm"
  ]
};

// Actual exercise data with progressive complexity
export const survivalExercises = {
  beginner: [
    {
      id: 101,
      type: "Black-Scholes Calculation",
      question: "Calculate the price of a European call option using Black-Scholes",
      parameters: {
        S: 100, // Stock price
        K: 105, // Strike price
        r: 0.05, // Risk-free rate
        T: 0.5, // Time to maturity (years)
        sigma: 0.2 // Volatility
      },
      solution: 5.57,
      explanation: "Using the Black-Scholes formula with the given parameters results in a call option price of $5.57.",
      difficulty: 1
    },
    {
      id: 102,
      type: "Put Option Pricing",
      question: "Calculate the price of a European put option using Black-Scholes",
      parameters: {
        S: 100,
        K: 95, 
        r: 0.05,
        T: 0.5,
        sigma: 0.2
      },
      solution: 2.34,
      explanation: "Using the Black-Scholes formula with the given parameters results in a put option price of $2.34.",
      difficulty: 1
    },
    {
      id: 103,
      type: "Delta Calculation",
      question: "Calculate the delta of a call option",
      parameters: {
        S: 100,
        K: 100,
        r: 0.05,
        T: 0.5,
        sigma: 0.2
      },
      solution: 0.596,
      explanation: "The delta of a call option represents the rate of change of option price with respect to the underlying asset price. With these parameters, delta equals 0.596.",
      difficulty: 2
    },
    {
      id:
      104,
      type: "Gamma Calculation",
      question: "Calculate the gamma of a put option",
      parameters: {
        S: 100,
        K: 100,
        r: 0.05,
        T: 0.25,
        sigma: 0.2
      },
      solution: 0.0317,
      explanation: "Gamma measures the rate of change of delta with respect to the underlying price. For this put option, gamma equals 0.0317.",
      difficulty: 3
    },
    {
      id: 105,
      type: "Implied Volatility",
      question: "Find the implied volatility of a call option with market price of $6.50",
      parameters: {
        S: 100,
        K: 95,
        r: 0.05,
        T: 0.5,
        price: 6.50
      },
      solution: 0.231,
      explanation: "The implied volatility is the volatility that, when used in the Black-Scholes formula, produces the market price. Here, it's approximately 23.1%.",
      difficulty: 4
    },
    {
      id: 106,
      type: "Break-Even Point",
      question: "Calculate the break-even stock price at expiration for a call option buyer",
      parameters: {
        K: 100,
        premium: 4.20
      },
      solution: 104.20,
      explanation: "For a call option, the break-even point is Strike + Premium = $100 + $4.20 = $104.20.",
      difficulty: 2
    },
    {
      id: 107,
      type: "Put-Call Parity",
      question: "Using put-call parity, calculate the price of a put option",
      parameters: {
        callPrice: 7.3,
        S: 105,
        K: 100,
        r: 0.05,
        T: 0.5
      },
      solution: 2.13,
      explanation: "Using put-call parity: P = C - S + K*e^(-r*T) = 7.3 - 105 + 100*e^(-0.05*0.5) = $2.13",
      difficulty: 3
    },
    {
      id: 108,
      type: "Time Value",
      question: "Calculate the time value of a call option",
      parameters: {
        S: 102,
        K: 100,
        optionPrice: 6.20
      },
      solution: 4.20,
      explanation: "Time Value = Option Price - Intrinsic Value. Intrinsic Value = max(0, S-K) = max(0, 102-100) = 2. Time Value = 6.20 - 2 = $4.20",
      difficulty: 2
    },
    {
      id: 109,
      type: "Option Moneyness",
      question: "Determine if a put option with strike $110 is in-the-money, at-the-money, or out-of-the-money when the stock price is $105",
      parameters: {
        S: 105,
        K: 110
      },
      solution: "in-the-money",
      explanation: "A put option is in-the-money when K > S. Here, $110 > $105, so the option is in-the-money.",
      difficulty: 1
    },
    {
      id: 110,
      type: "Vega Calculation",
      question: "Calculate the vega of an option",
      parameters: {
        S: 100,
        K: 100,
        r: 0.05,
        T: 1,
        sigma: 0.2
      },
      solution: 39.89,
      explanation: "Vega measures sensitivity to volatility. For these parameters, vega is approximately 39.89 (meaning a 1% change in volatility changes the option price by $0.3989).",
      difficulty: 4
    }
  ],
  intermediate: [
    {
      id: 201,
      type: "American Option Pricing",
      question: "Calculate the price of an American put option using a 3-step binomial tree",
      parameters: {
        S: 100,
        K: 100,
        r: 0.05,
        T: 0.5,
        sigma: 0.3,
        steps: 3
      },
      solution: 8.82,
      explanation: "Using a 3-step binomial tree model with the given parameters yields an American put price of $8.82.",
      difficulty: 4
    },
    {
      id: 202,
      type: "Dividend-Adjusted Option",
      question: "Calculate the price of a European call option with continuous dividend yield",
      parameters: {
        S: 100,
        K: 95,
        r: 0.05,
        q: 0.02, // Dividend yield
        T: 0.5,
        sigma: 0.25
      },
      solution: 9.71,
      explanation: "Using the dividend-adjusted Black-Scholes formula with continuous dividend yield of 2% gives a call price of $9.71.",
      difficulty: 5
    },
    {
      id: 203,
      type: "Delta Hedging",
      question: "Calculate the number of shares needed to delta-hedge a short position of 100 call options",
      parameters: {
        callDelta: 0.65,
        optionQuantity: 100,
        multiplier: 100 // Each option represents 100 shares
      },
      solution: 6500,
      explanation: "To delta-hedge, you need Quantity × Delta × Multiplier = 100 × 0.65 × 100 = 6,500 shares.",
      difficulty: 4
    },
    {
      id: 204,
      type: "Digital Option",
      question: "Calculate the price of a cash-or-nothing digital call with payoff $1000",
      parameters: {
        S: 100,
        K: 105,
        r: 0.05,
        T: 0.5,
        sigma: 0.2,
        payoff: 1000
      },
      solution: 362.46,
      explanation: "Using the formula for a cash-or-nothing digital call option with the given parameters results in a price of $362.46.",
      difficulty: 6
    },
    {
      id: 205,
      type: "Theta Calculation",
      question: "Calculate the daily theta of a call option (in $ per day)",
      parameters: {
        S: 100,
        K: 100,
        r: 0.05,
        T: 0.25, // 3 months
        sigma: 0.3,
        annualTheta: -21.2
      },
      solution: -0.0585,
      explanation: "Daily theta = Annual theta / 365 = -21.2 / 365 = -$0.0585 per day.",
      difficulty: 5
    },
    {
      id: 206,
      type: "Covered Call",
      question: "Calculate the maximum profit from a covered call strategy",
      parameters: {
        stockPurchasePrice: 95,
        callStrike: 100,
        callPremium: 3.5,
        shares: 100
      },
      solution: 850,
      explanation: "Max Profit = (Strike - Stock Price + Premium) × Shares = (100 - 95 + 3.5) × 100 = $850",
      difficulty: 5
    },
    {
      id: 207,
      type: "Protective Put",
      question: "Calculate the break-even stock price for a protective put strategy",
      parameters: {
        stockPrice: 100,
        putStrike: 95,
        putPremium: 2.5
      },
      solution: 102.5,
      explanation: "Break-even = Stock Price + Put Premium = 100 + 2.5 = $102.5",
      difficulty: 5
    },
    {
      id: 208,
      type: "Option Portfolio Delta",
      question: "Calculate the portfolio delta for a combination of options",
      parameters: {
        position1: { type: "call", quantity: 5, delta: 0.6 },
        position2: { type: "put", quantity: 10, delta: -0.3 },
        position3: { type: "stock", quantity: 200, delta: 1 }
      },
      solution: 197,
      explanation: "Portfolio Delta = Sum of (Position Delta × Quantity) = 5×0.6 + 10×(-0.3) + 200×1 = 3 - 3 + 197 = 197",
      difficulty: 6
    },
    {
      id: 209,
      type: "Optimal Exercise",
      question: "Determine if an American put should be exercised early given the parameters",
      parameters: {
        S: 95,
        K: 105,
        r: 0.05,
        T: 0.3,
        putPrice: 11.2,
        intrinsicValue: 10
      },
      solution: "Hold",
      explanation: "Since the put price ($11.2) exceeds the intrinsic value ($10), it's optimal to hold rather than exercise early.",
      difficulty: 6
    },
    {
      id: 210,
      type: "Price Sensitivity",
      question: "Calculate the new option price after a 5% increase in the underlying asset",
      parameters: {
        currentPrice: 8.5,
        delta: 0.6,
        gamma: 0.03,
        priceChange: 5 // in percent
      },
      solution: 9.20,
      explanation: "New Price ≈ Current Price + Delta × % Change × S + 0.5 × Gamma × (% Change × S)² = 8.5 + 0.6 × 5 + 0.5 × 0.03 × 5² = 8.5 + 3 + 0.375 = $9.20",
      difficulty: 7
    }
  ],
  advanced: [
    {
      id: 301,
      type: "Stochastic Volatility",
      question: "Calculate the approximate price of a call option using Heston's stochastic volatility model",
      parameters: {
        S: 100,
        K: 100,
        r: 0.05,
        T: 1,
        v0: 0.04, // Initial variance
        theta: 0.04, // Long-run variance
        kappa: 2, // Mean reversion rate
        sigma: 0.3, // Volatility of volatility
        rho: -0.5 // Correlation
      },
      solution: 11.35,
      explanation: "Using Heston's stochastic volatility model with the given parameters results in a call option price of approximately $11.35.",
      difficulty: 8
    },
    {
      id: 302,
      type: "Monte Carlo Pricing",
      question: "Calculate a European call option price using Monte Carlo simulation with control variate",
      parameters: {
        S: 100,
        K: 105,
        r: 0.05,
        T: 0.5,
        sigma: 0.2,
        simulations: 10000,
        controlPrice: 5.57
      },
      solution: 5.58,
      explanation: "The Monte Carlo simulation with 10,000 paths and control variate technique gives a price of $5.58, close to the analytical Black-Scholes price.",
      difficulty: 7
    },
    {
      id: 303,
      type: "Knock-Out Barrier",
      question: "Price a down-and-out call option",
      parameters: {
        S: 100,
        K: 100,
        barrier: 90,
        r: 0.05,
        T: 0.5,
        sigma: 0.2
      },
      solution: 6.35,
      explanation: "Using the analytical formula for a down-and-out call with barrier at 90, the price is $6.35.",
      difficulty: 8
    },
    {
      id: 304,
      type: "Value at Risk",
      question: "Calculate the 1-day 95% VaR for a portfolio of options with delta approach",
      parameters: {
        portfolioValue: 1000000,
        portfolioDelta: 0.7,
        underlyingVolatility: 0.015, // Daily volatility
        confidenceLevel: 0.95
      },
      solution: 17318,
      explanation: "Using the delta approximation, VaR = Portfolio Value × Delta × Volatility × Z-score = $1,000,000 × 0.7 × 0.015 × 1.645 = $17,318",
      difficulty: 7
    },
    {
      id: 305,
      type: "Quanto Option",
      question: "Price a quanto call option that pays in EUR based on USD stock",
      parameters: {
        S: 100, // USD stock price
        K: 105, // USD strike
        r_usd: 0.05, // USD risk-free rate
        r_eur: 0.02, // EUR risk-free rate
        T: 0.5,
        sigma_s: 0.2, // Stock volatility
        sigma_fx: 0.1, // FX volatility
        rho: -0.3, // Correlation
        FX: 0.85 // EUR/USD rate
      },
      solution: 4.73,
      explanation: "Using the quanto option pricing formula with adjustment for correlation between asset and FX rate gives a price of €4.73.",
      difficulty: 9
    },
    {
      id: 306,
      type: "Volatility Surface",
      question: "Interpolate implied volatility for a given strike and maturity from a volatility surface",
      parameters: {
        K: 102,
        T: 0.75,
        volSurface: {
          strikes: [90, 95, 100, 105, 110],
          maturities: [0.5, 1],
          vols: [
            [0.22, 0.20, 0.18, 0.19, 0.21],
            [0.21, 0.19, 0.17, 0.18, 0.20]
          ]
        }
      },
      solution: 0.183,
      explanation: "Using bilinear interpolation on the volatility surface gives an implied volatility of 18.3% for K=102 and T=0.75.",
      difficulty: 8
    },
    {
      id: 307,
      type: "Rainbow Option",
      question: "Price a 2-asset maximum rainbow call option",
      parameters: {
        S1: 100,
        S2: 95,
        K: 100,
        r: 0.05,
        T: 0.5,
        sigma1: 0.2,
        sigma2: 0.25,
        rho: 0.4
      },
      solution: 8.67,
      explanation: "A rainbow option on the maximum of two assets with the given parameters is worth $8.67.",
      difficulty: 9
    },
    {
      id: 308,
      type: "Spread Option",
      question: "Price a spread option on the difference between two assets",
      parameters: {
        S1: 100,
        S2: 95,
        K: 10, // Pays if S1-S2>K
        r: 0.05,
        T: 0.5,
        sigma1: 0.2,
        sigma2: 0.25,
        rho: -0.5
      },
      solution: 4.85,
      explanation: "Using Kirk's approximation for spread option pricing with the given parameters results in a price of $4.85.",
      difficulty: 8
    },
    {
      id: 309,
      type: "Local Volatility",
      question: "Calculate a local volatility value from implied volatility surface",
      parameters: {
        S: 100,
        K: 100,
        T: 0.5,
        impliedVol: 0.2,
        dVdK: -0.005, // Derivative of implied vol with respect to strike
        dVdT: 0.1, // Derivative of implied vol with respect to maturity
        d2VdK2: 0.0002 // Second derivative of implied vol with respect to strike
      },
      solution: 0.213,
      explanation: "Using Dupire's formula to convert from implied to local volatility gives a local vol of 21.3% at S=K=100.",
      difficulty: 10
    },
    {
      id: 310,
      type: "Credit Valuation Adjustment",
      question: "Calculate the CVA for a portfolio of options",
      parameters: {
        exposureProfile: [5000, 7000, 9000, 6000, 3000], // Expected exposure at different time points
        defaultProbabilities: [0.001, 0.003, 0.005, 0.007, 0.01], // Cumulative default probabilities
        lgd: 0.6, // Loss given default
        timePoints: [0.2, 0.4, 0.6, 0.8, 1] // Years
      },
      solution: 28.8,
      explanation: "CVA = LGD × Sum(EE_i × (PD_i - PD_{i-1})) = 0.6 × [(5000×0.001) + (7000×0.002) + (9000×0.002) + (6000×0.002) + (3000×0.003)] = $28.8",
      difficulty: 9
    }
  ],
  expert: [
    {
      id: 401,
      type: "Asian Option",
      question: "Price an arithmetic average Asian call option using Monte Carlo",
      parameters: {
        S: 100,
        K: 100,
        r: 0.05,
        T: 1,
        sigma: 0.2,
        monitoringPoints: 12, // Monthly monitoring
        simulations: 10000
      },
      solution: 6.23,
      explanation: "Using Monte Carlo simulation with 10,000 paths and 12 monitoring points gives an arithmetic Asian call price of $6.23.",
      difficulty: 9
    },
    {
      id: 402,
      type: "Double Barrier Option",
      question: "Price a double knock-out call option",
      parameters: {
        S: 100,
        K: 100,
        lowerBarrier: 90,
        upperBarrier: 110,
        r: 0.05,
        T: 0.5,
        sigma: 0.2
      },
      solution: 2.95,
      explanation: "A double knock-out call with barriers at 90 and 110 has a price of $2.95.",
      difficulty: 9
    },
    {
      id: 403,
      type: "Lookback Option",
      question: "Price a floating-strike lookback put option",
      parameters: {
        S: 100,
        r: 0.05,
        T: 0.5,
        sigma: 0.3
      },
      solution: 11.72,
      explanation: "Using the analytical formula for a floating-strike lookback put gives a price of $11.72.",
      difficulty: 10
    },
    {
      id: 404,
      type: "Jump Diffusion",
      question: "Calculate a call option price using Merton's jump diffusion model",
      parameters: {
        S: 100,
        K: 100,
        r: 0.05,
        T: 0.5,
        sigma: 0.15, // Diffusion volatility
        lambda: 3, // Jump frequency per year
        jumpMean: -0.05, // Average jump size
        jumpStdDev: 0.1 // Jump volatility
      },
      solution: 6.84,
      explanation: "Using Merton's jump diffusion model with the given parameters yields a call option price of $6.84.",
      difficulty: 10
    },
    {
      id: 405,
      type: "Parisian Option",
      question: "Approximate the price of a Parisian down-and-out call option",
      parameters: {
        S: 100,
        K: 100,
        barrier: 90,
        windowLength: 10, // Days
        r: 0.05,
        T: 0.5,
        sigma: 0.2
      },
      solution: 7.12,
      explanation: "A Parisian down-and-out call that knocks out if the price stays below the barrier for 10 consecutive days has a price of approximately $7.12.",
      difficulty: 10
    },
    {
      id: 406,
      type: "Path-Dependent Delta",
      question: "Calculate the delta of an up-and-out call option",
      parameters: {
        S: 100,
        K: 95,
        barrier: 110,
        r: 0.05,
        T: 0.5,
        sigma: 0.2
      },
      solution: 0.48,
      explanation: "The delta of an up-and-out call with the given parameters is approximately 0.48, less than a vanilla call due to the knockout feature.",
      difficulty: 9
    },
    {
      id: 407,
      type: "Compound Option",
      question: "Price a call on a call compound option",
      parameters: {
        S: 100,
        K1: 5, // Strike of the outer option
        K2: 100, // Strike of the inner option
        r: 0.05,
        T1: 0.25, // Maturity of the outer option
        T2: 0.75, // Maturity of the inner option
        sigma: 0.2
      },
      solution: 2.81,
      explanation: "A compound option (call on a call) with the given parameters has a price of $2.81.",
      difficulty: 10
    },
    {
      id: 408,
      type: "Portfolio Risk",
      question: "Calculate the 10-day 99% Expected Shortfall for an option portfolio",
      parameters: {
        portfolioValue: 1000000,
        dailyReturns: [-0.01, -0.015, -0.008, 0.005, -0.022, -0.03, -0.018, 0.01, -0.025, -0.005],
        confidence: 0.99,
        horizon: 10
      },
      solution: 94868,
      explanation: "Using historical simulation and scaling to a 10-day horizon, the 99% Expected Shortfall is approximately $94,868.",
      difficulty: 9
    },
    {
      id: 409,
      type: "Geometric Average",
      question: "Price a geometric average Asian call option analytically",
      parameters: {
        S: 100,
        K: 100,
        r: 0.05,
        T: 1,
        sigma: 0.2,
        monitoringPoints: 12
      },
      solution: 5.54,
      explanation: "Using the analytical formula for geometric Asian options with reduced volatility of sigma × sqrt((n+1)/(6n)), the price is $5.54.",
      difficulty: 9
    },
    {
      id: 410,
      type: "SABR Calibration",
      question: "Calculate the SABR implied volatility for a given strike",
      parameters: {
        F: 0.03, // Forward rate
        K: 0.035, // Strike
        alpha: 0.15, // Initial volatility
        beta: 0.7, // CEV parameter
        rho: -0.3, // Correlation
        nu: 0.3, // Vol of vol
        T: 5 // Maturity
      },
      solution: 0.163,
      explanation: "Using the SABR volatility approximation formula with the given parameters yields an implied volatility of 16.3%.",
      difficulty: 10
    }
  ],
  master: [
    {
      id: 501,
      type: "Autocallable Structure",
      question: "Calculate the fair coupon of an autocallable structure",
      parameters: {
        S: 100,
        autocallBarrier: 105,
        protectionBarrier: 70,
        callDates: [1, 2, 3], // Years
        r: 0.03,
        q: 0.01, // Dividend yield
        sigma: 0.25
      },
      solution: 0.082,
      explanation: "Using Monte Carlo simulation to value the structure and solve for the fair coupon gives a rate of 8.2%.",
      difficulty: 10
    },
    {
      id: 502,
      type: "Basket Option",
      question: "Price a worst-of put option on three assets",
      parameters: {
        S: [100, 95, 105],
        K: 95,
        r: 0.03,
        T: 0.5,
        sigma: [0.2, 0.25, 0.22],
        correlation: [
          [1, 0.6, 0.5],
          [0.6, 1, 0.7],
          [0.5, 0.7, 1]
        ]
      },
      solution: 7.45,
      explanation: "Using Monte Carlo simulation with correlated asset paths, the worst-of put option is worth $7.45.",
      difficulty: 10
    },
    {
      id: 503,
      type: "TARF Pricing",
      question: "Price a Target Redemption Forward (TARF) contract",
      parameters: {
        S: 1.2, // EUR/USD
        K: 1.25, // Strike
        targetAmount: 0.15, // Target profit per unit
        notional: 1000000, // EUR
        settlementDates: 12, // Monthly for 1 year
        r_domestic: 0.01,
        r_foreign: 0.03,
        sigma: 0.12
      },
      solution: 37500,
      explanation: "The fair value of the TARF contract with the given parameters is approximately $37,500.",
      difficulty: 10
    },
    {
      id: 504,
      type: "Callable Bond",
      question: "Calculate the price of a 5-year callable bond",
      parameters: {
        faceValue: 100,
        coupon: 0.04, // Annual
        yieldCurve: [0.02, 0.025, 0.03, 0.032, 0.035], // Zero rates for years 1-5
        callSchedule: [
          { time: 3, price: 102 },
          { time: 4, price: 101 }
        ],
        sigma: 0.2 // Interest rate volatility
      },
      solution: 103.8,
      explanation: "Using a binomial interest rate tree to model the callable bond gives a price of $103.8.",
      difficulty: 10
    },
    {
      id: 505,
      type: "Mountain Range",
      question: "Price a Himalaya option on a basket of 5 assets",
      parameters: {
        S: [100, 95, 105, 98, 102],
        K: 100,
        r: 0.03,
        T: 3,
        observations: 3, // Annual
        sigma: [0.2, 0.22, 0.25, 0.18, 0.21],
        correlation: 0.6 // Uniform correlation
      },
      solution: 12.65,
      explanation: "Using Monte Carlo simulation, the Himalaya option (where best performer is removed at each observation) is worth $12.65.",
      difficulty: 10
    },
    {
      id: 506,
      type: "Volatility Trading",
      question: "Calculate the P&L of a variance swap",
      parameters: {
        strikeVol: 0.2, // Strike volatility
        realizedVol: 0.25, // Realized volatility
        vega: 100000, // Vega notional in $
        varNotional: 250000 // Variance notional
      },
      solution: 31250,
      explanation: "P&L = Variance Notional × (Realized Variance - Strike Variance) = 250000 × (0.25² - 0.2²) = 250000 × (0.0625 - 0.04) = 250000 × 0.0225 = $31,250",
      difficulty: 10
    },
    {
      id: 507,
      type: "Local Stochastic Volatility",
      question: "Calibrate a local stochastic volatility model parameter",
      parameters: {
        marketVols: [0.22, 0.21, 0.20, 0.19, 0.20],
        strikes: [90, 95, 100, 105, 110],
        S: 100,
        T: 1,
        kappa: 2, // Mean reversion
        theta: 0.04, // Long-run variance
        sigma: 0.3, // Vol of vol
        rho: -0.7, // Correlation
        v0: 0.04 // Initial variance
      },
      solution: 0.127,
      explanation: "Calibrating the mixing parameter between local and stochastic volatility models to match the market smile gives a value of 0.127.",
      difficulty: 10
    },
    {
      id: 508,
      type: "Power Option",
      question: "Price a power call option with payoff (S_T^2 - K)+ using Monte Carlo",
      parameters: {
        S: 100,
        K: 10000,
        r: 0.03,
        T: 0.5,
        sigma: 0.25,
        power: 2,
        simulations: 50000
      },
      solution: 742.5,
      explanation: "Using Monte Carlo simulation for a power option with quadratic payoff gives a price of $742.5.",
      difficulty: 10
    },
    {
      id: 509,
      type: "Cross-Asset Hedging",
      question: "Calculate the optimal hedge ratio between two correlated assets",
      parameters: {
        sigmaX: 0.25, // Volatility of asset to hedge
        sigmaY: 0.2, // Volatility of hedging instrument
        rho: 0.7, // Correlation
        positionX: 1000000 // $ amount of position to hedge
      },
      solution: 875000,
      explanation: "Optimal Hedge Ratio = rho × (sigmaX/sigmaY) × Position in X = 0.7 × (0.25/0.2) × 1,000,000 = 0.7 × 1.25 × 1,000,000 = $875,000",
      difficulty: 9
    },
    {
      id: 510,
      type: "Multi-Asset Option",
      question: "Price a basket option on 5 equally weighted assets",
      parameters: {
        S: [100, 95, 105, 98, 102],
        K: 100,
        weights: [0.2, 0.2, 0.2, 0.2, 0.2],
        r: 0.03,
        T: 1,
        sigma: [0.2, 0.22, 0.25, 0.18, 0.21],
        correlation: [
          [1.0, 0.5, 0.4, 0.3, 0.6],
          [0.5, 1.0, 0.5, 0.4, 0.5],
          [0.4, 0.5, 1.0, 0.5, 0.4],
          [0.3, 0.4, 0.5, 1.0, 0.5],
          [0.6, 0.5, 0.4, 0.5, 1.0]
        ]
      },
      solution: 7.92,
      explanation: "Using a moment-matching approximation for the basket distribution, the basket call option is worth $7.92.",
      difficulty: 10
    }
  ],
  legendary: [
    {
      id: 601,
      type: "XVA Framework",
      question: "Calculate the total XVA (CVA + FVA + KVA) for a portfolio of interest rate swaps",
      parameters: {
        expectedExposure: [2.5, 4.8, 5.6, 4.2, 3.0, 1.8], // In millions $
        survivalProbabilities: [0.995, 0.99, 0.985, 0.98, 0.97, 0.96],
        fundingSpread: 0.005, // 50 bps
        capitalRequirement: 0.12, // 12% of exposure
        capitalCost: 0.10, // 10% return on capital
        lgd: 0.6, // Loss given default
        timePoints: [0.5, 1, 1.5, 2, 2.5, 3] // Years
      },
      solution: 0.678,
      explanation: "The total XVA is the sum of CVA (credit value adjustment), FVA (funding value adjustment), and KVA (capital value adjustment), which equals $678,000.",
      difficulty: 10
    },
    {
      id: 602,
      type: "Hull-White Model",
      question: "Calibrate a Hull-White interest rate model to market caps",
      parameters: {
        capPrices: [0.55, 1.25, 1.95, 2.65, 3.15], // Prices in %
        capMaturities: [1, 2, 3, 4, 5], // Years
        zeroCurve: [0.01, 0.0125, 0.015, 0.0175, 0.02], // Spot rates
        strike: 0.02 // Cap strike rate
      },
      solution: [0.012, 0.05],
      explanation: "Calibrating the Hull-White model parameters a (mean reversion) and σ (volatility) to match the given cap prices results in a=0.012 and σ=0.05.",
      difficulty: 10
    },
    {
      id: 603,
      type: "Heston Implementation",
      question: "Implement and calibrate a Heston stochastic volatility model to match market skew",
      parameters: {
        marketVols: [0.25, 0.22, 0.20, 0.19, 0.21],
        strikes: [80, 90, 100, 110, 120],
        S: 100,
        r: 0.02,
        T: 1,
        initialParams: {
          v0: 0.04,
          theta: 0.04,
          kappa: 1.5,
          sigma: 0.4,
          rho: -0.6
        }
      },
      solution: [0.043, 0.036, 1.2, 0.35, -0.65],
      explanation: "The calibrated Heston parameters [v0, theta, kappa, sigma, rho] that best match the market implied volatility skew are [0.043, 0.036, 1.2, 0.35, -0.65].",
      difficulty: 10
    },
    {
      id: 604,
      type: "SABR Model",
      question: "Calibrate a SABR model to match a volatility smile",
      parameters: {
        marketVols: [0.24, 0.22, 0.20, 0.19, 0.21],
        strikes: [0.01, 0.015, 0.02, 0.025, 0.03],
        F: 0.02, // Forward rate
        T: 5, // Maturity in years
        beta: 0.5 // Fixed CEV parameter
      },
      solution: [0.13, -0.3, 0.4],
      explanation: "The calibrated SABR parameters [alpha, rho, nu] that best match the given volatility smile are [0.13, -0.3, 0.4].",
      difficulty: 10
    },
    {
      id: 605,
      type: "Neural Network Pricing",
      question: "Train a neural network to approximate Black-Scholes prices and calculate error",
      parameters: {
        architecture: [5, 20, 20, 1], // Input, hidden layers, output
        trainingData: 10000, // Number of samples
        testData: 1000,
        inputRanges: {
          S: [50, 150],
          K: [50, 150],
          T: [0.1, 2],
          r: [0, 0.1],
          sigma: [0.1, 0.5]
        }
      },
      solution: 0.0032,
      explanation: "After training the neural network with the given architecture on Black-Scholes option prices, the mean squared error on the test set is 0.0032.",
      difficulty: 10
    },
    {
      id: 606,
      type: "Delta-Hedging Strategy",
      question: "Calculate the P&L of a delta-hedging strategy under discrete rebalancing",
      parameters: {
        S0: 100,
        K: 100,
        r: 0.02,
        T: 0.25,
        sigma: 0.2,
        realizedPaths: [
          [100, 102, 99, 103, 105, 106],
          [100, 98, 95, 93, 97, 99]
        ],
        rebalancingFrequency: "weekly"
      },
      solution: [-0.85, 1.12],
      explanation: "The P&L from delta-hedging a call option with weekly rebalancing along the two given price paths is -$0.85 and $1.12 respectively.",
      difficulty: 10
    },
    {
      id: 607,
      type: "Interest Rate Model",
      question: "Implement a G2++ two-factor interest rate model and price a callable bond",
      parameters: {
        a: 0.05, // Mean reversion of first factor
        b: 0.1, // Mean reversion of second factor
        sigma1: 0.01, // Volatility of first factor
        sigma2: 0.015, // Volatility of second factor
        rho: -0.2, // Correlation between factors
        zeroCurve: [0.01, 0.015, 0.02, 0.025, 0.028], // Spot rates for years 1-5
        callSchedule: [
          { time: 3, price: 102 },
          { time: 4, price: 101 }
        ],
        faceValue: 100,
        coupon: 0.03 // Annual
      },
      solution: 101.25,
      explanation: "Using the G2++ two-factor interest rate model with the given parameters, the callable bond price is $101.25.",
      difficulty: 10
    },
    {
      id: 608,
      type: "Bermudan Swaption",
      question: "Price a Bermudan swaption using a Libor Market Model",
      parameters: {
        notional: 10000000,
        strike: 0.03,
        tenor: 5, // Years
        exerciseDates: [1, 2, 3, 4], // Years
        forwardRates: [0.025, 0.028, 0.03, 0.031, 0.032], // Initial forward rates
        volatilities: [0.2, 0.19, 0.18, 0.17, 0.16], // Volatilities of forward rates
        correlations: 0.8 // Uniform correlation
      },
      solution: 215000,
      explanation: "Using a Libor Market Model with the given parameters, the Bermudan swaption has a value of approximately $215,000.",
      difficulty: 10
    },
    {
      id: 609,
      type: "Regime-Switching",
      question: "Implement a two-regime switching model for option pricing",
      parameters: {
        S: 100,
        K: 100,
        r: [0.02, 0.05], // Risk-free rates in regimes 1 and 2
        sigma: [0.15, 0.3], // Volatilities in regimes 1 and 2
        lambda: [2, 3], // Transition intensities
        T: 1,
        initialRegime: 1 // Starting in regime 1
      },
      solution: 9.45,
      explanation: "Using a two-regime switching model with the given parameters, the call option price is $9.45.",
      difficulty: 10
    },
    {
      id: 610,
      type: "Reinforcement Learning",
      question: "Design a reinforcement learning agent for delta-hedging and evaluate its performance",
      parameters: {
        environment: "Black-Scholes",
        S0: 100,
        K: 100,
        r: 0.02,
        sigma: 0.2,
        T: 0.25,
        transactionCost: 0.0005, // 5 bps
        rewardFunction: "negative mean squared error",
        episodes: 1000,
        benchmark: "daily rebalancing"
      },
      solution: 0.18,
      explanation: "The reinforcement learning agent achieves an 18% reduction in hedging cost compared to the benchmark daily rebalancing strategy.",
      difficulty: 10
    }
  ]
};

// Helper function to get difficulty color class
export const getDifficultyColorClass = (difficulty: DifficultyLevel): string => {
  switch (difficulty) {
    case 'easy':
      return 'bg-green-600/80';
    case 'medium':
      return 'bg-yellow-600/80';
    case 'hard':
      return 'bg-orange-600/80';
    case 'expert':
      return 'bg-red-600/80';
    case 'master':
      return 'bg-purple-600/80';
    case 'legendary':
      return 'bg-indigo-600/80';
    default:
      return 'bg-blue-600/80';
  }
};

