
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { safeTranslate } from '@/utils/translationUtils';
import { 
  Trophy, 
  Calendar, 
  Clock, 
  Users, 
  BarChart, 
  Award,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PythonActivator from '@/utils/pythonActivator';

// Données mockées pour le défi en cours
const currentChallenge = {
  id: 'w24-05',
  title: 'Optimisation de portefeuille multi-actifs',
  description: 'Développez un algorithme d\'optimisation de portefeuille qui maximise le ratio de Sharpe en utilisant différentes classes d\'actifs.',
  startDate: '12 Mai 2025',
  endDate: '19 Mai 2025',
  difficulty: 'Avancé',
  participants: 87,
  submissions: 54,
  daysLeft: 5,
  categories: ['Optimisation', 'Portfolio', 'Python']
};

// Données mockées pour les prochains défis
const upcomingChallenges = [
  {
    id: 'w24-06',
    title: 'Modélisation de la volatilité stochastique',
    description: 'Implémentez et calibrez un modèle de Heston sur des données réelles d\'options.',
    startDate: '20 Mai 2025',
    endDate: '27 Mai 2025',
    difficulty: 'Expert',
    categories: ['Volatilité', 'Calibration', 'Python']
  },
  {
    id: 'w24-07',
    title: 'Pricing d\'options exotiques par Monte Carlo',
    description: 'Développez un pricer pour options à barrière et asiatiques utilisant différentes méthodes de réduction de variance.',
    startDate: '28 Mai 2025',
    endDate: '4 Juin 2025',
    difficulty: 'Intermédiaire',
    categories: ['Options', 'Monte Carlo', 'Python']
  }
];

// Données mockées pour les défis précédents
const pastChallenges = [
  {
    id: 'w24-04',
    title: 'Construction de courbes de taux zéro-coupon',
    description: 'Développez un algorithme pour construire des courbes de taux zéro-coupon à partir de différents instruments.',
    startDate: '5 Mai 2025',
    endDate: '12 Mai 2025',
    difficulty: 'Intermédiaire',
    participants: 92,
    submissions: 68,
    categories: ['Taux', 'Courbes', 'Python'],
    winners: [
      { name: 'YieldMaster', score: 95.4 },
      { name: 'CurveOptimizer', score: 92.1 },
      { name: 'RateSpecialist', score: 89.7 }
    ]
  },
  {
    id: 'w24-03',
    title: 'Détection d\'anomalies dans les séries financières',
    description: 'Créez un algorithme capable de détecter des anomalies dans les séries temporelles financières.',
    startDate: '28 Avril 2025',
    endDate: '5 Mai 2025',
    difficulty: 'Avancé',
    participants: 78,
    submissions: 52,
    categories: ['Machine Learning', 'Time Series', 'Python'],
    winners: [
      { name: 'DataScientist42', score: 97.2 },
      { name: 'AnomalyHunter', score: 94.8 },
      { name: 'AlgoTrader', score: 91.3 }
    ]
  }
];

// Template de code pour le défi en cours
const challengeTemplate = `import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from scipy.optimize import minimize

# Données d'entrée (rendements historiques de différentes classes d'actifs)
returns = pd.DataFrame({
    'Actions_US': [0.12, 0.08, 0.15, -0.09, 0.11],
    'Actions_EU': [0.10, 0.07, 0.13, -0.07, 0.09],
    'Obligations': [0.04, 0.05, 0.03, 0.06, 0.03],
    'Or': [0.06, 0.09, -0.02, 0.14, 0.07],
    'Immobilier': [0.08, 0.06, 0.09, -0.03, 0.10]
})

# Taux sans risque
risk_free_rate = 0.02

# TODO: Calculer les rendements moyens et la matrice de covariance

# TODO: Définir la fonction objectif (maximiser le ratio de Sharpe)

# TODO: Définir les contraintes (somme des poids = 1, poids >= 0)

# TODO: Effectuer l'optimisation

# TODO: Visualiser la composition du portefeuille optimal

# TODO: Calculer le rendement attendu et le risque du portefeuille optimal

# TODO: Calculer le ratio de Sharpe du portefeuille optimal

# Affichez ici vos résultats
`;

const WeeklyChallenge = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('current');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-finance-accent mb-2">
            {safeTranslate(t, 'community.weeklyChallenge.title', 'Défis hebdomadaires')}
          </h1>
          <p className="text-finance-lightgray">
            {safeTranslate(t, 'community.weeklyChallenge.subtitle', 'Relevez des défis de finance quantitative et gagnez des récompenses')}
          </p>
        </div>
        
        <div className="flex items-center mt-4 md:mt-0">
          <Badge variant="outline" className="mr-4 flex items-center border-finance-accent text-finance-accent">
            <Trophy className="h-4 w-4 mr-1" />
            {safeTranslate(t, 'community.weeklyChallenge.leaderboard', 'Classement')}
          </Badge>
          <Button variant="finance">
            {safeTranslate(t, 'community.weeklyChallenge.mySubmissions', 'Mes soumissions')}
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="mb-6">
          <TabsTrigger value="current" className="data-[state=active]:text-finance-accent">
            {safeTranslate(t, 'community.weeklyChallenge.currentChallenge', 'Défi en cours')}
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="data-[state=active]:text-finance-accent">
            {safeTranslate(t, 'community.weeklyChallenge.upcomingChallenges', 'Prochains défis')}
          </TabsTrigger>
          <TabsTrigger value="past" className="data-[state=active]:text-finance-accent">
            {safeTranslate(t, 'community.weeklyChallenge.pastChallenges', 'Défis précédents')}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="current">
          <div className="finance-card mb-6">
            <div className="p-6 border-b border-finance-steel/10">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                <h2 className="text-xl font-bold text-finance-accent">{currentChallenge.title}</h2>
                <Badge variant="outline" className={`mt-2 md:mt-0 ${
                  currentChallenge.difficulty === 'Débutant' ? 'text-green-400 border-green-400' :
                  currentChallenge.difficulty === 'Intermédiaire' ? 'text-yellow-400 border-yellow-400' :
                  currentChallenge.difficulty === 'Avancé' ? 'text-orange-400 border-orange-400' :
                  'text-red-400 border-red-400'
                }`}>
                  {currentChallenge.difficulty}
                </Badge>
              </div>
              
              <p className="text-finance-lightgray mb-6">{currentChallenge.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-finance-charcoal/20 p-4 rounded-lg flex items-center">
                  <Calendar className="h-5 w-5 text-finance-accent mr-3" />
                  <div>
                    <div className="text-xs text-finance-lightgray">Période</div>
                    <div className="text-sm">{currentChallenge.startDate} - {currentChallenge.endDate}</div>
                  </div>
                </div>
                
                <div className="bg-finance-charcoal/20 p-4 rounded-lg flex items-center">
                  <Users className="h-5 w-5 text-finance-accent mr-3" />
                  <div>
                    <div className="text-xs text-finance-lightgray">Participants</div>
                    <div className="text-sm">{currentChallenge.participants} inscrits / {currentChallenge.submissions} soumissions</div>
                  </div>
                </div>
                
                <div className="bg-finance-charcoal/20 p-4 rounded-lg flex items-center">
                  <Clock className="h-5 w-5 text-finance-accent mr-3" />
                  <div>
                    <div className="text-xs text-finance-lightgray">Temps restant</div>
                    <div className="text-sm">{currentChallenge.daysLeft} jours</div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-6">
                {currentChallenge.categories.map((category, index) => (
                  <Badge key={index} variant="secondary" className="bg-finance-charcoal">
                    {category}
                  </Badge>
                ))}
              </div>
              
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>Progression du défi</span>
                  <span>{Math.round(((7 - currentChallenge.daysLeft) / 7) * 100)}%</span>
                </div>
                <Progress value={((7 - currentChallenge.daysLeft) / 7) * 100} className="h-2" />
              </div>
            </div>
            
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <BarChart className="h-5 w-5 mr-2 text-finance-accent" />
                {safeTranslate(t, 'community.weeklyChallenge.startCoding', 'Commencer à coder')}
              </h3>
              
              <PythonActivator autoLoad={true} discreet={true} />
              
              <div className="bg-finance-charcoal rounded-lg p-4 mb-6">
                <pre className="text-sm overflow-x-auto text-finance-lightgray whitespace-pre-wrap">
                  {challengeTemplate}
                </pre>
              </div>
              
              <div className="flex flex-col md:flex-row justify-between items-center">
                <div className="text-finance-lightgray text-sm mb-4 md:mb-0">
                  Soumettez votre solution avant le {currentChallenge.endDate} à 23:59 UTC
                </div>
                
                <div className="flex gap-3">
                  <Button variant="outline">
                    {safeTranslate(t, 'community.weeklyChallenge.saveDraft', 'Enregistrer brouillon')}
                  </Button>
                  <Button variant="finance">
                    {safeTranslate(t, 'community.weeklyChallenge.submitSolution', 'Soumettre solution')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="upcoming">
          <div className="space-y-6">
            {upcomingChallenges.map(challenge => (
              <div key={challenge.id} className="finance-card p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                  <h2 className="text-xl font-semibold text-finance-offwhite">{challenge.title}</h2>
                  <Badge variant="outline" className={`mt-2 md:mt-0 ${
                    challenge.difficulty === 'Débutant' ? 'text-green-400 border-green-400' :
                    challenge.difficulty === 'Intermédiaire' ? 'text-yellow-400 border-yellow-400' :
                    challenge.difficulty === 'Avancé' ? 'text-orange-400 border-orange-400' :
                    'text-red-400 border-red-400'
                  }`}>
                    {challenge.difficulty}
                  </Badge>
                </div>
                
                <p className="text-finance-lightgray mb-6">{challenge.description}</p>
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                  <div className="flex items-center mb-4 md:mb-0">
                    <Calendar className="h-4 w-4 text-finance-accent mr-2" />
                    <span className="text-sm">{challenge.startDate} - {challenge.endDate}</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {challenge.categories.map((category, index) => (
                      <Badge key={index} variant="secondary" className="bg-finance-charcoal">
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button variant="ghost" className="text-finance-accent flex items-center">
                    {safeTranslate(t, 'community.weeklyChallenge.setReminder', 'Recevoir notification')}
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="past">
          <div className="space-y-6">
            {pastChallenges.map(challenge => (
              <div key={challenge.id} className="finance-card p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                  <h2 className="text-xl font-semibold text-finance-offwhite">{challenge.title}</h2>
                  <Badge variant="outline" className={`mt-2 md:mt-0 ${
                    challenge.difficulty === 'Débutant' ? 'text-green-400 border-green-400' :
                    challenge.difficulty === 'Intermédiaire' ? 'text-yellow-400 border-yellow-400' :
                    challenge.difficulty === 'Avancé' ? 'text-orange-400 border-orange-400' :
                    'text-red-400 border-red-400'
                  }`}>
                    {challenge.difficulty}
                  </Badge>
                </div>
                
                <p className="text-finance-lightgray mb-6">{challenge.description}</p>
                
                <div className="flex flex-col md:flex-row gap-6 mb-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-finance-accent mr-2" />
                      <span className="text-sm">{challenge.startDate} - {challenge.endDate}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <Users className="h-4 w-4 text-finance-accent mr-2" />
                      <span className="text-sm">{challenge.participants} participants / {challenge.submissions} soumissions</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {challenge.categories.map((category, index) => (
                      <Badge key={index} variant="secondary" className="bg-finance-charcoal">
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="bg-finance-charcoal/20 p-4 rounded-lg mb-4">
                  <h3 className="text-sm font-medium mb-4 flex items-center">
                    <Trophy className="h-4 w-4 mr-2 text-yellow-400" />
                    {safeTranslate(t, 'community.weeklyChallenge.winners', 'Gagnants')}
                  </h3>
                  
                  <div className="space-y-3">
                    {challenge.winners.map((winner, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                            index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                            index === 1 ? 'bg-gray-400/20 text-gray-300' :
                            'bg-amber-700/20 text-amber-600'
                          }`}>
                            {index + 1}
                          </div>
                          <span>{winner.name}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-sm mr-2">{winner.score}</span>
                          <Award className={`h-4 w-4 ${
                            index === 0 ? 'text-yellow-400' :
                            index === 1 ? 'text-gray-300' :
                            'text-amber-600'
                          }`} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button variant="ghost" className="text-finance-accent flex items-center">
                    {safeTranslate(t, 'community.weeklyChallenge.viewSolutions', 'Voir les solutions')}
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WeeklyChallenge;
