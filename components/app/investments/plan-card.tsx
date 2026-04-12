'use client';

import { useMemo, useState, useTransition, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { InvestmentAssetKind } from '@prisma/client';
import { Money } from '@/components/ui/money';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { parseMoney } from '@/lib/services/moneyService';
import { useAssetLogos } from '@/components/app/investments/use-asset-logos';
import { AssetAvatar } from '@/components/app/investments/asset-avatar';
import { useMarketQuotes } from '@/components/app/investments/market-data-store';
import {
  createInvestmentHolding,
  deleteInvestmentHolding,
  updateInvestmentHoldingQuantity,
  updateInvestmentPlanValue
} from '@/lib/actions/investmentPlanActions';
import { POPULAR_STOCKS_TOP100 } from '@/lib/data/popular-stocks';
import { POPULAR_BINANCE_SYMBOLS, POPULAR_BOND_ETFS, POPULAR_COINGECKO, POPULAR_COINBASE_PAIRS, POPULAR_ETFS, POPULAR_FUNDS } from '@/lib/data/popular-investments';

type Holding = {
  id: string;
  kind: InvestmentAssetKind;
  name: string;
  symbol: string | null;
  provider: string | null;
  providerId: string | null;
  quantity: string;
  costBasis: number;
};

type Contribution = { amount: number; date: string };

type Quote = { priceCents: number | null; currency: string; asOf: string; source: string };

function annualizedReturnAprox(contribs: Contribution[], currentValueCents: number): number | null {
  const deposits = contribs.filter((c) => c.amount > 0);
  const total = deposits.reduce((acc, c) => acc + c.amount, 0);
  if (total <= 0) return null;

  const now = Date.now();
  const weightedMs = deposits.reduce((acc, c) => acc + c.amount * new Date(c.date).getTime(), 0) / total;
  const years = Math.max(0.1, (now - weightedMs) / (365.25 * 24 * 60 * 60 * 1000));
  const ratio = currentValueCents / total;
  if (!Number.isFinite(ratio) || ratio <= 0) return null;
  const apr = Math.pow(ratio, 1 / years) - 1;
  if (!Number.isFinite(apr)) return null;
  return Math.max(-0.99, Math.min(10, apr));
}

export function InvestmentPlanCard({
  currency,
  plan
}: {
  currency: string;
  plan: {
    id: string;
    name: string;
    type: string;
    riskLevel: string;
    targetAmount: number | null;
    annualInterestPct: number | null;
    currentValue: number | null;
    holdings: Holding[];
    contributions: Contribution[];
  };
}) {
  const [isPending, startTransition] = useTransition();

  const [holdKind, setHoldKind] = useState<InvestmentAssetKind>('ETF');
  const [holdName, setHoldName] = useState('');
  const [holdSymbol, setHoldSymbol] = useState('');
  const [holdProviderId, setHoldProviderId] = useState('');
  const [holdCryptoProvider, setHoldCryptoProvider] = useState<'coingecko' | 'coinbase' | 'binance'>('coingecko');
  const [holdQty, setHoldQty] = useState('');
  const [holdCost, setHoldCost] = useState('');
  const [holdBuyPrice, setHoldBuyPrice] = useState(''); // per-unit buy price (optional)
  const [holdPreviewQuote, setHoldPreviewQuote] = useState<Quote | null>(null);
  const [holdAutoQty, setHoldAutoQty] = useState('');
  const [holdManualQty, setHoldManualQty] = useState(false);

  const [editApr, setEditApr] = useState(plan.annualInterestPct != null ? String(plan.annualInterestPct) : '');
  const [editValue, setEditValue] = useState(plan.currentValue != null ? (plan.currentValue / 100).toFixed(2).replace('.', ',') : '');

  const marketQuotes = useMarketQuotes();
  const logos = useAssetLogos(plan.holdings);

  useEffect(() => {
    // Preview quote for the holding being created. Used to auto-calc quantity from invested amount.
    const cost = parseMoney(holdCost);
    if (!cost) {
      setHoldPreviewQuote(null);
      setHoldAutoQty('');
      return;
    }

    const isMarketHolding = holdKind === 'CRYPTO' || holdKind === 'STOCK' || holdKind === 'ETF' || holdKind === 'BOND' || holdKind === 'FUND';

    // Optional entry price: if provided, quantity must be based on that buy price (so P/L is correct).
    const buy = holdBuyPrice ? parseMoney(holdBuyPrice) : 0;
    if (isMarketHolding && buy > 0) {
      const qty = cost / buy;
      if (Number.isFinite(qty) && qty > 0) {
        setHoldAutoQty(qty.toFixed(8).replace(/0+$/, '').replace(/\.$/, ''));
      } else {
        setHoldAutoQty('');
      }
    }

    const isCrypto = holdKind === 'CRYPTO';
    const providerIdRaw = holdProviderId.trim();
    const providerId =
      holdCryptoProvider === 'coingecko'
        ? providerIdRaw.toLowerCase()
        : providerIdRaw.toUpperCase();
    const sym = holdSymbol.trim();

    const provider =
      holdKind === 'CRYPTO'
        ? holdCryptoProvider
        : holdKind === 'STOCK'
          ? 'finnhub'
          : holdKind === 'ETF' || holdKind === 'BOND' || holdKind === 'FUND'
            ? (sym.includes('.') ? 'stooq' : 'finnhub')
            : null;

    if (isCrypto) {
      if (!providerId) {
        setHoldPreviewQuote(null);
        setHoldAutoQty('');
        return;
      }
    } else {
      if (!sym) {
        setHoldPreviewQuote(null);
        setHoldAutoQty('');
        return;
      }
    }

    let cancelled = false;
    const fetchPreview = async () => {
      const item = isCrypto
        ? { id: 'preview', provider, providerId }
        : { id: 'preview', provider, symbol: sym };

      const res = await fetch('/api/market/quotes', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ currency, items: [item] })
      });
      if (!res.ok) return;
      const json = (await res.json()) as { quotes: Record<string, Quote> };
      const q = json?.quotes?.preview ?? null;
      if (cancelled) return;
      setHoldPreviewQuote(q);

      // Keep auto-qty derived from entry price when buy price is explicitly set.
      if (isMarketHolding && buy > 0) return;

      if (!q?.priceCents || q.currency !== currency) {
        setHoldAutoQty('');
        return;
      }
      const qty = cost / q.priceCents;
      if (!Number.isFinite(qty) || qty <= 0) {
        setHoldAutoQty('');
        return;
      }
      setHoldAutoQty(qty.toFixed(8).replace(/0+$/, '').replace(/\.$/, ''));
    };

    void fetchPreview();
    const id = setInterval(() => void fetchPreview(), 15_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [holdKind, holdCryptoProvider, holdProviderId, holdSymbol, holdCost, holdBuyPrice, currency]);

  const investedCents = useMemo(
    () => plan.holdings.reduce((acc, h) => acc + (h.costBasis ?? 0), 0),
    [plan.holdings]
  );

  const estimatedValueCents = useMemo(() => {
    // Treat `currentValue` as a manual override only when there are no holdings to price.
    if (plan.currentValue != null && plan.holdings.length === 0) return plan.currentValue;
    // If there are holdings with quotes, estimate.
    let sum = 0;
    let any = false;
    for (const h of plan.holdings) {
      const q = marketQuotes[h.id];
      const qty = Number(h.quantity);
      if (!q || q.priceCents == null || !Number.isFinite(qty)) continue;
      if (q.currency !== currency) continue;
      any = true;
      sum += Math.round(qty * q.priceCents);
    }
    return any ? sum : null;
  }, [plan.currentValue, plan.holdings, marketQuotes, currency]);

  const gainCents = useMemo(() => {
    if (estimatedValueCents == null) return null;
    return estimatedValueCents - investedCents;
  }, [estimatedValueCents, investedCents]);

  const aprLabel = useMemo(() => {
    if (plan.annualInterestPct != null) return { text: `${plan.annualInterestPct.toFixed(2)}%`, approx: false };
    if (estimatedValueCents == null) return { text: 'Sin dato', approx: false };
    const apr = annualizedReturnAprox(plan.contributions, estimatedValueCents);
    if (apr == null) return { text: 'Sin dato', approx: false };
    return { text: `${(apr * 100).toFixed(2)}%`, approx: true };
  }, [plan.annualInterestPct, plan.contributions, estimatedValueCents]);

  const saveHolding = () => {
    const cost = parseMoney(holdCost);
    const qty =
      Number(
        String(
          (holdKind === 'CRYPTO' || holdKind === 'STOCK' || holdKind === 'ETF' || holdKind === 'BOND' || holdKind === 'FUND') && !holdManualQty
            ? (holdAutoQty || '')
            : holdQty
        ).replace(',', '.')
      );
    if (!holdName || !Number.isFinite(qty) || qty <= 0 || !cost) return;

    const provider =
      holdKind === 'CRYPTO'
        ? holdCryptoProvider
        : holdKind === 'STOCK'
          ? 'finnhub'
          : holdKind === 'ETF' || holdKind === 'BOND' || holdKind === 'FUND'
            ? (holdSymbol.trim().includes('.') ? 'stooq' : 'finnhub')
            : null;

    if ((holdKind === 'STOCK' || holdKind === 'ETF' || holdKind === 'BOND' || holdKind === 'FUND') && !holdSymbol.trim()) return;
    const providerIdNormalized =
      holdKind === 'CRYPTO'
        ? holdCryptoProvider === 'coingecko'
          ? holdProviderId.trim().toLowerCase()
          : holdProviderId.trim().toUpperCase()
        : null;

    if (holdKind === 'CRYPTO' && !providerIdNormalized) return;

    startTransition(async () => {
      await createInvestmentHolding({
        planId: plan.id,
        kind: holdKind,
        name: holdName,
        symbol: provider === 'stooq' || provider === 'finnhub' ? holdSymbol.trim() : undefined,
        provider: provider ?? undefined,
        providerId: holdKind === 'CRYPTO' ? (providerIdNormalized ?? undefined) : undefined,
        quantity: String(qty),
        costBasis: Math.abs(cost),
        createContribution: true
      });
      setHoldName('');
      setHoldSymbol('');
      setHoldProviderId('');
      setHoldQty('');
      setHoldCost('');
      setHoldBuyPrice('');
      setHoldPreviewQuote(null);
      setHoldAutoQty('');
      setHoldManualQty(false);
    });
  };

  const saveOverrides = () => {
    const apr = editApr.trim() ? Number(editApr.replace(',', '.')) : null;
    const val = editValue.trim() ? parseMoney(editValue) : null;
    startTransition(async () => {
      await updateInvestmentPlanValue({
        planId: plan.id,
        annualInterestPct: Number.isFinite(apr as number) ? (apr as number) : null,
        currentValue: val && val > 0 ? val : null
      });
    });
  };

  return (
    <div className="rounded-3xl border border-border bg-card/90 p-4 shadow-soft backdrop-blur-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-base font-semibold text-slate-900">{plan.name}</div>
          <div className="text-xs text-muted-foreground">
            {plan.type} · Riesgo {plan.riskLevel}
            {plan.targetAmount ? (
              <>
                {' '}
                · Objetivo <Money amount={plan.targetAmount} currency={currency} />
              </>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-border bg-white/70 px-3 py-2 shadow-sm">
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Invertido</div>
          <div className="mt-1 text-sm font-semibold text-slate-900">
            <Money amount={investedCents} currency={currency} />
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-white/70 px-3 py-2 shadow-sm">
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Valor</div>
          <div className="mt-1 text-sm font-semibold text-slate-900">
            {estimatedValueCents == null ? '-' : <Money amount={estimatedValueCents} currency={currency} />}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-white/70 px-3 py-2 shadow-sm">
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Ganancia</div>
          <div className={cn('mt-1 text-sm font-semibold', (gainCents ?? 0) >= 0 ? 'text-emerald-700' : 'text-rd-danger')}>
            {gainCents == null ? '-' : <Money amount={gainCents} currency={currency} />}
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-border bg-white/60 px-4 py-3">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Interes anual</div>
          <div className="mt-1 text-sm font-semibold text-slate-900">
            {aprLabel.text}
            {aprLabel.approx ? <span className="ml-1 text-[10px] font-medium text-muted-foreground">(aprox.)</span> : null}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Compras</div>
          <div className="mt-1 text-sm font-semibold text-slate-900">{plan.holdings.length}</div>
        </div>
      </div>

      <details className="mt-4 rounded-2xl border border-border bg-white/60 px-4 py-3">
        <summary className="cursor-pointer text-xs font-semibold text-slate-700">Anadir activo al plan</summary>
        <div className="mt-3 grid gap-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-1">
              <Label>Tipo de activo</Label>
              <select
                className="h-11 rounded-2xl border border-border bg-white/70 px-4 text-sm shadow-sm dark:bg-white/5"
                value={holdKind}
                onChange={(e) => setHoldKind(e.target.value as InvestmentAssetKind)}
              >
                <option value="STOCK">Accion</option>
                <option value="ETF">ETF</option>
                <option value="BOND">Bono</option>
                <option value="FUND">Fondo</option>
                <option value="CRYPTO">Cripto</option>
                <option value="PENSION">Plan de pensiones</option>
                <option value="CASH">Efectivo</option>
                <option value="OTHER">Otro</option>
              </select>
            </div>
            <div className="grid gap-1">
              <Label>Nombre</Label>
              <Input value={holdName} onChange={(e) => setHoldName(e.target.value)} placeholder="MSCI World" />
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-1">
              {holdKind === 'CRYPTO' ? (
                <>
                  <Label>Proveedor</Label>
                  <select
                    className="h-11 rounded-2xl border border-border bg-white/70 px-4 text-sm shadow-sm dark:bg-white/5"
                    value={holdCryptoProvider}
                    onChange={(e) => setHoldCryptoProvider(e.target.value as any)}
                  >
                    <option value="coingecko">CoinGecko (aprox.)</option>
                    <option value="coinbase">Coinbase (mas en vivo)</option>
                    <option value="binance">Binance (mas en vivo)</option>
                  </select>

                  <Label className="mt-2">
                    {holdCryptoProvider === 'coingecko'
                      ? 'CoinGecko id'
                      : holdCryptoProvider === 'coinbase'
                        ? 'Par Coinbase'
                        : 'Simbolo Binance'}
                  </Label>
                  <Label className="mt-2">Cripto popular</Label>
                  <select
                    className="h-11 rounded-2xl border border-border bg-white/70 px-4 text-sm shadow-sm dark:bg-white/5"
                    value={(() => {
                      const v = holdProviderId.trim();
                      if (!v) return '';
                      const n = holdCryptoProvider === 'coingecko' ? v.toLowerCase() : v.toUpperCase();
                      const list =
                        holdCryptoProvider === 'coinbase'
                          ? POPULAR_COINBASE_PAIRS
                          : holdCryptoProvider === 'binance'
                            ? POPULAR_BINANCE_SYMBOLS
                            : POPULAR_COINGECKO;
                      return list.some((x) => x.id === n) ? n : '';
                    })()}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (!v) return;
                      const list =
                        holdCryptoProvider === 'coinbase'
                          ? POPULAR_COINBASE_PAIRS
                          : holdCryptoProvider === 'binance'
                            ? POPULAR_BINANCE_SYMBOLS
                            : POPULAR_COINGECKO;
                      const match = list.find((x) => x.id === v);
                      setHoldProviderId(v);
                      if (match) setHoldName(match.label);
                    }}
                  >
                    <option value="">Selecciona cripto popular</option>
                    {(holdCryptoProvider === 'coinbase'
                      ? POPULAR_COINBASE_PAIRS.filter((c) => c.id.toUpperCase().endsWith(`-${currency.toUpperCase()}`)).concat(
                          POPULAR_COINBASE_PAIRS.filter((c) => !c.id.toUpperCase().endsWith(`-${currency.toUpperCase()}`))
                        )
                      : holdCryptoProvider === 'binance'
                        ? POPULAR_BINANCE_SYMBOLS.filter((c) => c.id.toUpperCase().endsWith(currency.toUpperCase())).concat(
                            POPULAR_BINANCE_SYMBOLS.filter((c) => !c.id.toUpperCase().endsWith(currency.toUpperCase()))
                          )
                        : POPULAR_COINGECKO
                    ).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <div className="text-[11px] text-muted-foreground">O escribe el ID/par manualmente:</div>
                  <Input
                    value={holdProviderId}
                    onChange={(e) => setHoldProviderId(e.target.value)}
                    list={
                      holdCryptoProvider === 'coinbase'
                        ? 'crypto-coinbase-plan'
                        : holdCryptoProvider === 'coingecko'
                          ? 'crypto-coingecko-plan'
                          : 'crypto-binance-plan'
                    }
                    placeholder={
                      holdCryptoProvider === 'coingecko'
                        ? 'bitcoin'
                        : holdCryptoProvider === 'coinbase'
                          ? `BTC-${currency}`
                          : 'BTCUSDT'
                    }
                  />
                  <datalist id="crypto-coinbase-plan">
                    {POPULAR_COINBASE_PAIRS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </datalist>
                  <datalist id="crypto-coingecko-plan">
                    {POPULAR_COINGECKO.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </datalist>
                  <datalist id="crypto-binance-plan">
                    {POPULAR_BINANCE_SYMBOLS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </datalist>
                  <div className="text-[11px] text-muted-foreground">
                    {holdCryptoProvider === 'coingecko'
                      ? 'Ej: bitcoin, ethereum, solana.'
                      : holdCryptoProvider === 'coinbase'
                        ? `Ej: BTC-${currency}, ETH-${currency}. (Ideal: tu moneda)`
                        : 'Ej: BTCUSDT, ETHEUR.'}
                  </div>
                </>
              ) : (
                <>
                  <Label>{holdKind === 'STOCK' ? 'Accion (Top 100)' : 'Simbolo (opcional)'}</Label>
                  {holdKind === 'STOCK' ? (
                    <>
                      <Input
                        list="popular-stocks"
                        value={holdSymbol}
                        onChange={(e) => {
                          const v = e.target.value;
                          setHoldSymbol(v);
                          const match = POPULAR_STOCKS_TOP100.find((s) => s.symbol.toUpperCase() === v.toUpperCase());
                          if (match) {
                            // keep name aligned to the chosen symbol (still editable afterwards)
                            setHoldName(match.name);
                          }
                        }}
                        placeholder="AAPL"
                      />
                      <datalist id="popular-stocks">
                        {POPULAR_STOCKS_TOP100.map((s) => (
                          <option key={s.symbol} value={s.symbol}>
                            {s.name}
                          </option>
                        ))}
                      </datalist>
                      <div className="text-[11px] text-muted-foreground">Tiempo real: Finnhub (gratis con API key). Sin key, ultimo cierre (Stooq).</div>
                    </>
                  ) : holdKind === 'ETF' ? (
                    <>
                      <Input
                        list="popular-etfs-plan"
                        value={holdSymbol}
                        onChange={(e) => {
                          const v = e.target.value.toUpperCase();
                          setHoldSymbol(v);
                          const match = POPULAR_ETFS.find((x) => x.symbol === v);
                          if (match) setHoldName(match.name);
                        }}
                        placeholder="SPY"
                      />
                      <datalist id="popular-etfs-plan">
                        {POPULAR_ETFS.map((x) => (
                          <option key={x.symbol} value={x.symbol}>
                            {x.name}
                          </option>
                        ))}
                      </datalist>
                      <div className="text-[11px] text-muted-foreground">Tiempo real: Finnhub (con API key). Si usas sufijo (.de/.es), se usa Stooq.</div>
                    </>
                  ) : holdKind === 'BOND' ? (
                    <>
                      <Input
                        list="popular-bonds-plan"
                        value={holdSymbol}
                        onChange={(e) => {
                          const v = e.target.value.toUpperCase();
                          setHoldSymbol(v);
                          const match = POPULAR_BOND_ETFS.find((x) => x.symbol === v);
                          if (match) setHoldName(match.name);
                        }}
                        placeholder="BND"
                      />
                      <datalist id="popular-bonds-plan">
                        {POPULAR_BOND_ETFS.map((x) => (
                          <option key={x.symbol} value={x.symbol}>
                            {x.name}
                          </option>
                        ))}
                      </datalist>
                      <div className="text-[11px] text-muted-foreground">Bonos: normalmente ETFs. Finnhub (key) o Stooq.</div>
                    </>
                  ) : holdKind === 'FUND' ? (
                    <>
                      <Input
                        list="popular-funds-plan"
                        value={holdSymbol}
                        onChange={(e) => {
                          const v = e.target.value.toUpperCase();
                          setHoldSymbol(v);
                          const match = POPULAR_FUNDS.find((x) => x.symbol === v);
                          if (match) setHoldName(match.name);
                        }}
                        placeholder="VT"
                      />
                      <datalist id="popular-funds-plan">
                        {POPULAR_FUNDS.map((x) => (
                          <option key={x.symbol} value={x.symbol}>
                            {x.name}
                          </option>
                        ))}
                      </datalist>
                      <div className="text-[11px] text-muted-foreground">Fondos: si es un ETF/ticker publico, se puede valorar.</div>
                    </>
                  ) : (
                    <>
                      <Input value={holdSymbol} onChange={(e) => setHoldSymbol(e.target.value)} placeholder="aapl.us" />
                      <div className="text-[11px] text-muted-foreground">Para precios: Stooq. Ej: aapl.us, msft.us, vwce.de.</div>
                    </>
                  )}
                </>
              )}
            </div>
            <div
              className={cn(
                'grid gap-2',
                holdKind === 'CRYPTO' || holdKind === 'STOCK' || holdKind === 'ETF' || holdKind === 'BOND' || holdKind === 'FUND'
                  ? 'sm:grid-cols-3'
                  : 'sm:grid-cols-2'
              )}
            >
              <div className="grid gap-1">
                <div className="flex items-center justify-between gap-2">
                  <Label>Cantidad</Label>
                  {holdKind === 'CRYPTO' || holdKind === 'STOCK' || holdKind === 'ETF' || holdKind === 'BOND' || holdKind === 'FUND' ? (
                    <button
                      type="button"
                      className="text-[11px] font-semibold text-rd-rose-deep hover:underline"
                      onClick={() => setHoldManualQty((v) => !v)}
                    >
                      {holdManualQty ? 'Auto' : 'Editar'}
                    </button>
                  ) : null}
                </div>
                <Input
                  value={
                    (holdKind === 'CRYPTO' || holdKind === 'STOCK' || holdKind === 'ETF' || holdKind === 'BOND' || holdKind === 'FUND') && !holdManualQty
                      ? (holdAutoQty || '')
                      : holdQty
                  }
                  onChange={(e) => setHoldQty(e.target.value)}
                  placeholder={holdKind === 'CRYPTO' || holdKind === 'STOCK' || holdKind === 'ETF' || holdKind === 'BOND' || holdKind === 'FUND' ? '0,0086' : '1'}
                  disabled={!holdManualQty && (holdKind === 'CRYPTO' || holdKind === 'STOCK' || holdKind === 'ETF' || holdKind === 'BOND' || holdKind === 'FUND')}
                />
                {!holdManualQty && (holdKind === 'CRYPTO' || holdKind === 'STOCK' || holdKind === 'ETF' || holdKind === 'BOND' || holdKind === 'FUND') && !holdAutoQty ? (
                  <div className="text-[11px] text-muted-foreground">
                    Selecciona el activo y rellena el invertido (y opcionalmente el precio de compra) para calcular la cantidad.
                  </div>
                ) : null}
                {holdKind === 'CRYPTO' && holdPreviewQuote?.priceCents ? (
                  <div className="text-[11px] text-muted-foreground">
                    Precio: <Money amount={holdPreviewQuote.priceCents} currency={holdPreviewQuote.currency} /> / ud.
                  </div>
                ) : null}
                {holdKind !== 'CRYPTO' && holdPreviewQuote?.priceCents ? (
                  <div className="text-[11px] text-muted-foreground">
                    Precio: <Money amount={holdPreviewQuote.priceCents} currency={holdPreviewQuote.currency} /> / ud.
                  </div>
                ) : null}
              </div>
              <div className="grid gap-1">
                <Label>Invertido</Label>
                <Input value={holdCost} onChange={(e) => setHoldCost(e.target.value)} placeholder="500,00" />
                <div className="text-[11px] text-muted-foreground">Se registra como compra del activo.</div>
              </div>
              {holdKind === 'CRYPTO' || holdKind === 'STOCK' || holdKind === 'ETF' || holdKind === 'BOND' || holdKind === 'FUND' ? (
                <div className="grid gap-1">
                  <Label>Precio de compra (opcional)</Label>
                  <Input value={holdBuyPrice} onChange={(e) => setHoldBuyPrice(e.target.value)} placeholder="58.095,00" />
                  <div className="text-[11px] text-muted-foreground">Si lo dejas vacio, se usa el precio del momento para calcular la cantidad.</div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={saveHolding}
              disabled={
                isPending ||
                ((holdKind === 'CRYPTO' || holdKind === 'STOCK' || holdKind === 'ETF' || holdKind === 'BOND' || holdKind === 'FUND') &&
                  !holdManualQty &&
                  !holdAutoQty)
              }
            >
              <Plus className="h-4 w-4" />
              Agregar activo
            </Button>
            <div className="text-[11px] text-muted-foreground">
              El panel de mercado calculara el valor si hay simbolo/id.
            </div>
          </div>

          {plan.holdings.length > 0 && (
            <div className="grid gap-2 pt-2">
              {plan.holdings.map((h) => (
                <div key={h.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card/90 px-3 py-2 shadow-soft">
                  <div className="flex min-w-0 items-center gap-3">
                    <AssetAvatar kind={h.kind} size="sm" src={logos[h.id]} alt={h.name} />
                    <div className="min-w-0">
                      <div className="truncate text-xs font-semibold text-slate-900">{h.name}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {h.providerId ? (
                          <span className="font-mono">{h.providerId}</span>
                        ) : h.symbol ? (
                          <span className="font-mono">{h.symbol}</span>
                        ) : (
                          'Manual'
                        )}{' '}
                        · {h.quantity}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="inline-flex h-9 items-center justify-center rounded-xl border border-border bg-white/70 px-3 text-xs font-semibold text-slate-700 hover:bg-white"
                      onClick={() => {
                        const q = marketQuotes[h.id];
                        const price = q?.priceCents;
                        const cost = h.costBasis ?? 0;
                        if (!price || cost <= 0 || q?.currency !== currency) return;
                        const qty = cost / price;
                        if (!Number.isFinite(qty) || qty <= 0) return;
                        startTransition(async () => {
                          await updateInvestmentHoldingQuantity({ id: h.id, quantity: qty.toFixed(8) });
                        });
                      }}
                      aria-label="Recalcular cantidad"
                      title="Recalcular cantidad desde invertido / precio actual"
                      disabled={isPending}
                    >
                      Recalcular
                    </button>
                    <button
                      type="button"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-white/70 text-rd-danger hover:bg-white"
                      onClick={() =>
                        startTransition(async () => {
                          await deleteInvestmentHolding(h.id);
                        })
                      }
                      aria-label="Eliminar activo"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </details>

      <details className="mt-3 rounded-2xl border border-border bg-white/60 px-4 py-3">
        <summary className="cursor-pointer text-xs font-semibold text-slate-700">Editar valor e interes</summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1">
            <Label>Interes anual (%)</Label>
            <Input value={editApr} onChange={(e) => setEditApr(e.target.value)} placeholder="7,5" />
          </div>
          <div className="grid gap-1">
            <Label>Valor actual</Label>
            <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} placeholder="1.250,00" />
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <Button type="button" variant="outline" onClick={saveOverrides} disabled={isPending}>
            Guardar
          </Button>
        </div>
      </details>
    </div>
  );
}
