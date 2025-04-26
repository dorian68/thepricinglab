
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { safeTranslate } from '@/utils/translationUtils';
import { Search, Filter, ThumbsUp, Eye, Calendar, User, PlusCircle, BookOpen, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Publication, Article, Strategy } from '@/types/community';
import { Badge } from '@/components/ui/badge';

// Mock data (this should be replaced with actual data from an API)
const mockPublications: Publication[] = [
  {
    id: "1",
    type: "article" as const,
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
    type: "strategy" as const,
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
    strategyType: "pricing"
  },
  {
    id: "3",
    type: "article" as const,
    title: "L'impact des taux d'intérêt négatifs sur les marchés",
    author: "Lucie Bernard",
    authorAvatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=60",
    summary: "Examen des conséquences des taux négatifs sur l'économie mondiale et les stratégies d'investissement.",
    content: "## L'impact des taux d'intérêt négatifs sur les marchés\n\nLes taux d'intérêt négatifs sont devenus une réalité dans plusieurs économies développées, notamment en Europe et au Japon. Cette politique monétaire non conventionnelle a des conséquences importantes sur les marchés financiers et l'économie mondiale.\n\n### Conséquences sur les banques\n\nLes taux négatifs exercent une pression sur les marges des banques, car elles doivent payer pour déposer des fonds auprès de la banque centrale. Cela peut entraîner une réduction des prêts et une augmentation des frais bancaires.\n\n### Conséquences sur les investisseurs\n\nLes taux négatifs incitent les investisseurs à rechercher des rendements plus élevés, ce qui peut entraîner une augmentation des investissements dans des actifs plus risqués, tels que les actions et l'immobilier.\n\n### Conséquences sur l'économie\n\nLes taux négatifs visent à stimuler l'économie en encourageant les entreprises et les consommateurs à emprunter et à dépenser. Cependant, leur efficacité est controversée, et ils peuvent avoir des effets secondaires indésirables, tels que la formation de bulles d'actifs.",
    date: "20 Mars 2025",
    views: 302,
    likes: 52,
    tags: ["Taux d'intérêt", "Politique monétaire", "Marchés financiers"],
    published: true
  },
  {
    id: "4",
    type: "strategy" as const,
    title: "Iron Condor sur Indice S&P 500",
    author: "Michel Lefebvre",
    authorAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=60",
    summary: "Stratégie de volatilité neutre utilisant quatre jambes d'options pour profiter d'un marché stable.",
    content: "# Iron Condor sur Indice S&P 500\n\nL'Iron Condor est une stratégie d'options à quatre jambes qui combine un bull put spread et un bear call spread. Cette stratégie est utilisée lorsque l'on anticipe une faible volatilité du marché...",
    date: "5 Mai 2025",
    views: 187,
    likes: 24,
    tags: ["Options", "Iron Condor", "S&P 500", "Volatilité"],
    published: true,
    strategyType: "trading"
  }
];

