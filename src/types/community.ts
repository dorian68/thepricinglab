
export type PublicationType = 'article' | 'strategy';
export type StrategyType = 'pricing' | 'hedging' | 'trading' | 'other';

export interface Publication {
  id: number | string;
  type: PublicationType;
  title: string;
  author: string;
  authorAvatar?: string;
  summary: string;
  content: string;
  date: string;
  views: number;
  likes: number;
  tags: string[];
  published: boolean;
  strategyType?: StrategyType; // Make strategyType optional on base Publication
  isDraft?: boolean; // Add isDraft property
}

export interface Article extends Publication {
  type: 'article';
}

export interface Strategy extends Publication {
  type: 'strategy';
  strategyType: StrategyType;
  strategyData?: any; // For future integration with the Trading Lab
}

export interface PublicationFormData {
  title: string;
  summary: string;
  content: string;
  tags: string[];
  type: PublicationType;
  strategyType?: StrategyType;
}
