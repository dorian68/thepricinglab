
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { safeTranslate } from '@/utils/translationUtils';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ThumbsUp, Eye, Calendar, User, MessageSquare, Share2, Bookmark, BookOpen, Calculator, Layers, PlusCircle } from 'lucide-react';
import PayoffChart from '@/components/strategies/PayoffChart';
import GreekDisplay from '@/components/strategies/GreekDisplay';
import MarkdownMathRenderer from '../../components/editors/MarkdownMathRenderer';
import { Strategy } from '@/types/community';
import { calculateStrategyResults } from '@/utils/options/strategyCalculator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  },
  {
    id: 2,
    type: "strategy" as const,
    title: "Iron Condor sur Indice S&P 500",
    author: "Michel Lefebvre",
    authorAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=60",
    summary: "Stratégie de volatilité neutre utilisant quatre jambes d'options pour profiter d'un marché stable.",
    content: "# Iron Condor sur Indice S&P 500\n\nL'Iron Condor est une stratégie d'options à quatre jambes qui combine un bull put spread et un bear call spread. Cette stratégie est utilisée lorsque l'on anticipe une faible volatilité du marché...\n\n## Structure\n\n1. Achat d'un put avec un strike bas (protection)\n2. Vente d'un put avec un strike légèrement plus élevé\n3. Vente d'un call avec un strike plus élevé\n4. Achat d'un call avec un strike encore plus élevé (protection)\n\n## Avantages\n\n- Prime nette créditée au compte\n- Profit si le marché reste dans une certaine fourchette\n- Risque limité des deux côtés\n\n## Inconvénients\n\n- Profit limité\n- Nécessite un suivi attentif près des dates d'expiration\n- Performance réduite dans des marchés très directionnels",
    date: "5 Mai 2025",
    views: 187,
    likes: 24,
    tags: ["Options", "Iron Condor", "S&P 500", "Volatilité"],
    published: true,
    strategyType: "trading",
    strategyData: {
      instruments: [
        { type: "option", strike: 4800, optionType: "put", position: "long", quantity: 1 },
        { type: "option", strike: 4900, optionType: "put", position: "short", quantity: 1 },
        { type: "option", strike: 5100, optionType: "call", position: "short", quantity: 1 },
        { type: "option", strike: 5200, optionType: "call", position: "long", quantity: 1 }
      ],
      underlyingPrice: 5000,
      interestRate: 0.03,
      volatility: 0.18,
      daysToExpiry: 45
    }
  }
];

