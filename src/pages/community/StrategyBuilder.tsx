
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { safeTranslate } from '@/utils/translationUtils';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';

import { Calculator, Save, Settings, Share2, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';

import PayoffChart from '@/components/strategies/PayoffChart';
import GreekDisplay from '@/components/strategies/GreekDisplay';
import StrategyForm from '@/components/strategies/StrategyForm';

import { Strategy, StrategyType } from '@/types/community';
import { calculateStrategyResults } from '@/utils/options/strategyCalculator';
import { defaultStrategies } from '@/utils/options/strategyDefaults';

const StrategyBuilder: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState<number>(0);
  const [isPublic, setIsPublic] = useState<boolean>(true);
  const [strategyTitle, setStrategyTitle] = useState<string>('Nouvelle Stratégie');
  const [strategyDescription, setStrategyDescription] = useState<string>('Description de la stratégie');
  const [strategyType, setStrategyType] = useState<StrategyType>('pricing');
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy>(defaultStrategies[0]);
  const [results, setResults] = useState<any>(null);
  const [pricingMethod, setPricingMethod] = useState<'analytical' | 'monteCarlo'>('analytical');
  
  // Calculate results when strategy changes or pricing method changes
  useEffect(() => {
    if (selectedStrategy) {
      const calculatedResults = calculateStrategyResults(selectedStrategy);
      setResults(calculatedResults);
    }
  }, [selectedStrategy, pricingMethod]);

  const handleStrategyFormChange = (updatedStrategy: Strategy) => {
    setSelectedStrategy(updatedStrategy);
  };

  const handleCalculate = () => {
    const calculatedResults = calculateStrategyResults(selectedStrategy);
    setResults(calculatedResults);
  };

  const handlePublish = () => {
    // In a real implementation, this would save the strategy to a database
    alert('Stratégie publiée avec succès!');
    navigate('/community/explore');
  };

  const steps = [
    {
      title: 'Informations de base',
      description: 'Définir les informations de base de la stratégie',
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titre de la stratégie</Label>
            <Input 
              id="title" 
              value={strategyTitle} 
              onChange={(e) => setStrategyTitle(e.target.value)} 
              placeholder="Ex: Butterfly Spread sur Actions Tech" 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input 
              id="description" 
              value={strategyDescription} 
              onChange={(e) => setStrategyDescription(e.target.value)} 
              placeholder="Décrivez brièvement cette stratégie" 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="strategyType">Type de stratégie</Label>
            <Select 
              value={strategyType}
              onValueChange={(value: StrategyType) => setStrategyType(value)}
            >
              <SelectTrigger id="strategyType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pricing">Pricing</SelectItem>
                <SelectItem value="hedging">Couverture</SelectItem>
                <SelectItem value="trading">Trading</SelectItem>
                <SelectItem value="other">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )
    },
    {
      title: 'Paramètres du marché et produit',
      description: 'Configurer les paramètres du marché et du produit',
      content: (
        <div>
          <StrategyForm 
            strategy={selectedStrategy}
            onParametersChange={handleStrategyFormChange}
          />
        </div>
      )
    },
    {
      title: 'Pricing et analyse',
      description: 'Calculer et analyser le prix et les sensibilités',
      content: (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Méthode de pricing</Label>
            <div className="flex items-center space-x-4">
              <Select 
                value={pricingMethod}
                onValueChange={(value: 'analytical' | 'monteCarlo') => setPricingMethod(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="analytical">Pricing Analytique</SelectItem>
                  <SelectItem value="monteCarlo">Monte Carlo</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="finance" onClick={handleCalculate}>
                <Calculator className="mr-2 h-4 w-4" />
                Calculer
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-finance-charcoal">
              <CardHeader>
                <CardTitle className="text-lg">Diagramme de payoff</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <PayoffChart strategy={selectedStrategy} results={results} />
              </CardContent>
            </Card>
            
            <Card className="bg-finance-charcoal">
              <CardHeader>
                <CardTitle className="text-lg">Sensibilités (Greeks)</CardTitle>
              </CardHeader>
              <CardContent>
                <GreekDisplay strategy={selectedStrategy} results={results} />
              </CardContent>
            </Card>
          </div>
        </div>
      )
    },
    {
      title: 'Publication',
      description: 'Options de publication et finalisation',
      content: (
        <div className="space-y-6">
          <Card className="bg-finance-charcoal p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-finance-accent font-medium">Visibilité</h3>
                <p className="text-sm text-finance-lightgray">Rendre cette stratégie visible pour la communauté</p>
              </div>
              <Switch 
                checked={isPublic} 
                onCheckedChange={setIsPublic} 
                className="data-[state=checked]:bg-finance-accent" 
              />
            </div>
          </Card>
          
          <div className="bg-finance-charcoal p-4 rounded-lg">
            <h3 className="text-lg font-medium mb-2">Résumé de la stratégie</h3>
            
            <div className="space-y-2">
              <div>
                <span className="text-finance-lightgray text-sm">Titre:</span>
                <p className="text-finance-offwhite">{strategyTitle}</p>
              </div>
              
              <div>
                <span className="text-finance-lightgray text-sm">Description:</span>
                <p className="text-finance-offwhite">{strategyDescription}</p>
              </div>
              
              <div>
                <span className="text-finance-lightgray text-sm">Type:</span>
                <p className="text-finance-offwhite capitalize">{strategyType}</p>
              </div>
              
              <div>
                <span className="text-finance-lightgray text-sm">Visibilité:</span>
                <p className="text-finance-offwhite">{isPublic ? 'Publique' : 'Privée'}</p>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
    } else {
      // Handle final submission
      handlePublish();
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Helmet>
        <title>Créer une Stratégie | Finance Community</title>
      </Helmet>
      
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-finance-accent">Créateur de Stratégie</h1>
        <Button variant="outline" onClick={() => navigate('/community/explore')}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>{steps[activeStep].title}</CardTitle>
              <CardDescription>{steps[activeStep].description}</CardDescription>
            </div>
            <div className="bg-finance-dark px-3 py-1 rounded text-sm">
              Étape {activeStep + 1} sur {steps.length}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {steps[activeStep].content}
        </CardContent>
        
        <CardFooter className="flex justify-between border-t border-finance-steel pt-4">
          <Button 
            variant="outline" 
            onClick={handleBack} 
            disabled={activeStep === 0}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Précédent
          </Button>
          
          <Button 
            variant="finance" 
            onClick={handleNext}
          >
            {activeStep === steps.length - 1 ? (
              <>
                <Save className="mr-2 h-4 w-4" />
                Publier
              </>
            ) : (
              <>
                Suivant
                <ChevronRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
      
      <div className="bg-finance-charcoal rounded-lg p-4">
        <div className="flex items-center text-finance-lightgray mb-3">
          <BookOpen className="mr-2 h-4 w-4" />
          <h3 className="text-sm font-medium">Conseils et astuces</h3>
        </div>
        
        <div className="text-xs text-finance-lightgray space-y-2">
          <p>• Utilisez les paramètres du marché pour simuler différents scénarios.</p>
          <p>• Comparez les méthodes de pricing analytique et Monte Carlo pour vérifier la précision.</p>
          <p>• Les stratégies publiées peuvent être réutilisées dans le Trading Lab.</p>
        </div>
      </div>
    </div>
  );
};

export default StrategyBuilder;
