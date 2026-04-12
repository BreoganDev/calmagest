'use client';

import { useEffect, useState } from 'react';

export type MarketQuote = {
  priceCents: number | null;
  currency: string;
  asOf: string;
  source: string;
};

type StoreState = {
  quotes: Record<string, MarketQuote>;
};

const store: StoreState = { quotes: {} };
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

export function publishMarketQuotes(quotes: Record<string, MarketQuote>) {
  store.quotes = quotes;
  emit();
}

export function useMarketQuotes() {
  const [quotes, setQuotes] = useState(store.quotes);
  useEffect(() => {
    const onChange = () => setQuotes(store.quotes);
    listeners.add(onChange);
    return () => {
      listeners.delete(onChange);
    };
  }, []);
  return quotes;
}

