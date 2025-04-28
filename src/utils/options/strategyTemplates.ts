
import { Strategy } from '@/types/strategies';
import { v4 as uuidv4 } from 'uuid';

interface TemplateStrategy extends Omit<Strategy, 'id'> {
  template: string;
  description: string;
  category: 'income' | 'growth' | 'protection';
}

const createTemplate = (template: TemplateStrategy): Strategy => ({
  ...template,
  id: uuidv4()
});

export const structuredProductTemplates: TemplateStrategy[] = [
  {
    template: 'reverse-convertible',
    name: 'Reverse Convertible',
    description: 'Produit à coupon fixe avec risque de conversion en actions',
    category: 'income',
    parameters: {
      spotPrice: 100,
      volatility: 0.2,
      timeToMaturity: 1.0,
      interestRate: 0.05,
      dividendYield: 0,
      nominal: 1000,
      legs: [
        {
          strike: 100,
          type: 'put',
          position: 'short',
          quantity: 1
        }
      ],
      structuredFlows: [
        {
          id: 'coupon-1',
          type: 'coupon',
          description: 'Coupon fixe annuel',
          outcome: {
            type: 'payment',
            value: 8
          }
        },
        {
          id: 'redemption-1',
          type: 'redemption',
          description: 'Remboursement à maturité',
          condition: {
            assetId: '',
            threshold: 80,
            operator: '>'
          },
          outcome: {
            type: 'redemption',
            value: '100%'
          }
        }
      ]
    }
  },
  {
    template: 'autocall',
    name: 'Phoenix Autocall',
    description: 'Produit avec possibilité de remboursement anticipé et coupons conditionnels',
    category: 'income',
    parameters: {
      spotPrice: 100,
      volatility: 0.2,
      timeToMaturity: 5.0,
      interestRate: 0.05,
      dividendYield: 0,
      nominal: 1000,
      legs: [
        {
          strike: 100,
          type: 'put',
          position: 'short',
          quantity: 1,
          barrier: {
            type: 'knock-in',
            level: 60
          }
        }
      ],
      structuredFlows: [
        {
          id: 'autocall-1',
          type: 'autocall',
          description: 'Observation trimestrielle',
          condition: {
            assetId: '',
            threshold: 100,
            operator: '>=',
            isPeriodic: true,
            frequency: 'quarterly'
          },
          outcome: {
            type: 'redemption',
            value: '100%'
          }
        },
        {
          id: 'coupon-1',
          type: 'coupon',
          description: 'Coupon conditionnel trimestriel',
          condition: {
            assetId: '',
            threshold: 80,
            operator: '>='
          },
          outcome: {
            type: 'payment',
            value: 2
          }
        }
      ]
    }
  },
  {
    template: 'bonus-certificate',
    name: 'Bonus Certificate',
    description: 'Participation à la hausse avec protection conditionnelle du capital',
    category: 'growth',
    parameters: {
      spotPrice: 100,
      volatility: 0.2,
      timeToMaturity: 2.0,
      interestRate: 0.05,
      dividendYield: 0,
      nominal: 1000,
      legs: [
        {
          strike: 100,
          type: 'call',
          position: 'long',
          quantity: 1,
          barrier: {
            type: 'knock-out',
            level: 70
          }
        }
      ],
      structuredFlows: [
        {
          id: 'redemption-1',
          type: 'redemption',
          description: 'Remboursement bonifié',
          condition: {
            assetId: '',
            threshold: 70,
            operator: '>'
          },
          outcome: {
            type: 'redemption',
            value: '120%'
          }
        }
      ]
    }
  }
];

export const getTemplateStrategy = (templateName: string): Strategy | null => {
  const template = structuredProductTemplates.find(t => t.template === templateName);
  return template ? createTemplate(template) : null;
};

export const getAllTemplates = (): Strategy[] => {
  return structuredProductTemplates.map(createTemplate);
};
