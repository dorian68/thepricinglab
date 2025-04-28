
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Strategy } from '@/types/strategies';
import { structuredProductTemplates } from '@/utils/options/strategyTemplates';
import { Shield, CircleDollarSign, TrendingUp } from 'lucide-react';

interface TemplateGalleryProps {
  onSelectTemplate: (template: string) => void;
}

const categoryIcons = {
  income: CircleDollarSign,
  growth: TrendingUp,
  protection: Shield
};

export const TemplateGallery: React.FC<TemplateGalleryProps> = ({ onSelectTemplate }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {structuredProductTemplates.map((template) => {
        const Icon = categoryIcons[template.category];
        
        return (
          <Card 
            key={template.template}
            className="cursor-pointer hover:bg-finance-charcoal transition-colors"
            onClick={() => onSelectTemplate(template.template)}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{template.name}</CardTitle>
                <Icon className="h-5 w-5 text-finance-accent" />
              </div>
              <CardDescription>{template.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-finance-lightgray space-y-1">
                <p>• Maturité: {template.parameters.timeToMaturity} an(s)</p>
                {template.parameters.structuredFlows.length > 0 && (
                  <p>• {template.parameters.structuredFlows.length} flux configurés</p>
                )}
                {template.parameters.legs.some(leg => leg.barrier) && (
                  <p>• Avec barrière(s)</p>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
