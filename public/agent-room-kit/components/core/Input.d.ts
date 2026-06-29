import React from 'react';

export interface InputProps {
  as?: 'input' | 'textarea';
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  placeholder?: string;
  /** Leading icon node. */
  icon?: React.ReactNode;
  /** Trailing node (char count, unit, send button). */
  suffix?: React.ReactNode;
  rows?: number;
  /** Force the red active border (the focused RFQ prompt box). */
  accent?: boolean;
  disabled?: boolean;
  style?: React.CSSProperties;
  inputStyle?: React.CSSProperties;
}

/**
 * Text input / textarea with the terminal field treatment — dark fill, hairline
 * border, red focus border + glow. The RFQ prompt box uses `as="textarea"` +
 * `accent`.
 *
 * @dsCard group="Components"
 */
export function Input(props: InputProps): JSX.Element;
