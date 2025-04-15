
import { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
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
  Calendar as CalendarIcon
} from "lucide-react";
import { useTranslation } from "react-i18next";

// Category data
const categories = [
  { 
    id: "general",
    name: "Général",
    description: "Discussions générales sur la finance quantitative",
    icon: MessageSquare,
    topics: 156,
    posts: 2347,
    color: "bg-finance-burgundy/20"
  },
  { 
    id: "derivatives",
    name: "Produits dérivés",
    description: "Options, futures, swaps et autres dérivés",
    icon: TrendingUp,
    topics: 124,
    posts: 1853,
    color: "bg-blue-900/20"
  },
  { 
    id: "volatility",
    name: "Volatilité",
    description: "Surface de volatilité, modèles stochastiques et calibration",
    icon: HelpCircle,
    topics: 98,
    posts: 1245,
    color: "bg-purple-900/20"
  },
  { 
    id: "events",
    name: "Événements",
    description: "Hackathons, challenges et rencontres de la communauté",
    icon: CalendarIcon,
    topics: 45,
    posts: 782,
    color: "bg-orange-900/20"
  },
  { 
    id: "careers",
    name: "Carrières",
    description: "Opportunités professionnelles et développement de carrière",
    icon: Award,
    topics: 67,
    posts: 930,
    color: "bg-green-900/20"
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
  const [activeTab, setActiveTab] = useState("forum");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Filter topics based on search query and selected category
  const filteredTopics = topics.filter(topic => {
    const matchesSearch = topic.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory ? topic.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });
  
  return (
    <div className="flex flex-col min-h-screen bg-finance-dark text-finance-offwhite">
      <Navbar />
      
      <main className="flex-1 py-8 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold terminal-text mb-2">{t('community.title')}</h1>
              <p className="text-finance-lightgray">
                {t('community.subtitle')}
              </p>
            </div>
            
            <div className="flex gap-3 mt-4 md:mt-0">
              <button className="finance-button-outline flex items-center">
                <Bell className="mr-2 h-4 w-4" />
                {t('community.notifications')}
              </button>
              <button className="finance-button flex items-center">
                <PlusCircle className="mr-2 h-4 w-4" />
                {t('community.newTopic')}
              </button>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="border-b border-finance-steel/10 mb-6">
            <div className="flex overflow-x-auto">
              <button 
                onClick={() => setActiveTab("forum")}
                className={`px-6 py-4 font-medium text-sm ${
                  activeTab === "forum" 
                    ? "border-b-2 border-finance-accent text-finance-offwhite" 
                    : "border-b-2 border-transparent text-finance-lightgray hover:text-finance-offwhite"
                }`}
              >
                <div className="flex items-center">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  {t('community.tabs.forum')}
                </div>
              </button>
              <button 
                onClick={() => setActiveTab("events")}
                className={`px-6 py-4 font-medium text-sm ${
                  activeTab === "events" 
                    ? "border-b-2 border-finance-accent text-finance-offwhite" 
                    : "border-b-2 border-transparent text-finance-lightgray hover:text-finance-offwhite"
                }`}
              >
                <div className="flex items-center">
                  <Calendar className="mr-2 h-4 w-4" />
                  {t('community.tabs.events')}
                </div>
              </button>
              <button 
                onClick={() => setActiveTab("members")}
                className={`px-6 py-4 font-medium text-sm ${
                  activeTab === "members" 
                    ? "border-b-2 border-finance-accent text-finance-offwhite" 
                    : "border-b-2 border-transparent text-finance-lightgray hover:text-finance-offwhite"
                }`}
              >
                <div className="flex items-center">
                  <Users className="mr-2 h-4 w-4" />
                  {t('community.tabs.members')}
                </div>
              </button>
            </div>
          </div>
          
          {/* Forum tab content */}
          {activeTab === "forum" && (
            <div className="space-y-8">
              {/* Search and filter */}
              <div className="finance-card p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-finance-lightgray" />
                      <input
                        type="text"
                        placeholder={t('community.searchTopics')}
                        className="w-full bg-finance-charcoal/30 border border-finance-steel/20 rounded pl-10 pr-4 py-2 text-finance-offwhite placeholder:text-finance-lightgray focus:outline-none focus:border-finance-accent"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <button
                      className={`px-3 py-1.5 rounded text-sm ${
                        !selectedCategory
                          ? 'bg-finance-burgundy/20 text-finance-accent' 
                          : 'bg-finance-steel/10 text-finance-lightgray hover:bg-finance-steel/20'
                      }`}
                      onClick={() => setSelectedCategory(null)}
                    >
                      {t('community.allCategories')}
                    </button>
                    
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        className={`px-3 py-1.5 rounded text-sm ${
                          selectedCategory === category.id
                            ? 'bg-finance-burgundy/20 text-finance-accent' 
                            : 'bg-finance-steel/10 text-finance-lightgray hover:bg-finance-steel/20'
                        }`}
                        onClick={() => setSelectedCategory(category.id)}
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Categories */}
              <div>
                <h2 className="text-xl font-medium mb-4">{t('community.categories')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories.map((category) => (
                    <div 
                      key={category.id}
                      className="finance-card p-4 hover:border-finance-accent transition-colors duration-300 cursor-pointer"
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      <div className="flex items-start">
                        <div className={`p-2.5 rounded-full ${category.color} mr-3`}>
                          <category.icon className="h-5 w-5 text-finance-accent" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-finance-offwhite font-medium">{category.name}</h3>
                          <p className="text-finance-lightgray text-sm mt-1 mb-3">{category.description}</p>
                          <div className="flex items-center text-finance-lightgray text-xs">
                            <span className="mr-3">{category.topics} sujets</span>
                            <span>{category.posts} messages</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Topics */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-medium">{t('community.recentTopics')}</h2>
                  <div className="flex items-center">
                    <Filter className="h-4 w-4 text-finance-accent mr-2" />
                    <select className="bg-transparent text-finance-lightgray text-sm focus:outline-none">
                      <option>{t('community.sortByRecent')}</option>
                      <option>{t('community.sortByPopular')}</option>
                      <option>{t('community.sortByActivity')}</option>
                    </select>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {filteredTopics.map((topic) => (
                    <div 
                      key={topic.id}
                      className={`finance-card p-4 hover:border-finance-accent transition-colors duration-300 ${
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
                                <Badge variant="achievement" className="mr-1">Épinglé</Badge>
                              )}
                              {topic.isPinned && (
                                <Badge variant="warning">Annonce</Badge>
                              )}
                            </div>
                            <div className="text-finance-lightgray text-xs">
                              {categories.find(c => c.id === topic.category)?.name}
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
                        {topic.tags.map((tag, index) => (
                          <div 
                            key={index}
                            className="flex items-center px-2 py-1 bg-finance-steel/10 rounded-full text-xs text-finance-lightgray"
                          >
                            <Hash className="h-3 w-3 mr-1" />
                            {tag}
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="text-finance-lightgray text-xs flex items-center">
                          <span className="mr-1">{t('community.lastReply')}:</span>
                          <span className="text-finance-accent">{topic.lastReply.username}</span>
                          <span className="mx-1">•</span>
                          <span>{topic.lastReply.date}</span>
                        </div>
                        
                        <button className="text-finance-accent text-sm flex items-center hover:underline">
                          {t('community.readMore')} <ChevronRight className="ml-1 h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Events tab content */}
          {activeTab === "events" && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  {/* Upcoming events */}
                  <div>
                    <h2 className="text-xl font-medium mb-4">{t('community.upcomingEvents')}</h2>
                    <div className="space-y-4">
                      {upcomingEvents.map((event) => (
                        <div key={event.id} className="finance-card p-6 hover:border-finance-accent transition-colors duration-300">
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
                            <button className="finance-button text-sm">{t('community.registerNow')}</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Past events */}
                  <div>
                    <h2 className="text-xl font-medium mb-4">{t('community.pastEvents')}</h2>
                    <div className="finance-card p-6">
                      <div className="flex justify-center items-center py-8">
                        <div className="text-center">
                          <Calendar className="h-12 w-12 text-finance-accent mx-auto mb-3 opacity-50" />
                          <h3 className="text-lg font-medium text-finance-offwhite mb-2">{t('community.noPastEvents')}</h3>
                          <p className="text-finance-lightgray text-sm max-w-md">
                            {t('community.noPastEventsDesc')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-6">
                  {/* Community poll */}
                  <div className="finance-card p-6">
                    <h3 className="text-lg font-medium mb-4">{t('community.communityPoll')}</h3>
                    
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
                  
                  {/* Propose an event */}
                  <div className="finance-card p-6">
                    <h3 className="text-lg font-medium mb-3">{t('community.proposeEvent')}</h3>
                    <p className="text-finance-lightgray text-sm mb-4">
                      {t('community.proposeEventDesc')}
                    </p>
                    <button className="finance-button w-full text-sm">
                      {t('community.submitProposal')}
                    </button>
                  </div>
                  
                  {/* Online members */}
                  <div className="finance-card p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium">{t('community.onlineMembers')}</h3>
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
            </div>
          )}
          
          {/* Members tab content */}
          {activeTab === "members" && (
            <div className="finance-card p-12 text-center">
              <Users className="h-16 w-16 text-finance-accent mx-auto mb-4 opacity-50" />
              <h2 className="text-2xl font-medium text-finance-offwhite mb-3">
                {t('community.membersPageComing')}
              </h2>
              <p className="text-finance-lightgray max-w-lg mx-auto mb-6">
                {t('community.membersPageComingDesc')}
              </p>
              <button className="finance-button">{t('community.getNotified')}</button>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Community;
