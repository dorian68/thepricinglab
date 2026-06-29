import React from 'react';

export interface TickerItem {
  sym: string;
  value: string | number;
  delta: string;
  /** Force direction; otherwise inferred from the delta sign. */
  dir?: 'up' | 'down';
}

export interface TickerStripProps {
  label?: string;
  items: TickerItem[];
  /** Right-side status text with a green dot (e.g. "All Systems Operational"). */
  status?: string | null;
  right?: React.ReactNode;
  style?: React.CSSProperties;
}

/**
 * Full-width MARKET WATCH ticker strip pinned to the bottom of the desk shell.
 *
 * @dsCard group="Components"
 */
export function TickerStrip(props: TickerStripProps): JSX.Element;
