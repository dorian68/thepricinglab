import React from 'react';

export interface PayoffPoint { x: number; y: number; }

export interface PayoffChartProps {
  /** Explicit payoff points; if omitted a long-call payoff is drawn. */
  points?: PayoffPoint[] | null;
  width?: number;
  height?: number;
  tone?: 'red' | 'green' | string;
  /** Marker x-values. */
  spot?: number | null;
  strike?: number | null;
  breakeven?: number | null;
  xDomain?: [number, number];
  /** Compact variant for idea cards (no axes/grid). */
  mini?: boolean;
  showZero?: boolean;
  style?: React.CSSProperties;
}

/**
 * Option payoff / P&L diagram (hockey-stick) with break-even, spot and strike
 * markers. `mini` renders the thumbnail used inside approach/idea cards.
 *
 * @startingPoint section="Charts" subtitle="Option payoff diagram" viewport="520x240"
 * @dsCard group="Components"
 */
export function PayoffChart(props: PayoffChartProps): JSX.Element;
