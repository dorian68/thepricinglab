
import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code, Play, Download, BookOpen, BarChart3, TrendingUp } from 'lucide-react';
import { safeTranslate } from '../utils/translationUtils';

const LaboTrading = () => {
  const { t } = useTranslation();
  const [selectedNotebook, setSelectedNotebook] = useState('black-scholes');
  
  const notebooks = [
    {
      id: 'black-scholes',
      title: 'Pricing Black-Scholes',
      description: 'Implémentation complète du modèle Black-Scholes avec calcul des Greeks',
      level: 'Débutant',
      duration: '30 min'
    },
    {
      id: 'monte-carlo',
      title: 'Simulation Monte Carlo',
      description: 'Pricing d\'options par simulation avec variance reduction',
      level: 'Intermédiaire',
      duration: '45 min'
    },
    {
      id: 'backtest',
      title: 'Backtesting de Stratégies',
      description: 'Framework de backtesting pour stratégies d\'options',
      level: 'Avancé',
      duration: '60 min'
    }
  ];

  return (
    <>
      <Helmet>
        <title>Labo de Trading | The Pricing Library</title>
        <meta name="description" content="Laboratoire interactif pour expérimenter avec des modèles de pricing et des stratégies de trading" />
      </Helmet>
      
      <div className="min-h-screen bg-finance-dark text-finance-offwhite">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-finance-accent mb-2">
              {safeTranslate(t, 'laboTrading.title', 'Laboratoire de Trading')}
            </h1>
            <p className="text-finance-lightgray text-lg">
              Expérimentez avec des modèles de pricing et testez vos stratégies dans un environnement sécurisé
            </p>
          </div>

          <Tabs defaultValue="notebooks" className="w-full">
            <TabsList className="grid grid-cols-3 mb-6 bg-finance-charcoal">
              <TabsTrigger value="notebooks" className="data-[state=active]:bg-finance-burgundy data-[state=active]:text-finance-offwhite">
                <BookOpen className="h-4 w-4 mr-2" />
                Notebooks
              </TabsTrigger>
              <TabsTrigger value="editor" className="data-[state=active]:bg-finance-burgundy data-[state=active]:text-finance-offwhite">
                <Code className="h-4 w-4 mr-2" />
                Éditeur Python
              </TabsTrigger>
              <TabsTrigger value="backtest" className="data-[state=active]:bg-finance-burgundy data-[state=active]:text-finance-offwhite">
                <BarChart3 className="h-4 w-4 mr-2" />
                Backtesting
              </TabsTrigger>
            </TabsList>

            <TabsContent value="notebooks" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {notebooks.map((notebook) => (
                  <Card key={notebook.id} className="finance-card hover:border-finance-accent/50 transition-colors cursor-pointer">
                    <CardHeader>
                      <CardTitle className="text-finance-accent">{notebook.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-finance-lightgray mb-4">{notebook.description}</p>
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-sm bg-finance-burgundy/20 text-finance-accent px-2 py-1 rounded">
                          {notebook.level}
                        </span>
                        <span className="text-sm text-finance-lightgray">
                          {notebook.duration}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1">
                          <Play className="h-4 w-4 mr-2" />
                          Exécuter
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="editor" className="space-y-6">
              <Card className="finance-card">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Code className="h-5 w-5 mr-2" />
                    Éditeur Python Interactif
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-finance-charcoal rounded-lg p-4 mb-4">
                    <div className="h-64 bg-gray-900 rounded border text-white p-4 font-mono text-sm">
                      <div className="text-green-400"># Éditeur Python - Prêt pour vos expériences</div>
                      <div className="text-blue-400">import</div> numpy <div className="text-blue-400">as</div> np
                      <br />
                      <div className="text-blue-400">import</div> pandas <div className="text-blue-400">as</div> pd
                      <br />
                      <div className="text-blue-400">from</div> scipy.stats <div className="text-blue-400">import</div> norm
                      <br />
                      <br />
                      <div className="text-green-400"># Votre code ici...</div>
                      <div className="animate-pulse">|</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button>
                      <Play className="h-4 w-4 mr-2" />
                      Exécuter
                    </Button>
                    <Button variant="outline">
                      Charger exemple
                    </Button>
                    <Button variant="outline">
                      Réinitialiser
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="backtest" className="space-y-6">
              <Card className="finance-card">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Backtesting de Stratégies
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Configuration</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Stratégie</label>
                          <select className="w-full bg-finance-charcoal border border-finance-steel/20 rounded px-3 py-2">
                            <option>Covered Call</option>
                            <option>Protective Put</option>
                            <option>Iron Condor</option>
                            <option>Custom Strategy</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Période</label>
                          <select className="w-full bg-finance-charcoal border border-finance-steel/20 rounded px-3 py-2">
                            <option>1 an</option>
                            <option>2 ans</option>
                            <option>5 ans</option>
                          </select>
                        </div>
                        <Button className="w-full">
                          <BarChart3 className="h-4 w-4 mr-2" />
                          Lancer le Backtest
                        </Button>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Résultats</h3>
                      <div className="bg-finance-charcoal rounded-lg p-4 h-64 flex items-center justify-center">
                        <p className="text-finance-lightgray">Résultats du backtest apparaîtront ici</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default LaboTrading;
