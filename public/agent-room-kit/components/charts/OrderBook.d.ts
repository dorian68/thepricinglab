import React from 'react';

export interface OrderBookLevel { price: number | string; size: number; }

export interface OrderBookProps {
  /** Bid levels (green), nearest mid first. */
  bids: OrderBookLevel[];
  /** Ask levels (red), nearest mid first. */
  asks: OrderBookLevel[];
  mid?: number | string;
  spread?: number | string;
  /** Price level to highlight. */
  highlight?: number | null;
  style?: React.CSSProperties;
}

/**
 * Depth-of-market ladder. Asks red (depth from the right), bids green (depth
 * from the left), MID + SPREAD divider between.
 *
 * @dsCard group="Components"
 */
export function OrderBook(props: OrderBookProps): JSX.Element;
