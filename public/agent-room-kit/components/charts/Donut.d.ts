import React from 'react';

export interface DonutSegment { value: number; color: string; label?: string; }

export interface DonutProps {
  segments: DonutSegment[];
  size?: number;
  thickness?: number;
  /** Center readout, e.g. { value: '62', label: 'Medium' }. */
  center?: { value: React.ReactNode; label?: React.ReactNode } | null;
  /** Gap between segments in arc-length units. */
  gap?: number;
  style?: React.CSSProperties;
}

/**
 * Ring/donut chart for storage usage, risk breakdown, and confidence/risk
 * scores with an optional center readout.
 *
 * @dsCard group="Components"
 */
export function Donut(props: DonutProps): JSX.Element;
