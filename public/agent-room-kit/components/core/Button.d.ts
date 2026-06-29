import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  children?: React.ReactNode;
  /** primary = solid red, secondary = outline, ghost = bare, danger = red outline */
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Leading icon node (e.g. a Lucide <i>) */
  icon?: React.ReactNode;
  /** Trailing icon node */
  iconRight?: React.ReactNode;
  disabled?: boolean;
  fullWidth?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  style?: React.CSSProperties;
}

/**
 * Primary call-to-action button for the trading desk. Solid red primary for
 * commit actions ("Send Quote to Client", "Generate Full Package"); outline
 * secondary for neutral actions.
 *
 * @dsCard group="Components"
 */
export function Button(props: ButtonProps): JSX.Element;
