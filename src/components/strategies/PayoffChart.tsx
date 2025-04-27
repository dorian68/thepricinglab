
import React from 'react';
import { LineChart } from '@/components/ui/chart';
import { Strategy as CommunityStrategy } from '@/types/community';
import { Strategy as TradingStrategy } from '@/types/strategies';
import { getCalculationStrategy } from '@/utils/options/strategyAdapter';

interface PayoffChartProps {
  strategy: CommunityStrategy | TradingStrategy;
  results: any;
  interactive?: boolean;
}

const PayoffChart: React.FC<PayoffChartProps> = ({ strategy, results, interactive = false }) => {
  // Si aucun résultat n'est disponible, afficher un placeholder
  if (!strategy || !results) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-center text-finance-lightgray">
          Données de payoff non disponibles
        </p>
      </div>
    );
  }

  // Transform the data into the format expected by LineChart
  const chartData = results.payoff ? 
    results.payoff.map((value: number, index: number) => ({
      x: index,
      y: value,
    })) :
    // If results has payoff points already formatted (x,y)
    results.payoffPoints || [];

  return (
    <div className="h-full">
      {chartData.length > 0 ? (
        <LineChart
          data={chartData}
          color="#8884d8"
          xLabel="Prix du sous-jacent"
          yLabel="Profit/Perte"
          showAxes={true}
          animate={!interactive} // Disable animation in interactive mode
          className="w-full h-full"
        />
      ) : (
        <div className="flex items-center justify-center h-full">
          <p className="text-center text-finance-lightgray">
            Pas assez de données pour afficher le graphique
          </p>
        </div>
      )}
    </div>
  );
};

export default PayoffChart;
