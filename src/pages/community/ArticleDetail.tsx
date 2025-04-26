
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, Calendar, User, Eye, ThumbsUp, ChevronRight, Share2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MarkdownMathRenderer } from "../../components/editors/MarkdownMathRenderer";
import { Article, Publication } from "../../types/community";

// Mock article data
const mockArticles: Article[] = [
  {
    id: 1,
    type: "article",
    title: "Calibrage du modèle Heston pour options exotiques",
    author: "Martin Dubois",
    authorAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    summary: "Une analyse approfondie de la méthode de calibrage du modèle de Heston pour le pricing d'options exotiques.",
    content: `
# Calibrage du modèle Heston pour options exotiques

## Introduction

Le modèle de Heston est l'un des modèles à volatilité stochastique les plus utilisés en finance quantitative. Contrairement au modèle de Black-Scholes qui suppose une volatilité constante, le modèle de Heston permet de capturer des phénomènes plus complexes comme le smile de volatilité.

## Le modèle mathématique

Le modèle de Heston est décrit par le système d'équations différentielles stochastiques suivant :

$$
\\begin{align}
dS_t &= \\mu S_t dt + \\sqrt{v_t} S_t dW_t^S \\\\
dv_t &= \\kappa(\\theta - v_t)dt + \\sigma\\sqrt{v_t}dW_t^v
\\end{align}
$$

où :
- $S_t$ est le prix de l'actif sous-jacent
- $v_t$ est la variance instantanée
- $\\mu$ est le rendement attendu
- $\\kappa$ est la vitesse de retour à la moyenne
- $\\theta$ est la variance long terme
- $\\sigma$ est la volatilité de la volatilité
- $W_t^S$ et $W_t^v$ sont des mouvements browniens avec une corrélation $\\rho$

## Procédure de calibrage

Le calibrage du modèle de Heston nécessite de déterminer les paramètres suivants :
- $v_0$ : variance initiale
- $\\kappa$ : vitesse de retour à la moyenne
- $\\theta$ : niveau de variance long terme
- $\\sigma$ : volatilité de la volatilité
- $\\rho$ : corrélation entre les deux mouvements browniens

### Méthode des moindres carrés

Une approche standard consiste à minimiser l'écart quadratique entre les prix d'options observés sur le marché et les prix théoriques calculés avec le modèle de Heston :

$$
\\min_{\\kappa, \\theta, \\sigma, \\rho, v_0} \\sum_{i=1}^{N} (P_i^{market} - P_i^{Heston})^2
$$

où $P_i^{market}$ est le prix de l'option $i$ observé sur le marché et $P_i^{Heston}$ est le prix théorique selon le modèle de Heston.

### Exemple avec Python

Voici un exemple de code Python utilisant la bibliothèque scipy pour calibrer le modèle de Heston :

\`\`\`python
import numpy as np
from scipy.optimize import minimize
from scipy.integrate import quad

def heston_characteristic_function(u, T, r, v0, kappa, theta, sigma, rho):
    # Implémentation de la fonction caractéristique du modèle de Heston
    # ...
    return cf

def heston_call_price(S0, K, T, r, v0, kappa, theta, sigma, rho):
    # Calcul du prix d'option d'achat avec la méthode d'intégration
    # ...
    return call_price

def objective_function(params, market_prices, strikes, S0, T, r):
    v0, kappa, theta, sigma, rho = params
    model_prices = np.array([heston_call_price(S0, K, T, r, v0, kappa, theta, sigma, rho) for K in strikes])
    return np.sum((model_prices - market_prices)**2)

# Exemple de calibrage
initial_params = [0.1, 2.0, 0.04, 0.3, -0.7]  # v0, kappa, theta, sigma, rho
bounds = [(0.001, 1.0), (0.1, 10.0), (0.001, 0.2), (0.01, 1.0), (-0.99, 0.99)]

result = minimize(
    objective_function,
    initial_params,
    args=(market_prices, strikes, S0, T, r),
    method='L-BFGS-B',
    bounds=bounds
)

calibrated_params = result.x
\`\`\`

## Application aux options exotiques

Une fois le modèle calibré, il peut être utilisé pour évaluer des options exotiques comme :

1. **Options barrières** - Options dont le payoff dépend du franchissement d'un certain niveau de prix
2. **Options asiatiques** - Options dont le payoff dépend de la moyenne du prix du sous-jacent
3. **Options lookback** - Options dont le payoff dépend du maximum ou du minimum atteint par le sous-jacent

### Exemple de diagramme de flux de calibrage

\`\`\`mermaid
graph TD
    A[Collecter les données de marché] --> B[Définir la fonction objectif]
    B --> C[Initialiser les paramètres]
    C --> D[Optimiser avec algorithme numérique]
    D --> E{Convergence?}
    E -- Non --> F[Ajuster paramètres ou contraintes]
    F --> D
    E -- Oui --> G[Paramètres calibrés]
    G --> H[Valoriser options exotiques]
\`\`\`

## Conclusion

Le calibrage du modèle de Heston est une étape cruciale pour la valorisation précise des options exotiques. En capturant de manière plus réaliste la dynamique de la volatilité, ce modèle permet d'obtenir des prix plus cohérents avec les observations de marché, particulièrement pour les options à longue maturité ou les options dont la valeur dépend fortement de la trajectoire du sous-jacent.

## Références

1. Heston, S. L. (1993). A closed-form solution for options with stochastic volatility with applications to bond and currency options. *The Review of Financial Studies*, 6(2), 327-343.
2. Gatheral, J. (2006). *The volatility surface: a practitioner's guide*. John Wiley & Sons.
    `,
    date: "2024-04-22",
    views: 475,
    likes: 38,
    tags: ["Heston", "Calibrage", "Options exotiques"],
    published: true
  },
  {
    id: 2,
    type: "article",
    title: "Impact des taux négatifs sur les modèles de Black-Scholes",
    author: "Alexandre Dupont",
    authorAvatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    summary: "Dans un environnement de taux d'intérêt négatifs, le modèle classique de Black-Scholes présente des limitations importantes.",
    content: `
# Impact des taux négatifs sur les modèles de Black-Scholes

## Introduction au problème des taux négatifs

Depuis quelques années, plusieurs banques centrales ont mis en place des politiques de taux d'intérêt négatifs. Cette situation, jamais envisagée dans les modèles financiers classiques, pose d'importants défis pour la valorisation des produits dérivés.

Le modèle de Black-Scholes, développé en 1973, suppose implicitement que les taux d'intérêt sont positifs. Lorsque ce n'est pas le cas, plusieurs anomalies apparaissent.

## La formule de Black-Scholes

Rappelons la formule classique de Black-Scholes pour une option d'achat :

$$
C(S, t) = S_t \\Phi(d_1) - K e^{-r(T-t)} \\Phi(d_2)
$$

où :

$$
d_1 = \\frac{\\ln(S_t/K) + (r + \\sigma^2/2)(T-t)}{\\sigma\\sqrt{T-t}}
$$

$$
d_2 = d_1 - \\sigma\\sqrt{T-t}
$$

Avec $r$ négatif, cette formule produit des résultats contre-intuitifs.
    `,
    date: "2024-04-15",
    views: 289,
    likes: 32,
    tags: ["Black-Scholes", "Taux négatifs", "Modélisation"],
    published: true
  }
];

