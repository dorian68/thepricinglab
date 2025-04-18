
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { safeTranslate } from '@/utils/translationUtils';
import { 
  Users, 
  Code, 
  Calendar, 
  Clock, 
  Star, 
  Filter, 
  Search,
  MessageSquare,
  Monitor,
  Cpu,
  GitBranch,
  ChevronRight,
  Laptop
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Données mockées pour les sessions de pair programming
const pairSessions = [
  {
    id: 'ps001',
    title: 'Implémentation d\'un modèle de volatilité locale en Python',
    host: {
      name: 'MathFinance',
      avatar: 'https://i.pravatar.cc/150?img=10',
      rating: 4.9,
      level: 'Expert'
    },
    status: 'open',
    date: '18 Mai 2025',
    time: '14:00 - 16:00 UTC',
    topics: ['Volatilité', 'Python', 'Calibration'],
    available: 1,
    participants: 1,
    description: 'Session de pair programming pour implémenter et calibrer un modèle de volatilité locale sur des options vanille.'
  },
  {
    id: 'ps002',
    title: 'Optimisation des calculs Monte Carlo avec vectorisation NumPy',
    host: {
      name: 'DataOptimizer',
      avatar: 'https://i.pravatar.cc/150?img=20',
      rating: 4.7,
      level: 'Avancé'
    },
    status: 'open',
    date: '20 Mai 2025',
    time: '18:00 - 20:00 UTC',
    topics: ['Monte Carlo', 'NumPy', 'Optimisation'],
    available: 2,
    participants: 0,
    description: 'Venez apprendre à accélérer vos simulations Monte Carlo avec les techniques de vectorisation NumPy et les bonnes pratiques.'
  },
  {
    id: 'ps003',
    title: 'Création d\'un backtest de stratégie d\'options',
    host: {
      name: 'OptionTrader',
      avatar: 'https://i.pravatar.cc/150?img=30',
      rating: 4.8,
      level: 'Intermédiaire'
    },
    status: 'full',
    date: '19 Mai 2025',
    time: '16:00 - 18:00 UTC',
    topics: ['Backtest', 'Options', 'Stratégie'],
    available: 0,
    participants: 2,
    description: 'Session pour coder un système de backtest de stratégies d\'options sur indices. Compatible avec toutes compétences Python.'
  },
  {
    id: 'ps004',
    title: 'Visualisation de surface de volatilité avec Plotly',
    host: {
      name: 'VolSurface',
      avatar: 'https://i.pravatar.cc/150?img=40',
      rating: 4.5,
      level: 'Intermédiaire'
    },
    status: 'open',
    date: '22 Mai 2025',
    time: '15:00 - 17:00 UTC',
    topics: ['Visualisation', 'Plotly', 'Volatilité'],
    available: 3,
    participants: 1,
    description: 'Créons ensemble des visualisations interactives de surfaces de volatilité avec Plotly. Apportez vos données ou utilisez les nôtres.'
  }
];

// Données mockées pour les projets collaboratifs
const collaborativeProjects = [
  {
    id: 'cp001',
    title: 'Bibliothèque de pricing d\'options open-source',
    description: 'Développement d\'une bibliothèque open-source de pricing d\'options utilisant différentes méthodes numériques.',
    status: 'En cours',
    members: 7,
    level: 'Intermédiaire à Expert',
    language: 'Python',
    github: 'github.com/open-options-lib/project',
    progress: 65,
    topics: ['Options', 'Pricing', 'Open Source'],
    lastActivity: '2 jours'
  },
  {
    id: 'cp002',
    title: 'Plateforme de backtesting collaboratif',
    description: 'Création d\'une plateforme web permettant le backtest collaboratif de stratégies de trading.',
    status: 'Recrutement',
    members: 4,
    level: 'Intermédiaire',
    language: 'Python, JavaScript',
    github: 'github.com/quant-backtest/platform',
    progress: 30,
    topics: ['Backtest', 'Web', 'Collaboration'],
    lastActivity: '5 jours'
  },
  {
    id: 'cp003',
    title: 'Dataset de volatilité implicite historique',
    description: 'Projet de collecte, nettoyage et mise à disposition d\'un jeu de données de volatilité implicite historique.',
    status: 'En cours',
    members: 5,
    level: 'Débutant à Intermédiaire',
    language: 'Python, SQL',
    github: 'github.com/vol-dataset/historical',
    progress: 80,
    topics: ['Dataset', 'Volatilité', 'Data Science'],
    lastActivity: '1 jour'
  }
];

const PairProgramming = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('sessions');
  const [searchQuery, setSearchQuery] = useState('');
  const [topicFilter, setTopicFilter] = useState('all');

  // Filtrage des sessions en fonction de la recherche et du filtre de sujet
  const filteredSessions = pairSessions.filter(session => {
    const matchesSearch = session.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         session.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTopic = topicFilter === 'all' || session.topics.some(topic => topic.toLowerCase() === topicFilter.toLowerCase());
    return matchesSearch && matchesTopic;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-finance-accent mb-2">
            {safeTranslate(t, 'community.pairProgramming.title', 'Pair Programming')}
          </h1>
          <p className="text-finance-lightgray">
            {safeTranslate(t, 'community.pairProgramming.subtitle', 'Collaborez en temps réel avec d\'autres développeurs quantitatifs')}
          </p>
        </div>
        
        <Button variant="finance" className="mt-4 md:mt-0">
          {safeTranslate(t, 'community.pairProgramming.createSession', 'Créer une session')}
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="mb-6">
          <TabsTrigger value="sessions" className="data-[state=active]:text-finance-accent">
            <Users className="h-4 w-4 mr-2" />
            {safeTranslate(t, 'community.pairProgramming.pairSessions', 'Sessions de pair')}
          </TabsTrigger>
          <TabsTrigger value="projects" className="data-[state=active]:text-finance-accent">
            <Code className="h-4 w-4 mr-2" />
            {safeTranslate(t, 'community.pairProgramming.collaborativeProjects', 'Projets collaboratifs')}
          </TabsTrigger>
          <TabsTrigger value="myProgramming" className="data-[state=active]:text-finance-accent">
            <Laptop className="h-4 w-4 mr-2" />
            {safeTranslate(t, 'community.pairProgramming.myProgramming', 'Mes sessions')}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="sessions">
          <div className="finance-card p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-finance-lightgray h-4 w-4" />
                <Input 
                  placeholder={safeTranslate(t, 'community.pairProgramming.searchSessions', 'Rechercher des sessions...')}
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="flex gap-3">
                <div className="flex items-center">
                  <Filter className="h-4 w-4 text-finance-accent mr-2" />
                  <Select value={topicFilter} onValueChange={setTopicFilter}>
                    <SelectTrigger className="w-[150px] md:w-[180px]">
                      <SelectValue placeholder="Sujet" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les sujets</SelectItem>
                      <SelectItem value="Python">Python</SelectItem>
                      <SelectItem value="Volatilité">Volatilité</SelectItem>
                      <SelectItem value="Monte Carlo">Monte Carlo</SelectItem>
                      <SelectItem value="Options">Options</SelectItem>
                      <SelectItem value="Optimisation">Optimisation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
          
          {filteredSessions.length === 0 ? (
            <div className="finance-card p-8 text-center">
              <Code className="h-12 w-12 mx-auto text-finance-accent opacity-50 mb-4" />
              <h3 className="text-xl font-medium mb-2">
                {safeTranslate(t, 'community.pairProgramming.noSessions', 'Aucune session trouvée')}
              </h3>
              <p className="text-finance-lightgray mb-4">
                {safeTranslate(t, 'community.pairProgramming.noSessionsDesc', 'Essayez d\'autres filtres ou créez votre propre session de pair programming.')}
              </p>
              <Button variant="finance">
                {safeTranslate(t, 'community.pairProgramming.createSession', 'Créer une session')}
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredSessions.map(session => (
                <div key={session.id} className="finance-card p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="w-full md:w-16 flex md:flex-col items-center justify-center">
                      <div className="w-12 h-12 md:w-16 md:h-16 rounded-full overflow-hidden mb-2">
                        <img 
                          src={session.host.avatar} 
                          alt={session.host.name} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="ml-3 md:ml-0 text-center">
                        <div className="text-sm font-medium text-finance-offwhite">{session.host.name}</div>
                        <div className="flex items-center text-xs text-finance-lightgray">
                          <Star className="h-3 w-3 text-yellow-400 mr-1" />
                          {session.host.rating}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-3">
                        <h3 className="text-xl font-medium mb-2 md:mb-0">{session.title}</h3>
                        <Badge
                          className={`${
                            session.status === 'open' ? 'bg-green-800/20 text-green-400' : 'bg-red-800/20 text-red-400'
                          }`}
                        >
                          {session.status === 'open' ? 'Places disponibles' : 'Complet'}
                        </Badge>
                      </div>
                      
                      <p className="text-finance-lightgray mb-4">{session.description}</p>
                      
                      <div className="flex flex-wrap gap-3 mb-4">
                        <div className="flex items-center bg-finance-charcoal/20 px-3 py-1.5 rounded-full text-sm">
                          <Calendar className="h-4 w-4 text-finance-accent mr-2" />
                          {session.date}
                        </div>
                        <div className="flex items-center bg-finance-charcoal/20 px-3 py-1.5 rounded-full text-sm">
                          <Clock className="h-4 w-4 text-finance-accent mr-2" />
                          {session.time}
                        </div>
                        <div className="flex items-center bg-finance-charcoal/20 px-3 py-1.5 rounded-full text-sm">
                          <Users className="h-4 w-4 text-finance-accent mr-2" />
                          {session.participants}/{session.participants + session.available} participants
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        {session.topics.map((topic, index) => (
                          <Badge key={index} variant="secondary" className="bg-finance-charcoal">
                            {topic}
                          </Badge>
                        ))}
                      </div>
                      
                      <div className="flex justify-end">
                        <Button
                          variant="finance"
                          disabled={session.status !== 'open'}
                        >
                          {safeTranslate(t, 'community.pairProgramming.joinSession', 'Rejoindre la session')}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="projects">
          <div className="space-y-6">
            {collaborativeProjects.map(project => (
              <div key={project.id} className="finance-card p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                  <h3 className="text-xl font-medium mb-2 md:mb-0">{project.title}</h3>
                  <Badge
                    className={`${
                      project.status === 'En cours' ? 'bg-blue-800/20 text-blue-400' : 
                      project.status === 'Recrutement' ? 'bg-green-800/20 text-green-400' : 
                      'bg-yellow-800/20 text-yellow-400'
                    }`}
                  >
                    {project.status}
                  </Badge>
                </div>
                
                <p className="text-finance-lightgray mb-4">{project.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-finance-charcoal/20 p-3 rounded-lg flex items-center">
                    <Users className="h-4 w-4 text-finance-accent mr-2" />
                    <div className="text-sm">{project.members} contributeurs • {project.level}</div>
                  </div>
                  
                  <div className="bg-finance-charcoal/20 p-3 rounded-lg flex items-center">
                    <Cpu className="h-4 w-4 text-finance-accent mr-2" />
                    <div className="text-sm">{project.language}</div>
                  </div>
                  
                  <div className="bg-finance-charcoal/20 p-3 rounded-lg flex items-center">
                    <GitBranch className="h-4 w-4 text-finance-accent mr-2" />
                    <div className="text-sm overflow-hidden text-ellipsis">{project.github}</div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progression du projet</span>
                    <span>{project.progress}%</span>
                  </div>
                  <div className="h-2 bg-finance-charcoal rounded-full">
                    <div 
                      className="h-full bg-finance-accent rounded-full" 
                      style={{ width: `${project.progress}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {project.topics.map((topic, index) => (
                    <Badge key={index} variant="secondary" className="bg-finance-charcoal">
                      {topic}
                    </Badge>
                  ))}
                </div>
                
                <div className="flex flex-col md:flex-row justify-between items-center text-sm">
                  <div className="text-finance-lightgray mb-3 md:mb-0">
                    Dernière activité: il y a {project.lastActivity}
                  </div>
                  
                  <div className="flex gap-3">
                    <Button variant="outline" size="sm">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Discussions
                    </Button>
                    <Button variant="finance" size="sm">
                      Rejoindre le projet
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="myProgramming">
          <div className="finance-card p-8 text-center">
            <Monitor className="h-12 w-12 mx-auto text-finance-accent opacity-50 mb-4" />
            <h3 className="text-xl font-medium mb-2">
              {safeTranslate(t, 'community.pairProgramming.noActiveSessions', 'Aucune session active')}
            </h3>
            <p className="text-finance-lightgray mb-6 max-w-lg mx-auto">
              {safeTranslate(t, 'community.pairProgramming.noActiveSessionsDesc', 'Vous n\'avez pas encore rejoint ou créé de session de pair programming. Rejoignez une session existante ou créez la vôtre pour commencer à collaborer.')}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="outline" className="flex items-center" onClick={() => setActiveTab('sessions')}>
                <ChevronRight className="h-4 w-4 mr-2" />
                {safeTranslate(t, 'community.pairProgramming.browseSessions', 'Parcourir les sessions')}
              </Button>
              <Button variant="finance">
                {safeTranslate(t, 'community.pairProgramming.createSession', 'Créer une session')}
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PairProgramming;
