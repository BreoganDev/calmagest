'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Money } from '@/components/ui/money';
import { parseMoney } from '@/lib/services/moneyService';
import { createInvestmentPlan } from '@/lib/actions/investmentActions';
import { POPULAR_STOCKS_TOP100 } from '@/lib/data/popular-stocks';
import { POPULAR_BINANCE_SYMBOLS, POPULAR_BOND_ETFS, POPULAR_COINGECKO, POPULAR_COINBASE_PAIRS, POPULAR_ETFS, POPULAR_FUNDS } from '@/lib/data/popular-investments';

type Quote = { priceCents: number | null; currency: string; asOf: string; source: string };

function defaultAprForType(type: string) {
  const t = (type ?? '').toLowerCase();
  if (t.includes('accion')) return '8';
  if (t.includes('etf')) return '6';
  if (t.includes('fondo')) return '6';
  if (t.includes('bono')) return '3';
  if (t.includes('pension')) return '4';
  if (t.includes('crip')) return '15';
  if (t.includes('efectivo')) return '0';
  return '5';
}

function riskLabelForType(type: string) {
  const t = (type ?? '').toLowerCase();
  if (t.includes('accion') || t.includes('crip')) return 'Alto';
  if (t.includes('etf') || t.includes('fondo') || t.includes('otros')) return 'Medio';
  if (t.includes('bono') || t.includes('pension') || t.includes('efectivo')) return 'Bajo';
  return 'Medio';
}

function instrumentLabel(type: string) {
  if (type === 'ETFs') return 'ETF (popular)';
  if (type === 'Bonos') return 'Bono/ETF (popular)';
  if (type === 'Fondos') return 'Fondo (popular)';
  if (type === 'Cripto') return 'Cripto';
  return 'Instrumento';
}