const Explore: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"all" | "articles" | "strategies">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filteredPublications, setFilteredPublications] = useState<Publication[]>(mockPublications);

  // Filter publications based on active tab and search query
  useEffect(() => {
    let filtered = mockPublications;
    
    // Filter by type
    if (activeTab === "articles") {
      filtered = filtered.filter(pub => pub.type === "article");
    } else if (activeTab === "strategies") {
      filtered = filtered.filter(pub => pub.type === "strategy");
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(pub => 
        pub.title.toLowerCase().includes(query) ||
        pub.summary.toLowerCase().includes(query) ||
        pub.author.toLowerCase().includes(query) ||
        pub.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    setFilteredPublications(filtered);
  }, [activeTab, searchQuery]);

  const getDetailLink = (publication: Publication) => {
    return publication.type === "article" 
      ? `/community/article/${publication.id}` 
      : `/community/strategy/${publication.id}`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-finance-accent mb-2">Explorer</h1>
          <p className="text-finance-lightgray">
            {safeTranslate(t, 'community.explore.subtitle', 'Découvrez des articles et stratégies de la communauté')}
          </p>
        </div>
        
        <div className="flex gap-3 mt-4 md:mt-0">
          <Button 
            variant="outline" 
            className="flex items-center"
            onClick={() => navigate('/community')}
          >
            <BookOpen className="mr-2 h-4 w-4" />
            {safeTranslate(t, 'community.explore.backToCommunity', 'Communauté')}
          </Button>
          <Button 
            variant="finance" 
            className="flex items-center"
            onClick={() => navigate('/community/strategy-builder')}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            {safeTranslate(t, 'community.explore.createStrategy', 'Créer une Stratégie')}
          </Button>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
        <div className="w-full md:w-1/2 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-finance-lightgray h-4 w-4" />
          <Input 
            placeholder={safeTranslate(t, 'community.explore.searchPlaceholder', 'Rechercher par titre, auteur ou tag...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Tabs 
          value={activeTab} 
          onValueChange={(value) => setActiveTab(value as "all" | "articles" | "strategies")}
          className="w-full md:w-auto"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">
              Tout
            </TabsTrigger>
            <TabsTrigger value="articles">
              Articles
            </TabsTrigger>
            <TabsTrigger value="strategies">
              Stratégies
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {filteredPublications.length === 0 ? (
        <div className="finance-card p-8 text-center">
          <p className="text-finance-lightgray mb-2">
            {safeTranslate(t, 'community.explore.noResults', 'Aucun résultat trouvé')}
          </p>
          <p className="text-finance-lightgray text-sm">
            {safeTranslate(t, 'community.explore.tryDifferent', 'Essayez une recherche différente ou effacez les filtres')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredPublications.map((publication) => (
            <Link 
              key={publication.id} 
              to={getDetailLink(publication)}
              className="block"
            >
              <Card className="h-full hover:border-finance-accent transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{publication.title}</CardTitle>
                    <Badge variant="secondary">
                      {publication.type === "article" ? "Article" : "Stratégie"}
                    </Badge>
                  </div>
                  <div className="flex items-center text-finance-lightgray text-sm">
                    <User className="h-3 w-3 mr-1" />
                    {publication.author}
                    <span className="mx-1">•</span>
                    <Calendar className="h-3 w-3 mr-1" />
                    {publication.date}
                  </div>
                </CardHeader>
                
                <CardContent>
                  {publication.type === "strategy" && (
                    <Badge variant="outline" className="mb-2">
                      {publication.strategyType}
                    </Badge>
                  )}
                  <p className="text-finance-lightgray text-sm line-clamp-3">
                    {publication.summary}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mt-3">
                    {publication.tags.slice(0, 3).map((tag, i) => (
                      <span 
                        key={i} 
                        className="px-2 py-0.5 bg-finance-dark rounded-full text-xs text-finance-lightgray"
                      >
                        {tag}
                      </span>
                    ))}
                    {publication.tags.length > 3 && (
                      <span className="px-2 py-0.5 bg-finance-dark rounded-full text-xs text-finance-lightgray">
                        +{publication.tags.length - 3}
                      </span>
                    )}
                  </div>
                </CardContent>
                
                <CardFooter className="border-t border-finance-steel pt-3">
                  <div className="flex justify-between w-full text-finance-lightgray text-xs">
                    <div className="flex items-center">
                      <ThumbsUp className="h-3 w-3 mr-1" />
                      {publication.likes}
                      <span className="mx-2">•</span>
                      <Eye className="h-3 w-3 mr-1" />
                      {publication.views}
                    </div>
                    
                    {publication.type === "strategy" && (
                      <div className="flex items-center">
                        <Layers className="h-3 w-3 mr-1" />
                        {safeTranslate(t, 'community.explore.addToPortfolio', 'Ajouter au portefeuille')}
                      </div>
                    )}
                  </div>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Explore;
