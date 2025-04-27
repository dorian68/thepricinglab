
import { Strategy as CommunityStrategy } from '@/types/community';
import { Strategy as TradingStrategy, OptionLeg } from '@/types/strategies';

/**
 * Adapts a community strategy to a trading strategy format
 */
export function adaptCommunityToTradingStrategy(communityStrategy: CommunityStrategy): TradingStrategy {
  // Extract strategy data or use defaults
  const strategyData = communityStrategy.strategyData || {};
  
  return {
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
    }
  };
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
    strategyData: {
      ...tradingStrategy.parameters,
      category: tradingStrategy.category
    }
  };
}
