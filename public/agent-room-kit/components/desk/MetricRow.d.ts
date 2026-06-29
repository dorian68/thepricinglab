import React from 'react';

export interface MetricRowProps {
  label: React.ReactNode;
  value: React.ReactNode;
  unit?: React.ReactNode;
  /** Right/secondary change figure, e.g. "+0.02". */
  change?: React.ReactNode;
  changeTone?: 'positive' | 'negative' | string;
  /** Trailing description column (Greeks table). */
  desc?: React.ReactNode;
  emphasize?: boolean;
  style?: React.CSSProperties;
}

/**
 * Label / value row for Greeks tables, KEY METRICS and EXPOSURE SUMMARY lists.
 *
 * @dsCard group="Components"
 */
export function MetricRow(props: MetricRowProps): JSX.Element;
