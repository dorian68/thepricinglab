
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { BookOpen, Code, Search, Filter, User, Calendar, ChevronRight, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Mock data for community publications
const mockPublications = [
  {
    id: 1,
    type: "article",
    title: "Calibrage du modèle Heston pour options exotiques",
    author: "Martin Dubois",
    authorAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    excerpt: "Une analyse approfondie de la méthode de calibrage du modèle de Heston pour le pricing d'options exotiques, en particulier les options à barrière et les options asiatiques...",
    date: "2024-04-22",
    views: 475,
    likes: 38,
    tags: ["Heston", "Calibrage", "Options exotiques"],
    published: true
  },
  {
    id: 2,
    type: "strategy",
    title: "Stratégie d'arbitrage de volatilité pour indices",
    author: "Sophie Martin",
    authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    excerpt: "Cette stratégie vise à exploiter les différences entre volatilité implicite et réalisée sur les indices majeurs. Particulièrement efficace en période de forte volatilité, elle permet...",
    date: "2024-04-19",
    views: 322,
    likes: 24,
    tags: ["Arbitrage", "Volatilité", "SPX", "Stratégie quantitative"],
    published: true
  },
  {
    id: 3,
    type: "article",
    title: "Impact des taux négatifs sur les modèles de Black-Scholes",
    author: "Alexandre Dupont",
    authorAvatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    excerpt: "Dans un environnement de taux d'intérêt négatifs, le modèle classique de Black-Scholes présente des limitations importantes. Cet article examine les ajustements nécessaires et propose...",
    date: "2024-04-15",
    views: 289,
    likes: 32,
    tags: ["Black-Scholes", "Taux négatifs", "Modélisation"],
    published: true
  },
  {
    id: 4,
    type: "strategy",
    title: "Couverture dynamique pour options sur taux",
    author: "Émilie Lambert",
    authorAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    excerpt: "Stratégie de couverture dynamique pour options sur taux d'intérêt utilisant une combinaison de Delta et Vega hedging. Cette approche optimise le ratio coût-efficacité des couvertures...",
    date: "2024-04-10",
    views: 178,
    likes: 15,
    tags: ["Hedging", "Options sur taux", "Delta", "Vega"],
    published: true
  },
  {
    id: 5,
    type: "article",
    title: "Optimisation de Monte Carlo pour produits structurés",
    author: "Thomas Richard",
    authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    excerpt: "Les techniques d'optimisation de Monte Carlo permettent d'accélérer significativement le pricing des produits structurés complexes. Cet article présente des approches avancées de réduction de variance...",
    date: "2024-04-05",
    views: 211,
    likes: 22,
    tags: ["Monte Carlo", "Produits structurés", "Optimisation"],
    published: true
  }
];

const Explore = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Filter publications based on active tab and search query
  const filteredPublications = mockPublications.filter(pub => {
    const matchesType = activeTab === "all" || pub.type === activeTab;
    const matchesSearch = pub.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         pub.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         pub.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesType && matchesSearch && pub.published;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <Helmet>
        <title>Publications de la communauté | The Pricing Library</title>
        <meta name="description" content="Découvrez les articles et stratégies publiés par notre communauté d'experts en finance quantitative" />
      </Helmet>

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-2">Publications de la communauté</h1>
          <p className="text-finance-lightgray">
            Découvrez les articles et stratégies publiés par notre communauté d'experts
          </p>
        </div>
        
        <Button asChild variant="finance">
          <Link to="/community/contribute">
            Contribuer
          </Link>
        </Button>
      </div>

      <div className="mb-8">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-3 h-4 w-4 text-finance-lightgray" />
            <Input
              className="pl-10"
              placeholder="Rechercher par titre, contenu ou tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" className="flex items-center md:w-auto">
            <Filter className="mr-2 h-4 w-4" />
            Filtres avancés
          </Button>
        </div>

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="all">Tous</TabsTrigger>
            <TabsTrigger value="article">Articles</TabsTrigger>
            <TabsTrigger value="strategy">Stratégies</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            {filteredPublications.map(publication => (
              <PublicationCard key={publication.id} publication={publication} />
            ))}
          </TabsContent>

          <TabsContent value="article" className="space-y-6">
            {filteredPublications.filter(p => p.type === "article").map(publication => (
              <PublicationCard key={publication.id} publication={publication} />
            ))}
          </TabsContent>

          <TabsContent value="strategy" className="space-y-6">
            {filteredPublications.filter(p => p.type === "strategy").map(publication => (
              <PublicationCard key={publication.id} publication={publication} />
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

interface PublicationProps {
  publication: {
    id: number;
    type: string;
    title: string;
    author: string;
    authorAvatar: string;
    excerpt: string;
    date: string;
    views: number;
    likes: number;
    tags: string[];
    published: boolean;
  };
}

const PublicationCard = ({ publication }: PublicationProps) => {
  return (
    <Card className="overflow-hidden hover:border-finance-accent transition-colors duration-300">
      <CardHeader className="pb-3">
        <div className="flex justify-between">
          <Badge variant={publication.type === "article" ? "secondary" : "premium"}>
            {publication.type === "article" ? "Article" : "Stratégie"}
          </Badge>
          <span className="text-sm text-finance-lightgray">{publication.date}</span>
        </div>
        <CardTitle className="text-xl mt-2">{publication.title}</CardTitle>
      </CardHeader>
      
      <CardContent className="pb-3">
        <div className="flex items-center mb-3">
          <div className="h-8 w-8 rounded-full overflow-hidden mr-2">
            <img 
              src={publication.authorAvatar}
              alt={publication.author}
              className="h-full w-full object-cover"
            />
          </div>
          <span className="text-finance-accent">{publication.author}</span>
        </div>
        
        <CardDescription className="text-finance-lightgray mb-4">
          {publication.excerpt.length > 300 
            ? `${publication.excerpt.substring(0, 300)}...` 
            : publication.excerpt}
        </CardDescription>
        
        <div className="flex flex-wrap gap-2 mb-3">
          {publication.tags.map((tag, index) => (
            <Badge key={index} variant="level" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between pt-0">
        <div className="flex items-center text-sm text-finance-lightgray">
          <Eye className="h-4 w-4 mr-1" />
          <span className="mr-4">{publication.views}</span>
          <BookOpen className="h-4 w-4 mr-1" />
          <span>{publication.likes}</span>
        </div>
        
        <Button variant="link" asChild className="text-finance-accent p-0">
          <Link to={`/community/${publication.type}/${publication.id}`}>
            Lire la suite <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default Explore;
