
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Plus } from "lucide-react";
import { OptionLeg, StrategyParameters } from '@/types/strategies';
import OptionLegForm from './OptionLegForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface StrategyBuilderProps {
  parameters: StrategyParameters;
  onParametersChange: (parameters: StrategyParameters) => void;
}

const StrategyBuilder: React.FC<StrategyBuilderProps> = ({ 
  parameters,
  onParametersChange
}) => {
  const [activeTab, setActiveTab] = useState("market");

  const handleAddLeg = () => {
    const newLeg: OptionLeg = {
      strike: parameters.spotPrice,
      type: 'call',
      position: 'long',
      quantity: 1
    };

    onParametersChange({
      ...parameters,
      legs: [...parameters.legs, newLeg]
    });
  };

  const handleUpdateLeg = (index: number, updatedLeg: OptionLeg) => {
    const updatedLegs = [...parameters.legs];
    updatedLegs[index] = updatedLeg;
    
    onParametersChange({
      ...parameters,
      legs: updatedLegs
    });
  };

  const handleRemoveLeg = (index: number) => {
    const updatedLegs = parameters.legs.filter((_, i) => i !== index);
    
    onParametersChange({
      ...parameters,
      legs: updatedLegs
    });
  };

  const handleMarketParamChange = (field: keyof StrategyParameters, value: number) => {
    onParametersChange({
      ...parameters,
      [field]: value
    });
  };

  return (
    <Card className="border border-finance-steel/30 bg-finance-charcoal">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Constructeur de stratégie</CardTitle>
      </CardHeader>

      <CardContent className="p-4 pt-0 space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="market">Paramètres marché</TabsTrigger>
            <TabsTrigger value="legs">Positions ({parameters.legs.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="market" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="spotPrice">Prix spot (S)</Label>
              <div className="flex items-center gap-4">
                <Slider 
                  value={[parameters.spotPrice]} 
                  min={10} 
                  max={1000} 
                  step={1}
                  onValueChange={(values) => handleMarketParamChange('spotPrice', values[0])}
                  className="flex-grow"
                />
                <Input 
                  id="spotPrice"
                  type="number" 
                  value={parameters.spotPrice} 
                  onChange={(e) => handleMarketParamChange('spotPrice', Number(e.target.value))}
                  className="w-20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="volatility">Volatilité (σ) %</Label>
              <div className="flex items-center gap-4">
                <Slider 
                  value={[parameters.volatility * 100]} 
                  min={5} 
                  max={100} 
                  step={1}
                  onValueChange={(values) => handleMarketParamChange('volatility', values[0] / 100)}
                  className="flex-grow"
                />
                <Input 
                  id="volatility"
                  type="number" 
                  value={(parameters.volatility * 100).toFixed(0)} 
                  onChange={(e) => handleMarketParamChange('volatility', Number(e.target.value) / 100)}
                  className="w-20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeToMaturity">Maturité (T) années</Label>
              <div className="flex items-center gap-4">
                <Slider 
                  value={[parameters.timeToMaturity]} 
                  min={0.1} 
                  max={2} 
                  step={0.1}
                  onValueChange={(values) => handleMarketParamChange('timeToMaturity', values[0])}
                  className="flex-grow"
                />
                <Input 
                  id="timeToMaturity"
                  type="number" 
                  value={parameters.timeToMaturity} 
                  onChange={(e) => handleMarketParamChange('timeToMaturity', Number(e.target.value))}
                  className="w-20"
                  step="0.1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="interestRate">Taux sans risque (r) %</Label>
              <div className="flex items-center gap-4">
                <Slider 
                  value={[parameters.interestRate * 100]} 
                  min={0} 
                  max={10} 
                  step={0.1}
                  onValueChange={(values) => handleMarketParamChange('interestRate', values[0] / 100)}
                  className="flex-grow"
                />
                <Input 
                  id="interestRate"
                  type="number" 
                  value={(parameters.interestRate * 100).toFixed(1)} 
                  onChange={(e) => handleMarketParamChange('interestRate', Number(e.target.value) / 100)}
                  className="w-20"
                  step="0.1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dividendYield">Rendement du dividende (q) %</Label>
              <div className="flex items-center gap-4">
                <Slider 
                  value={[parameters.dividendYield * 100]} 
                  min={0} 
                  max={10} 
                  step={0.1}
                  onValueChange={(values) => handleMarketParamChange('dividendYield', values[0] / 100)}
                  className="flex-grow"
                />
                <Input 
                  id="dividendYield"
                  type="number" 
                  value={(parameters.dividendYield * 100).toFixed(1)} 
                  onChange={(e) => handleMarketParamChange('dividendYield', Number(e.target.value) / 100)}
                  className="w-20"
                  step="0.1"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="legs" className="space-y-4">
            {parameters.legs.length === 0 && (
              <div className="text-center py-8 text-finance-lightgray">
                Aucune position n'a été ajoutée. Utilisez le bouton ci-dessous pour ajouter des options.
              </div>
            )}

            {parameters.legs.map((leg, index) => (
              <OptionLegForm 
                key={index} 
                leg={leg}
                index={index}
                spotPrice={parameters.spotPrice}
                onUpdate={(updatedLeg) => handleUpdateLeg(index, updatedLeg)}
                onRemove={() => handleRemoveLeg(index)}
              />
            ))}

            <Button 
              onClick={handleAddLeg} 
              variant="outline" 
              className="w-full border-dashed border-finance-steel/50 hover:border-finance-accent hover:bg-finance-accent/10"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une position
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default StrategyBuilder;
