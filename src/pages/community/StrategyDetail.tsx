
import React from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, User, Calendar, Eye, Code, ThumbsUp, Download, Share2, FileCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Mock data for a strategy
const mockStrategies = [
  {
    id: "2",
    type: "strategy",
    title: "Stratégie d'arbitrage de volatilité pour indices",
    author: "Sophie Martin",
    authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    description: `# Stratégie d'arbitrage de volatilité pour indices

Cette stratégie vise à exploiter les différences entre volatilité implicite et réalisée sur les indices majeurs. Particulièrement efficace en période de forte volatilité du marché, elle permet de générer des rendements alpha indépendamment de la direction du marché.

## Principe fondamental

La stratégie repose sur l'observation que la volatilité implicite (celle qui est intégrée dans les prix d'options) tend à surréagir par rapport à la volatilité réalisée (celle qui est effectivement observée sur le marché). Ce phénomène crée des opportunités d'arbitrage.

## Méthodologie

1. **Analyse de l'écart vol implicite/réalisée**: Suivre en temps réel l'écart entre:
   - La volatilité implicite à 30 jours (VIX pour le S&P 500)
   - La volatilité réalisée sur 20 jours de l'indice sous-jacent

2. **Signal d'entrée**: Entrer en position lorsque:
   - L'écart dépasse 1.5 fois son écart-type historique
   - Le ratio volatilité implicite/réalisée > 1.4

3. **Mise en œuvre de la position**:
   - Short vega: vente d'options straddle ATM (1 mois)
   - Couverture delta: achat/vente de contrats futures sur indice
   - Rebalancement: ajustement quotidien de la couverture delta

4. **Gestion des risques**:
   - Stop-loss si l'écart augmente de 50%
   - Ajustement de la taille de position selon la VaR
   - Couverture contre les mouvements extrêmes par des options OTM

## Performance historique

Analyse sur 10 ans pour le S&P 500:
- Rendement annualisé: 8.7%
- Ratio de Sharpe: 1.3
- Drawdown maximum: 12.4%
- Corrélation au marché: 0.18

## Code Python pour le calcul du signal

\`\`\`python
import numpy as np
import pandas as pd
import yfinance as yf

def calculate_volatility_gap(ticker="^GSPC", vix_ticker="^VIX", lookback=252):
    # Télécharger les données
    sp500 = yf.download(ticker, period=f"{lookback+30}d")
    vix = yf.download(vix_ticker, period=f"{lookback+30}d")
    
    # Calculer la volatilité réalisée (20 jours)
    sp500['returns'] = sp500['Adj Close'].pct_change()
    sp500['realized_vol'] = sp500['returns'].rolling(window=20).std() * np.sqrt(252)
    
    # Obtenir la volatilité implicite (VIX)
    vix['implied_vol'] = vix['Adj Close'] / 100
    
    # Fusionner les données
    data = pd.concat([sp500['realized_vol'], vix['implied_vol']], axis=1).dropna()
    
    # Calculer le ratio volatilité implicite/réalisée
    data['vol_ratio'] = data['implied_vol'] / data['realized_vol']
    
    # Calculer l'écart normalisé
    data['vol_gap'] = data['vol_ratio']
    data['vol_gap_zscore'] = (data['vol_gap'] - data['vol_gap'].rolling(window=lookback).mean()) / data['vol_gap'].rolling(window=lookback).std()
    
    return data['vol_gap'].iloc[-1], data['vol_gap_zscore'].iloc[-1]

# Génération du signal
vol_gap, vol_gap_zscore = calculate_volatility_gap()
signal = vol_gap > 1.4 and vol_gap_zscore > 1.5

print(f"Vol Ratio: {vol_gap:.2f}")
print(f"Vol Gap Z-Score: {vol_gap_zscore:.2f}")
print(f"Signal d'entrée: {'OUI' if signal else 'NON'}")
\`\`\`

## Considérations pratiques

Pour une implémentation réelle, considérer:

1. Les coûts de transaction (spread bid-ask, commissions)
2. Le glissement lors du rebalancement delta
3. L'impact de marché pour les grandes positions
4. La gestion des dividendes et des événements corporatifs

## Adaptations possibles

Cette stratégie peut être adaptée à:
- D'autres indices (Eurostoxx 50, Nikkei, etc.)
- Des secteurs spécifiques (XLF, XLE, etc.)
- Des actions individuelles à forte volatilité

Un portefeuille diversifié sur plusieurs sous-jacents améliore significativement le profil risque/rendement.`,
    strategyType: "Arbitrage de volatilité",
    implementation: `// Implementation JavaScript pour le calcul du signal

/**
 * Calcule l'écart de volatilité entre implicite et réalisée
 * @param {Array} prices - Prix historiques de l'indice
 * @param {Array} vixValues - Valeurs historiques du VIX
 * @param {Number} lookback - Période d'historique à considérer
 * @returns {Object} - Signal et statistiques
 */
function calculateVolatilityGap(prices, vixValues, lookback = 252) {
  // Calculer les rendements quotidiens
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i-1]) / prices[i-1]);
  }
  
  // Calculer la volatilité réalisée (20 jours)
  const realizedVol = [];
  for (let i = 19; i < returns.length; i++) {
    const windowReturns = returns.slice(i-19, i+1);
    const stdDev = calculateStdDev(windowReturns);
    realizedVol.push(stdDev * Math.sqrt(252));
  }
  
  // Convertir VIX en décimal
  const impliedVol = vixValues.map(v => v / 100);
  
  // Calculer le ratio vol implicite / réalisée
  const volRatio = [];
  for (let i = 0; i < Math.min(realizedVol.length, impliedVol.length); i++) {
    volRatio.push(impliedVol[i] / realizedVol[i]);
  }
  
  // Calculer la moyenne et l'écart-type historique du ratio
  const lookbackRatio = volRatio.slice(-lookback);
  const mean = calculateMean(lookbackRatio);
  const stdDev = calculateStdDev(lookbackRatio);
  
  // Calcul du z-score actuel
  const currentRatio = volRatio[volRatio.length - 1];
  const zScore = (currentRatio - mean) / stdDev;
  
  // Générer le signal
  const signal = currentRatio > 1.4 && zScore > 1.5;
  
  return {
    volatilityRatio: currentRatio,
    zScore: zScore,
    signal: signal,
    stats: {
      meanRatio: mean,
      stdDevRatio: stdDev
    }
  };
}

/**
 * Calcule la moyenne d'un tableau de nombres
 */
function calculateMean(arr) {
  return arr.reduce((sum, val) => sum + val, 0) / arr.length;
}

/**
 * Calcule l'écart-type d'un tableau de nombres
 */
function calculateStdDev(arr) {
  const mean = calculateMean(arr);
  const squaredDiffs = arr.map(val => Math.pow(val - mean, 2));
  const variance = calculateMean(squaredDiffs);
  return Math.sqrt(variance);
}

// Exemple d'utilisation
// const prices = [...]; // Prix historiques de l'indice
// const vixValues = [...]; // Valeurs historiques du VIX
// const result = calculateVolatilityGap(prices, vixValues);
// console.log(\`Signal d'entrée: \${result.signal ? 'OUI' : 'NON'}\`);`,
    date: "2024-04-19",
    views: 322,
    likes: 24,
    tags: ["Arbitrage", "Volatilité", "SPX", "Stratégie quantitative"],
    published: true
  }
];

