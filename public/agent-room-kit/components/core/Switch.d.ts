import React from 'react';

export interface SwitchProps {
  checked?: boolean;
  onChange?: (next: boolean) => void;
  disabled?: boolean;
  label?: React.ReactNode;
  tone?: 'red' | 'green';
  style?: React.CSSProperties;
}

/**
 * Binary toggle (Educational ↔ Pro mode, Create as Package). Off = hairline
 * track, on = red (or green) track.
 *
 * @dsCard group="Components"
 */
export function Switch(props: SwitchProps): JSX.Element;
