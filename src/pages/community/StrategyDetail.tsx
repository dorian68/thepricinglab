
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, Calendar, User, Eye, ThumbsUp, ChevronRight, Share2, Calculator, BarChart3, TrendingUp, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MarkdownMathRenderer } from "../../components/editors/MarkdownMathRenderer";
import { Strategy, Publication } from "../../types/community";
import { PayoffChart } from "../../components/strategies/PayoffChart";
import { GreekDisplay } from "../../components/strategies/GreekDisplay";

// Mock strategy data
const mockStrategies: Strategy[] = [
  {
    id: 1,
    type: "strategy",
    title: "Stratégie d'arbitrage de volatilité pour indices",
    author: "Sophie Martin",
    authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    summary: "Cette stratégie vise à exploiter les différences entre volatilité implicite et réalisée sur les indices majeurs.",
    content: `
# Stratégie d'arbitrage de volatilité pour indices

## Principe de base

Cette stratégie consiste à exploiter les écarts entre la volatilité implicite des options et la volatilité réalisée historique des indices sous-jacents. L'idée fondamentale est que la volatilité implicite contient souvent une prime de risque qui peut être exploitée dans certaines conditions de marché.

## Structure de la stratégie

La stratégie se compose des éléments suivants :

1. **Identification des indices cibles** - Nous nous concentrons sur les indices liquides comme S&P 500, EuroStoxx 50 et Nikkei 225
2. **Analyse du terme de volatilité** - Construction de la structure par terme de volatilité implicite
3. **Calcul de l'écart de volatilité** - Comparaison avec les volatilités réalisées historiques
4. **Construction de position** - Utilisation de straddles/strangles/condors pour exploiter les écarts

### Formule de calcul de l'écart de volatilité

$$
\\text{Écart de volatilité} = \\sigma_{\\text{implicite}} - \\sigma_{\\text{réalisée}}
$$

Où :
- $\\sigma_{\\text{implicite}}$ est la volatilité implicite des options
- $\\sigma_{\\text{réalisée}}$ est la volatilité réalisée calculée sur une fenêtre historique

## Conditions d'entrée

La stratégie est déclenchée lorsque :

1. L'écart de volatilité dépasse 5 points de pourcentage
2. Le marché présente des signes de stabilisation (RSI entre 40 et 60)
3. Les volumes d'options sont suffisamment importants pour assurer la liquidité

## Position et sizing

Pour un indice donné, nous utilisons la combinaison suivante :

- **Position longue** : Vente de straddles ATM avec expiration 1-2 mois
- **Protection** : Achat de strangles OTM avec même expiration (risk reversal)
- **Scaling** : Sizing basé sur un risque maximal de 2% du portefeuille par position

## Gestion des risques

La stratégie comprend plusieurs mécanismes de protection :

1. **Stop-loss automatique** - Sortie si la perte atteint 3% de la position
2. **Protection contre les événements extrêmes** - Les strangles OTM limitent les pertes en cas de mouvements importants
3. **Surveillance des catalyseurs** - Réduction des positions avant annonces macroéconomiques majeures

## Backtesting et résultats

Sur la période 2010-2023, cette stratégie a généré :

- Rendement annualisé : 14.2% 
- Ratio de Sharpe : 1.76
- Drawdown maximum : 12%
- Taux de succès : 67%

### Visualisation des performances

\`\`\`mermaid
graph LR
    A[Entrée] -->|Écart > 5%| B[Construction position]
    B --> C{Performance?}
    C -->|Target atteint| D[Sortie +]
    C -->|Stop-loss| E[Sortie -]
    C -->|Expiration| F[Évaluation]
    F -->|Rollover?| G[Nouvelle position]
    F -->|Clôture| H[Fin]
\`\`\`

## Adaptation du modèle

Le modèle est adaptable selon les conditions de marché :

1. En période de haute volatilité : réduction des positions et extension des protections
2. En période de basse volatilité : augmentation du levier et réduction des protections

## Conclusion

Cette stratégie d'arbitrage de volatilité offre une exposition intéressante aux primes de risque de volatilité tout en maintenant un profil de risque contrôlé grâce aux protections via options. Son principal avantage est sa faible corrélation avec les rendements des indices, ce qui en fait un bon diversificateur de portefeuille.
    `,
    date: "2024-04-19",
    views: 322,
    likes: 24,
    tags: ["Arbitrage", "Volatilité", "SPX", "Stratégie quantitative"],
    published: true,
    strategyType: "trading"
  },
  {
    id: 2,
    type: "strategy",
    title: "Couverture dynamique pour options sur taux",
    author: "Émilie Lambert",
    authorAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    summary: "Stratégie de couverture dynamique pour options sur taux d'intérêt utilisant une combinaison de Delta et Vega hedging.",
    content: `
# Couverture dynamique pour options sur taux

Cette stratégie propose une approche optimisée pour couvrir les options sur taux d'intérêt en utilisant une combinaison de Delta et Vega hedging.

## Modèle de base

Le modèle utilise une extension du cadre de Black pour les options sur taux, avec ajustement pour la structure par terme des taux forward.
    `,
    date: "2024-04-10",
    views: 178,
    likes: 15,
    tags: ["Hedging", "Options sur taux", "Delta", "Vega"],
    published: true,
    strategyType: "hedging"
  }
];

const StrategyDetail = () => {
  const { id } = useParams<{id: string}>();
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedStrategies, setRelatedStrategies] = useState<Publication[]>([]);
  const [activeTab, setActiveTab] = useState("description");

  useEffect(() => {
    // In a real app, we would fetch the strategy from an API
    // For demo purposes, we'll use the mock data
    const strategyId = parseInt(id || "0");
    const foundStrategy = mockStrategies.find(s => s.id === strategyId);
    
    if (foundStrategy) {
      setStrategy(foundStrategy);
      
      // Find related strategies based on tags
      const related = mockStrategies
        .filter(s => s.id !== strategyId && s.tags.some(tag => foundStrategy.tags.includes(tag)))
        .slice(0, 3);
      
      setRelatedStrategies(related);
    }
    
    setLoading(false);
  }, [id]);

  // Mock strategy results for demonstration
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
                    {/* Use the PayoffChart component from the Trading Lab */}
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
                    {/* Use the GreekDisplay component from the Trading Lab */}
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
