
import React, { useEffect, useRef } from 'react';
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
  const chartRef = useRef<HTMLDivElement | null>(null);
  
  // If no strategy or results are available, display a placeholder
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

  // Handle edge cases where the data might be incomplete
  if (!chartData || chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-center text-finance-lightgray">
          Pas assez de données pour afficher le graphique
        </p>
      </div>
    );
  }

  // Format tooltip content
  const formatTooltip = (dataPoint: { x: number; y: number }) => {
    // Get the current strategy for calculations
    const currentStrategy = getCalculationStrategy(strategy);
    
    // Calculate the spot price based on the x value and chart range
    const spotPrice = currentStrategy.parameters.spotPrice * 0.5 + 
      (dataPoint.x / chartData.length) * currentStrategy.parameters.spotPrice;
    
    return (
      <div className="bg-finance-dark p-2 rounded shadow-lg border border-finance-steel">
        <div className="text-xs text-finance-lightgray">Prix spot: {spotPrice.toFixed(2)}€</div>
        <div className="text-sm font-medium">{dataPoint.y > 0 ? 'Profit' : 'Perte'}: {dataPoint.y.toFixed(2)}€</div>
      </div>
    );
  };

  // Add break-even points overlay
  const breakEvenOverlay = results.breakEvenPoints && results.breakEvenPoints.length > 0 ? (
    <div className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none">
      {results.breakEvenPoints.map((point: number, index: number) => {
        // Convert break-even price to position in the chart
        const spotRange = strategy.parameters.spotPrice;
        const minPrice = spotRange * 0.5;
        const maxPrice = spotRange * 1.5;
        const xPos = ((point - minPrice) / (maxPrice - minPrice)) * 100;
        
        // Only show if the point is within the visible range
        if (xPos >= 0 && xPos <= 100) {
          return (
            <div
              key={index}
              className="absolute h-full border-l border-yellow-500 border-dashed flex flex-col items-center"
              style={{ left: `${xPos}%` }}
            >
              <div className="bg-yellow-500 text-black text-xs px-1 rounded mt-1">
                BE: {point.toFixed(2)}
              </div>
            </div>
          );
        }
        return null;
      })}
    </div>
  ) : null;

  return (
    <div ref={chartRef} className="h-full relative">
      <LineChart
        data={chartData}
        color="#8884d8"
        xLabel="Prix du sous-jacent"
        yLabel="Profit/Perte"
        showAxes={true}
        animate={!interactive} // Disable animation in interactive mode
        tooltipFormatter={formatTooltip}
        className="w-full h-full"
      />
      {breakEvenOverlay}
    </div>
  );
};

export default PayoffChart;
