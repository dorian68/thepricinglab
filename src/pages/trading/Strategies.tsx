
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import ModernNavbar from '../../components/ModernNavbar';
import StrategySelector from '../../components/strategies/StrategySelector';
import StrategyForm from '../../components/strategies/StrategyForm';
import PayoffChart from '../../components/strategies/PayoffChart';
import GreekDisplay from '../../components/strategies/GreekDisplay';
import { defaultStrategies } from '../../utils/options/strategyDefaults';
import { Strategy } from '../../types/strategies';
import { calculateStrategyResults } from '../../utils/options/strategyCalculator';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const Strategies = () => {
  const { t } = useTranslation();
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy>(defaultStrategies[0]);
  const [results, setResults] = useState<any>(null);

  useEffect(() => {
    // Calculate initial results for the default strategy
    const initialResults = calculateStrategyResults(selectedStrategy);
    setResults(initialResults);
  }, []);

  const handleStrategyChange = (strategy: Strategy) => {
    setSelectedStrategy(strategy);
    const newResults = calculateStrategyResults(strategy);
    setResults(newResults);
  };

  const handleParametersChange = (updatedStrategy: Strategy) => {
    setSelectedStrategy(updatedStrategy);
    const newResults = calculateStrategyResults(updatedStrategy);
    setResults(newResults);
  };

  return (
    <>
      <Helmet>
        <title>{t('tradingLab.strategies', 'Stratégies')} | The Trading Lab</title>
      </Helmet>
      <ModernNavbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-finance-accent mb-3">
          {t('tradingLab.optionStrategies', 'Pricing des stratégies d\'options')}
        </h1>
        <p className="text-finance-offwhite mb-6">
          {t('tradingLab.strategiesDesc', 'Simulez et analysez différentes stratégies d\'options avec pricing en temps réel, affichage du payoff et calcul des Greeks')}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-1">
            <Card className="bg-finance-charcoal p-6 rounded-lg shadow-md h-full">
              <h2 className="text-xl font-semibold text-finance-accent mb-4">
                {t('strategies.selectStrategy', 'Sélectionnez une stratégie')}
              </h2>
              <StrategySelector 
                selectedStrategy={selectedStrategy} 
                onStrategyChange={handleStrategyChange} 
              />
            </Card>
          </div>
          <div className="md:col-span-2">
            <Card className="bg-finance-charcoal p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-finance-accent mb-4">
                {t('strategies.parameters', 'Paramètres')}
              </h2>
              <StrategyForm 
                strategy={selectedStrategy} 
                onParametersChange={handleParametersChange} 
              />
            </Card>
          </div>
        </div>

        {results && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-finance-charcoal p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-finance-accent mb-4">
                {t('strategies.payoffDiagram', 'Diagramme de Payoff')}
              </h2>
              <PayoffChart 
                strategy={selectedStrategy} 
                results={results}
              />
            </Card>
            <Card className="bg-finance-charcoal p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-finance-accent mb-4">
                {t('strategies.greeksAndPricing', 'Pricing et Greeks')}
              </h2>
              <GreekDisplay 
                strategy={selectedStrategy} 
                results={results}
              />
            </Card>
          </div>
        )}
      </div>
    </>
  );
};

export default Strategies;
