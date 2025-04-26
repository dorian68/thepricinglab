
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { safeTranslate } from '@/utils/translationUtils';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ThumbsUp, Eye, Calendar, User, MessageSquare, Share2, Bookmark, BookOpen } from 'lucide-react';
import MarkdownMathRenderer from '../../components/editors/MarkdownMathRenderer';
import { Article } from '@/types/community';

// Fix the type issue by defining the correct interface that matches Record<string, string>
interface RouteParams {
  id: string;
}

const ArticleDetail: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<RouteParams>();
  const [article, setArticle] = useState<Article | null>(null);

  // Mock article data (replace with actual data fetching later)
  const mockArticles: Article[] = [
    {
      id: "1",
      type: "article",
      title: "Introduction aux Options Exotiques",
      author: "Sophie Martin",
      authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=60",
      summary: "Un guide approfondi pour comprendre et valoriser les options exotiques sur les marchés financiers modernes.",
      content: "# Introduction aux Options Exotiques\n\nLes options exotiques sont des contrats financiers qui diffèrent des options vanilles standard par leurs structures de payoff plus complexes et leurs conditions d'exercice spécifiques. Cet article explore en détail les caractéristiques, les types et les applications des options exotiques dans le trading et la gestion de portefeuille.\n\n## Types d'Options Exotiques\n\n- **Options Asiatiques:** Le payoff dépend de la moyenne du prix de l'actif sous-jacent sur une période déterminée.\n- **Options Barrière:** Ces options s'activent ou s'éteignent si le prix de l'actif sous-jacent atteint un certain niveau (la barrière).\n- **Options Lookback:** Le payoff est basé sur le prix maximal ou minimal de l'actif sous-jacent pendant la durée de vie de l'option.\n\n## Valorisation des Options Exotiques\n\nLa valorisation des options exotiques nécessite souvent des méthodes numériques complexes, telles que la simulation de Monte Carlo ou les arbres binomiales, en raison de la complexité de leurs payoffs et de leurs conditions d'exercice.\n\n## Applications dans le Trading\n\nLes options exotiques sont utilisées par les traders pour des stratégies de couverture plus sophistiquées et pour exploiter des vues spécifiques sur le marché. Elles permettent de personnaliser le profil de risque et de rendement d'un portefeuille de manière plus précise que les options vanilles.",
      date: "12 Avril 2025",
      views: 342,
      likes: 28,
      tags: ["Options", "Pricing", "Marchés dérivés"],
      published: true
    },
    {
      id: "2",
      type: "article",
      title: "Les modèles de volatilité stochastique",
      author: "Pierre Durant",
      authorAvatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=400&auto=format&fit=crop&q=60",
      summary: "Analyse des modèles de Heston et SABR pour la capture de la dynamique de la volatilité.",
      content: "## Les modèles de volatilité stochastique\n\nLes modèles de volatilité stochastique, tels que Heston et SABR, sont essentiels pour capturer la dynamique de la volatilité observée sur les marchés financiers. Ces modèles permettent de mieux pricer et gérer les risques associés aux produits dérivés.\n\n### Modèle de Heston\n\nLe modèle de Heston est un modèle à deux facteurs qui décrit l'évolution du prix d'un actif et de sa variance instantanée. Il est largement utilisé pour pricer les options européennes et américaines.\n\n### Modèle SABR\n\nLe modèle SABR (Stochastic Alpha Beta Rho) est un modèle de volatilité stochastique utilisé pour modéliser les taux d'intérêt et les smile de volatilité. Il est particulièrement utile pour pricer les caps et les floors.\n\n### Applications\n\nCes modèles sont utilisés par les traders et les gestionnaires de risques pour:\n\n- Pricer les options et autres produits dérivés\n- Couvrir les risques de volatilité\n- Gérer les portefeuilles d'options",
      date: "5 Mai 2025",
      views: 287,
      likes: 45,
      tags: ["Volatilité", "Heston", "SABR"],
      published: true
    },
    {
      id: "3",
      type: "article",
      title: "L'impact des taux d'intérêt négatifs sur les marchés",
      author: "Lucie Bernard",
      authorAvatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=60",
      summary: "Examen des conséquences des taux négatifs sur l'économie mondiale et les stratégies d'investissement.",
      content: "## L'impact des taux d'intérêt négatifs sur les marchés\n\nLes taux d'intérêt négatifs sont devenus une réalité dans plusieurs économies développées, notamment en Europe et au Japon. Cette politique monétaire non conventionnelle a des conséquences importantes sur les marchés financiers et l'économie mondiale.\n\n### Conséquences sur les banques\n\nLes taux négatifs exercent une pression sur les marges des banques, car elles doivent payer pour déposer des fonds auprès de la banque centrale. Cela peut entraîner une réduction des prêts et une augmentation des frais bancaires.\n\n### Conséquences sur les investisseurs\n\nLes taux négatifs incitent les investisseurs à rechercher des rendements plus élevés, ce qui peut entraîner une augmentation des investissements dans des actifs plus risqués, tels que les actions et l'immobilier.\n\n### Conséquences sur l'économie\n\nLes taux négatifs visent à stimuler l'économie en encourageant les entreprises et les consommateurs à emprunter et à dépenser. Cependant, leur efficacité est controversée, et ils peuvent avoir des effets secondaires indésirables, tels que la formation de bulles d'actifs.",
      date: "20 Mai 2025",
      views: 302,
      likes: 52,
      tags: ["Taux d'intérêt", "Politique monétaire", "Marchés financiers"],
      published: true
    }
  ];

  useEffect(() => {
    // Simulate fetching article data based on ID
    const fetchedArticle = mockArticles.find(article => article.id === id);
    if (fetchedArticle) {
      setArticle(fetchedArticle);
    } else {
      console.log(`Article with id ${id} not found.`);
    }
  }, [id]);

  if (!article) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-finance-lightgray">Article non trouvé.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link to="/community/explore" className="inline-flex items-center mb-4 text-finance-accent hover:underline">
        <ChevronLeft className="mr-2 h-4 w-4" />
        {safeTranslate(t, 'community.article.backToExplore', 'Retour à l\'exploration')}
      </Link>

      <Card className="bg-finance-card">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">{article.title}</CardTitle>
          <CardDescription className="text-finance-lightgray">
            <div className="flex items-center">
              <User className="mr-2 h-4 w-4" />
              {article.author}
              {article.authorAvatar && (
                <img
                  src={article.authorAvatar}
                  alt={article.author}
                  className="rounded-full h-8 w-8 ml-2"
                />
              )}
            </div>
            <div className="flex items-center mt-1">
              <Calendar className="mr-2 h-4 w-4" />
              {article.date}
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MarkdownMathRenderer content={article.content} />
        </CardContent>
        <CardFooter className="flex justify-between items-center">
          <div className="flex items-center">
            <Button variant="ghost" className="mr-2">
              <ThumbsUp className="mr-2 h-4 w-4" />
              {article.likes}
            </Button>
            <Button variant="ghost">
              <Eye className="mr-2 h-4 w-4" />
              {article.views}
            </Button>
          </div>
          <div className="flex items-center">
            <Button variant="ghost" className="mr-2">
              <Share2 className="mr-2 h-4 w-4" />
              {safeTranslate(t, 'community.article.share', 'Partager')}
            </Button>
            <Button variant="ghost">
              <Bookmark className="mr-2 h-4 w-4" />
              {safeTranslate(t, 'community.article.bookmark', 'Enregistrer')}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ArticleDetail;
