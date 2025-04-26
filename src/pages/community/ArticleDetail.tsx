
import React from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, User, Calendar, Eye, BookOpen, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

// Mock data for a detailed article view
const mockArticles = [
  {
    id: "1",
    type: "article",
    title: "Calibrage du modèle Heston pour options exotiques",
    author: "Martin Dubois",
    authorAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    content: `
# Calibrage du modèle Heston pour options exotiques

Le modèle de Heston est l'un des modèles de volatilité stochastique les plus populaires en finance quantitative. Contrairement au modèle de Black-Scholes qui suppose une volatilité constante, le modèle de Heston permet à la volatilité de suivre un processus stochastique, ce qui reflète mieux le comportement réel des marchés financiers.

## Formulation mathématique du modèle

Dans le modèle de Heston, le prix de l'actif sous-jacent \(S_t\) et sa variance instantanée \(v_t\) évoluent selon les équations différentielles stochastiques suivantes:

\[
dS_t = \mu S_t dt + \sqrt{v_t} S_t dW_t^S
\]

\[
dv_t = \kappa(\theta - v_t)dt + \sigma \sqrt{v_t} dW_t^v
\]

où:
- \(\mu\) est le rendement moyen de l'actif
- \(\kappa\) est la vitesse de retour à la moyenne pour la variance
- \(\theta\) est la variance à long terme
- \(\sigma\) est la volatilité de la volatilité
- \(W_t^S\) et \(W_t^v\) sont des mouvements browniens avec une corrélation \(\rho\)

## Processus de calibrage

Le calibrage du modèle de Heston pour les options exotiques nécessite une attention particulière car ces produits sont souvent sensibles à toute la structure de la volatilité. Voici une approche étape par étape:

1. **Collecte des données de marché**: Obtenir les prix d'options vanille pour différentes échéances et strikes
2. **Définition de la fonction objectif**: Minimiser l'erreur quadratique entre les prix de marché et les prix du modèle
3. **Optimisation des paramètres**: Utiliser des algorithmes comme Levenberg-Marquardt ou Nelder-Mead
4. **Validation**: Vérifier que le modèle calibré reproduit correctement les prix des options vanille
5. **Extension aux options exotiques**: Utiliser les paramètres calibrés pour valoriser les options exotiques

## Défis spécifiques pour les options exotiques

Les options exotiques, comme les options à barrière ou les options asiatiques, présentent des défis supplémentaires:

- **Dépendance au chemin**: Beaucoup d'options exotiques dépendent du chemin suivi par l'actif sous-jacent
- **Sensibilité à la corrélation**: Le paramètre de corrélation \(\rho\) peut avoir un impact significatif
- **Méthodes numériques**: Souvent, des méthodes Monte Carlo avancées sont nécessaires pour la valorisation

## Exemple de mise en œuvre

Voici un exemple simplifié de calibrage en Python utilisant SciPy:

\`\`\`python
import numpy as np
from scipy.optimize import minimize

def heston_option_price(params, strikes, maturities, market_prices):
    # Calcul des prix d'options selon le modèle de Heston
    # Params = [kappa, theta, sigma, rho, v0]
    # [...]
    return model_prices

def objective_function(params, strikes, maturities, market_prices):
    model_prices = heston_option_price(params, strikes, maturities, market_prices)
    return np.sum((model_prices - market_prices)**2)

# Données de marché
strikes = [...]
maturities = [...]
market_prices = [...]

# Paramètres initiaux
initial_params = [1.0, 0.04, 0.2, -0.7, 0.04]

# Optimisation
result = minimize(
    objective_function,
    initial_params,
    args=(strikes, maturities, market_prices),
    method='Nelder-Mead'
)

calibrated_params = result.x
\`\`\`

## Conclusion

Un calibrage précis du modèle de Heston est essentiel pour la valorisation correcte des options exotiques. En comprenant les subtilités du modèle et en utilisant des techniques d'optimisation robustes, on peut obtenir des paramètres qui reflètent fidèlement la dynamique du marché et permettent une valorisation fiable des produits dérivés complexes.

`,
    date: "2024-04-22",
    views: 475,
    likes: 38,
    tags: ["Heston", "Calibrage", "Options exotiques"],
    published: true
  }
];

const ArticleDetail = () => {
  const { id } = useParams<{id: string}>();
  const article = mockArticles.find(a => a.id === id);

  if (!article) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Article non trouvé</h1>
        <p className="mb-6">L'article que vous recherchez n'existe pas ou a été supprimé.</p>
        <Button asChild>
          <Link to="/community/explore">Revenir aux publications</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Helmet>
        <title>{article.title} | The Pricing Library</title>
        <meta name="description" content={article.title} />
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
            <Badge variant="secondary" className="mb-3">Article</Badge>
            <h1 className="text-3xl font-bold mb-4">{article.title}</h1>
            
            <div className="flex items-center flex-wrap gap-y-3">
              <div className="flex items-center mr-6">
                <div className="h-10 w-10 rounded-full overflow-hidden mr-2">
                  <img 
                    src={article.authorAvatar}
                    alt={article.author}
                    className="h-full w-full object-cover"
                  />
                </div>
                <span className="text-finance-accent">{article.author}</span>
              </div>
              
              <div className="flex items-center mr-6">
                <Calendar className="h-4 w-4 mr-1 text-finance-lightgray" />
                <span className="text-finance-lightgray">{article.date}</span>
              </div>
              
              <div className="flex items-center mr-6">
                <Eye className="h-4 w-4 mr-1 text-finance-lightgray" />
                <span className="text-finance-lightgray">{article.views} vues</span>
              </div>
              
              <div className="flex items-center">
                <ThumbsUp className="h-4 w-4 mr-1 text-finance-lightgray" />
                <span className="text-finance-lightgray">{article.likes} j'aime</span>
              </div>
            </div>
          </header>
          
          <div className="prose prose-invert max-w-none">
            {/* In a real app, we would render markdown with a library like react-markdown */}
            <div dangerouslySetInnerHTML={{ __html: article.content.replace(/\n/g, '<br />') }} />
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-800">
            <div className="flex flex-wrap gap-2 mb-6">
              {article.tags.map((tag, index) => (
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
              <Button variant="finance">Partager</Button>
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

export default ArticleDetail;
