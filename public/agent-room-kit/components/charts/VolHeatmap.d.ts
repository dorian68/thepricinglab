import React from 'react';

export interface VolHeatmapProps {
  /** 2D matrix of values (rows × cols). */
  matrix: number[][];
  /** Strike / moneyness row labels. */
  rowLabels?: (string | number)[];
  /** Tenor column labels. */
  colLabels?: (string | number)[];
  min?: number;
  max?: number;
  cell?: number;
  gap?: number;
  style?: React.CSSProperties;
}

/**
 * Implied-volatility surface heatmap (Strike × Tenor) with red-intensity cells,
 * matching the VOL SURFACE panel.
 *
 * @dsCard group="Components"
 */
export function VolHeatmap(props: VolHeatmapProps): JSX.Element;
