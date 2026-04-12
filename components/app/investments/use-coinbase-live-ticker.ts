'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

export type CoinbaseLiveTicker = {
  productId: string; // e.g. BTC-USD
  priceCents: number;
  quoteCurrency: string; // e.g. USD
  pct24h: number | null;
  asOf: string;
};

type State = {
  status: 'idle' | 'connecting' | 'live' | 'error';
  tickers: Record<string, CoinbaseLiveTicker>; // key: productId
  error: string | null;
};

function normalizeProducts(products: string[]) {
  return Array.from(
    new Set(
      products
        .map((p) => String(p ?? '').trim().toUpperCase())
        .filter(Boolean)
    )
  ).sort();
}

function parseQuoteCurrency(productId: string) {
  const parts = productId.split('-');
  return (parts[1] ?? '').toUpperCase();
}

export function useCoinbaseLiveTicker(products: string[]) {
  const normalized = useMemo(() => normalizeProducts(products), [products]);
  const key = normalized.join('|');

  const [state, setState] = useState<State>({ status: 'idle', tickers: {}, error: null });
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<{ tries: number; timer: any } | null>(null);

  useEffect(() => {
    // Cleanup previous ws on products change.
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (reconnectRef.current?.timer) clearTimeout(reconnectRef.current.timer);
    reconnectRef.current = { tries: 0, timer: null };

    if (!key) {
      setState({ status: 'idle', tickers: {}, error: null });
      return;
    }

    let cancelled = false;

    const connect = () => {
      if (cancelled) return;

      setState((s) => ({ ...s, status: 'connecting', error: null }));

      const ws = new WebSocket('wss://advanced-trade-ws.coinbase.com');
      wsRef.current = ws;

      ws.onopen = () => {
        if (cancelled) return;
        reconnectRef.current = { tries: 0, timer: null };
        setState((s) => ({ ...s, status: 'live', error: null }));

        // Subscribe to tickers and heartbeats. One channel per message.
        ws.send(JSON.stringify({ type: 'subscribe', channel: 'ticker', product_ids: normalized }));
        ws.send(JSON.stringify({ type: 'subscribe', channel: 'heartbeats', product_ids: normalized }));
      };

      ws.onmessage = (ev) => {
        if (cancelled) return;
        let msg: any;
        try {
          msg = JSON.parse(ev.data);
        } catch {
          return;
        }

        if (msg?.channel !== 'ticker' || !Array.isArray(msg?.events)) return;

        const ts = typeof msg?.timestamp === 'string' ? msg.timestamp : new Date().toISOString();
        const updates: Record<string, CoinbaseLiveTicker> = {};

        for (const e of msg.events) {
          const tickers = e?.tickers;
          if (!Array.isArray(tickers)) continue;
          for (const t of tickers) {
            const productId = String(t?.product_id ?? '').toUpperCase();
            const price = Number(t?.price);
            if (!productId || !Number.isFinite(price)) continue;

            const pct24h = t?.price_percent_chg_24_h != null ? Number(t.price_percent_chg_24_h) : null;
            updates[productId] = {
              productId,
              priceCents: Math.round(price * 100),
              quoteCurrency: parseQuoteCurrency(productId),
              pct24h: Number.isFinite(pct24h as number) ? (pct24h as number) : null,
              asOf: ts
            };
          }
        }

        if (Object.keys(updates).length === 0) return;
        setState((s) => ({ ...s, tickers: { ...s.tickers, ...updates } }));
      };

      ws.onerror = () => {
        if (cancelled) return;
        setState((s) => ({ ...s, status: 'error', error: 'No pude conectar al feed en vivo de Coinbase.' }));
      };

      ws.onclose = () => {
        if (cancelled) return;
        const r = reconnectRef.current ?? { tries: 0, timer: null };
        const tries = Math.min(10, (r.tries ?? 0) + 1);
        const delay = Math.min(30_000, 800 * 2 ** (tries - 1));
        reconnectRef.current = { tries, timer: setTimeout(connect, delay) };
        setState((s) => ({ ...s, status: 'connecting' }));
      };
    };

    connect();

    return () => {
      cancelled = true;
      if (reconnectRef.current?.timer) clearTimeout(reconnectRef.current.timer);
      reconnectRef.current = null;
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  return state;
}

