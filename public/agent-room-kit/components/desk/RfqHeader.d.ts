import React from 'react';

export interface RfqHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** RFQ identifier, e.g. "RFQ-2026-0617-001". */
  rfqId?: string;
  /** Auto-save timestamp, e.g. "15:42:18". */
  savedAt?: string;
  /** Right-aligned actions (Export, ⋮). */
  right?: React.ReactNode;
  copyIcon?: React.ReactNode;
  style?: React.CSSProperties;
}

/**
 * Screen header: uppercase title + subtitle, with an RFQ-ID copy control and a
 * green "Auto-Saved" state. Sits at the top of every desk view.
 *
 * @dsCard group="Components"
 */
export function RfqHeader(props: RfqHeaderProps): JSX.Element;
