import React from 'react';

export interface TabItem { id: string; label: React.ReactNode; }

export interface TabsProps {
  items: TabItem[];
  value: string;
  onChange?: (id: string) => void;
  dense?: boolean;
  style?: React.CSSProperties;
}

/**
 * Underline tab bar (SUMMARY · GREEKS · SENSITIVITIES …). Active tab is red
 * with a 2px red underline that slides in.
 *
 * @dsCard group="Components"
 */
export function Tabs(props: TabsProps): JSX.Element;
