
import React from 'react';
import { AreaChart, BarChart as RechartsBarChart, LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Area, Bar, ResponsiveContainer } from 'recharts';

export const Chart: React.FC<{
  children: React.ReactNode;
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
  activeDot?: boolean | React.ReactNode;
}> = ({ dataKey, stroke = "#8884d8", strokeWidth = 2, dot = false, activeDot = true }) => {
  return <Line type="monotone" dataKey={dataKey} stroke={stroke} strokeWidth={strokeWidth} dot={dot} activeDot={activeDot} />;
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
}

export const LineChart: React.FC<LineChartProps> = ({ 
  data, 
  xLabel, 
  yLabel, 
  color = "#8884d8",
  showAxes = true,
  animate = true
}) => {
  const chartData = data.map(item => ({
    name: item.x,
    value: item.y
  }));

  return (
    <Chart>
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
