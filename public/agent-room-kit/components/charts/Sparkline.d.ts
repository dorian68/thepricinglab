import React from 'react';

export interface SparklineProps {
  /** Series of numbers. */
  data: number[];
  width?: number;
  height?: number;
  tone?: 'green' | 'red' | string;
  strokeWidth?: number;
  /** Render the gradient area fill under the line. */
  fill?: boolean;
  style?: React.CSSProperties;
}

/**
 * Minimal area+line sparkline for KPI tiles and table rows.
 *
 * @dsCard group="Components"
 */
export function Sparkline(props: SparklineProps): JSX.Element;
