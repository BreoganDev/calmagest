'use client';

import { useEffect, useMemo, useState } from 'react';
import { RefreshCw, TrendingDown, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Money } from '@/components/ui/money';
import { cn } from '@/lib/utils';
import { useCoinbaseLiveTicker } from '@/components/app/investments/use-coinbase-live-ticker';
import type { InvestmentAssetKind } from '@prisma/client';
import { useAssetLogos } from '@/components/app/investments/use-asset-logos';
import { AssetAvatar } from '@/components/app/investments/asset-avatar';
import { publishMarketQuotes } from '@/components/app/investments/market-data-store';

type Holding = {
  id: string;
  name: string;
  kind: InvestmentAssetKind;
  symbol: string | null;
  provider: string | null;
  providerId: string | null;
  quantity: string;
  costBasis: number;
};

type Quote = {
  priceCents: number | null;
  currency: string;
  asOf: string;
  source: string;
};

export function MarketPanel({
  currency,
  holdings
}: {
  currency: string;
  holdings: Holding[];
}) {
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<Record<string, 'up' | 'down'>>({});
  const lastLivePrice = useMemo(() => new Map<string, number>(), []);

  const items = useMemo(
    () =>
      holdings.map((h) => ({
        id: h.id,
        provider: h.provider,
        symbol: h.symbol,
        providerId: h.providerId
      })),
    [holdings]
  );

  const coinbaseProducts = useMemo(() => {
    const out: string[] = [];
    for (const h of holdings) {
      if ((h.provider ?? '').toLowerCase() === 'coinbase' && h.providerId) out.push(h.providerId);
    }
    return out;
  }, [holdings]);

  const coinbase = useCoinbaseLiveTicker(coinbaseProducts);
  const logos = useAssetLogos(holdings);

  const refreshMs = useMemo(() => {
    // Faster refresh for exchange-based crypto quotes; slower for stocks/aggregators.
    const providers = new Set(holdings.map((h) => (h.provider ?? '').toLowerCase()));
    if (providers.has('coinbase') || providers.has('binance')) return 15_000;
    if (providers.has('coingecko')) return 30_000;
    return 60_000;
  }, [holdings]);

  const fetchQuotes = async () => {
    if (items.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/market/quotes', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ currency, items })
      });
      if (!res.ok) throw new Error('No pude cargar precios.');
      const json = (await res.json()) as { quotes: Record<string, Quote> };
      setQuotes(json.quotes ?? {});
    } catch (e: any) {
      setError(e?.message ?? 'Error cargando precios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchQuotes();
    const id = setInterval(() => void fetchQuotes(), refreshMs);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currency, items.length, refreshMs]);

  const effectiveQuotes = useMemo(() => {
    const out: Record<string, Quote> = {};
    for (const h of holdings) {
      let q = quotes[h.id];
      if ((h.provider ?? '').toLowerCase() === 'coinbase' && h.providerId) {
        const live = coinbase.tickers[h.providerId.toUpperCase()];
        if (live) {
          q = {
            priceCents: live.priceCents,
            currency: live.quoteCurrency,
            asOf: live.asOf,
            source: 'coinbase_ws'
          };
        }
      }
      if (q) out[h.id] = q;
    }
    return out;
  }, [holdings, quotes, coinbase.tickers]);

  useEffect(() => {
    // Share quotes with the rest of the page (plan cards) so we don't open extra intervals/websockets.
    publishMarketQuotes(effectiveQuotes);
  }, [effectiveQuotes]);

  const rows = useMemo(() => {
    return holdings.map((h) => {
      let q = quotes[h.id];

      // Prefer Coinbase live tickers (WebSocket).
      if ((h.provider ?? '').toLowerCase() === 'coinbase' && h.providerId) {
        const live = coinbase.tickers[h.providerId.toUpperCase()];
        if (live) {
          q = {
            priceCents: live.priceCents,
            currency: live.quoteCurrency,
            asOf: live.asOf,
            source: 'coinbase_ws'
          };
        }
      }
      const qty = Number(h.quantity);
      const valueCents = q?.priceCents != null && Number.isFinite(qty) ? Math.round(qty * q.priceCents) : null;
      const gainCents = valueCents != null && (q?.currency ?? currency) === currency ? valueCents - h.costBasis : null;
      return { holding: h, quote: q, valueCents, gainCents };
    });
  }, [holdings, quotes, coinbase.tickers]);

  const totals = useMemo(() => {
    // Only aggregate totals when quote currency matches the user's currency, otherwise totals are misleading.
    const comparable = rows.filter((r) => r.quote?.currency === currency && r.valueCents != null);
    const invested = comparable.reduce((acc, r) => acc + (r.holding.costBasis ?? 0), 0);
    const value = comparable.reduce((acc, r) => acc + (r.valueCents ?? 0), 0);
    const hasValue = comparable.length > 0;
    return {
      invested,
      value: hasValue ? value : null,
      gain: hasValue ? value - invested : null
    };
  }, [rows, currency]);

  useEffect(() => {
    // Subtle Coinbase-like flash on price update.
    const t = coinbase.tickers;
    const ids = Object.keys(t);
    if (ids.length === 0) return;

    for (const h of holdings) {
      if ((h.provider ?? '').toLowerCase() !== 'coinbase' || !h.providerId) continue;
      const live = t[h.providerId.toUpperCase()];
      if (!live) continue;

      const prev = lastLivePrice.get(h.id);
      lastLivePrice.set(h.id, live.priceCents);
      if (prev == null || prev === live.priceCents) continue;

      const dir: 'up' | 'down' = live.priceCents > prev ? 'up' : 'down';
      setFlash((m) => ({ ...m, [h.id]: dir }));
      setTimeout(() => setFlash((m) => {
        const next = { ...m };
        delete next[h.id];
        return next;
      }), 220);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coinbase.tickers]);

  return (
    <div className="grid gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Mercado</div>
          <div className="flex items-center gap-2">
            <div className="text-lg font-semibold text-slate-900">Cripto en tiempo real</div>
            {coinbaseProducts.length > 0 ? (
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.22em]',
                  coinbase.status === 'live'
                    ? 'border-emerald-200/70 bg-emerald-50 text-emerald-700'
                    : 'border-border bg-card/70 text-muted-foreground'
                )}
              >
                <span className={cn('h-1.5 w-1.5 rounded-full', coinbase.status === 'live' ? 'bg-emerald-500' : 'bg-muted-foreground')} />
                Live
              </span>
            ) : null}
          </div>
          <div className="text-xs text-muted-foreground">
            Estilo Coinbase: si el activo es <span className="font-mono">coinbase</span>, el precio llega por WebSocket. Para acciones/ETFs sigue Stooq.
          </div>
        </div>
        <Button type="button" variant="outline" size="sm" className="gap-2" onClick={fetchQuotes} disabled={loading}>
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          Actualizar
        </Button>
      </div>

      {coinbaseProducts.length > 0 ? (() => {
        const first = coinbaseProducts[0]?.toUpperCase();
        const t = first ? coinbase.tickers[first] : null;
        if (!t) return null;
        const base = t.productId.split('-')[0] ?? t.productId;
        const pct = t.pct24h;
        return (
          <div className="rounded-3xl border border-border bg-card/90 p-4 shadow-soft backdrop-blur-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="grid h-11 w-11 place-items-center rounded-2xl border border-border bg-gradient-to-br from-sky-50 to-indigo-50 text-slate-900 shadow-sm">
                  <span className="text-sm font-extrabold tracking-tight">{base}</span>
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-slate-900">{t.productId}</div>
                  <div className="text-xs text-muted-foreground">Feed Coinbase (WebSocket)</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-semibold tabular-nums text-slate-900">
                  <Money amount={t.priceCents} currency={t.quoteCurrency} />
                </div>
                {pct == null ? null : (
                  <div className={cn('text-xs font-semibold tabular-nums', pct >= 0 ? 'text-emerald-700' : 'text-rd-danger')}>
                    {pct >= 0 ? '+' : ''}{pct.toFixed(2)}% (24h)
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })() : null}

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-border bg-card/90 px-4 py-3 shadow-soft">
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Invertido</div>
          <div className="mt-2 text-base font-semibold text-slate-900">
            <Money amount={totals.invested} currency={currency} />
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card/90 px-4 py-3 shadow-soft">
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Valor</div>
          <div className="mt-2 text-base font-semibold text-slate-900">
            {totals.value == null ? '-' : <Money amount={totals.value} currency={currency} />}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card/90 px-4 py-3 shadow-soft">
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Ganancia</div>
          <div className={cn('mt-2 text-base font-semibold', (totals.gain ?? 0) >= 0 ? 'text-emerald-700' : 'text-rd-danger')}>
            {totals.gain == null ? '-' : <Money amount={totals.gain} currency={currency} />}
          </div>
        </div>
      </div>

      {error && <div className="text-xs text-rd-danger">{error}</div>}

      {holdings.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card/70 px-4 py-6 text-sm text-muted-foreground">
          Aun no tienes activos. Agrega uno dentro de un plan para ver su valor en tiempo real.
        </div>
      ) : (
        <div className="grid gap-2">
          {rows.map((r) => {
            const up = (r.gainCents ?? 0) >= 0;
            const isCoinbaseLive = (r.holding.provider ?? '').toLowerCase() === 'coinbase' && r.quote?.source === 'coinbase_ws';
            const pct24h =
              (r.holding.provider ?? '').toLowerCase() === 'coinbase' && r.holding.providerId
                ? coinbase.tickers[r.holding.providerId.toUpperCase()]?.pct24h ?? null
                : null;
            const flashDir = flash[r.holding.id];
            const hasQuote = r.quote?.priceCents != null;
            const unitCurrency = r.quote?.currency ?? currency;
            return (
              <div
                key={r.holding.id}
                className={cn(
                  'grid grid-cols-[1fr_auto] items-center gap-3 rounded-2xl border border-border bg-card/80 px-4 py-3 shadow-soft transition-colors',
                  flashDir === 'up' && 'bg-emerald-50/70',
                  flashDir === 'down' && 'bg-rose-50/70'
                )}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="relative">
                      <AssetAvatar kind={r.holding.kind} size="sm" src={logos[r.holding.id]} alt={r.holding.name} />
                      <div
                        className={cn(
                          'absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full border bg-white/90 shadow-sm',
                          up ? 'border-emerald-200/70 text-emerald-700' : 'border-rose-200/70 text-rose-700'
                        )}
                        aria-hidden="true"
                      >
                        {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-900">{r.holding.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {r.holding.providerId ? (
                          <span className="font-mono">{r.holding.providerId}</span>
                        ) : r.holding.symbol ? (
                          <span className="font-mono">{r.holding.symbol}</span>
                        ) : (
                          'Manual'
                        )}{' '}
                        · {r.holding.quantity} ud.
                        {isCoinbaseLive ? <span className="ml-2 rounded-full bg-slate-900/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-700">Live</span> : null}
                      </div>
                      <div className="mt-1 text-[11px] text-muted-foreground">
                        {hasQuote ? (
                          <>
                            <span className="font-semibold text-slate-700">
                              <Money amount={r.quote!.priceCents!} currency={unitCurrency} />
                            </span>
                            <span className="ml-2">/ ud.</span>
                            {r.quote?.source ? <span className="ml-2">({r.quote.source})</span> : null}
                          </>
                        ) : (
                          <>
                            Sin precio.
                            <span className="ml-2">Revisa simbolo/proveedor.</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-slate-900">
                    {r.valueCents == null ? '-' : <Money amount={r.valueCents} currency={unitCurrency} />}
                  </div>
                  <div className="mt-0.5 flex items-center justify-end gap-2">
                    <div className={cn('text-xs font-medium', up ? 'text-emerald-700' : 'text-rd-danger')}>
                      {r.gainCents == null ? '-' : <Money amount={r.gainCents} currency={currency} />}
                    </div>
                    {pct24h == null ? null : (
                      <div className={cn('text-xs font-semibold tabular-nums', pct24h >= 0 ? 'text-emerald-700' : 'text-rd-danger')}>
                        {pct24h >= 0 ? '+' : ''}{pct24h.toFixed(2)}%
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
