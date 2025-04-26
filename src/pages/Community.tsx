import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Users,
  User,
  ChevronRight,
  Calendar,
  MessageCircle,
  Eye,
  ThumbsUp,
  Search,
  Filter,
  PlusCircle,
  Bell,
  TrendingUp,
  TagIcon,
  Edit,
  HelpCircle,
  Lightbulb,
  Award,
  Hash,
  Calendar as CalendarIcon,
  Code,
  Laptop,
  Zap,
  BookOpen,
  FileText
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { safeTranslate } from "@/utils/translationUtils";
import { Button } from "@/components/ui/button";
import { useAuth } from "../contexts/AuthContext";

// Category data
const categories = [
  { 
    id: "general",
    name: "Général",
    description: "Discussions générales sur la finance quantitative",
    icon: MessageSquare,
    topics: 156,
    posts: 2347,
    color: "bg-finance-burgundy/20",
    link: "/community/forum"
  },
  { 
    id: "chat",
    name: "Chat en direct",
    description: "Échangez en temps réel avec la communauté",
    icon: MessageCircle,
    topics: 0,
    posts: 0,
    color: "bg-blue-900/20",
    link: "/community/chat"
  },
  { 
    id: "weekly-challenge",
    name: "Défis hebdomadaires",
    description: "Relevez des défis de finance quantitative",
    icon: Zap,
    topics: 0,
    posts: 0,
    color: "bg-purple-900/20",
    link: "/community/weekly-challenge"
  },
  { 
    id: "pair-programming",
    name: "Pair Programming",
    description: "Codez en binôme avec d'autres développeurs",
    icon: Laptop,
    topics: 0,
    posts: 0,
    color: "bg-orange-900/20",
    link: "/community/pair-programming"
  }
];

// Topic data
const topics = [
  {
    id: 1,
    title: "Calibration de modèles de volatilité stochastique - Approches et défis",
    category: "volatility",
    author: {
      username: "QuantMaster",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
    },
    replies: 23,
    views: 456,
    likes: 47,
    lastReply: {
      username: "VolTrader",
      date: "Il y a 2 heures"
    },
    tags: ["Heston", "Calibration", "SABR", "Surface de volatilité"],
    isSticky: true,
    isPinned: false
  },
  {
    id: 2,
    title: "Résolution d'équations différentielles stochastiques en finance",
    category: "general",
    author: {
      username: "OptionPro",
      avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
    },
    replies: 18,
    views: 320,
    likes: 32,
    lastReply: {
      username: "DerivativeNinja",
      date: "Il y a 5 heures"
    },
    tags: ["SDE", "Méthodes numériques", "Monte Carlo", "Euler-Maruyama"],
    isSticky: false,
    isPinned: true
  },
  {
    id: 3,
    title: "Hackathon de Pricing d'Options - Inscription et détails",
    category: "events",
    author: {
      username: "Admin",
      avatar: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
    },
    replies: 42,
    views: 780,
    likes: 89,
    lastReply: {
      username: "FinanceWhiz",
      date: "Il y a 1 jour"
    },
    tags: ["Hackathon", "Événement", "Challenge", "Prix"],
    isSticky: true,
    isPinned: true
  },
  {
    id: 4,
    title: "Implémentation du modèle de Heston en Python",
    category: "volatility",
    author: {
      username: "VolTrader",
      avatar: "https://images.unsplash.com/photo-1601412436009-d964bd02edbc?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
    },
    replies: 15,
    views: 287,
    likes: 28,
    lastReply: {
      username: "AlgoFinance",
      date: "Il y a 1 jour"
    },
    tags: ["Heston", "Python", "Implémentation", "Code"],
    isSticky: false,
    isPinned: false
  },
  {
    id: 5,
    title: "Comparaison des modèles pour le pricing d'options exotiques",
    category: "derivatives",
    author: {
      username: "BlackScholes",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
    },
    replies: 32,
    views: 415,
    likes: 53,
    lastReply: {
      username: "QuantMaster",
      date: "Il y a 2 jours"
    },
    tags: ["Options exotiques", "Monte Carlo", "Arbres", "FDM"],
    isSticky: false,
    isPinned: false
  }
];

// Members currently online
const onlineMembers = [
  {
    username: "QuantMaster",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
  },
  {
    username: "OptionPro",
    avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
  },
  {
    username: "VolTrader",
    avatar: "https://images.unsplash.com/photo-1601412436009-d964bd02edbc?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
  },
  {
    username: "AlgoFinance",
    avatar: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
  },
  {
    username: "BlackScholes",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
  }
];

// Upcoming events
const upcomingEvents = [
  {
    id: 1,
    title: "Hackathon de Pricing d'Options",
    date: "25-27 Avril 2025",
    participants: 78,
    description: "Un challenge de 48 heures pour développer le meilleur modèle de pricing d'options"
  },
  {
    id: 2,
    title: "Webinaire: Trading algorithmique",
    date: "30 Avril 2025",
    participants: 156,
    description: "Présentation des stratégies de trading algorithmique par des experts du domaine"
  }
];

