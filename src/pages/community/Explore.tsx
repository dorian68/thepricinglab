import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { safeTranslate } from '@/utils/translationUtils';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, ThumbsUp, Eye, Calendar, User, MessageSquare, BookOpen } from 'lucide-react';
import { Publication } from '@/types/community';

// Update the sample publications to include the required content field
const samplePublications: Publication[] = [
  {
    id: 1,
    type: "article",
    title: "Introduction aux Options Exotiques",
    author: "Sophie Martin",
    authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=60",
    summary: "Un guide approfondi pour comprendre et valoriser les options exotiques sur les marchés financiers modernes.",
    content: "# Introduction aux Options Exotiques\n\nLes options exotiques sont des contrats financiers qui diffèrent des options vanilles standard par leurs structures de payoff plus complexes et leurs conditions d'exercice spécifiques...",
    date: "12 Avril 2025",
    views: 342,
    likes: 28,
    tags: ["Options", "Pricing", "Marchés dérivés"],
    published: true
  },
  {
    id: 2,
    type: "strategy",
    title: "Arbitrage de Volatilité avec Straddles",
    author: "Luc Dubois",
    authorAvatar: "https://images.unsplash.com/photo-1500648767791-00d5a469aa9d?w=400&auto=format&fit=crop&q=60",
    summary: "Stratégie d'arbitrage de volatilité utilisant des straddles pour exploiter les écarts de prix sur le marché.",
    content: "# Arbitrage de Volatilité avec Straddles\n\nCette stratégie exploite les différences entre la volatilité implicite et la volatilité réalisée en utilisant des straddles...",
    date: "18 Avril 2025",
    views: 287,
    likes: 22,
    tags: ["Volatilité", "Arbitrage", "Straddles"],
    published: true,
    strategyType: "pricing"
  },
  {
    id: 3,
    type: "article",
    title: "L'Impact des Taux d'Intérêt sur les Marchés Boursiers",
    author: "Chloé Leclerc",
    authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd8a72fbc?w=400&auto=format&fit=crop&q=60",
    summary: "Analyse de l'influence des taux d'intérêt sur la performance des marchés boursiers et les stratégies d'investissement.",
    content: "# L'Impact des Taux d'Intérêt sur les Marchés Boursiers\n\nLes taux d'intérêt jouent un rôle crucial dans la détermination de la santé économique et de la performance des marchés boursiers...",
    date: "22 Avril 2025",
    views: 412,
    likes: 35,
    tags: ["Taux d'intérêt", "Marchés boursiers", "Investissement"],
    published: true
  },
  {
    id: 4,
    type: "strategy",
    title: "Couverture de Portefeuille avec des Options Put",
    author: "Thierry Girard",
    authorAvatar: "https://images.unsplash.com/photo-1502823403499-b1bca814266c?w=400&auto=format&fit=crop&q=60",
    summary: "Techniques de couverture de portefeuille utilisant des options put pour minimiser les risques de baisse.",
    content: "# Couverture de Portefeuille avec des Options Put\n\nLa couverture de portefeuille avec des options put est une stratégie défensive visant à protéger un portefeuille contre les pertes potentielles dues à une baisse du marché...",
    date: "25 Avril 2025",
    views: 367,
    likes: 30,
    tags: ["Couverture", "Options Put", "Gestion des risques"],
    published: true,
    strategyType: "hedging"
  },
  {
    id: 5,
    type: "article",
    title: "Les Tendances Actuelles du Trading Algorithmique",
    author: "Isabelle Morin",
    authorAvatar: "https://images.unsplash.com/photo-1488426862026-730f9ca8cb9c?w=400&auto=format&fit=crop&q=60",
    summary: "Exploration des dernières tendances et technologies dans le domaine du trading algorithmique.",
    content: "# Les Tendances Actuelles du Trading Algorithmique\n\nLe trading algorithmique continue d'évoluer avec l'introduction de nouvelles technologies et approches. Cet article examine les tendances actuelles...",
    date: "29 Avril 2025",
    views: 451,
    likes: 42,
    tags: ["Trading algorithmique", "Technologies financières", "Marchés financiers"],
    published: true
  }
];

const Explore = () => {
  const { t } = useTranslation();
  const [publications, setPublications] = useState<Publication[]>(samplePublications);

  useEffect(() => {
    // Simulate fetching publications from an API
    setTimeout(() => {
      setPublications(samplePublications);
    }, 500);
  }, []);

  // Make sure all publications have a content property
  for (const pub of samplePublications) {
    if (!pub.content) {
      pub.content = `# ${pub.title}\n\n${pub.summary}\n\nContenu détaillé à venir...`;
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold terminal-text mb-4">{safeTranslate(t, 'community.explorePublications', 'Explorer les Publications')}</h1>
      <p className="text-finance-lightgray mb-8">
        {safeTranslate(t, 'community.discoverArticlesStrategies', 'Découvrez les articles et stratégies partagés par notre communauté.')}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {publications.map((publication) => (
          <Card key={publication.id} className="bg-finance-card border-finance-steel/20">
            <CardHeader>
              <CardTitle className="flex justify-between items-start">
                <Link to={`/community/${publication.type}/${publication.id}`} className="hover:underline">
                  {publication.title}
                </Link>
                {publication.published && (
                  <Badge variant="secondary">{safeTranslate(t, 'common.published', 'Publié')}</Badge>
                )}
              </CardTitle>
              <CardDescription className="text-finance-lightgray">
                {publication.summary}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-finance-lightgray">
              <div className="flex items-center mb-2">
                <User className="h-4 w-4 mr-2 text-finance-accent" />
                <span>{publication.author}</span>
              </div>
              <div className="flex items-center mb-2">
                <Calendar className="h-4 w-4 mr-2 text-finance-accent" />
                <span>{publication.date}</span>
              </div>
              <div className="flex items-center">
                <BookOpen className="h-4 w-4 mr-2 text-finance-accent" />
                <span>{publication.type === 'article' ? safeTranslate(t, 'community.article', 'Article') : safeTranslate(t, 'community.strategy', 'Stratégie')}</span>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between items-center">
              <Link to={`/community/${publication.type}/${publication.id}`} className="text-finance-accent hover:underline flex items-center">
                {safeTranslate(t, 'common.readMore', 'Lire plus')}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
              <div className="flex items-center space-x-3">
                <div className="flex items-center">
                  <Eye className="h-4 w-4 mr-1 text-finance-accent" />
                  <span>{publication.views}</span>
                </div>
                <div className="flex items-center">
                  <ThumbsUp className="h-4 w-4 mr-1 text-finance-accent" />
                  <span>{publication.likes}</span>
                </div>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Explore;
