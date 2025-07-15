
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Trash2 } from "lucide-react";
import { OptionType, PositionType, OptionLeg } from '@/types/strategies';
import { Badge } from '@/components/ui/badge';
import { safeTranslate } from '@/utils/translationUtils';

interface OptionLegFormProps {
  leg: OptionLeg;
  onUpdate: (updatedLeg: OptionLeg) => void;
  onRemove: () => void;
  spotPrice: number;
  index: number;
}

const OptionLegForm: React.FC<OptionLegFormProps> = ({ 
  leg, 
  onUpdate, 
  onRemove,
  spotPrice,
  index
}) => {
  const { t } = useTranslation();
  const st = (key: string, defaultValue: string) => safeTranslate(t, key, defaultValue);
  const handleChange = (field: keyof OptionLeg, value: any) => {
    onUpdate({
      ...leg,
      [field]: value
    });
  };

  const getMoneyness = () => {
    const ratio = leg.strike / spotPrice;
    
    if (leg.type === 'call') {
      if (ratio < 0.95) return { label: 'ITM', color: 'green' };
      if (ratio > 1.05) return { label: 'OTM', color: 'red' };
      return { label: 'ATM', color: 'yellow' };
    } else {
      if (ratio > 1.05) return { label: 'ITM', color: 'green' };
      if (ratio < 0.95) return { label: 'OTM', color: 'red' };
      return { label: 'ATM', color: 'yellow' };
    }
  };

  const moneyness = getMoneyness();

  return (
    <Card className="border border-finance-steel/30 bg-finance-charcoal">
      <CardHeader className="p-4 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge className={`bg-finance-${moneyness.color === 'green' ? 'accent' : moneyness.color === 'yellow' ? 'amber-500' : 'red-500'}`}>
            {moneyness.label}
          </Badge>
          <h3 className="text-lg font-medium">Leg {index + 1}</h3>
        </div>
        <Button variant="ghost" onClick={onRemove} className="h-8 w-8 p-0" aria-label="Supprimer">
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardHeader>
      
      <CardContent className="p-4 pt-0 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor={`position-${index}`}>{st('common.position', 'Position')}</Label>
            <Select 
              value={leg.position} 
              onValueChange={(value: PositionType) => handleChange('position', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionner une position" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="long">Long</SelectItem>
                <SelectItem value="short">Short</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor={`type-${index}`}>{st('common.type', 'Type d\'option')}</Label>
            <Select 
              value={leg.type} 
              onValueChange={(value: OptionType) => handleChange('type', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionner un type d'option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="call">Call</SelectItem>
                <SelectItem value="put">Put</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor={`strike-${index}`}>{st('common.strike', 'Strike')} (K)</Label>
            <div className="text-sm text-finance-lightgray">
              Spot: {spotPrice.toFixed(2)}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Slider 
              value={[leg.strike]} 
              min={Math.max(1, spotPrice * 0.5)} 
              max={spotPrice * 1.5} 
              step={1}
              onValueChange={(values) => handleChange('strike', values[0])}
              className="flex-grow"
            />
            <Input 
              id={`strike-${index}`}
              type="number" 
              value={leg.strike} 
              onChange={(e) => handleChange('strike', Number(e.target.value))}
              className="w-20"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor={`quantity-${index}`}>{st('common.quantity', 'Quantité')}</Label>
          <div className="flex items-center gap-4">
            <Slider 
              value={[leg.quantity]} 
              min={1} 
              max={10} 
              step={1}
              onValueChange={(values) => handleChange('quantity', values[0])}
              className="flex-grow"
            />
            <Input 
              id={`quantity-${index}`}
              type="number" 
              value={leg.quantity} 
              onChange={(e) => handleChange('quantity', Number(e.target.value))}
              className="w-20"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OptionLegForm;
