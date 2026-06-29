import React from 'react';

export interface StatCardProps {
  /** Uppercase label, e.g. "DAILY PNL". */
  label: React.ReactNode;
  /** Primary figure (mono, tabular). */
  value: React.ReactNode;
  /** Unit suffix, e.g. "/bbl", "USD/bbl", "%". */
  unit?: React.ReactNode;
  /** Right-aligned change figure, e.g. "+1.28%". */
  delta?: React.ReactNode;
  /** Colour the delta. */
  deltaTone?: 'positive' | 'negative' | string;
  /** Secondary line under the value, e.g. "Since Trade". */
  sub?: React.ReactNode;
  /** Override the value colour (e.g. green ask, red bid, purple quote). */
  valueColor?: string;
  /** Red-accent emphasis treatment (border + hero glow). */
  accent?: boolean;
  /** Sparkline / area chart node rendered beneath the value. */
  chart?: React.ReactNode;
  size?: 'md' | 'lg';
  style?: React.CSSProperties;
}

/**
 * Dense KPI tile. The atom of every metric strip on the desk (THEO PRICE, BID,
 * ASK, SPREAD, DAILY PNL, VAR, RISK SCORE).
 *
 * @startingPoint section="Cards" subtitle="Dense KPI metric tile" viewport="280x140"
 * @dsCard group="Components"
 */
export function StatCard(props: StatCardProps): JSX.Element;
