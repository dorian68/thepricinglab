
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { safeTranslate } from '@/utils/translationUtils';
import { 
  MessageCircle, 
  Users,
  Search,
  Filter,
  ThumbsUp,
  Eye,
  Calendar,
  Pin,
  Hash,
  PlusCircle,
  ChevronRight
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Données mockées pour les catégories de forum
const forumCategories = [
  {
    id: 'general',
    name: 'Général',
    description: 'Discussions générales sur la finance quantitative',
    topics: 156,
    posts: 2347,
    color: 'bg-blue-600/20 text-blue-400'
  },
  {
    id: 'derivatives',
    name: 'Produits dérivés',
    description: 'Options, futures, swaps et autres dérivés',
    topics: 124,
    posts: 1853,
    color: 'bg-purple-600/20 text-purple-400'
  },
  {
    id: 'volatility',
    name: 'Volatilité',
    description: 'Modèles de volatilité, surfaces et calibration',
    topics: 98,
    posts: 1245,
    color: 'bg-pink-600/20 text-pink-400'
  },
  {
    id: 'career',
    name: 'Carrières',
    description: 'Opportunités professionnelles, formations, certifications',
    topics: 76,
    posts: 893,
    color: 'bg-green-600/20 text-green-400'
  }
];

// Données mockées pour les sujets récents
const recentTopics = [
  {
    id: 1,
    title: 'Calibration du modèle de Heston pour options sur indices',
    category: 'volatility',
    author: {
      name: 'MarketMaster',
      avatar: 'https://i.pravatar.cc/150?img=1'
    },
    replies: 34,
    views: 412,
    likes: 22,
    isPinned: true,
    isLocked: false,
    lastActivity: '2h ago',
    tags: ['Heston', 'Calibration', 'Surface de Vol']
  },
  {
    id: 2,
    title: 'Implémentation de Monte Carlo pour les options asiatiques',
    category: 'derivatives',
    author: {
      name: 'AlgoTrader',
      avatar: 'https://i.pravatar.cc/150?img=2'
    },
    replies: 18,
    views: 256,
    likes: 15,
    isPinned: false,
    isLocked: false,
    lastActivity: '5h ago',
    tags: ['Monte Carlo', 'Options Asiatiques', 'Implémentation']
  },
  {
    id: 3,
    title: 'Comparatif des plateformes de trading quantitatif',
    category: 'general',
    author: {
      name: 'QuantAnalyst',
      avatar: 'https://i.pravatar.cc/150?img=3'
    },
    replies: 42,
    views: 589,
    likes: 36,
    isPinned: false,
    isLocked: false,
    lastActivity: '1d ago',
    tags: ['Trading Quantitatif', 'Plateformes', 'Comparatif']
  },
  {
    id: 4,
    title: 'Préparation aux entretiens quantitatifs en finance',
    category: 'career',
    author: {
      name: 'CareerCoach',
      avatar: 'https://i.pravatar.cc/150?img=4'
    },
    replies: 29,
    views: 378,
    likes: 31,
    isPinned: false,
    isLocked: false,
    lastActivity: '2d ago',
    tags: ['Carrière', 'Entretiens', 'Préparation']
  }
];

const Forum = () => {
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Filtrage des sujets en fonction de la catégorie et de la recherche
  const filteredTopics = recentTopics.filter(topic => {
    const matchesCategory = activeCategory ? topic.category === activeCategory : true;
    const matchesSearch = topic.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-finance-accent mb-2">
            {safeTranslate(t, 'community.forum.title', 'Forum de la communauté')}
          </h1>
          <p className="text-finance-lightgray">
            {safeTranslate(t, 'community.forum.subtitle', 'Discutez avec d\'autres professionnels de la finance quantitative')}
          </p>
        </div>
        
        <Button variant="finance" className="mt-4 md:mt-0 flex items-center gap-2">
          <PlusCircle className="h-4 w-4" />
          {safeTranslate(t, 'community.forum.newTopic', 'Nouveau sujet')}
        </Button>
      </div>
      
      <div className="finance-card p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-finance-lightgray h-4 w-4" />
            <Input 
              placeholder={safeTranslate(t, 'community.forum.searchPlaceholder', 'Rechercher dans le forum...')}
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button 
              className={`px-3 py-1 rounded-full text-sm ${!activeCategory ? 'bg-finance-accent/20 text-finance-accent' : 'bg-finance-charcoal text-finance-lightgray'}`}
              onClick={() => setActiveCategory(null)}
            >
              {safeTranslate(t, 'community.forum.allCategories', 'Toutes les catégories')}
            </button>
            
            {forumCategories.map(category => (
              <button 
                key={category.id}
                className={`px-3 py-1 rounded-full text-sm ${activeCategory === category.id ? 'bg-finance-accent/20 text-finance-accent' : 'bg-finance-charcoal text-finance-lightgray'}`}
                onClick={() => setActiveCategory(category.id)}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <Tabs defaultValue="recent" className="mb-8">
        <TabsList className="mb-6">
          <TabsTrigger value="recent" className="data-[state=active]:text-finance-accent">
            {safeTranslate(t, 'community.forum.recentTopics', 'Sujets récents')}
          </TabsTrigger>
          <TabsTrigger value="popular" className="data-[state=active]:text-finance-accent">
            {safeTranslate(t, 'community.forum.popularTopics', 'Sujets populaires')}
          </TabsTrigger>
          <TabsTrigger value="unanswered" className="data-[state=active]:text-finance-accent">
            {safeTranslate(t, 'community.forum.unansweredTopics', 'Sans réponse')}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="recent" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {forumCategories.map(category => (
              <div 
                key={category.id}
                className="finance-card p-4 hover:border-finance-accent transition-colors duration-300 cursor-pointer"
                onClick={() => setActiveCategory(category.id)}
              >
                <div className={`inline-block ${category.color} rounded-full px-2 py-1 text-xs mb-2`}>
                  {category.name}
                </div>
                <p className="text-finance-lightgray text-sm mb-3">{category.description}</p>
                <div className="flex justify-between text-xs text-finance-lightgray">
                  <span>{category.topics} sujets</span>
                  <span>{category.posts} messages</span>
                </div>
              </div>
            ))}
          </div>
          
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <MessageCircle className="h-5 w-5 mr-2 text-finance-accent" />
            {searchQuery ? 
              `Résultats pour "${searchQuery}"` : 
              activeCategory ? 
                `Sujets dans ${forumCategories.find(c => c.id === activeCategory)?.name}` : 
                safeTranslate(t, 'community.forum.recentTopics', 'Sujets récents')}
          </h2>
          
          {filteredTopics.length === 0 ? (
            <div className="finance-card p-8 text-center">
              <p className="text-finance-lightgray">
                {safeTranslate(t, 'community.forum.noResults', 'Aucun sujet ne correspond à votre recherche.')}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTopics.map(topic => (
                <div 
                  key={topic.id}
                  className={`finance-card p-4 hover:border-finance-accent transition-colors duration-300 ${
                    topic.isPinned ? 'border-l-2 border-l-finance-accent' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="hidden md:block">
                      <div className="w-10 h-10 rounded-full overflow-hidden">
                        <img src={topic.author.avatar} alt={topic.author.name} className="w-full h-full object-cover" />
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex flex-wrap gap-2 items-center mb-2">
                        {topic.isPinned && (
                          <Badge variant="outline" className="text-yellow-500 border-yellow-500">
                            <Pin className="h-3 w-3 mr-1" />
                            Épinglé
                          </Badge>
                        )}
                        <Badge className={`${forumCategories.find(c => c.id === topic.category)?.color}`}>
                          {forumCategories.find(c => c.id === topic.category)?.name}
                        </Badge>
                      </div>
                      
                      <h3 className="text-lg font-medium mb-2 hover:text-finance-accent transition-colors">
                        {topic.title}
                      </h3>
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        {topic.tags.map((tag, index) => (
                          <div key={index} className="flex items-center px-2 py-1 bg-finance-charcoal rounded-full text-xs text-finance-lightgray">
                            <Hash className="h-3 w-3 mr-1" />
                            {tag}
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex flex-wrap justify-between items-center text-sm text-finance-lightgray">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center">
                            <MessageCircle className="h-4 w-4 mr-1 text-finance-accent" />
                            {topic.replies}
                          </span>
                          <span className="flex items-center">
                            <Eye className="h-4 w-4 mr-1 text-finance-accent" />
                            {topic.views}
                          </span>
                          <span className="flex items-center">
                            <ThumbsUp className="h-4 w-4 mr-1 text-finance-accent" />
                            {topic.likes}
                          </span>
                        </div>
                        
                        <div className="flex items-center mt-2 md:mt-0">
                          <span className="hidden md:inline mr-2">Dernière activité:</span>
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>{topic.lastActivity}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="hidden md:flex items-center">
                      <Button variant="ghost" size="sm">
                        <ChevronRight className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-6 flex justify-center">
            <Button variant="outline" className="mr-2">
              &laquo; Précédent
            </Button>
            <Button variant="outline">
              Suivant &raquo;
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="popular">
          <div className="finance-card p-8 text-center">
            <Users className="h-12 w-12 mx-auto text-finance-accent opacity-50 mb-4" />
            <h3 className="text-xl font-medium mb-2">
              {safeTranslate(t, 'community.forum.popularTopicsTitle', 'Sujets populaires')}
            </h3>
            <p className="text-finance-lightgray mb-4">
              {safeTranslate(t, 'community.forum.popularTopicsDescription', 'Découvrez les discussions les plus actives de notre communauté.')}
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="unanswered">
          <div className="finance-card p-8 text-center">
            <MessageCircle className="h-12 w-12 mx-auto text-finance-accent opacity-50 mb-4" />
            <h3 className="text-xl font-medium mb-2">
              {safeTranslate(t, 'community.forum.unansweredTopicsTitle', 'Questions sans réponse')}
            </h3>
            <p className="text-finance-lightgray mb-4">
              {safeTranslate(t, 'community.forum.unansweredTopicsDescription', 'Aidez la communauté en répondant aux questions sans réponse.')}
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Forum;
