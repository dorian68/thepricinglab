
import { Strategy as CommunityStrategy } from '@/types/community';
import { Strategy as TradingStrategy, OptionLeg, UnderlyingAsset, StructuredProductFlow, Coupon } from '@/types/strategies';

/**
 * Adapts a community strategy to a trading strategy format
 */
export function adaptCommunityToTradingStrategy(communityStrategy: CommunityStrategy): TradingStrategy {
  // Extract strategy data or use defaults
  const strategyData = communityStrategy.strategyData || {};
  
  const result: TradingStrategy = {
    id: communityStrategy.id.toString(),
    name: communityStrategy.title || "Unnamed Strategy",
    category: strategyData.category || "vanilla", // Default category
    description: communityStrategy.summary || "",
    parameters: {
      spotPrice: strategyData.spotPrice || 100,
      volatility: strategyData.volatility || 0.2,
      timeToMaturity: strategyData.timeToMaturity || 1.0,
      interestRate: strategyData.interestRate || 0.05,
      dividendYield: strategyData.dividendYield || 0,
      legs: strategyData.legs || [
        {
          strike: 100,
          type: "call",
          position: "long",
          quantity: 1
        }
      ]
    },
    isDraft: communityStrategy.isDraft || false
  };
  
  // Add structured product properties if available
  if (strategyData.underlyingAssets) {
    result.parameters.underlyingAssets = strategyData.underlyingAssets;
  }
  
  if (strategyData.structuredFlows) {
    result.parameters.structuredFlows = strategyData.structuredFlows;
  }
  
  if (strategyData.coupons) {
    result.parameters.coupons = strategyData.coupons;
  }
  
  if (strategyData.nominal) {
    result.parameters.nominal = strategyData.nominal;
  }
  
  return result;
}

/**
 * Check if a strategy object is a Community Strategy
 */
export function isCommunityStrategy(strategy: any): strategy is CommunityStrategy {
  return strategy && typeof strategy === 'object' && 'type' in strategy && strategy.type === 'strategy';
}

/**
 * Check if a strategy object is a Trading Strategy
 */
export function isTradingStrategy(strategy: any): strategy is TradingStrategy {
  return strategy && typeof strategy === 'object' && 'parameters' in strategy;
}

/**
 * Get appropriate strategy object for the calculations
 */
export function getCalculationStrategy(strategy: CommunityStrategy | TradingStrategy): TradingStrategy {
  if (isCommunityStrategy(strategy)) {
    return adaptCommunityToTradingStrategy(strategy);
  }
  return strategy;
}

/**
 * Adapts a trading strategy to a community strategy format
 */
export function adaptTradingToCommunityStrategy(
  tradingStrategy: TradingStrategy, 
  additionalData: Partial<CommunityStrategy> = {}
): CommunityStrategy {
  // Create strategy data from trading strategy parameters
  const strategyData = {
    ...tradingStrategy.parameters,
    category: tradingStrategy.category
  };
  
  return {
    id: tradingStrategy.id || "temp-id",
    type: "strategy",
    title: tradingStrategy.name || "Unnamed Strategy",
    author: additionalData.author || "Anonymous", 
    authorAvatar: additionalData.authorAvatar || "",
    summary: tradingStrategy.description || "",
    content: additionalData.content || `# ${tradingStrategy.name}\n\n${tradingStrategy.description}`,
    date: additionalData.date || new Date().toISOString(),
    views: additionalData.views || 0,
    likes: additionalData.likes || 0,
    tags: additionalData.tags || ["options", "strategy"],
    published: additionalData.published !== undefined ? additionalData.published : true,
    strategyType: additionalData.strategyType || "pricing",
    isDraft: tradingStrategy.isDraft || false,
    strategyData: strategyData
  };
}

/**
 * Creates a structured product strategy with default values
 */
export function createDefaultStructuredStrategy(): TradingStrategy {
  return {
    id: "new-structured-product",
    name: "Nouveau Produit Structuré",
    category: "structured",
    description: "Description du produit structuré",
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
          type: "call",
          position: "long",
          quantity: 1
        }
      ],
      underlyingAssets: [
        {
          id: "sample-stock",
          name: "Action Exemple",
          type: "stock",
          price: 100,
          volatility: 0.2,
          dividendYield: 0.01
        }
      ]
    },
    isDraft: false
  };
}