const StrategyDetail = () => {
  const { id } = useParams<{id: string}>();
  const strategy = mockStrategies.find(s => s.id === id);

  if (!strategy) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Stratégie non trouvée</h1>
        <p className="mb-6">La stratégie que vous recherchez n'existe pas ou a été supprimée.</p>
        <Button asChild>
          <Link to="/community/explore">Revenir aux publications</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Helmet>
        <title>{strategy.title} | The Pricing Library</title>
        <meta name="description" content={strategy.title} />
      </Helmet>

      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button variant="outline" asChild className="mb-6">
            <Link to="/community/explore">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour aux publications
            </Link>
          </Button>
        </div>

        <article className="finance-card p-6">
          <header className="mb-6">
            <div className="flex items-center mb-3">
              <Badge variant="premium" className="mr-2">Stratégie</Badge>
              <Badge variant="secondary">{strategy.strategyType}</Badge>
            </div>
            
            <h1 className="text-3xl font-bold mb-4">{strategy.title}</h1>
            
            <div className="flex items-center flex-wrap gap-y-3">
              <div className="flex items-center mr-6">
                <div className="h-10 w-10 rounded-full overflow-hidden mr-2">
                  <img 
                    src={strategy.authorAvatar}
                    alt={strategy.author}
                    className="h-full w-full object-cover"
                  />
                </div>
                <span className="text-finance-accent">{strategy.author}</span>
              </div>
              
              <div className="flex items-center mr-6">
                <Calendar className="h-4 w-4 mr-1 text-finance-lightgray" />
                <span className="text-finance-lightgray">{strategy.date}</span>
              </div>
              
              <div className="flex items-center mr-6">
                <Eye className="h-4 w-4 mr-1 text-finance-lightgray" />
                <span className="text-finance-lightgray">{strategy.views} vues</span>
              </div>
              
              <div className="flex items-center">
                <ThumbsUp className="h-4 w-4 mr-1 text-finance-lightgray" />
                <span className="text-finance-lightgray">{strategy.likes} j'aime</span>
              </div>
            </div>
          </header>
          
          <Tabs defaultValue="description">
            <TabsList className="mb-6">
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="implementation">Implémentation</TabsTrigger>
            </TabsList>
            
            <TabsContent value="description">
              <div className="prose prose-invert max-w-none">
                {/* In a real app, we would render markdown with a library like react-markdown */}
                <div dangerouslySetInnerHTML={{ __html: strategy.description.replace(/\n/g, '<br />') }} />
              </div>
            </TabsContent>
            
            <TabsContent value="implementation">
              <Card className="mb-6">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <FileCode className="mr-2 h-5 w-5" />
                    Code d'implémentation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="p-4 rounded bg-finance-dark-secondary overflow-x-auto">
                    <code>{strategy.implementation}</code>
                  </pre>
                </CardContent>
              </Card>
              
              <div className="flex justify-end">
                <Button variant="outline" className="flex items-center">
                  <Download className="mr-2 h-4 w-4" />
                  Télécharger le code
                </Button>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="mt-6 pt-6 border-t border-gray-800">
            <div className="flex flex-wrap gap-2 mb-6">
              {strategy.tags.map((tag, index) => (
                <Badge key={index} variant="level">
                  {tag}
                </Badge>
              ))}
            </div>
            
            <div className="flex justify-between">
              <Button variant="outline" className="flex items-center">
                <ThumbsUp className="mr-2 h-4 w-4" />
                J'aime
              </Button>
              <Button variant="finance" className="flex items-center">
                <Share2 className="mr-2 h-4 w-4" />
                Partager
              </Button>
            </div>
          </div>
        </article>
        
        <Card className="mt-8 p-6">
          <h3 className="text-xl font-semibold mb-4">Commentaires</h3>
          <p className="text-finance-lightgray italic">
            La fonctionnalité de commentaires sera disponible prochainement.
          </p>
        </Card>
      </div>
    </div>
  );
};

export default StrategyDetail;
