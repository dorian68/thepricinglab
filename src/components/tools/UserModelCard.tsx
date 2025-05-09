
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalibrationModel, CalibrationDomain } from '@/types/community';
import { Lock, Globe, Beaker, User, Code } from 'lucide-react';

interface DomainIconProps {
  domain: CalibrationDomain;
}

const DomainIcon: React.FC<DomainIconProps> = ({ domain }) => {
  switch (domain) {
    case 'equity':
      return <div className="bg-blue-500/20 text-blue-500 p-2 rounded-full">EQ</div>;
    case 'rates':
      return <div className="bg-green-500/20 text-green-500 p-2 rounded-full">RT</div>;
    case 'fx':
      return <div className="bg-yellow-500/20 text-yellow-500 p-2 rounded-full">FX</div>;
    case 'vol':
      return <div className="bg-purple-500/20 text-purple-500 p-2 rounded-full">VL</div>;
    case 'commodities':
      return <div className="bg-orange-500/20 text-orange-500 p-2 rounded-full">CM</div>;
    case 'credit':
      return <div className="bg-red-500/20 text-red-500 p-2 rounded-full">CR</div>;
    default:
      return <div className="bg-gray-500/20 text-gray-500 p-2 rounded-full">OT</div>;
  }
};

interface UserModelCardProps {
  model: CalibrationModel;
  onTest: (model: CalibrationModel) => void;
  isOwner: boolean;
}

const UserModelCard: React.FC<UserModelCardProps> = ({ model, onTest, isOwner }) => {
  return (
    <Card className={`bg-finance-charcoal border-finance-steel/30 ${model.isDraft ? 'border-dashed' : ''} transition-all hover:border-finance-accent/50`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 mb-2">
            <DomainIcon domain={model.domain} />
            <div>
              <CardTitle className="text-lg">{model.name}</CardTitle>
              <div className="flex items-center text-xs text-finance-lightgray gap-1 mt-1">
                <User size={12} />
                <span>{model.author}</span>
                {model.isPublic ? 
                  <Globe size={12} className="ml-2 text-green-500" /> : 
                  <Lock size={12} className="ml-2 text-finance-accent" />}
                {model.isDraft && 
                  <span className="ml-2 px-1 py-0.5 bg-finance-steel/20 text-finance-lightgray rounded text-[10px]">
                    BROUILLON
                  </span>
                }
              </div>
            </div>
          </div>
        </div>
        <CardDescription className="line-clamp-2 text-sm">{model.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1 text-xs text-finance-lightgray">
            <Code size={12} />
            <span>{model.code.length > 50 ? `${model.code.length} caractères` : 'Code source'}</span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs flex items-center gap-1 border-finance-accent/50 text-finance-accent"
            onClick={() => onTest(model)}
          >
            <Beaker size={14} />
            <span>Tester</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserModelCard;
