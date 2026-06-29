import React from 'react';

export interface AgentNodeRow { label: React.ReactNode; value: React.ReactNode; tone?: string; }

export interface AgentNodeProps {
  index?: number;
  name: React.ReactNode;
  /** Domain glyph node (Lucide icon). */
  icon?: React.ReactNode;
  /** Coloured status word, e.g. "UNDERSTANDING", "QUOTING". */
  status?: string;
  /** Status hue key (red, amber, blue, purple, green, cyan) or CSS color. */
  hue?: 'red' | 'amber' | 'blue' | 'purple' | 'green' | 'cyan' | string;
  description?: React.ReactNode;
  /** Mini data rows (Results / Quote / Risk Check). */
  rows?: AgentNodeRow[];
  /** Elapsed timer, e.g. "00:08". */
  elapsed?: string;
  /** Progress 0..1 for the bottom status bar. */
  progress?: number;
  active?: boolean;
  style?: React.CSSProperties;
}

/**
 * A node in the multi-agent pipeline (Sales → Structurer → … → Report). Tinted
 * icon ring, coloured status word, description, mini data rows, timer and a
 * status-hued progress bar.
 *
 * @startingPoint section="Desk" subtitle="Agent pipeline node" viewport="300x220"
 * @dsCard group="Components"
 */
export function AgentNode(props: AgentNodeProps): JSX.Element;
