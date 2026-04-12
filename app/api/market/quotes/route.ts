import { NextRequest } from 'next/server';
import { getRequestId, jsonWithRequestId } from '@/lib/server/request-context';
import { logger } from '@/lib/server/logger';

type QuoteItem = {
  id: string;
  provider?: string | null;
  symbol?: string | null;
  providerId?: string | null;
};

type Quote = {
  priceCents: number | null;
  currency: string;
  asOf: string;
  source: string;
};

const TTL_STOCK_MS = 30_000;
const TTL_CRYPTO_FAST_MS = 10_000;
const TTL_CRYPTO_AGG_MS = 30_000;
const TTL_FX_MS = 60 * 60_000;

function getCache() {
  const g = globalThis as unknown as {
    __calmagest_quote_cache?: Map<string, { ts: number; value: Quote }>;
    __calmagest_fx_cache?: Map<string, { ts: number; rate: number }>;
  };
  if (!g.__calmagest_quote_cache) g.__calmagest_quote_cache = new Map();
  return g.__calmagest_quote_cache;
}

function getFxCache() {
  const g = globalThis as unknown as {
    __calmagest_fx_cache?: Map<string, { ts: number; rate: number }>;
  };
  if (!g.__calmagest_fx_cache) g.__calmagest_fx_cache = new Map();
  return g.__calmagest_fx_cache;
}

function parseCsvLine(line: string) {
  // naive CSV split (stooq output has no quoted commas for this endpoint)
  return line.split(',').map((s) => s.trim());
}

async function fetchStooqPriceCents(rawSymbol: string): Promise<number | null> {
  try {
    const symbol = rawSymbol.trim().toLowerCase();
    const withSuffix = symbol.includes('.') ? symbol : `${symbol}.us`;
    const url = `https://stooq.com/q/l/?s=${encodeURIComponent(withSuffix)}&i=d`;

    const res = await fetch(url, {
      // "real-time" panel should not be cached for long, we add our own TTL cache.
      cache: 'no-store'
    });
    if (!res.ok) return null;
    const text = await res.text();
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length < 1) return null;

    // Stooq may return either just the data line or a header + data line depending on endpoint quirks.
    const dataLine = lines.length >= 2 ? lines[1] : lines[0];
    const cols = parseCsvLine(dataLine);
    // Symbol,Date,Time,Open,High,Low,Close,Volume
    const closeStr = cols[6];
    const close = closeStr ? Number(closeStr) : NaN;
    if (!Number.isFinite(close)) return null;
    return Math.round(close * 100);
  } catch {
    return null;
  }
}

async function fetchFinnhubPriceCents(symbol: string): Promise<number | null> {
  try {
    const token = process.env.FINNHUB_API_KEY;
    if (!token) return null;
    const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol.trim().toUpperCase())}&token=${encodeURIComponent(token)}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    const json = (await res.json()) as any;
    const current = Number(json?.c);
    if (!Number.isFinite(current)) return null;
    return Math.round(current * 100);
  } catch {
    return null;
  }
}

async function fetchCoinGeckoPricesCents(ids: string[], vs: string): Promise<Record<string, number | null>> {
  try {
    if (ids.length === 0) return {};
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(
      ids.join(',')
    )}&vs_currencies=${encodeURIComponent(vs)}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return Object.fromEntries(ids.map((id) => [id, null]));
    const json = (await res.json()) as Record<string, Record<string, number>>;
    const out: Record<string, number | null> = {};
    for (const id of ids) {
      const v = json?.[id]?.[vs];
      out[id] = Number.isFinite(v) ? Math.round(v * 100) : null;
    }
    return out;
  } catch {
    return Object.fromEntries(ids.map((id) => [id, null]));
  }
}

async function fetchCoinbaseSpotCents(pair: string): Promise<number | null> {
  try {
    const url = `https://api.coinbase.com/v2/prices/${encodeURIComponent(pair)}/spot`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    const json = (await res.json()) as any;
    const amount = Number(json?.data?.amount);
    if (!Number.isFinite(amount)) return null;
    return Math.round(amount * 100);
  } catch {
    return null;
  }
}

function parsePairCurrency(pair: string) {
  const parts = pair.split('-').map((s) => s.trim().toUpperCase()).filter(Boolean);
  return parts.length === 2 ? parts[1] : null;
}

function parseBinanceQuoteCurrency(sym: string) {
  const s = sym.toUpperCase();
  for (const q of ['USDT', 'USDC', 'BUSD', 'USD', 'EUR', 'GBP']) {
    if (s.endsWith(q)) return q;
  }
  return null;
}

