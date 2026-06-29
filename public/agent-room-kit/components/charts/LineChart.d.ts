import React from 'react';

export interface LineChartProps {
  /** Primary series. */
  data: number[];
  /** Optional dashed "theoretical (mid)" series. */
  theoretical?: number[] | null;
  width?: number;
  height?: number;
  tone?: 'red' | 'green' | string;
  /** X-axis tick labels (months, dates). */
  xLabels?: (string | number)[];
  yTicks?: number;
  area?: boolean;
  padding?: { t: number; r: number; b: number; l: number };
  style?: React.CSSProperties;
}

/**
 * Terminal price chart: solid line + gradient area + faint grid, optional dashed
 * theoretical series. Used in MARKET SNAPSHOT and the SPX hero panel.
 *
 * @startingPoint section="Charts" subtitle="Terminal price line chart" viewport="560x220"
 * @dsCard group="Components"
 */
export function LineChart(props: LineChartProps): JSX.Element;
