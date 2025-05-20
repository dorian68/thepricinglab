
import React from 'react';
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { StrategyResult, Greeks } from '@/types/strategies';
import { LineChart } from '@/components/ui/chart';
import GreeksTable from './GreeksTable';
import PayoffChart from './PayoffChart';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface StrategyResultsProps {
  result: StrategyResult | null;
  isCalculating: boolean;
}

const StrategyResults: React.FC<StrategyResultsProps> = ({ 
  result, 
  isCalculating 
}) => {
  if (!result && !isCalculating) {
    return (
      <Card className="border border-finance-steel/30 bg-finance-charcoal h-full flex items-center justify-center">
        <CardContent className="text-center py-8">
          <Activity className="h-12 w-12 mx-auto mb-4 text-finance-lightgray" />
          <p className="text-finance-lightgray">
            Ajoutez des positions pour visualiser le payoff et les grecques
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Payoff Chart */}
      <Card className="border border-finance-steel/30 bg-finance-charcoal">
        <CardHeader className="pb-0">
          <CardTitle className="text-lg">Profil de payoff</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 h-72">
          {isCalculating ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-finance-lightgray">Calcul en cours...</p>
            </div>
          ) : result ? (
            <div className="h-full">
              <div className="h-full">
                <LineChart 
                  data={result.payoffPoints} 
                  color="#8884d8" 
                  xLabel="Prix du sous-jacent" 
                  yLabel="Profit/Perte"
                />
              </div>
              {result.breakEvenPoints.length > 0 && (
                <div className="mt-2 text-sm text-finance-lightgray">
                  Points d'équilibre: {result.breakEvenPoints.join(', ')}
                </div>
              )}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Strategy Price */}
        <Card className="border border-finance-steel/30 bg-finance-charcoal">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-finance-lightgray">Prix de la stratégie</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-finance-offwhite">
              {isCalculating ? '...' : result ? `${result.totalPrice.toFixed(2)} €` : '0.00 €'}
            </div>
          </CardContent>
        </Card>

        {/* Max Profit */}
        <Card className="border border-finance-steel/30 bg-finance-charcoal">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-finance-lightgray">Profit maximum</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-green-500" />
            <div className="text-2xl font-bold text-green-500">
              {isCalculating ? '...' : result ? `${result.maxProfit.toFixed(2)} €` : '0.00 €'}
            </div>
          </CardContent>
        </Card>

        {/* Max Loss */}
        <Card className="border border-finance-steel/30 bg-finance-charcoal">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-finance-lightgray">Perte maximale</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center">
            <TrendingDown className="h-5 w-5 mr-2 text-red-500" />
            <div className="text-2xl font-bold text-red-500">
              {isCalculating ? '...' : result ? `${result.maxLoss.toFixed(2)} €` : '0.00 €'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Greeks Table */}
      <GreeksTable 
        greeks={result?.totalGreeks || { delta: 0, gamma: 0, vega: 0, theta: 0, rho: 0 }} 
        isLoading={isCalculating}
      />
    </div>
  );
};

export default StrategyResults;
