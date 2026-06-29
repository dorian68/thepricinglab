import React from 'react';

export interface PanelProps {
  /** Uppercase eyebrow title in the panel header. */
  title?: React.ReactNode;
  titleColor?: string;
  /** Right-aligned header content (toggles, menu, count). */
  right?: React.ReactNode;
  /** Show a pulsing green LIVE indicator. */
  live?: boolean;
  liveLabel?: string;
  /** Use the sunken inset background (chart wells). */
  inset?: boolean;
  /** Apply default body padding (default true). */
  pad?: boolean;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  bodyStyle?: React.CSSProperties;
}

/**
 * Hairline-bordered container that wraps almost every region of the desk.
 * Flat dark fill + 1px hairline + 4px radius + faint top inner gradient.
 *
 * @dsCard group="Components"
 */
export function Panel(props: PanelProps): JSX.Element;
