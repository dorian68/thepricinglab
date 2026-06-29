import React from 'react';

export type BadgeTone = 'red' | 'green' | 'amber' | 'purple' | 'blue' | 'cyan' | 'neutral';
export type BadgeKind =
  | 'directional' | 'balanced' | 'hedge' | 'structured' | 'high-exposure'
  | 'data-export' | 'term-sheet' | 'notebook'
  | 'high' | 'medium' | 'low'
  | 'approved' | 'live' | 'in-progress' | 'locked' | 'completed'
  | 'positive' | 'negative';

export interface BadgeProps {
  children?: React.ReactNode;
  /** Explicit color tone. */
  tone?: BadgeTone;
  /** Semantic kind that maps to a tone (tag chips, confidence, risk, status). */
  kind?: BadgeKind;
  variant?: 'soft' | 'outline' | 'dot';
  uppercase?: boolean;
  dot?: boolean;
  size?: 'sm' | 'md';
  style?: React.CSSProperties;
}

/**
 * Compact badge / tag chip / status pill. Drives product tags (DIRECTIONAL,
 * BALANCED, HEDGE, STRUCTURED), confidence (HIGH/MEDIUM), risk (GREEN/AMBER/RED),
 * and workflow status (APPROVED, LIVE, IN PROGRESS, LOCKED).
 *
 * @dsCard group="Components"
 */
export function Badge(props: BadgeProps): JSX.Element;
