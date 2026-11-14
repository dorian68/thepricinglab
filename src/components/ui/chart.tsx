
import React from 'react';
import { AreaChart, BarChart as RechartsBarChart, LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Area, Bar, ResponsiveContainer } from 'recharts';

export const Chart: React.FC<{
  children: React.ReactElement;
  className?: string;
}> = ({ children, className = "" }) => {
  return (
    <div className={`w-full h-full ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
};

export const ChartLine: React.FC<{
  dataKey: string;
  stroke?: string;
  strokeWidth?: number;
  dot?: boolean;
  activeDot?: boolean | { r: number } | React.ReactElement;
}> = ({ dataKey, stroke = "#8884d8", strokeWidth = 2, dot = false, activeDot = true }) => {
  return <Line type="monotone" dataKey={dataKey} stroke={stroke} strokeWidth={strokeWidth} dot={dot} activeDot={activeDot ? { r: 4 } : false} />;
};

export const ChartBar: React.FC<{
  dataKey: string;
  fill?: string;
  radius?: number;
}> = ({ dataKey, fill = "#8884d8", radius = 0 }) => {
  return <Bar dataKey={dataKey} fill={fill} radius={radius} />;
};

interface LineChartProps {
  data: Array<{x: string | number, y: number}>;
  xLabel?: string;
  yLabel?: string;
  color?: string;
  showAxes?: boolean;
  animate?: boolean;
  className?: string;
}

export const LineChart: React.FC<LineChartProps> = ({ 
  data, 
  xLabel, 
  yLabel, 
  color = "#8884d8",
  showAxes = true,
  animate = true,
  className = "",
}) => {
  const chartData = data.map(item => ({
    name: item.x,
    value: item.y
  }));

  return (
    <Chart className={className}>
      <RechartsLineChart
        data={chartData}
        margin={{ top: 5, right: 20, bottom: 20, left: 20 }}
      >
        {showAxes && <CartesianGrid stroke="#444" strokeDasharray="3 3" />}
        {showAxes && <XAxis dataKey="name" label={xLabel ? { value: xLabel, position: 'insideBottom', offset: -10 } : undefined} />}
        {showAxes && <YAxis label={yLabel ? { value: yLabel, angle: -90, position: 'insideLeft' } : undefined} />}
        {showAxes && <Tooltip />}
        <Line 
          type="monotone" 
          dataKey="value" 
          stroke={color} 
          strokeWidth={2}
          dot={false}
          isAnimationActive={animate}
        />
      </RechartsLineChart>
    </Chart>
  );
};

interface BarChartProps {
  data: Array<{x: string | number, y: number}>;
  xLabel?: string;
  yLabel?: string;
  color?: string;
}

interface ComparisonLineChartProps {
  data: Array<{ x: string | number; market: number; model: number }>;
  xLabel?: string;
  yLabel?: string;
  marketLabel?: string;
  modelLabel?: string;
}

export const ComparisonLineChart: React.FC<ComparisonLineChartProps> = ({
  data,
  xLabel,
  yLabel,
  marketLabel = 'Market',
  modelLabel = 'Model',
}) => {
  const chartData = data.map((item) => ({
    name: item.x,
    [marketLabel]: item.market,
    [modelLabel]: item.model,
  }));
  const finiteValues = data
    .flatMap((item) => [item.market, item.model])
    .filter((value) => Number.isFinite(value));
  const minimum = finiteValues.length > 0 ? Math.min(...finiteValues) : 0;
  const maximum = finiteValues.length > 0 ? Math.max(...finiteValues) : 1;
  const span = maximum - minimum;
  const padding = span > 1e-8
    ? span * 0.15
    : Math.max(Math.abs((minimum + maximum) / 2) * 0.02, 0.1);
  const yDomain: [number, number] = [minimum - padding, maximum + padding];

  return (
    <Chart>
      <RechartsLineChart data={chartData} margin={{ top: 14, right: 16, bottom: 20, left: 12 }}>
        <CartesianGrid stroke="#444" strokeDasharray="3 3" />
        <XAxis dataKey="name" label={xLabel ? { value: xLabel, position: 'insideBottom', offset: -10 } : undefined} />
        <YAxis
          domain={yDomain}
          tickFormatter={(value: number) => value.toFixed(2)}
          width={48}
          label={yLabel ? { value: yLabel, angle: -90, position: 'insideLeft' } : undefined}
        />
        <Tooltip />
        <Legend
          verticalAlign="top"
          align="right"
          height={28}
          iconType="line"
          wrapperStyle={{ fontSize: '11px' }}
        />
        <Line type="monotone" dataKey={marketLabel} stroke="#22c55e" strokeWidth={2} dot isAnimationActive={false} />
        <Line type="monotone" dataKey={modelLabel} stroke="#8884d8" strokeWidth={2} dot={false} isAnimationActive={false} />
      </RechartsLineChart>
    </Chart>
  );
};

export const BarChart: React.FC<BarChartProps> = ({ 
  data, 
  xLabel, 
  yLabel, 
  color = "#8884d8" 
}) => {
  const chartData = data.map(item => ({
    name: item.x,
    value: item.y
  }));

  return (
    <Chart>
      <RechartsBarChart
        data={chartData}
        margin={{ top: 5, right: 20, bottom: 20, left: 20 }}
      >
        <CartesianGrid stroke="#444" strokeDasharray="3 3" />
        <XAxis dataKey="name" label={xLabel ? { value: xLabel, position: 'insideBottom', offset: -10 } : undefined} />
        <YAxis label={yLabel ? { value: yLabel, angle: -90, position: 'insideLeft' } : undefined} />
        <Tooltip />
        <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
      </RechartsBarChart>
    </Chart>
  );
};

// Re-export Table components pour la cohérence d'interface
export { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
