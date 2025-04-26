import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { safeTranslate } from '@/utils/translationUtils';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ThumbsUp, Eye, Calendar, User, MessageSquare, Share2, Bookmark, BookOpen } from 'lucide-react';
import PayoffChart from '@/components/strategies/PayoffChart';
import GreekDisplay from '@/components/strategies/GreekDisplay';
import MarkdownMathRenderer from '../../components/editors/MarkdownMathRenderer';
import { Strategy } from '@/types/community';

// Add mock strategies data properly typed
const mockStrategies: Strategy[] = [
  {
    id: 1,
    type: "strategy" as const, // Use const assertion to ensure it's exactly "strategy"
    title: "Stratégie de Volatilité avec Butterfly Spread",
    author: "Alex Dupont",
    authorAvatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=400&auto=format&fit=crop&q=60",
    summary: "Une stratégie d'options utilisant un butterfly spread pour profiter de la volatilité dans un marché stable.",
    content: "# Stratégie de Volatilité avec Butterfly Spread\n\nCette stratégie vise à capitaliser sur des marchés à volatilité modérée en utilisant une structure de butterfly spread...",
    date: "15 Avril 2025",
    views: 245,
    likes: 32,
    tags: ["Options", "Volatilité", "Butterfly Spread"],
    published: true,
    strategyType: "pricing",
    strategyData: {
      // Sample strategy data
      instruments: [
        { type: "option", strike: 100, optionType: "call", position: "long", quantity: 1 },
        { type: "option", strike: 110, optionType: "call", position: "short", quantity: 2 },
        { type: "option", strike: 120, optionType: "call", position: "long", quantity: 1 }
      ],
      underlyingPrice: 105,
      interestRate: 0.02,
      volatility: 0.25,
      daysToExpiry: 30
    }
  }
];

const StrategyDetail = () => {
  // Fix the type issue with useParams
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const [strategy, setStrategy] = useState<Strategy | undefined>(undefined);
  const [results, setResults] = useState<any>(null); // Placeholder for strategy results

  useEffect(() => {
    if (id) {
      // Find the strategy in the mock data
      const foundStrategy = mockStrategies.find(strategy => strategy.id === Number(id));
      if (foundStrategy) {
        setStrategy(foundStrategy);
      } else {
        console.log(`Strategy with id ${id} not found`);
      }
    }
  }, [id]);

  // Placeholder function to simulate strategy calculation
  const calculateStrategy = () => {
    // Simulate calculation and set results
    setResults({
      payoff: [10, 20, 15, 25, 30],
      greeks: { delta: 0.5, gamma: 0.1, theta: -0.05 }
    });
  };

  if (!strategy) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-4">
          <Link to="/community/explore" className="text-finance-accent hover:underline flex items-center">
            <ChevronLeft className="h-4 w-4 mr-1" />
            {safeTranslate(t, 'community.explore', 'Explorer')}
          </Link>
        </div>
        <Card className="finance-card p-6">
          <CardContent>
            {safeTranslate(t, 'community.strategyNotFound', 'Stratégie non trouvée')}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-4">
        <Link to="/community/explore" className="text-finance-accent hover:underline flex items-center">
          <ChevronLeft className="h-4 w-4 mr-1" />
          {safeTranslate(t, 'community.explore', 'Explorer')}
        </Link>
      </div>

      <Card className="finance-card">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>{strategy.title}</span>
            <Badge variant="secondary">{strategy.type}</Badge>
          </CardTitle>
          <CardDescription>
            <div className="flex items-center text-finance-lightgray">
              <User className="h-4 w-4 mr-1" />
              {strategy.author}
              <span className="mx-2">•</span>
              <Calendar className="h-4 w-4 mr-1" />
              {strategy.date}
            </div>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="mb-4">
            <MarkdownMathRenderer content={strategy.content} />
          </div>

          {/* Payoff Chart and Greek Display */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-80">
              <PayoffChart strategy={strategy} results={results} />
            </div>
            <div>
              <GreekDisplay strategy={strategy} results={results} />
            </div>
          </div>

          {/* Simulate Calculation Button */}
          <Button variant="finance" onClick={calculateStrategy}>
            {safeTranslate(t, 'community.calculateStrategy', 'Simuler le calcul')}
          </Button>
        </CardContent>

        <CardFooter className="flex justify-between items-center">
          <div className="flex items-center text-finance-lightgray">
            <ThumbsUp className="h-4 w-4 mr-2" />
            {strategy.likes}
            <span className="mx-2">•</span>
            <Eye className="h-4 w-4 mr-2" />
            {strategy.views}
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="icon">
              <Share2 className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Bookmark className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default StrategyDetail;
