import React from 'react';

export type SegOption = string | { id: string; label: React.ReactNode };

export interface SegmentedToggleProps {
  options: SegOption[];
  value: string;
  onChange?: (id: string) => void;
  /** Active fill tone. */
  tone?: 'red' | 'green' | string;
  size?: 'sm' | 'md';
  style?: React.CSSProperties;
}

/**
 * Compact segmented control for timeframes (1D/1W/1M/3M/1Y) and modes
 * (Bid/Mid, Pipeline/Map, NPV/P&L). Active segment fills with the tone.
 *
 * @dsCard group="Components"
 */
export function SegmentedToggle(props: SegmentedToggleProps): JSX.Element;
