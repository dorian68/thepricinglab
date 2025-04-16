
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Strategy, StrategyResult } from '../../types/strategies';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';

interface GreekDisplayProps {
  strategy: Strategy;
  results: StrategyResult;
}

const GreekDisplay: React.FC<GreekDisplayProps> = ({ strategy, results }) => {
  const { t } = useTranslation();
  const { totalPrice, totalGreeks, legResults } = results;
  const hasMultipleLegs = strategy.parameters.legs.length > 1;
  
  // Format for currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };
  
  // Format for numbers with configurable decimal places
  const formatNumber = (value: number, decimals = 4) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  };
  
  return (
    <div className="space-y-6">
      {/* Strategy Pricing Summary */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-medium text-finance-offwhite">
            {t('strategies.pricingSummary', 'Récapitulatif du pricing')}
          </h3>
          <div className="text-xl font-semibold text-finance-accent">
            {formatCurrency(totalPrice)}
          </div>
        </div>
        <p className="text-xs text-finance-offwhite/70 mb-4">
          {totalPrice > 0 
            ? t('strategies.pricingPositive', 'Crédit net: vous recevez cette prime')
            : t('strategies.pricingNegative', 'Débit net: vous payez cette prime')}
        </p>
      </div>
      
      <Separator className="bg-finance-steel/20" />
      
      {/* Greeks */}
      <div>
        <h3 className="text-sm font-medium text-finance-offwhite mb-3">
          {t('strategies.greeks', 'Greeks')}
        </h3>
        
        <div className="bg-finance-steel/10 rounded-md p-4 grid grid-cols-2 md:grid-cols-5 gap-3">
          <GreekCard 
            name="Delta" 
            value={totalGreeks.delta} 
            description={t('strategies.deltaDesc', 'Sensibilité au prix')}
          />
          <GreekCard 
            name="Gamma" 
            value={totalGreeks.gamma} 
            description={t('strategies.gammaDesc', 'Variation du delta')}
          />
          <GreekCard 
            name="Vega" 
            value={totalGreeks.vega} 
            description={t('strategies.vegaDesc', 'Sensibilité à la volatilité')}
          />
          <GreekCard 
            name="Theta" 
            value={totalGreeks.theta} 
            description={t('strategies.thetaDesc', 'Décroissance temporelle')}
          />
          <GreekCard 
            name="Rho" 
            value={totalGreeks.rho} 
            description={t('strategies.rhoDesc', 'Sensibilité aux taux')}
          />
        </div>
      </div>
      
      {hasMultipleLegs && (
        <>
          <Separator className="bg-finance-steel/20" />
          
          {/* Leg Details */}
          <div>
            <h3 className="text-sm font-medium text-finance-offwhite mb-3">
              {t('strategies.legDetails', 'Détails par jambe')}
            </h3>
            
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">{t('strategies.leg', 'Jambe')}</TableHead>
                    <TableHead>{t('strategies.type', 'Type')}</TableHead>
                    <TableHead>{t('strategies.strike', 'Strike')}</TableHead>
                    <TableHead>{t('strategies.price', 'Prix')}</TableHead>
                    <TableHead>Delta</TableHead>
                    <TableHead>Gamma</TableHead>
                    <TableHead>Vega</TableHead>
                    <TableHead>Theta</TableHead>
                    <TableHead>Rho</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {strategy.parameters.legs.map((leg, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">#{index + 1}</TableCell>
                      <TableCell>{`${leg.position === 'long' ? '+' : '-'}${leg.quantity} ${leg.type.toUpperCase()}`}</TableCell>
                      <TableCell>{formatCurrency(leg.strike)}</TableCell>
                      <TableCell>{formatCurrency(legResults[index].price)}</TableCell>
                      <TableCell>{formatNumber(legResults[index].greeks.delta)}</TableCell>
                      <TableCell>{formatNumber(legResults[index].greeks.gamma)}</TableCell>
                      <TableCell>{formatNumber(legResults[index].greeks.vega)}</TableCell>
                      <TableCell>{formatNumber(legResults[index].greeks.theta)}</TableCell>
                      <TableCell>{formatNumber(legResults[index].greeks.rho)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-finance-steel/10">
                    <TableCell colSpan={3} className="font-medium">
                      {t('strategies.total', 'Total')}
                    </TableCell>
                    <TableCell className="font-medium">{formatCurrency(totalPrice)}</TableCell>
                    <TableCell className="font-medium">{formatNumber(totalGreeks.delta)}</TableCell>
                    <TableCell className="font-medium">{formatNumber(totalGreeks.gamma)}</TableCell>
                    <TableCell className="font-medium">{formatNumber(totalGreeks.vega)}</TableCell>
                    <TableCell className="font-medium">{formatNumber(totalGreeks.theta)}</TableCell>
                    <TableCell className="font-medium">{formatNumber(totalGreeks.rho)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

interface GreekCardProps {
  name: string;
  value: number;
  description: string;
}

const GreekCard: React.FC<GreekCardProps> = ({ name, value, description }) => {
  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4
    }).format(value);
  };
  
  return (
    <div className="bg-finance-steel/10 p-3 rounded-md">
      <div className="flex items-baseline justify-between mb-1">
        <span className="font-semibold text-finance-accent">{name}</span>
        <span className={`font-mono ${value > 0 ? 'text-green-400' : value < 0 ? 'text-red-400' : 'text-finance-offwhite'}`}>
          {formatNumber(value)}
        </span>
      </div>
      <div className="text-xs text-finance-offwhite/70">{description}</div>
    </div>
  );
};

export default GreekDisplay;
