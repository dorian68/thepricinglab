
export type PublicationType = 'article' | 'strategy';
export type StrategyType = 'pricing' | 'hedging' | 'trading' | 'other';

// New type for calibration model domains
export type CalibrationDomain = 'equity' | 'rates' | 'fx' | 'vol' | 'commodities' | 'credit' | 'other';

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
  strategyType?: StrategyType;
  isDraft?: boolean;
}

// Updated interface for user calibration models with demoFile as string
export interface CalibrationModel {
  id: string;
  name: string;
  description: string;
  code: string;
  domain: CalibrationDomain;
  author: string;
  authorId: string;
  createdAt: string;
  isPublic: boolean;
  isDraft: boolean;
  demoFile?: string; // Changed from File to string
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

// Form data for calibration model submission
export interface CalibrationModelFormData {
  name: string;
  description: string;
  code: string;
  domain: CalibrationDomain;
  isPublic: boolean;
  demoFile?: File | null;
}