async function fetchBinancePriceCents(symbol: string): Promise<number | null> {
  try {
    const url = `https://api.binance.com/api/v3/ticker/price?symbol=${encodeURIComponent(symbol)}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    const json = (await res.json()) as any;
    const price = Number(json?.price);
    if (!Number.isFinite(price)) return null;
    return Math.round(price * 100);
  } catch {
    return null;
  }
}

async function fetchFxRate(from: string, to: string): Promise<number | null> {
  try {
    const f = from.toUpperCase();
    const t = to.toUpperCase();
    if (!f || !t || f === t) return 1;
    const key = `${f}:${t}`;
    const cache = getFxCache();
    const now = Date.now();
    const cached = cache.get(key);
    if (cached && now - cached.ts < TTL_FX_MS) return cached.rate;

    // Free endpoint, no key required.
    const url = `https://api.frankfurter.app/latest?from=${encodeURIComponent(f)}&to=${encodeURIComponent(t)}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    const json = (await res.json()) as any;
    const rate = Number(json?.rates?.[t]);
    if (!Number.isFinite(rate) || rate <= 0) return null;
    cache.set(key, { ts: now, rate });
    return rate;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req);
  try {
    const body = (await req.json().catch(() => null)) as null | {
      currency?: string;
      items?: QuoteItem[];
    };

    const requestedCurrency = (body?.currency ?? 'EUR').toUpperCase();
    const items = Array.isArray(body?.items) ? body.items : [];
    const cache = getCache();

    const quotes: Record<string, Quote> = {};
    const now = Date.now();

    const cgIds: string[] = [];

    for (const item of items) {
      const provider = (item.provider ?? '').toLowerCase();
      if (provider === 'coingecko' && item.providerId) {
        cgIds.push(item.providerId);
      }
    }

    const uniqueCgIds = Array.from(new Set(cgIds));
    const cgPrices = await fetchCoinGeckoPricesCents(uniqueCgIds, requestedCurrency.toLowerCase());

    for (const item of items) {
      const provider = (item.provider ?? '').toLowerCase();
      // Cache key includes requested currency, but for some providers the quote currency is embedded in providerId/symbol.
      const key = `${provider}:${item.symbol ?? ''}:${item.providerId ?? ''}:${requestedCurrency}`;

      const cached = cache.get(key);
      const ttl =
        provider === 'coinbase' || provider === 'binance'
          ? TTL_CRYPTO_FAST_MS
          : provider === 'coingecko'
            ? TTL_CRYPTO_AGG_MS
            : TTL_STOCK_MS;

      if (cached && cached.value.priceCents != null && now - cached.ts < ttl) {
        quotes[item.id] = cached.value;
        continue;
      }

      let priceCents: number | null = null;
      let source = 'manual';
      let outCurrency = requestedCurrency;

      if (provider === 'stooq' && item.symbol) {
        priceCents = await fetchStooqPriceCents(item.symbol);
        source = 'stooq';
        // Heuristic: if we ended up with a `.us` suffix, treat as USD for conversion.
        const s = item.symbol.trim().toLowerCase();
        outCurrency = s.includes('.') ? (s.endsWith('.us') ? 'USD' : requestedCurrency) : requestedCurrency;
      } else if (provider === 'coingecko' && item.providerId) {
        priceCents = cgPrices[item.providerId] ?? null;
        source = 'coingecko';
      } else if (provider === 'coinbase' && item.providerId) {
        // providerId = pair (e.g. BTC-USD, ETH-EUR)
        priceCents = await fetchCoinbaseSpotCents(item.providerId);
        source = 'coinbase';
        outCurrency = parsePairCurrency(item.providerId) ?? requestedCurrency;
      } else if (provider === 'binance' && item.providerId) {
        // providerId = symbol (e.g. BTCUSDT, ETHEUR)
        priceCents = await fetchBinancePriceCents(item.providerId);
        source = 'binance';
        outCurrency = parseBinanceQuoteCurrency(item.providerId) ?? requestedCurrency;
      } else if (provider === 'yahoo' && item.symbol) {
        // Yahoo frequently blocks server-to-server requests (401). Treat it as a legacy alias.
        priceCents = await fetchStooqPriceCents(item.symbol);
        source = 'stooq_from_yahoo';
        // Stooq symbols with .us are USD; without suffix we also assume USD for this path.
        const s = item.symbol.trim().toLowerCase();
        outCurrency = s.includes('.') ? (s.endsWith('.us') ? 'USD' : requestedCurrency) : 'USD';
      } else if (provider === 'finnhub' && item.symbol) {
        // Optional: Finnhub for near real-time, but requires API key. If missing, fallback to Yahoo then Stooq.
        const hasFinnhub = Boolean(process.env.FINNHUB_API_KEY);
        priceCents = await fetchFinnhubPriceCents(item.symbol);
        source = hasFinnhub ? 'finnhub' : 'finnhub_missing_key';
        outCurrency = 'USD';
        if (priceCents == null) {
          // Fallback to Stooq (delayed/close) so the UI never shows "no price".
          priceCents = await fetchStooqPriceCents(item.symbol);
          source = hasFinnhub ? 'stooq_fallback' : 'stooq_close_no_key';
        }
      }

      // Convert to requested currency when possible (helps keep KPIs consistent).
      if (priceCents != null && outCurrency !== requestedCurrency) {
        // Treat stablecoins as USD for FX (good enough for this UI).
        const fxFrom = outCurrency === 'USDT' || outCurrency === 'USDC' ? 'USD' : outCurrency;
        const fxTo = requestedCurrency;
        const rate = await fetchFxRate(fxFrom, fxTo);
        if (rate && Number.isFinite(rate)) {
          priceCents = Math.round(priceCents * rate);
          outCurrency = requestedCurrency;
          source = `${source}+fx`;
        }
      }

      const value: Quote = {
        priceCents,
        currency: outCurrency,
        asOf: new Date().toISOString(),
        source
      };
      if (value.priceCents != null) cache.set(key, { ts: now, value });
      quotes[item.id] = value;
    }

    return jsonWithRequestId({ currency: requestedCurrency, quotes }, requestId);
  } catch (error) {
    logger.error('market-quotes-route-failed', {
      requestId,
      error: error instanceof Error ? error.message : 'unknown'
    });
    return jsonWithRequestId({ currency: 'EUR', quotes: {} }, requestId);
  }
}
