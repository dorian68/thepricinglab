import React from 'react';

export interface LearningTipProps {
  label?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  /** Optional "Learn more about X" link text. */
  linkLabel?: React.ReactNode;
  onLink?: () => void;
  tone?: 'blue' | 'amber' | 'green';
  style?: React.CSSProperties;
}

/**
 * Educational aside (LEARNING TIP / EDUCATIONAL TIP / QUICK INSIGHT) that
 * translates desk jargon for the learner. Tinted panel + glyph + optional link.
 *
 * @dsCard group="Components"
 */
export function LearningTip(props: LearningTipProps): JSX.Element;
