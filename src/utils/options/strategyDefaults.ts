
import { Strategy } from '../../types/strategies';

export const defaultStrategies: Strategy[] = [
  // Vanilla Strategies
  {
    id: 'long-call',
    name: 'Long Call',
    category: 'vanilla',
    description: 'Achat d\'une option d\'achat. Profit potentiel illimité si le prix monte, perte limitée à la prime.',
    parameters: {
      spotPrice: 100,
      volatility: 0.2,
      timeToMaturity: 0.25,
      interestRate: 0.05,
      dividendYield: 0.01,
      legs: [
        {
          strike: 100,
          type: 'call',
          position: 'long',
          quantity: 1
        }
      ]
    }
  },
  {
    id: 'long-put',
    name: 'Long Put',
    category: 'vanilla',
    description: 'Achat d\'une option de vente. Profit potentiel si le prix baisse, perte limitée à la prime.',
    parameters: {
      spotPrice: 100,
      volatility: 0.2,
      timeToMaturity: 0.25,
      interestRate: 0.05,
      dividendYield: 0.01,
      legs: [
        {
          strike: 100,
          type: 'put',
          position: 'long',
          quantity: 1
        }
      ]
    }
  },
  {
    id: 'covered-call',
    name: 'Covered Call',
    category: 'vanilla',
    description: 'Détention du sous-jacent et vente d\'un call. Augmente le rendement mais limite le potentiel de hausse.',
    parameters: {
      spotPrice: 100,
      volatility: 0.2,
      timeToMaturity: 0.25,
      interestRate: 0.05,
      dividendYield: 0.01,
      legs: [
        {
          strike: 110,
          type: 'call',
          position: 'short',
          quantity: 1
        }
      ]
    }
  },
  {
    id: 'protective-put',
    name: 'Protective Put',
    category: 'vanilla',
    description: 'Détention du sous-jacent et achat d\'un put. Limite les pertes potentielles en cas de baisse du prix.',
    parameters: {
      spotPrice: 100,
      volatility: 0.2,
      timeToMaturity: 0.25,
      interestRate: 0.05,
      dividendYield: 0.01,
      legs: [
        {
          strike: 90,
          type: 'put',
          position: 'long',
          quantity: 1
        }
      ]
    }
  },
  
  // Advanced Strategies
  {
    id: 'straddle',
    name: 'Straddle',
    category: 'advanced',
    description: 'Achat d\'un call et d\'un put au même strike. Profite d\'une forte volatilité dans un sens ou dans l\'autre.',
    parameters: {
      spotPrice: 100,
      volatility: 0.2,
      timeToMaturity: 0.25,
      interestRate: 0.05,
      dividendYield: 0.01,
      legs: [
        {
          strike: 100,
          type: 'call',
          position: 'long',
          quantity: 1
        },
        {
          strike: 100,
          type: 'put',
          position: 'long',
          quantity: 1
        }
      ]
    }
  },
  {
    id: 'strangle',
    name: 'Strangle',
    category: 'advanced',
    description: 'Achat d\'un call OTM et d\'un put OTM. Moins cher qu\'un straddle mais nécessite un mouvement plus important.',
    parameters: {
      spotPrice: 100,
      volatility: 0.2,
      timeToMaturity: 0.25,
      interestRate: 0.05,
      dividendYield: 0.01,
      legs: [
        {
          strike: 110,
          type: 'call',
          position: 'long',
          quantity: 1
        },
        {
          strike: 90,
          type: 'put',
          position: 'long',
          quantity: 1
        }
      ]
    }
  },
  {
    id: 'bull-call-spread',
    name: 'Bull Call Spread',
    category: 'advanced',
    description: 'Achat d\'un call ITM et vente d\'un call OTM. Profit limité mais coût réduit.',
    parameters: {
      spotPrice: 100,
      volatility: 0.2,
      timeToMaturity: 0.25,
      interestRate: 0.05,
      dividendYield: 0.01,
      legs: [
        {
          strike: 95,
          type: 'call',
          position: 'long',
          quantity: 1
        },
        {
          strike: 105,
          type: 'call',
          position: 'short',
          quantity: 1
        }
      ]
    }
  },
  {
    id: 'bear-put-spread',
    name: 'Bear Put Spread',
    category: 'advanced',
    description: 'Achat d\'un put ITM et vente d\'un put OTM. Profit limité mais coût réduit.',
    parameters: {
      spotPrice: 100,
      volatility: 0.2,
      timeToMaturity: 0.25,
      interestRate: 0.05,
      dividendYield: 0.01,
      legs: [
        {
          strike: 105,
          type: 'put',
          position: 'long',
          quantity: 1
        },
        {
          strike: 95,
          type: 'put',
          position: 'short',
          quantity: 1
        }
      ]
    }
  },
  {
    id: 'iron-condor',
    name: 'Iron Condor',
    category: 'advanced',
    description: 'Combinaison d\'un bull put spread et d\'un bear call spread. Profit si le prix reste dans une fourchette.',
    parameters: {
      spotPrice: 100,
      volatility: 0.2,
      timeToMaturity: 0.25,
      interestRate: 0.05,
      dividendYield: 0.01,
      legs: [
        {
          strike: 90,
          type: 'put',
          position: 'short',
          quantity: 1
        },
        {
          strike: 85,
          type: 'put',
          position: 'long',
          quantity: 1
        },
        {
          strike: 110,
          type: 'call',
          position: 'short',
          quantity: 1
        },
        {
          strike: 115,
          type: 'call',
          position: 'long',
          quantity: 1
        }
      ]
    }
  },
  {
    id: 'butterfly-spread',
    name: 'Butterfly Spread',
    category: 'advanced',
    description: 'Combinaison d\'un bull spread et d\'un bear spread. Profit maximal si le prix est exactement au strike moyen à l\'échéance.',
    parameters: {
      spotPrice: 100,
      volatility: 0.2,
      timeToMaturity: 0.25,
      interestRate: 0.05,
      dividendYield: 0.01,
      legs: [
        {
          strike: 90,
          type: 'call',
          position: 'long',
          quantity: 1
        },
        {
          strike: 100,
          type: 'call',
          position: 'short',
          quantity: 2
        },
        {
          strike: 110,
          type: 'call',
          position: 'long',
          quantity: 1
        }
      ]
    }
  }
];
