
import React from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { defaultStrategies } from '../../utils/options/strategyDefaults';
import { Strategy } from '../../types/strategies';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { safeTranslate } from '../../utils/translationUtils';

interface StrategySelectorProps {
  selectedStrategy: Strategy;
  onStrategyChange: (strategy: Strategy) => void;
}

const StrategySelector: React.FC<StrategySelectorProps> = ({ 
  selectedStrategy, 
  onStrategyChange 
}) => {
  const { t } = useTranslation();
  
  const vanillaStrategies = defaultStrategies.filter(s => s.category === 'vanilla');
  const advancedStrategies = defaultStrategies.filter(s => s.category === 'advanced');

  return (
    <Tabs defaultValue="vanilla" className="w-full">
      <TabsList className="w-full grid grid-cols-2 mb-4">
        <TabsTrigger value="vanilla" className="text-sm">
          {safeTranslate(t, 'strategies.vanilla', 'Vanilla')}
        </TabsTrigger>
        <TabsTrigger value="advanced" className="text-sm">
          {safeTranslate(t, 'strategies.advanced', 'Advanced')}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="vanilla" className="space-y-3">
        {vanillaStrategies.map((strategy) => (
          <StrategyCard
            key={strategy.id}
            strategy={strategy}
            isSelected={selectedStrategy.id === strategy.id}
            onClick={() => onStrategyChange(strategy)}
            t={t}
          />
        ))}
      </TabsContent>

      <TabsContent value="advanced" className="space-y-3">
        {advancedStrategies.map((strategy) => (
          <StrategyCard
            key={strategy.id}
            strategy={strategy}
            isSelected={selectedStrategy.id === strategy.id}
            onClick={() => onStrategyChange(strategy)}
            t={t}
          />
        ))}
      </TabsContent>
    </Tabs>
  );
};

interface StrategyCardProps {
  strategy: Strategy;
  isSelected: boolean;
  onClick: () => void;
  t: TFunction;
}

const StrategyCard: React.FC<StrategyCardProps> = ({ strategy, isSelected, onClick, t }) => {
  // Traduction des noms et descriptions des stratégies
  // Assurer qu'on n'affiche jamais les valeurs brutes "name" ou "description"
  const strategyId = strategy.id || '';
  console.log("--------------------------------------");
  console.log(strategy);
  // Déterminer un nom lisible pour la stratégie
  let displayName = strategy.name;
  if (!displayName || displayName === "name") {
    displayName = `Strategy ${strategyId}`;
  }
  
  // Déterminer une description lisible pour la stratégie
  let displayDescription = strategy.description;
  if (!displayDescription || displayDescription === "description") {
    displayDescription = `Configuration for ${displayName}`;
  }
  
  // Utiliser les traductions si disponibles, sinon utiliser les noms formatés
  const strategyName = displayName;
  
  const strategyDescription = displayDescription;

  return (
    <Card 
      className={`p-3 cursor-pointer hover:bg-finance-steel/10 transition-colors ${
        isSelected ? 'border border-finance-accent bg-finance-steel/20' : 'bg-finance-steel/5'
      }`}
      onClick={onClick}
    >
      <h3 className="font-medium text-finance-offwhite">{strategyName}</h3>
      <p className="text-xs text-finance-offwhite/80 mt-1 line-clamp-2">{strategyDescription}</p>
    </Card>
  );
};

export default StrategySelector;