// Community polls
const polls = [
  {
    id: 1,
    question: "Quel modèle de volatilité préférez-vous?",
    options: [
      { id: "a", text: "SABR", votes: 45, percentage: 45 },
      { id: "b", text: "Heston", votes: 30, percentage: 30 },
      { id: "c", text: "Local Vol", votes: 15, percentage: 15 },
      { id: "d", text: "Autre", votes: 10, percentage: 10 }
    ],
    totalVotes: 100,
    endDate: "Dans 3 jours"
  }
];

const Community = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("forum");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { profile } = useAuth();
  
  // Filter topics based on search query and selected category
  const filteredTopics = topics.filter(topic => {
    const matchesSearch = topic.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory ? topic.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold terminal-text mb-2">{safeTranslate(t, 'community.title', 'Communauté')}</h1>
          <p className="text-finance-lightgray">
            {safeTranslate(t, 'community.subtitle', 'Rejoignez notre communauté de professionnels de la finance quantitative')}
          </p>
        </div>
        
        <div className="flex gap-3 mt-4 md:mt-0">
          <Button variant="outline" className="flex items-center">
            <Bell className="mr-2 h-4 w-4" />
            {safeTranslate(t, 'community.notifications', 'Notifications')}
          </Button>
          <Button variant="finance" className="flex items-center">
            <PlusCircle className="mr-2 h-4 w-4" />
            {safeTranslate(t, 'community.newTopic', 'Nouveau sujet')}
          </Button>
        </div>
      </div>
      
      {/* New collaborative content section */}
      <div className="finance-card p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Publications collaboratives</h2>
        <p className="text-finance-lightgray mb-4">
          Découvrez les articles et stratégies publiés par la communauté ou contribuez avec votre propre contenu.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <Button asChild variant="default" className="flex items-center">
            <Link to="/community/explore">
              <BookOpen className="mr-2 h-4 w-4" />
              Explorer les publications
            </Link>
          </Button>
          <Button asChild variant="finance" className="flex items-center">
            <Link to="/community/contribute">
              <FileText className="mr-2 h-4 w-4" />
              Contribuer
            </Link>
          </Button>
        </div>
      </div>
      
      {/* Feature grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {categories.map((category) => (
          <Link 
            key={category.id}
            to={category.link}
            className="finance-card p-6 hover:border-finance-accent transition-colors duration-300"
          >
            <div className={`p-3 rounded-full ${category.color} inline-flex mb-4`}>
              <category.icon className="h-6 w-6 text-finance-accent" />
            </div>
            <h3 className="text-xl font-semibold text-finance-offwhite mb-2">{category.name}</h3>
            <p className="text-finance-lightgray mb-4">{category.description}</p>
            <div className="flex items-center text-finance-accent">
              <span className="text-sm">Explorer</span>
              <ChevronRight className="h-4 w-4 ml-1" />
            </div>
          </Link>
        ))}
      </div>
      
      {/* Recent discussions */}
      <div className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold flex items-center">
            <MessageSquare className="h-5 w-5 mr-2 text-finance-accent" />
            {safeTranslate(t, 'community.recentDiscussions', 'Discussions récentes')}
          </h2>
          <Link to="/community/forum" className="text-finance-accent flex items-center hover:underline">
            {safeTranslate(t, 'community.viewAllDiscussions', 'Voir toutes les discussions')}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
        
        <div className="space-y-4">
          {topics.slice(0, 3).map((topic) => (
            <Link 
              key={topic.id}
              to="/community/forum"
              className={`finance-card p-4 hover:border-finance-accent transition-colors duration-300 block ${
                topic.isSticky || topic.isPinned ? 'border-l-2 border-l-finance-accent' : ''
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center mb-3">
                <div className="flex items-center flex-1">
                  <div className="h-9 w-9 rounded-full overflow-hidden mr-3">
                    <img 
                      src={topic.author.avatar} 
                      alt={topic.author.username} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="flex items-center">
                      <span className="text-finance-offwhite font-medium mr-2">{topic.author.username}</span>
                      {topic.isSticky && (
                        <Badge variant="secondary" className="mr-1 bg-yellow-900/20 text-yellow-500 border-yellow-500/50">Épinglé</Badge>
                      )}
                      {topic.isPinned && (
                        <Badge variant="secondary" className="bg-blue-900/20 text-blue-500 border-blue-500/50">Annonce</Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center mt-2 md:mt-0">
                  <div className="flex items-center mr-4">
                    <MessageCircle className="h-4 w-4 text-finance-accent mr-1" />
                    <span className="text-finance-lightgray text-sm">{topic.replies}</span>
                  </div>
                  <div className="flex items-center mr-4">
                    <Eye className="h-4 w-4 text-finance-accent mr-1" />
                    <span className="text-finance-lightgray text-sm">{topic.views}</span>
                  </div>
                  <div className="flex items-center">
                    <ThumbsUp className="h-4 w-4 text-finance-accent mr-1" />
                    <span className="text-finance-lightgray text-sm">{topic.likes}</span>
                  </div>
                </div>
              </div>
              
              <h3 className="text-lg font-medium text-finance-offwhite mb-3">{topic.title}</h3>
              
              <div className="flex flex-wrap gap-2 mb-3">
                {topic.tags.slice(0, 3).map((tag, index) => (
                  <div 
                    key={index}
                    className="flex items-center px-2 py-1 bg-finance-steel/10 rounded-full text-xs text-finance-lightgray"
                  >
                    <Hash className="h-3 w-3 mr-1" />
                    {tag}
                  </div>
                ))}
                {topic.tags.length > 3 && (
                  <div className="flex items-center px-2 py-1 bg-finance-steel/10 rounded-full text-xs text-finance-lightgray">
                    +{topic.tags.length - 3}
                  </div>
                )}
              </div>
              
              <div className="flex justify-between items-center">
                <div className="text-finance-lightgray text-xs flex items-center">
                  <span className="mr-1">{safeTranslate(t, 'community.lastReply', 'Dernière réponse')}:</span>
                  <span className="text-finance-accent">{topic.lastReply.username}</span>
                  <span className="mx-1">•</span>
                  <span>{topic.lastReply.date}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
      
      {/* Upcoming events */}
      <div className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-finance-accent" />
            {safeTranslate(t, 'community.upcomingEvents', 'Événements à venir')}
          </h2>
          <Link to="/community/weekly-challenge" className="text-finance-accent flex items-center hover:underline">
            {safeTranslate(t, 'community.viewAllEvents', 'Voir tous les événements')}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {upcomingEvents.map((event) => (
            <Link 
              key={event.id}
              to="/community/weekly-challenge"
              className="finance-card p-6 hover:border-finance-accent transition-colors duration-300 block"
            >
              <h3 className="text-xl font-medium text-finance-offwhite mb-2">{event.title}</h3>
              
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <div className="flex items-center px-3 py-1 bg-finance-burgundy/20 rounded-full">
                  <Calendar className="h-4 w-4 text-finance-accent mr-2" />
                  <span className="text-finance-offwhite text-sm">{event.date}</span>
                </div>
                
                <div className="flex items-center px-3 py-1 bg-finance-steel/10 rounded-full">
                  <Users className="h-4 w-4 text-finance-accent mr-2" />
                  <span className="text-finance-lightgray text-sm">{event.participants} participants</span>
                </div>
              </div>
              
              <p className="text-finance-lightgray mb-4">{event.description}</p>
              
              <div className="flex justify-end">
                <Button variant="finance" size="sm">
                  {safeTranslate(t, 'community.registerEvent', 'S\'inscrire')}
                </Button>
              </div>
            </Link>
          ))}
        </div>
      </div>
      
      {/* Community poll and online members */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 finance-card p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-finance-accent" />
            {safeTranslate(t, 'community.communityPoll', 'Sondage communautaire')}
          </h3>
          
          {polls.map((poll) => (
            <div key={poll.id}>
              <p className="text-finance-offwhite mb-4">{poll.question}</p>
              
              <div className="space-y-3 mb-4">
                {poll.options.map((option) => (
                  <div key={option.id} className="relative">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-finance-lightgray text-sm">{option.text}</span>
                      <span className="text-finance-accent text-sm">{option.percentage}%</span>
                    </div>
                    <div className="h-2 bg-finance-steel/20 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-finance-accent rounded-full" 
                        style={{ width: `${option.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-between items-center text-finance-lightgray text-xs">
                <span>{poll.totalVotes} votes</span>
                <span>Se termine {poll.endDate}</span>
              </div>
            </div>
          ))}
        </div>
        
        <div className="finance-card p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold flex items-center">
              <Users className="h-5 w-5 mr-2 text-finance-accent" />
              {safeTranslate(t, 'community.onlineMembers', 'Membres en ligne')}
            </h3>
            <span className="px-2 py-1 bg-green-900/20 text-green-400 rounded-full text-xs">
              {onlineMembers.length} en ligne
            </span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {onlineMembers.map((member) => (
              <div 
                key={member.username}
                className="flex flex-col items-center w-16"
                title={member.username}
              >
                <div className="relative mb-1">
                  <div className="w-10 h-10 rounded-full overflow-hidden">
                    <img 
                      src={member.avatar} 
                      alt={member.username} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-finance-dark"></div>
                </div>
                <span className="text-finance-lightgray text-xs truncate w-full text-center">
                  {member.username}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Community;