const StrategyDetail = () => {
  // Fix the type issue with useParams
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const [strategy, setStrategy] = useState<Strategy | undefined>(undefined);
  const [results, setResults] = useState<any>(null); // Placeholder for strategy results
  const [pricingMethod, setPricingMethod] = useState<'analytical' | 'monteCarlo'>('analytical');
  const [isAddedToPortfolio, setIsAddedToPortfolio] = useState(false);

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

  // Calculate results when strategy changes or pricing method changes
  useEffect(() => {
    if (strategy) {
      calculateStrategy();
    }
  }, [strategy, pricingMethod]);

  // Function to simulate strategy calculation
  const calculateStrategy = () => {
    if (!strategy) return;

    // In a real implementation, this would use different calculation methods
    // based on the selected pricing method
    const calculatedResults = strategy.strategyData ? {
      payoff: [10, 20, 15, 25, 30],
      payoffPoints: Array.from({ length: 50 }, (_, i) => ({
        x: 90 + i, // Generate x values from 90 to 139
        y: Math.sin((i - 25) / 10) * 20 // Generate a sine wave for demonstration
      })),
      totalPrice: 250,
      maxProfit: 500,
      maxLoss: -200,
      totalGreeks: { 
        delta: 0.5, 
        gamma: 0.1, 
        theta: -0.05, 
        vega: 3.2,
        rho: 1.5
      }
    } : null;
    
    setResults(calculatedResults);
  };

  // Function to handle adding strategy to portfolio
  const handleAddToPortfolio = () => {
    setIsAddedToPortfolio(!isAddedToPortfolio);
    const message = isAddedToPortfolio 
      ? 'Stratégie retirée du portefeuille' 
      : 'Stratégie ajoutée au portefeuille';
    alert(message);
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

      <Card className="finance-card mb-8">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <span>{strategy.title}</span>
                <Badge variant="secondary">{strategy.strategyType}</Badge>
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
            </div>

            <div className="flex gap-2">
              <Button 
                variant={isAddedToPortfolio ? "default" : "outline"} 
                size="sm" 
                onClick={handleAddToPortfolio}
              >
                <Layers className="h-4 w-4 mr-1" />
                {isAddedToPortfolio ? 'Ajouté au portefeuille' : 'Ajouter au portefeuille'}
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-1" />
                Partager
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Strategy tags */}
          <div className="flex flex-wrap gap-2">
            {strategy.tags.map((tag, index) => (
              <Badge key={index} variant="outline">{tag}</Badge>
            ))}
          </div>

          {/* Strategy description */}
          <div className="mb-6">
            <MarkdownMathRenderer content={strategy.content} />
          </div>

          <div className="bg-finance-charcoal rounded-lg p-4 mb-4">
            <h3 className="text-lg font-medium mb-3 text-finance-accent">Analyse et Simulation</h3>
            
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-finance-lightgray">Méthode de pricing:</span>
                <Select 
                  value={pricingMethod}
                  onValueChange={(value: 'analytical' | 'monteCarlo') => setPricingMethod(value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="analytical">Pricing Analytique</SelectItem>
                    <SelectItem value="monteCarlo">Monte Carlo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button variant="finance" onClick={calculateStrategy}>
                <Calculator className="h-4 w-4 mr-2" />
                {safeTranslate(t, 'community.calculateStrategy', 'Recalculer')}
              </Button>
            </div>

            {/* Payoff Chart and Greek Display */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              <div className="h-80">
                <h4 className="text-sm font-medium mb-2 text-finance-lightgray">Diagramme de Payoff</h4>
                <PayoffChart strategy={strategy} results={results} />
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2 text-finance-lightgray">Sensibilités (Greeks)</h4>
                <GreekDisplay strategy={strategy} results={results} />
              </div>
            </div>
          </div>

          {/* Strategy integration with Trading Lab */}
          <Card className="bg-finance-charcoal border-dashed border-finance-lightgray">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Utiliser dans le Trading Lab</CardTitle>
              <CardDescription>
                Cette stratégie peut être utilisée dans le Trading Lab pour des analyses plus approfondies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" size="sm">
                  <BookOpen className="h-4 w-4 mr-1" />
                  Backtests
                </Button>
                <Button variant="outline" size="sm">
                  <Calculator className="h-4 w-4 mr-1" />
                  Stress Tests
                </Button>
                <Button variant="finance" size="sm">
                  <PlusCircle className="h-4 w-4 mr-1" />
                  Créer une variante
                </Button>
              </div>
            </CardContent>
          </Card>
        </CardContent>

        <CardFooter className="flex justify-between items-center border-t border-finance-steel pt-4">
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

      {/* Related strategies section */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-4">Stratégies similaires</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mockStrategies
            .filter(s => s.id !== strategy.id)
            .slice(0, 2)
            .map((relatedStrategy) => (
              <Link 
                key={relatedStrategy.id}
                to={`/community/strategy/${relatedStrategy.id}`}
                className="block"
              >
                <Card className="hover:border-finance-accent transition-colors">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{relatedStrategy.title}</CardTitle>
                    <CardDescription className="text-xs">
                      {relatedStrategy.author} • {relatedStrategy.tags.join(', ')}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
        </div>
      </div>
    </div>
  );
};

export default StrategyDetail;
