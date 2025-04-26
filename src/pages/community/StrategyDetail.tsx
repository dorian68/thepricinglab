import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, Calendar, User, Eye, ThumbsUp, ChevronRight, Share2, Calculator, BarChart3, TrendingUp, Activity, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MarkdownMathRenderer from "../../components/editors/MarkdownMathRenderer";
import { Strategy, Publication } from "../../types/community";

const PayoffChart = ({ strategy, results }: any) => {
  return (
    <div className="flex items-center justify-center h-full">
      <p className="text-center text-finance-lightgray">
        Diagramme de Payoff à implémenter
      </p>
    </div>
  );
};

const GreekDisplay = ({ strategy, results }: any) => {
  return (
    <div className="flex items-center justify-center h-full">
      <p className="text-center text-finance-lightgray">
        Analyse des Greeks à implémenter
      </p>
    </div>
  );
};

const StrategyDetail = () => {
  const { id } = useParams<{id: string}>();
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedStrategies, setRelatedStrategies] = useState<Publication[]>([]);
  const [activeTab, setActiveTab] = useState("description");

  useEffect(() => {
    const strategyId = parseInt(id || "0");
    const foundStrategy = mockStrategies.find(s => s.id === strategyId);
    
    if (foundStrategy) {
      setStrategy(foundStrategy);
      
      const related = mockStrategies
        .filter(s => s.id !== strategyId && s.tags.some(tag => foundStrategy.tags.includes(tag)))
        .slice(0, 3);
      
      setRelatedStrategies(related);
    }
    
    setLoading(false);
  }, [id]);

  const mockResults = {
    totalPrice: 4.25,
    totalGreeks: {
      delta: 0.45,
      gamma: 0.08,
      vega: 0.32,
      theta: -0.15,
      rho: 0.05
    },
    legResults: [
      {
        price: 3.75,
        greeks: {
          delta: 0.52,
          gamma: 0.09,
          vega: 0.30,
          theta: -0.12,
          rho: 0.04
        }
      },
      {
        price: 0.50,
        greeks: {
          delta: -0.07,
          gamma: -0.01,
          vega: 0.02,
          theta: -0.03,
          rho: 0.01
        }
      }
    ],
    payoffPoints: Array.from({length: 100}, (_, i) => ({
      x: 100 + i, 
      y: Math.max(-5, Math.min(15, 
        (i < 30) ? -3 : 
        (i > 70) ? 10 - (i-70)*0.2 : 
        (i-30)*0.3
      ))
    })),
    breakEvenPoints: [118, 135],
    maxProfit: 12.5,
    maxLoss: 5.0
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-8 text-center">Chargement...</div>;
  }

  if (!strategy) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Stratégie introuvable</h1>
        <p className="text-finance-lightgray mb-6">Cette stratégie n'existe pas ou a été supprimée.</p>
        <Button asChild variant="finance">
          <Link to="/community/explore">Retour aux publications</Link>
        </Button>
      </div>
    );
  }

  const getStrategyTypeBadge = (type: string) => {
    switch (type) {
      case "pricing":
        return <Badge variant="level" className="bg-blue-500/20 text-blue-400 border-blue-500/30">Pricing d'options</Badge>;
      case "hedging":
        return <Badge variant="level" className="bg-green-500/20 text-green-400 border-green-500/30">Couverture</Badge>;
      case "trading":
        return <Badge variant="level" className="bg-purple-500/20 text-purple-400 border-purple-500/30">Trading</Badge>;
      default:
        return <Badge variant="level">Autre</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Helmet>
        <title>{strategy.title} | The Pricing Library</title>
        <meta name="description" content={strategy.summary} />
      </Helmet>

      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link to="/community/explore" className="text-finance-accent flex items-center hover:underline mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux publications
          </Link>
          
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="premium">Stratégie</Badge>
            {getStrategyTypeBadge(strategy.strategyType)}
          </div>
          
          <h1 className="text-3xl font-bold mb-6">{strategy.title}</h1>
          
          <div className="flex items-center mb-6">
            <div className="h-10 w-10 rounded-full overflow-hidden mr-3">
              <img 
                src={strategy.authorAvatar} 
                alt={strategy.author} 
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <div className="text-finance-offwhite font-medium">{strategy.author}</div>
              <div className="flex items-center text-xs text-finance-lightgray">
                <Calendar className="h-3 w-3 mr-1" />
                <span>Publié le {strategy.date}</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-6">
            {strategy.tags.map((tag, index) => (
              <Badge key={index} variant="level" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full mb-6">
              <TabsTrigger value="description" className="flex-1">
                <Book className="h-4 w-4 mr-2" />
                Description
              </TabsTrigger>
              <TabsTrigger value="strategy" className="flex-1">
                <BarChart3 className="h-4 w-4 mr-2" />
                Payoff
              </TabsTrigger>
              <TabsTrigger value="greeks" className="flex-1">
                <Activity className="h-4 w-4 mr-2" />
                Greeks
              </TabsTrigger>
              <TabsTrigger value="analyze" className="flex-1">
                <Calculator className="h-4 w-4 mr-2" />
                Analyser
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="description">
              <div className="prose prose-invert max-w-none mb-8">
                <MarkdownMathRenderer content={strategy.content} />
              </div>
            </TabsContent>
            
            <TabsContent value="strategy">
              <Card className="bg-finance-charcoal border-finance-steel/20 mb-6">
                <CardHeader>
                  <CardTitle className="text-lg">Diagramme de Payoff</CardTitle>
                  <CardDescription>Visualisation du profil de gain/perte de la stratégie</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-96">
                    <PayoffChart
                      strategy={{
                        id: "strategy-1",
                        name: strategy.title,
                        category: 'advanced',
                        description: strategy.summary,
                        parameters: {
                          spotPrice: 120,
                          volatility: 0.2,
                          timeToMaturity: 0.25,
                          interestRate: 0.05,
                          dividendYield: 0.02,
                          legs: [
                            {
                              strike: 115,
                              type: 'call',
                              position: 'long',
                              quantity: 1
                            },
                            {
                              strike: 125,
                              type: 'call',
                              position: 'short',
                              quantity: 1
                            }
                          ]
                        }
                      }}
                      results={mockResults}
                    />
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="bg-finance-charcoal border-finance-steel/20">
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">Points d'équilibre</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-semibold text-finance-accent">
                      {mockResults.breakEvenPoints.join(' / ')}
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-finance-charcoal border-finance-steel/20">
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">Gain maximum</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-semibold text-green-400">
                      +{mockResults.maxProfit}
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-finance-charcoal border-finance-steel/20">
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">Perte maximale</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-semibold text-red-400">
                      -{mockResults.maxLoss}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="greeks">
              <Card className="bg-finance-charcoal border-finance-steel/20 mb-6">
                <CardHeader>
                  <CardTitle className="text-lg">Analyse des Greeks</CardTitle>
                  <CardDescription>Sensibilités de la stratégie aux différents facteurs de marché</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-96">
                    <GreekDisplay
                      strategy={{
                        id: "strategy-1",
                        name: strategy.title,
                        category: 'advanced',
                        description: strategy.summary,
                        parameters: {
                          spotPrice: 120,
                          volatility: 0.2,
                          timeToMaturity: 0.25,
                          interestRate: 0.05,
                          dividendYield: 0.02,
                          legs: [
                            {
                              strike: 115,
                              type: 'call',
                              position: 'long',
                              quantity: 1
                            },
                            {
                              strike: 125,
                              type: 'call',
                              position: 'short',
                              quantity: 1
                            }
                          ]
                        }
                      }}
                      results={mockResults}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="analyze">
              <div className="text-center py-8">
                <TrendingUp className="h-16 w-16 mx-auto text-finance-accent mb-4" />
                <h3 className="text-xl font-semibold mb-2">Analyser cette stratégie</h3>
                <p className="text-finance-lightgray mb-6 max-w-md mx-auto">
                  Utilisez nos outils avancés du Trading Lab pour tester cette stratégie avec vos propres paramètres.
                </p>
                <Button asChild variant="finance">
                  <Link to="/trading/strategies">
                    Ouvrir dans le Trading Lab
                  </Link>
                </Button>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-between items-center border-t border-finance-steel/20 pt-6 mt-12">
            <div>
              <p className="text-sm text-finance-lightgray">Cette stratégie vous a-t-elle été utile ?</p>
              <div className="flex items-center mt-2">
                <Button variant="outline" size="sm" className="flex items-center mr-2">
                  <ThumbsUp className="h-4 w-4 mr-1" />
                  J'aime
                </Button>
                <Button variant="outline" size="sm" className="flex items-center">
                  <Share2 className="h-4 w-4 mr-1" />
                  Partager
                </Button>
              </div>
            </div>
            <div>
              <Button asChild variant="finance">
                <Link to="/community/contribute">Créer une stratégie</Link>
              </Button>
            </div>
          </div>
        </div>
        
        {relatedStrategies.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-bold mb-6">Stratégies connexes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedStrategies.map(related => (
                <Card key={related.id} className="overflow-hidden hover:border-finance-accent transition-colors duration-300">
                  <CardHeader className="pb-2">
                    <Badge variant="premium" className="mb-2 w-fit">
                      Stratégie
                    </Badge>
                    <CardTitle className="text-lg">{related.title}</CardTitle>
                  </CardHeader>
                  
                  <CardContent className="pb-2">
                    <CardDescription className="text-finance-lightgray text-sm line-clamp-3">
                      {related.summary}
                    </CardDescription>
                  </CardContent>
                  
                  <CardFooter>
                    <Button variant="link" asChild className="text-finance-accent p-0">
                      <Link to={`/community/strategy/${related.id}`}>
                        Voir la stratégie <ChevronRight className="h-4 w-4 ml-1" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Book = ({ className }: { className?: string }) => {
  return <BookOpen className={className} />;
};

export default StrategyDetail;
