
import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Clock, Star, Filter, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { safeTranslate } from '../utils/translationUtils';

const Exercices = () => {
  const { t } = useTranslation();
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const exercises = [
    {
      id: 1,
      title: 'Calcul de prix Black-Scholes',
      description: 'Calculez le prix d\'une option européenne avec le modèle Black-Scholes',
      difficulty: 'Débutant',
      duration: '15 min',
      points: 100,
      category: 'pricing',
      completed: true,
      progress: 100
    },
    {
      id: 2,
      title: 'Greeks d\'une option',
      description: 'Calculez Delta, Gamma, Theta et Vega pour un portefeuille d\'options',
      difficulty: 'Intermédiaire',
      duration: '25 min',
      points: 150,
      category: 'greeks',
      completed: false,
      progress: 60
    },
    {
      id: 3,
      title: 'Calibration de modèle Heston',
      description: 'Calibrez les paramètres du modèle de Heston sur des données de marché',
      difficulty: 'Avancé',
      duration: '45 min',
      points: 250,
      category: 'modeling',
      completed: false,
      progress: 0
    },
    {
      id: 4,
      title: 'Stratégie Iron Condor',
      description: 'Analysez la rentabilité d\'une stratégie Iron Condor',
      difficulty: 'Intermédiaire',
      duration: '30 min',
      points: 180,
      category: 'strategies',
      completed: false,
      progress: 25
    }
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Débutant': return 'success';
      case 'Intermédiaire': return 'warning';
      case 'Avancé': return 'error';
      default: return 'secondary';
    }
  };

  const filteredExercises = exercises.filter(ex => {
    const matchesFilter = filter === 'all' || ex.category === filter;
    const matchesSearch = ex.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ex.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <>
      <Helmet>
        <title>Exercices | The Pricing Library</title>
        <meta name="description" content="Exercices pratiques de pricing d'options avec auto-correction et suivi de progression" />
      </Helmet>
      
      <div className="min-h-screen bg-finance-dark text-finance-offwhite">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-finance-accent mb-2">
              {safeTranslate(t, 'exercices.title', 'Exercices Pratiques')}
            </h1>
            <p className="text-finance-lightgray text-lg">
              Maîtrisez le pricing d'options avec des exercices progressifs et une correction automatique
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="finance-card">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-green-400 mr-3" />
                  <div>
                    <p className="text-2xl font-bold text-finance-accent">1</p>
                    <p className="text-sm text-finance-lightgray">Complétés</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="finance-card">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-blue-400 mr-3" />
                  <div>
                    <p className="text-2xl font-bold text-finance-accent">2</p>
                    <p className="text-sm text-finance-lightgray">En cours</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="finance-card">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Star className="h-8 w-8 text-yellow-400 mr-3" />
                  <div>
                    <p className="text-2xl font-bold text-finance-accent">100</p>
                    <p className="text-sm text-finance-lightgray">Points</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="finance-card">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-full">
                    <p className="text-sm text-finance-lightgray mb-2">Progression globale</p>
                    <Progress value={45} className="w-full" />
                    <p className="text-xs text-finance-lightgray mt-1">45%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-finance-lightgray" />
                <Input
                  placeholder="Rechercher un exercice..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'finance' : 'financeOutline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                Tous
              </Button>
              <Button
                variant={filter === 'pricing' ? 'finance' : 'financeOutline'}
                size="sm"
                onClick={() => setFilter('pricing')}
              >
                Pricing
              </Button>
              <Button
                variant={filter === 'greeks' ? 'finance' : 'financeOutline'}
                size="sm"
                onClick={() => setFilter('greeks')}
              >
                Greeks
              </Button>
              <Button
                variant={filter === 'strategies' ? 'finance' : 'financeOutline'}
                size="sm"
                onClick={() => setFilter('strategies')}
              >
                Stratégies
              </Button>
            </div>
          </div>

          {/* Exercises Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExercises.map((exercise) => (
              <Card key={exercise.id} className="finance-card hover:border-finance-accent/50 transition-colors">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-finance-accent mb-2">{exercise.title}</CardTitle>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={getDifficultyColor(exercise.difficulty)}>
                          {exercise.difficulty}
                        </Badge>
                        <span className="text-sm text-finance-lightgray">{exercise.duration}</span>
                      </div>
                    </div>
                    {exercise.completed && (
                      <CheckCircle className="h-6 w-6 text-green-400" />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-finance-lightgray mb-4 text-sm">{exercise.description}</p>
                  
                  {exercise.progress > 0 && (
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-finance-lightgray">Progression</span>
                        <span className="text-xs text-finance-lightgray">{exercise.progress}%</span>
                      </div>
                      <Progress value={exercise.progress} className="h-2" />
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <div className="flex items-center text-finance-accent">
                      <Star className="h-4 w-4 mr-1" />
                      <span className="text-sm font-medium">{exercise.points} pts</span>
                    </div>
                    <Button 
                      size="sm"
                      variant={exercise.completed ? "financeOutline" : "finance"}
                    >
                      {exercise.completed ? 'Réviser' : exercise.progress > 0 ? 'Continuer' : 'Commencer'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Exercices;
