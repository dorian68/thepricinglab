
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Strategy, StrategyResult } from '../../types/strategies';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Legend } from 'recharts';

interface PayoffChartProps {
  strategy: Strategy;
  results: StrategyResult;
}

const PayoffChart: React.FC<PayoffChartProps> = ({ strategy, results }) => {
  const { t } = useTranslation();
  
  const { payoffPoints, breakEvenPoints, maxProfit, maxLoss } = results;
  const currentSpot = strategy.parameters.spotPrice;
  
  // Format for currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-finance-charcoal p-3 border border-finance-steel/20 shadow-lg rounded">
          <p className="text-finance-accent font-semibold">{`${t('strategies.spotPrice', 'Prix du sous-jacent')}: ${formatCurrency(label)}`}</p>
          <p className="text-finance-offwhite">{`${t('strategies.payoff', 'Profit/Perte')}: ${formatCurrency(payload[0].value)}`}</p>
        </div>
      );
    }
    
    return null;
  };
  
  return (
    <div className="space-y-4">
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={payoffPoints}
            margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis 
              dataKey="x" 
              domain={['dataMin', 'dataMax']}
              type="number"
              tickFormatter={formatCurrency}
              stroke="#8E9196"
              fontSize={11}
            />
            <YAxis 
              tickFormatter={formatCurrency}
              stroke="#8E9196" 
              fontSize={11}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend formatter={(value) => t('strategies.payoffLine', 'Courbe de payoff')} />
            
            {/* Zero profit line */}
            <ReferenceLine y={0} stroke="#8E9196" strokeDasharray="3 3" />
            
            {/* Current price line */}
            <ReferenceLine 
              x={currentSpot} 
              stroke="#9b87f5" 
              label={{ 
                value: t('strategies.currentPrice', 'Prix actuel'), 
                position: 'insideTopRight',
                fill: '#9b87f5',
                fontSize: 11
              }}
            />
            
            {/* Break-even points */}
            {breakEvenPoints.map((price, index) => (
              <ReferenceLine 
                key={index}
                x={price} 
                stroke="#1EAEDB" 
                strokeDasharray="5 5"
                label={{ 
                  value: `BE: ${formatCurrency(price)}`, 
                  position: 'insideBottomRight',
                  fill: '#1EAEDB',
                  fontSize: 10
                }}
              />
            ))}
            
            {/* Payoff line */}
            <Line 
              type="monotone" 
              dataKey="y" 
              stroke="#9b87f5" 
              dot={false} 
              activeDot={{ r: 6 }}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-finance-steel/10 p-3 rounded-md">
          <div className="text-xs text-finance-offwhite/70 mb-1">
            {t('strategies.breakEvenPoints', 'Points d\'équilibre')}
          </div>
          <div className="font-medium text-finance-offwhite">
            {breakEvenPoints.length > 0 
              ? breakEvenPoints.map(price => formatCurrency(price)).join(', ')
              : t('strategies.none', 'Aucun')}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-finance-steel/10 p-3 rounded-md">
            <div className="text-xs text-finance-offwhite/70 mb-1">
              {t('strategies.maxProfit', 'Profit max')}
            </div>
            <div className={`font-medium ${maxProfit && maxProfit > 0 ? 'text-green-400' : 'text-finance-offwhite'}`}>
              {maxProfit !== undefined ? formatCurrency(maxProfit) : t('strategies.unlimited', 'Illimité')}
            </div>
          </div>
          
          <div className="bg-finance-steel/10 p-3 rounded-md">
            <div className="text-xs text-finance-offwhite/70 mb-1">
              {t('strategies.maxLoss', 'Perte max')}
            </div>
            <div className={`font-medium ${maxLoss && maxLoss < 0 ? 'text-red-400' : 'text-finance-offwhite'}`}>
              {maxLoss !== undefined ? formatCurrency(maxLoss) : t('strategies.unlimited', 'Illimitée')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayoffChart;
