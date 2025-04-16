import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Strategy, OptionLeg } from '../../types/strategies';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface StrategyFormProps {
  strategy: Strategy;
  onParametersChange: (updatedStrategy: Strategy) => void;
}

const StrategyForm: React.FC<StrategyFormProps> = ({ strategy, onParametersChange }) => {
  const { t } = useTranslation();
  const [localStrategy, setLocalStrategy] = useState<Strategy>({ ...strategy });

  // Update local state when strategy prop changes
  useEffect(() => {
    setLocalStrategy({ ...strategy });
  }, [strategy]);

  const handleCommonParamChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    const numValue = parseFloat(value);
    
    if (!isNaN(numValue)) {
      const updatedStrategy = {
        ...localStrategy,
        parameters: {
          ...localStrategy.parameters,
          [name]: numValue,
        },
      };
      
      setLocalStrategy(updatedStrategy);
      onParametersChange(updatedStrategy);
    }
  };

  const handleLegChange = (index: number, field: keyof OptionLeg, value: any) => {
    const updatedLegs = [...localStrategy.parameters.legs];
    updatedLegs[index] = {
      ...updatedLegs[index],
      [field]: field === 'quantity' || field === 'strike' ? parseFloat(value) : value,
    };

    const updatedStrategy = {
      ...localStrategy,
      parameters: {
        ...localStrategy.parameters,
        legs: updatedLegs,
      },
    };

    setLocalStrategy(updatedStrategy);
    onParametersChange(updatedStrategy);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <h3 className="text-sm font-medium text-finance-offwhite mb-3">
          {t('strategies.marketParameters', 'Paramètres de marché')}
        </h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="spotPrice" className="text-xs">
                {t('strategies.spotPrice', 'Prix du sous-jacent')}
              </Label>
              <Input
                id="spotPrice"
                name="spotPrice"
                type="number"
                value={localStrategy.parameters.spotPrice}
                onChange={handleCommonParamChange}
                className="text-sm h-8"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="volatility" className="text-xs">
                {t('strategies.volatility', 'Volatilité')}
              </Label>
              <Input
                id="volatility"
                name="volatility"
                type="number"
                step="0.01"
                min="0.01"
                max="2"
                value={localStrategy.parameters.volatility}
                onChange={handleCommonParamChange}
                className="text-sm h-8"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="timeToMaturity" className="text-xs">
                {t('strategies.timeToMaturity', 'Maturité (années)')}
              </Label>
              <Input
                id="timeToMaturity"
                name="timeToMaturity"
                type="number"
                step="0.01"
                min="0.01"
                value={localStrategy.parameters.timeToMaturity}
                onChange={handleCommonParamChange}
                className="text-sm h-8"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="interestRate" className="text-xs">
                {t('strategies.interestRate', 'Taux d\'intérêt')}
              </Label>
              <Input
                id="interestRate"
                name="interestRate"
                type="number"
                step="0.001"
                value={localStrategy.parameters.interestRate}
                onChange={handleCommonParamChange}
                className="text-sm h-8"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="dividendYield" className="text-xs">
              {t('strategies.dividendYield', 'Rendement de dividende')}
            </Label>
            <Input
              id="dividendYield"
              name="dividendYield"
              type="number"
              step="0.001"
              value={localStrategy.parameters.dividendYield}
              onChange={handleCommonParamChange}
              className="text-sm h-8"
            />
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="text-sm font-medium text-finance-offwhite mb-3">
          {t('strategies.optionLegs', 'Jambes d\'options')}
        </h3>
        
        {localStrategy.parameters.legs.length > 1 ? (
          <Tabs defaultValue="0" className="w-full">
            <TabsList className="w-full grid" style={{ gridTemplateColumns: `repeat(${localStrategy.parameters.legs.length}, 1fr)` }}>
              {localStrategy.parameters.legs.map((_, index) => (
                <TabsTrigger key={index} value={index.toString()} className="text-xs">
                  {t('strategies.leg', 'Jambe')} {index + 1}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {localStrategy.parameters.legs.map((leg, index) => (
              <TabsContent key={index} value={index.toString()} className="space-y-4 pt-2">
                <LegForm
                  leg={leg}
                  index={index}
                  onChange={handleLegChange}
                />
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <LegForm
            leg={localStrategy.parameters.legs[0]}
            index={0}
            onChange={handleLegChange}
          />
        )}
      </div>
    </div>
  );
};

interface LegFormProps {
  leg: OptionLeg;
  index: number;
  onChange: (index: number, field: keyof OptionLeg, value: any) => void;
}

const LegForm: React.FC<LegFormProps> = ({ leg, index, onChange }) => {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`strike-${index}`} className="text-xs">
            {t('strategies.strikePrice', 'Prix d\'exercice')}
          </Label>
          <Input
            id={`strike-${index}`}
            type="number"
            value={leg.strike}
            onChange={(e) => onChange(index, 'strike', e.target.value)}
            className="text-sm h-8"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor={`quantity-${index}`} className="text-xs">
            {t('strategies.quantity', 'Quantité')}
          </Label>
          <Input
            id={`quantity-${index}`}
            type="number"
            value={leg.quantity}
            onChange={(e) => onChange(index, 'quantity', e.target.value)}
            className="text-sm h-8"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`type-${index}`} className="text-xs">
            {t('strategies.optionType', 'Type d\'option')}
          </Label>
          <Select
            value={leg.type}
            onValueChange={(value) => onChange(index, 'type', value as 'call' | 'put')}
          >
            <SelectTrigger id={`type-${index}`} className="text-sm h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="call">{t('strategies.call', 'Call')}</SelectItem>
              <SelectItem value="put">{t('strategies.put', 'Put')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor={`position-${index}`} className="text-xs">
            {t('strategies.position', 'Position')}
          </Label>
          <Select
            value={leg.position}
            onValueChange={(value) => onChange(index, 'position', value as 'long' | 'short')}
          >
            <SelectTrigger id={`position-${index}`} className="text-sm h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="long">{t('strategies.long', 'Long (Achat)')}</SelectItem>
              <SelectItem value="short">{t('strategies.short', 'Short (Vente)')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default StrategyForm;
