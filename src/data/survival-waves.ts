
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
