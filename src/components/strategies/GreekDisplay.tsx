import React from 'react';
import { Card } from '@/components/ui/card';
import { Strategy as CommunityStrategy } from '@/types/community';
import { Strategy as TradingStrategy } from '@/types/strategies';
import { getCalculationStrategy } from '@/utils/options/strategyAdapter';

interface GreekDisplayProps {
  strategy: CommunityStrategy | TradingStrategy | any;
  results: any;
}

const GreekDisplay: React.FC<GreekDisplayProps> = ({ strategy, results }) => {
  // Safely handle the case where strategy or results is undefined
  if (!strategy || !results) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-center text-finance-lightgray">
          Données Greeks non disponibles
        </p>
      </div>
    );
  }

  const greeks = results.totalGreeks || results.greeks || {};

  const formatNumber = (num: number | undefined) => {
    if (num === undefined) return 'N/A';
    return num.toFixed(4);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card className="p-3 bg-finance-charcoal border-finance-steel">
          <div className="text-xs text-finance-lightgray mb-1">Delta</div>
          <div className="text-lg font-semibold">{formatNumber(greeks.delta)}</div>
        </Card>

        <Card className="p-3 bg-finance-charcoal border-finance-steel">
          <div className="text-xs text-finance-lightgray mb-1">Gamma</div>
          <div className="text-lg font-semibold">{formatNumber(greeks.gamma)}</div>
        </Card>

        <Card className="p-3 bg-finance-charcoal border-finance-steel">
          <div className="text-xs text-finance-lightgray mb-1">Vega</div>
          <div className="text-lg font-semibold">{formatNumber(greeks.vega)}</div>
        </Card>

        <Card className="p-3 bg-finance-charcoal border-finance-steel">
          <div className="text-xs text-finance-lightgray mb-1">Theta</div>
          <div className="text-lg font-semibold">{formatNumber(greeks.theta)}</div>
        </Card>

        <Card className="p-3 bg-finance-charcoal border-finance-steel">
          <div className="text-xs text-finance-lightgray mb-1">Rho</div>
          <div className="text-lg font-semibold">{formatNumber(greeks.rho)}</div>
        </Card>
      </div>

      {results.totalPrice !== undefined && (
        <Card className="p-3 bg-finance-charcoal border-finance-accent mt-4">
          <div className="text-xs text-finance-lightgray mb-1">Prix Total</div>
          <div className="text-xl font-bold text-finance-accent">{formatNumber(results.totalPrice)}</div>
        </Card>
      )}
      
      {(results.maxProfit !== undefined || results.maxLoss !== undefined) && (
        <div className="grid grid-cols-2 gap-3 mt-4">
          {results.maxProfit !== undefined && (
            <Card className="p-3 bg-finance-charcoal border-green-700">
              <div className="text-xs text-finance-lightgray mb-1">Profit Max</div>
              <div className="text-lg font-semibold text-green-500">{formatNumber(results.maxProfit)}</div>
            </Card>
          )}
          {results.maxLoss !== undefined && (
            <Card className="p-3 bg-finance-charcoal border-red-700">
              <div className="text-xs text-finance-lightgray mb-1">Perte Max</div>
              <div className="text-lg font-semibold text-red-500">{formatNumber(results.maxLoss)}</div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default GreekDisplay;