export function InvestmentPlanForm({ currency }: { currency: string }) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState('');
  const [type, setType] = useState<'Acciones' | 'ETFs' | 'Bonos' | 'Fondos' | 'Plan de pensiones' | 'Cripto' | 'Efectivo' | 'Otros'>('ETFs');
  const [annualInterestPct, setAnnualInterestPct] = useState(defaultAprForType('ETFs'));

  // Primary inputs for seeded plans
  const [invested, setInvested] = useState(''); // cost basis (cents)
  const [quantity, setQuantity] = useState(''); // units
  const [quantityManual, setQuantityManual] = useState(false);
  const [buyPrice, setBuyPrice] = useState(''); // per-unit buy price (optional)

  // Selected instrument id
  const [symbol, setSymbol] = useState(''); // stock/etf/bond/fund ticker OR crypto providerId/pair
  const [cryptoProvider, setCryptoProvider] = useState<'coinbase' | 'coingecko' | 'binance'>('coinbase');

  const [quote, setQuote] = useState<Quote | null>(null);
  const marketType = type === 'Acciones' || type === 'ETFs' || type === 'Bonos' || type === 'Fondos' || type === 'Cripto';

  const popularCryptoOptions = useMemo(() => {
    if (type !== 'Cripto') return [];
    if (cryptoProvider === 'coinbase') {
      const preferred = POPULAR_COINBASE_PAIRS.filter((c) => c.id.toUpperCase().endsWith(`-${currency.toUpperCase()}`));
      const rest = POPULAR_COINBASE_PAIRS.filter((c) => !c.id.toUpperCase().endsWith(`-${currency.toUpperCase()}`));
      return [...preferred, ...rest];
    }
    if (cryptoProvider === 'binance') {
      const preferred = POPULAR_BINANCE_SYMBOLS.filter((c) => c.id.toUpperCase().endsWith(currency.toUpperCase()));
      const rest = POPULAR_BINANCE_SYMBOLS.filter((c) => !c.id.toUpperCase().endsWith(currency.toUpperCase()));
      return [...preferred, ...rest];
    }
    return POPULAR_COINGECKO;
  }, [type, cryptoProvider, currency]);

  const popularCryptoValue = useMemo(() => {
    if (type !== 'Cripto') return '';
    const s = symbol.trim();
    if (!s) return '';
    const normalized = cryptoProvider === 'coingecko' ? s.toLowerCase() : s.toUpperCase();
    return popularCryptoOptions.some((o) => o.id === normalized) ? normalized : '';
  }, [type, cryptoProvider, symbol, popularCryptoOptions]);

  useEffect(() => {
    setAnnualInterestPct((prev) => (prev.trim() ? prev : defaultAprForType(type)));
    setQuantityManual(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const risk = useMemo(() => riskLabelForType(type), [type]);

  const instrumentProvider = useMemo(() => {
    if (!marketType) return null;
    if (type === 'Cripto') return cryptoProvider;
    // For EU tickers with suffix (.de, .es, etc) Stooq is the safe fallback.
    if (symbol.trim().includes('.')) return 'stooq';
    // For US tickers Finnhub is near real-time when key exists, otherwise API falls back to close.
    return 'finnhub';
  }, [type, cryptoProvider, symbol]);

  useEffect(() => {
    if (!marketType) {
      setQuote(null);
      return;
    }
    const symRaw = symbol.trim();
    const sym =
      type === 'Cripto' && cryptoProvider === 'coingecko'
        ? symRaw.toLowerCase()
        : symRaw.toUpperCase();
    if (!sym) {
      setQuote(null);
      return;
    }

    // Stocks/ETFs/Bonos/Fondos/Cripto: always preview quote so we can compute quantity and current value.
    let cancelled = false;
    const run = async () => {
      const item =
        type === 'Cripto'
          ? { id: 'inst', provider: instrumentProvider, providerId: sym }
          : { id: 'inst', provider: instrumentProvider, symbol: sym };
      const res = await fetch('/api/market/quotes', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ currency, items: [item] })
      });
      if (!res.ok) return;
      const json = (await res.json()) as { quotes: Record<string, Quote> };
      const q = json?.quotes?.inst ?? null;
      if (!cancelled) setQuote(q);
    };
    void run();
    const id = setInterval(() => void run(), 15_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [symbol, type, instrumentProvider, currency]);

  // Auto-quantity from invested (core concept).
  useEffect(() => {
    if (!marketType) return;
    if (quantityManual) return;
    const inv = invested ? parseMoney(invested) : 0;
    if (!inv) return;

    const buy = buyPrice ? parseMoney(buyPrice) : 0;
    const priceCents = buy > 0 ? buy : quote?.priceCents ?? 0;
    const priceCurrencyOk = buy > 0 ? true : quote?.currency === currency;
    if (!priceCents || !priceCurrencyOk) return;

    const qty = inv / priceCents;
    if (!Number.isFinite(qty) || qty <= 0) return;
    setQuantity(qty.toFixed(8).replace(/0+$/, '').replace(/\.$/, ''));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invested, buyPrice, quote?.priceCents, quote?.currency, currency, marketType, quantityManual]);

  const currentValueCents = useMemo(() => {
    if (!marketType) return null;
    const qty = Number(String(quantity).replace(',', '.'));
    if (!Number.isFinite(qty) || qty <= 0) return null;
    if (!quote?.priceCents || quote.currency !== currency) return null;
    return Math.round(qty * quote.priceCents);
  }, [quantity, quote, currency]);

  const onSelectFromList = (nextSymbol: string) => {
    if (type === 'Cripto') {
      const v =
        cryptoProvider === 'coingecko'
          ? nextSymbol.trim().toLowerCase()
          : nextSymbol.trim().toUpperCase();
      setSymbol(v);
      if (!name.trim()) {
        const match =
          cryptoProvider === 'coinbase'
            ? POPULAR_COINBASE_PAIRS.find((c) => c.id === v)
            : cryptoProvider === 'binance'
              ? POPULAR_BINANCE_SYMBOLS.find((c) => c.id === v)
              : POPULAR_COINGECKO.find((c) => c.id === v);
        if (match) setName(match.label);
      }
      return;
    }

    const v = nextSymbol.toUpperCase();
    setSymbol(v);
    if (type === 'Acciones') {
      const match = POPULAR_STOCKS_TOP100.find((s) => s.symbol === v);
      if (match) setName(match.name);
      return;
    }
    if (type === 'ETFs') {
      const match = POPULAR_ETFS.find((x) => x.symbol === v);
      if (match) setName(match.name);
      return;
    }
    if (type === 'Bonos') {
      const match = POPULAR_BOND_ETFS.find((x) => x.symbol === v);
      if (match) setName(match.name);
      return;
    }
    if (type === 'Fondos') {
      const match = POPULAR_FUNDS.find((x) => x.symbol === v);
      if (match) setName(match.name);
    }
  };

  const save = () => {
    if (!name) return;
    const inv = invested ? parseMoney(invested) : 0;
    const qty = Number(String(quantity).replace(',', '.'));
    const apr = annualInterestPct.trim() ? Number(String(annualInterestPct).replace(',', '.')) : undefined;

    const symRaw = symbol.trim();
    const sym =
      type === 'Cripto' && cryptoProvider === 'coingecko'
        ? symRaw.toLowerCase()
        : symRaw.toUpperCase();
    const canSeed = marketType ? Boolean(sym) && inv > 0 && Number.isFinite(qty) && qty > 0 : inv > 0;
    if (!canSeed) return;

    startTransition(async () => {
      const kind =
        type === 'Acciones'
          ? 'STOCK'
          : type === 'ETFs'
            ? 'ETF'
            : type === 'Bonos'
              ? 'BOND'
              : type === 'Fondos'
                ? 'FUND'
                : type === 'Cripto'
                  ? 'CRYPTO'
                  : type === 'Plan de pensiones'
                    ? 'PENSION'
                    : type === 'Efectivo'
                      ? 'CASH'
                      : 'OTHER';

      // If it is not a market instrument, we still model it as a manual "asset" (so investment always means acquisition).
      const holdingQty = marketType ? qty : 1;

      await createInvestmentPlan({
        name,
        type,
        annualInterestPct: Number.isFinite(apr as number) ? (apr as number) : undefined,
        currentValue: marketType ? (currentValueCents ?? undefined) : inv,
        initialHolding: {
          kind: kind as any,
          name,
          symbol: marketType && type !== 'Cripto' ? sym : undefined,
          provider: marketType ? (instrumentProvider as string) : undefined,
          providerId: type === 'Cripto' ? sym : undefined,
          quantity: String(holdingQty),
          costBasis: inv
        }
      });

      setName('');
      setType('ETFs');
      setAnnualInterestPct(defaultAprForType('ETFs'));
      setInvested('');
      setQuantity('');
      setQuantityManual(false);
      setBuyPrice('');
      setSymbol('');
      setQuote(null);
      setCryptoProvider('coinbase');
    });
  };

  const datalistId =
    type === 'Acciones'
      ? 'popular-stocks-top100'
      : type === 'ETFs'
        ? 'popular-etfs'
        : type === 'Bonos'
          ? 'popular-bonds'
          : type === 'Fondos'
            ? 'popular-funds'
            : type === 'Cripto'
              ? cryptoProvider === 'coinbase'
                ? 'popular-coinbase'
                : cryptoProvider === 'binance'
                  ? 'popular-binance'
                  : 'popular-coingecko'
              : undefined;

  return (
    <div className="grid gap-3">
      <div className="grid gap-2">
        <Label htmlFor="planName">Nombre</Label>
        <Input id="planName" value={name} onChange={(e) => setName(e.target.value)} placeholder="Mi plan" />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="planType">Tipo</Label>
        <select
          id="planType"
          className="h-11 rounded-2xl border border-border bg-white/70 px-4 text-sm shadow-sm dark:bg-white/5"
          value={type}
          onChange={(e) => setType(e.target.value as any)}
        >
          <option>Acciones</option>
          <option>ETFs</option>
          <option>Bonos</option>
          <option>Fondos</option>
          <option>Plan de pensiones</option>
          <option>Cripto</option>
          <option>Efectivo</option>
          <option>Otros</option>
        </select>
      </div>

      <div className="grid gap-2 rounded-2xl border border-border bg-card/70 p-3">
        <div className="grid gap-2">
          <Label>{instrumentLabel(type)}</Label>
          {!marketType ? (
            <div className="text-sm text-muted-foreground">
              Este tipo no tiene precio de mercado. Registra el invertido y sigue aportando cuando quieras.
            </div>
          ) : type === 'Cripto' ? (
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Proveedor</Label>
                <select
                  className="h-11 rounded-2xl border border-border bg-white/70 px-4 text-sm shadow-sm dark:bg-white/5"
                  value={cryptoProvider}
                  onChange={(e) => setCryptoProvider(e.target.value as any)}
                >
                  <option value="coinbase">Coinbase (WebSocket)</option>
                  <option value="coingecko">CoinGecko (aprox.)</option>
                  <option value="binance">Binance</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label>Cripto</Label>
                <select
                  className="h-11 rounded-2xl border border-border bg-white/70 px-4 text-sm shadow-sm dark:bg-white/5"
                  value={popularCryptoValue}
                  onChange={(e) => onSelectFromList(e.target.value)}
                >
                  <option value="">Selecciona cripto popular</option>
                  {popularCryptoOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <div className="text-[11px] text-muted-foreground">O escribe el ID/par manualmente:</div>
                <Input
                  list={datalistId}
                  value={symbol}
                  onChange={(e) => onSelectFromList(e.target.value)}
                  placeholder={cryptoProvider === 'coinbase' ? `BTC-${currency}` : cryptoProvider === 'binance' ? 'BTCUSDT' : 'bitcoin'}
                />
              </div>
            </div>
          ) : (
            <Input
              list={datalistId}
              value={symbol}
              onChange={(e) => onSelectFromList(e.target.value)}
              placeholder={type === 'ETFs' ? 'SPY' : type === 'Bonos' ? 'BND' : type === 'Fondos' ? 'VT' : 'META'}
            />
          )}

          <datalist id="popular-stocks-top100">
            {POPULAR_STOCKS_TOP100.map((s) => (
              <option key={s.symbol} value={s.symbol}>
                {s.name}
              </option>
            ))}
          </datalist>
          <datalist id="popular-etfs">
            {POPULAR_ETFS.map((x) => (
              <option key={x.symbol} value={x.symbol}>
                {x.name}
              </option>
            ))}
          </datalist>
          <datalist id="popular-bonds">
            {POPULAR_BOND_ETFS.map((x) => (
              <option key={x.symbol} value={x.symbol}>
                {x.name}
              </option>
            ))}
          </datalist>
          <datalist id="popular-funds">
            {POPULAR_FUNDS.map((x) => (
              <option key={x.symbol} value={x.symbol}>
                {x.name}
              </option>
            ))}
          </datalist>
          <datalist id="popular-coinbase">
            {POPULAR_COINBASE_PAIRS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </datalist>
          <datalist id="popular-binance">
            {POPULAR_BINANCE_SYMBOLS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </datalist>
          <datalist id="popular-coingecko">
            {POPULAR_COINGECKO.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </datalist>

          <div className="text-[11px] text-muted-foreground">
            {marketType ? (
              <>
                Precio actual: {quote?.priceCents ? <Money amount={quote.priceCents} currency={quote.currency} /> : '-'}
                {quote?.source ? <span className="ml-2">({quote.source})</span> : null}
              </>
            ) : null}
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label>Invertido</Label>
            <Input value={invested} onChange={(e) => setInvested(e.target.value)} placeholder="500,00" />
          </div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-2">
              <Label>{marketType ? 'Cantidad' : 'Cantidad'}</Label>
              {marketType ? (
                <button
                  type="button"
                  className="text-[11px] font-semibold text-rd-rose-deep hover:underline"
                  onClick={() => setQuantityManual((v) => !v)}
                >
                  {quantityManual ? 'Auto' : 'Editar'}
                </button>
              ) : null}
            </div>
            <Input
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder={marketType ? '0,0086' : '1'}
              disabled={marketType && !quantityManual}
            />
            {marketType && !quantityManual ? (
              <div className="text-[11px] text-muted-foreground">
                Se calcula automaticamente con el invertido y el precio (compra o actual).
              </div>
            ) : null}
          </div>
        </div>

        {marketType ? (
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Precio de compra (opcional)</Label>
              <Input value={buyPrice} onChange={(e) => setBuyPrice(e.target.value)} placeholder="58.095,00" />
              <div className="text-[11px] text-muted-foreground">
                Si lo dejas vacio, se toma el precio del momento para calcular la cantidad.
              </div>
            </div>
            <div className="grid gap-1">
              <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Compra estimada</div>
              <div className="text-sm font-semibold text-slate-900">
                {(() => {
                  const inv = invested ? parseMoney(invested) : 0;
                  const qty = Number(String(quantity).replace(',', '.'));
                  if (!inv || !Number.isFinite(qty) || qty <= 0) return '-';
                  const entry = Math.round(inv / qty);
                  return <Money amount={entry} currency={currency} />;
                })()}
                <span className="ml-2 text-xs text-muted-foreground">/ ud.</span>
              </div>
            </div>
          </div>
        ) : null}

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="grid gap-1">
            <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Valor actual</div>
            <div className="text-sm font-semibold text-slate-900">
              {marketType ? (currentValueCents != null ? <Money amount={currentValueCents} currency={currency} /> : '-') : <Money amount={invested ? parseMoney(invested) : 0} currency={currency} />}
            </div>
          </div>
          <div className="grid gap-1">
            <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Riesgo</div>
            <div className="text-sm font-semibold text-slate-900">{risk}</div>
          </div>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="planApr">Interes anual (%)</Label>
          <Input id="planApr" value={annualInterestPct} onChange={(e) => setAnnualInterestPct(e.target.value)} placeholder="7,5" />
        </div>
        <div className="grid gap-2">
          <Label>Valor actual (auto)</Label>
          <Input value={currentValueCents != null ? (currentValueCents / 100).toFixed(2).replace('.', ',') : ''} disabled placeholder="-" />
        </div>
      </div>

      <Button type="button" onClick={save} disabled={isPending}>
        Crear plan
      </Button>
    </div>
  );
}
