
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
  const chartData = React.useMemo(() => {
    if (!results) return [];
    
    // Check if results has payoff points in the correct format
    if (results.payoffPoints && Array.isArray(results.payoffPoints)) {
      return results.payoffPoints.filter(point => 
        point && 
        typeof point.x === 'number' && 
        typeof point.y === 'number' &&
        isFinite(point.x) && 
        isFinite(point.y)
      );
    }
    
    // Fallback for old format
    if (results.payoff && Array.isArray(results.payoff)) {
      return results.payoff
        .map((value: number, index: number) => ({
          x: index,
          y: value,
        }))
        .filter(point => 
          typeof point.y === 'number' && 
          isFinite(point.y)
        );
    }
    
    return [];
  }, [results]);

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

  // Format tooltip content - simplified to prevent infinite loops
  const formatTooltip = (dataPoint: { x: number; y: number }) => {
    if (!dataPoint || !isFinite(dataPoint.x) || !isFinite(dataPoint.y)) {
      return null;
    }
    
    return (
      <div className="bg-finance-dark p-2 rounded shadow-lg border border-finance-steel">
        <div className="text-xs text-finance-lightgray">Prix spot: {dataPoint.x.toFixed(2)}€</div>
        <div className="text-sm font-medium">{dataPoint.y > 0 ? 'Profit' : 'Perte'}: {dataPoint.y.toFixed(2)}€</div>
      </div>
    );
  };

  // Add break-even points overlay - simplified to prevent loops
  const breakEvenOverlay = React.useMemo(() => {
    if (!results?.breakEvenPoints || !Array.isArray(results.breakEvenPoints) || results.breakEvenPoints.length === 0) {
      return null;
    }

    try {
      const currentStrategy = getCalculationStrategy(strategy);
      if (!currentStrategy?.parameters?.spotPrice) return null;

      const spotRange = currentStrategy.parameters.spotPrice;
      const minPrice = spotRange * 0.5;
      const maxPrice = spotRange * 1.5;

      return (
        <div className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none">
          {results.breakEvenPoints.map((point: number, index: number) => {
            if (!isFinite(point)) return null;
            
            const xPos = ((point - minPrice) / (maxPrice - minPrice)) * 100;
            
            // Only show if the point is within the visible range
            if (xPos >= 0 && xPos <= 100) {
              return (
                <div
                  key={`breakeven-${index}-${point}`}
                  className="absolute h-full border-l border-yellow-500 border-dashed flex flex-col items-center"
                  style={{ left: `${Math.max(0, Math.min(100, xPos))}%` }}
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
      );
    } catch (error) {
      console.warn('Error rendering break-even overlay:', error);
      return null;
    }
  }, [results?.breakEvenPoints, strategy]);

  // Pass only the expected props to LineChart, without tooltipFormatter
  const chartProps = {
    data: chartData,
    color: "#8884d8",
    xLabel: "Prix du sous-jacent",
    yLabel: "Profit/Perte",
    showAxes: true,
    animate: !interactive,
    className: "w-full h-full"
  };

  return (
    <div ref={chartRef} className="h-full relative">
      <LineChart {...chartProps} />
      {breakEvenOverlay}
    </div>
  );
};

export default PayoffChart;
