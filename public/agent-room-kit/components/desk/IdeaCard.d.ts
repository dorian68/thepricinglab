import React from 'react';
import { BadgeKind } from '../core/Badge';
import { PayoffChartProps } from '../charts/PayoffChart';

export interface IdeaCardProps {
  title: React.ReactNode;
  rationale?: React.ReactNode;
  /** Product tag chip kind (directional, balanced, hedge, structured…). */
  tagKind?: BadgeKind;
  tagLabel?: React.ReactNode;
  /** Override props for the mini PayoffChart. */
  payoff?: Partial<PayoffChartProps> | null;
  /** Estimated cost, e.g. "$3.45 /bbl". */
  estCost?: React.ReactNode;
  confidence?: 'high' | 'medium' | 'low';
  selected?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

/**
 * Strategy/approach proposal card with a mini payoff thumbnail, tag chip, Est.
 * Cost and Confidence. Used in POSSIBLE APPROACHES and AGENT PROPOSALS.
 *
 * @startingPoint section="Desk" subtitle="Strategy proposal card" viewport="240x230"
 * @dsCard group="Components"
 */
export function IdeaCard(props: IdeaCardProps): JSX.Element;