const ArticleDetail = () => {
  const { id } = useParams<{id: string}>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedArticles, setRelatedArticles] = useState<Publication[]>([]);

  useEffect(() => {
    // In a real app, we would fetch the article from an API
    // For demo purposes, we'll use the mock data
    const articleId = parseInt(id || "0");
    const foundArticle = mockArticles.find(a => a.id === articleId);
    
    if (foundArticle) {
      setArticle(foundArticle);
      
      // Find related articles based on tags
      const related = mockArticles
        .filter(a => a.id !== articleId && a.tags.some(tag => foundArticle.tags.includes(tag)))
        .slice(0, 3);
      
      setRelatedArticles(related);
    }
    
    setLoading(false);
  }, [id]);

  if (loading) {
    return <div className="container mx-auto px-4 py-8 text-center">Chargement...</div>;
  }

  if (!article) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Article introuvable</h1>
        <p className="text-finance-lightgray mb-6">Cet article n'existe pas ou a été supprimé.</p>
        <Button asChild variant="finance">
          <Link to="/community/explore">Retour aux publications</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Helmet>
        <title>{article.title} | The Pricing Library</title>
        <meta name="description" content={article.summary} />
      </Helmet>

      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link to="/community/explore" className="text-finance-accent flex items-center hover:underline mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux publications
          </Link>
          
          <Badge className="mb-4" variant="secondary">Article</Badge>
          
          <h1 className="text-3xl font-bold mb-6">{article.title}</h1>
          
          <div className="flex items-center mb-6">
            <div className="h-10 w-10 rounded-full overflow-hidden mr-3">
              <img 
                src={article.authorAvatar} 
                alt={article.author} 
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <div className="text-finance-offwhite font-medium">{article.author}</div>
              <div className="flex items-center text-xs text-finance-lightgray">
                <Calendar className="h-3 w-3 mr-1" />
                <span>Publié le {article.date}</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-6">
            {article.tags.map((tag, index) => (
              <Badge key={index} variant="level" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-finance-lightgray mb-6">
            <div className="flex items-center">
              <Eye className="h-4 w-4 mr-1" />
              <span>{article.views} vues</span>
            </div>
            <div className="flex items-center">
              <ThumbsUp className="h-4 w-4 mr-1" />
              <span>{article.likes} likes</span>
            </div>
          </div>
          
          <Separator className="mb-8" />
          
          <div className="prose prose-invert max-w-none mb-8">
            <MarkdownMathRenderer content={article.content} />
          </div>
          
          <div className="flex justify-between items-center border-t border-finance-steel/20 pt-6 mt-12">
            <div>
              <p className="text-sm text-finance-lightgray">Cet article vous a-t-il été utile ?</p>
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
                <Link to="/community/contribute">Rédiger un article</Link>
              </Button>
            </div>
          </div>
        </div>
        
        {relatedArticles.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-bold mb-6">Articles connexes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedArticles.map(related => (
                <Card key={related.id} className="overflow-hidden hover:border-finance-accent transition-colors duration-300">
                  <CardHeader className="pb-2">
                    <Badge variant="secondary" className="mb-2 w-fit">
                      Article
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
                      <Link to={`/community/article/${related.id}`}>
                        Lire la suite <ChevronRight className="h-4 w-4 ml-1" />
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

export default ArticleDetail;
