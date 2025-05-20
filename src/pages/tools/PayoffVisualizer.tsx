
import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { safeTranslate } from '@/utils/translationUtils';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { StrategyParameters, OptionLeg } from '@/types/strategies';
import StrategyBuilder from '@/components/strategies/StrategyBuilder';
import StrategyResults from '@/components/strategies/StrategyResults';
import usePayoffCalculator from '@/hooks/usePayoffCalculator';
import { Info } from 'lucide-react';

const PayoffVisualizer: React.FC = () => {
  const { t } = useTranslation();
  
  // Initialize strategy parameters
  const [parameters, setParameters] = useState<StrategyParameters>({
    spotPrice: 100,
    volatility: 0.2,
    timeToMaturity: 1,
    interestRate: 0.03,
    dividendYield: 0.01,
    legs: []
  });
  
  // Use the payoff calculator hook
  const { result, isCalculating } = usePayoffCalculator(parameters);
  
  return (
    <>
      <Helmet>
        <title>{safeTranslate(t, 'tools.payoff.title', 'Visualiseur de Payoff')} | The Trading Lab</title>
      </Helmet>
      
      {/* Header */}
      <div className="py-8 px-6 border-b border-finance-steel/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold terminal-text">
                {safeTranslate(t, 'tools.payoff.title', 'Visualiseur de Payoff')}
              </h1>
              <p className="text-finance-lightgray mt-2 max-w-3xl">
                {safeTranslate(t, 'tools.payoff.description', 'Construisez et analysez des stratégies optionnelles complexes avec visualisation en temps réel.')}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="py-8 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Info Card */}
          <Card className="p-4 mb-6 bg-finance-burgundy/20 border border-finance-burgundy/30">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-finance-accent mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-finance-offwhite mb-1">
                  {safeTranslate(t, 'tools.payoff.infoTitle', 'Comment utiliser le visualiseur')}
                </h3>
                <p className="text-xs text-finance-lightgray">
                  {safeTranslate(t, 'tools.payoff.infoDescription', 
                    "Ajoutez des positions d'options (calls et puts) avec le bouton + dans l'onglet Positions. " +
                    "Modifiez les paramètres de marché pour voir leur impact sur le prix et les Greeks. " +
                    "Le graphique de payoff montre le profit/perte à maturité en fonction du prix du sous-jacent."
                  )}
                </p>
              </div>
            </div>
          </Card>
          
          {/* Main Layout - Two Columns on Larger Screens */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Strategy Builder */}
            <div>
              <StrategyBuilder 
                parameters={parameters}
                onParametersChange={setParameters}
              />
            </div>
            
            {/* Right Column - Results */}
            <div>
              <StrategyResults 
                result={result}
                isCalculating={isCalculating}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PayoffVisualizer;
