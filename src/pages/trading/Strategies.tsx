
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import StrategySelector from '../../components/strategies/StrategySelector';
import StrategyForm from '../../components/strategies/StrategyForm';
import PayoffChart from '../../components/strategies/PayoffChart';
import GreekDisplay from '../../components/strategies/GreekDisplay';
import { defaultStrategies } from '../../utils/options/strategyDefaults';
import { Strategy } from '../../types/strategies';
import { calculateStrategyResults } from '../../utils/options/strategyCalculator';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { safeTranslate } from '../../utils/translationUtils';
import { Calculator } from 'lucide-react';

const Strategies = () => {
  const { t } = useTranslation();
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy>(defaultStrategies[0]);
  const [formStrategy, setFormStrategy] = useState<Strategy>(defaultStrategies[0]);
  const [results, setResults] = useState<any>(null);

  useEffect(() => {
    // Calculate initial results for the default strategy
    const initialResults = calculateStrategyResults(selectedStrategy);
    setResults(initialResults);
    setFormStrategy(selectedStrategy);
  }, []);

  const handleStrategyChange = (strategy: Strategy) => {
    // Ensure that strategy never contains raw "name" or "description" values
    const cleanStrategy = {
      ...strategy,
      name: strategy.name === "name" ? `Strategy ${strategy.id}` : strategy.name,
      description: strategy.description === "description" ? `Configuration for strategy ${strategy.id}` : strategy.description
    };
    
    setSelectedStrategy(cleanStrategy);
    setFormStrategy(cleanStrategy);
    const newResults = calculateStrategyResults(cleanStrategy);
    setResults(newResults);
  };

  const handleParametersChange = (updatedStrategy: Strategy) => {
    // Only update the form state, don't calculate yet
    setFormStrategy(updatedStrategy);
  };

  const handleCalculate = () => {
    // Update the selected strategy and calculate results
    setSelectedStrategy(formStrategy);
    const newResults = calculateStrategyResults(formStrategy);
    setResults(newResults);
  };

  return (
    <>
      <Helmet>
        <title>{safeTranslate(t, 'tradingLab.strategies', 'Strategies')} | The Trading Lab</title>
      </Helmet>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-finance-accent mb-3">
          {safeTranslate(t, 'tradingLab.optionStrategies', 'Option Strategy Pricing')}
        </h1>
        <p className="text-finance-offwhite mb-6">
          {safeTranslate(t, 'tradingLab.strategiesDesc', 'Simulate and analyze different option strategies with real-time pricing, payoff visualization and Greek calculations')}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-1">
            <Card className="bg-finance-charcoal p-6 rounded-lg shadow-md h-full">
              <h2 className="text-xl font-semibold text-finance-accent mb-4">
                {safeTranslate(t, 'strategies.selectStrategy', 'Select a Strategy')}
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
                {safeTranslate(t, 'strategies.parameters', 'Parameters')}
              </h2>
              <StrategyForm 
                strategy={formStrategy} 
                onParametersChange={handleParametersChange} 
              />
              <div className="mt-6 flex justify-end">
                <Button 
                  variant="finance" 
                  onClick={handleCalculate}
                  className="flex items-center"
                >
                  <Calculator className="mr-2 h-4 w-4" />
                  {safeTranslate(t, 'strategies.calculate', 'Calculate')}
                </Button>
              </div>
            </Card>
          </div>
        </div>

        {results && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-finance-charcoal p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-finance-accent mb-4">
                {safeTranslate(t, 'strategies.payoffDiagram', 'Payoff Diagram')}
              </h2>
              <PayoffChart 
                strategy={selectedStrategy} 
                results={results}
              />
            </Card>
            <Card className="bg-finance-charcoal p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-finance-accent mb-4">
                {safeTranslate(t, 'strategies.greeksAndPricing', 'Pricing and Greeks')}
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
