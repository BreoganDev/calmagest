import { NextRequest } from 'next/server';
import { getRequestId, jsonWithRequestId } from '@/lib/server/request-context';
import { logger } from '@/lib/server/logger';

type LogoItem = {
  id: string;
  kind?: string | null;
  provider?: string | null;
  symbol?: string | null;
  providerId?: string | null;
};

type LogoResponse = {
  logos: Record<string, string | null>;
};

const TTL_LOGO_MS = 7 * 24 * 60 * 60_000;
const TTL_CG_SEARCH_MS = 7 * 24 * 60 * 60_000;

function getLogoCache() {
  const g = globalThis as unknown as {
    __calmagest_logo_cache?: Map<string, { ts: number; value: string | null }>;
    __calmagest_cg_symbol_to_id?: Map<string, { ts: number; id: string | null }>;
  };
  if (!g.__calmagest_logo_cache) g.__calmagest_logo_cache = new Map();
  if (!g.__calmagest_cg_symbol_to_id) g.__calmagest_cg_symbol_to_id = new Map();
  return { logo: g.__calmagest_logo_cache, cg: g.__calmagest_cg_symbol_to_id };
}

function normalizeFinnhubSymbol(raw: string) {
  const s = raw.trim();
  if (!s) return '';
  // If we store Stooq-like tickers (aapl.us), keep the base.
  const base = s.includes('.') ? s.split('.')[0] : s;
  return base.toUpperCase();
}

function baseSymbolFromCryptoId(raw: string) {
  const s = raw.trim().toUpperCase();
  if (!s) return '';

  // Coinbase product id: BTC-EUR
  if (s.includes('-')) return s.split('-')[0] ?? '';

  // Binance symbols: BTCUSDT, ETHEUR
  for (const q of ['USDT', 'USDC', 'BUSD', 'USD', 'EUR', 'GBP']) {
    if (s.endsWith(q)) return s.slice(0, -q.length);
  }

  return s;
}

async function fetchFinnhubLogo(symbol: string): Promise<string | null> {
  try {
    const token = process.env.FINNHUB_API_KEY;
    if (!token) return null;
    const url = `https://finnhub.io/api/v1/stock/profile2?symbol=${encodeURIComponent(symbol)}&token=${encodeURIComponent(token)}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    const json = (await res.json()) as any;
    const logo = typeof json?.logo === 'string' ? json.logo.trim() : '';
    return logo || null;
  } catch {
    return null;
  }
}

async function fetchCoinGeckoLogos(ids: string[]): Promise<Record<string, string | null>> {
  try {
    if (ids.length === 0) return {};
    const unique = Array.from(new Set(ids.filter(Boolean)));
    if (unique.length === 0) return {};

    // markets endpoint returns `image` without requiring extra calls.
    const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${encodeURIComponent(unique.join(','))}&per_page=${unique.length}&page=1&sparkline=false`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return Object.fromEntries(unique.map((id) => [id, null]));
    const json = (await res.json()) as any[];
    const out: Record<string, string | null> = Object.fromEntries(unique.map((id) => [id, null]));
    for (const row of Array.isArray(json) ? json : []) {
      const id = typeof row?.id === 'string' ? row.id : null;
      const image = typeof row?.image === 'string' ? row.image : null;
      if (id && id in out) out[id] = image;
    }
    return out;
  } catch {
    return Object.fromEntries(ids.map((id) => [id, null]));
  }
}

async function searchCoinGeckoIdBySymbol(sym: string): Promise<string | null> {
  try {
    const { cg } = getLogoCache();
    const key = sym.trim().toLowerCase();
    if (!key) return null;

    const now = Date.now();
    const cached = cg.get(key);
    if (cached && now - cached.ts < TTL_CG_SEARCH_MS) return cached.id;

    const url = `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(key)}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      cg.set(key, { ts: now, id: null });
      return null;
    }
    const json = (await res.json()) as any;
    const coins: any[] = Array.isArray(json?.coins) ? json.coins : [];

    // Prefer exact symbol match, otherwise pick first result.
    let found: string | null = null;
    for (const c of coins) {
      const s = typeof c?.symbol === 'string' ? c.symbol.toLowerCase() : '';
      const id = typeof c?.id === 'string' ? c.id : '';
      if (!id) continue;
      if (s === key) {
        found = id;
        break;
      }
    }
    if (!found) {
      const first = coins[0];
      found = typeof first?.id === 'string' ? first.id : null;
    }

    cg.set(key, { ts: now, id: found });
    return found;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req);
  try {
    const body = (await req.json().catch(() => null)) as null | { items?: LogoItem[] };
    const items = Array.isArray(body?.items) ? body.items : [];
    const { logo: cache } = getLogoCache();

    const now = Date.now();
    const logos: Record<string, string | null> = {};

    // Pre-collect CoinGecko ids to batch fetch.
    const cgIds: string[] = [];
    const cgByItemId: Record<string, string> = {};
    const cgNeedSearch: { itemId: string; baseSym: string }[] = [];

    for (const item of items) {
      const kind = (item.kind ?? '').toUpperCase();
      const provider = (item.provider ?? '').toLowerCase();
      if (kind !== 'CRYPTO') continue;

      if (provider === 'coingecko' && item.providerId) {
        cgIds.push(item.providerId);
        cgByItemId[item.id] = item.providerId;
      } else {
        const base = baseSymbolFromCryptoId(item.providerId || item.symbol || '');
        if (base) cgNeedSearch.push({ itemId: item.id, baseSym: base });
      }
    }

    // Resolve symbol -> id via search (cached).
    for (const x of cgNeedSearch) {
      const id = await searchCoinGeckoIdBySymbol(x.baseSym);
      if (!id) continue;
      cgIds.push(id);
      cgByItemId[x.itemId] = id;
    }

    const cgLogoById = await fetchCoinGeckoLogos(cgIds);

    for (const item of items) {
      const provider = (item.provider ?? '').toLowerCase();
      const kind = (item.kind ?? '').toUpperCase();
      const symbol = item.symbol ?? '';
      const providerId = item.providerId ?? '';
      const key = `${kind}:${provider}:${symbol}:${providerId}`;

      const cached = cache.get(key);
      if (cached && now - cached.ts < TTL_LOGO_MS) {
        logos[item.id] = cached.value;
        continue;
      }

      let url: string | null = null;

      if (kind === 'CRYPTO') {
        const id = cgByItemId[item.id];
        url = id ? (cgLogoById[id] ?? null) : null;
      } else {
        // Best effort for market instruments: use Finnhub profile logo when we can.
        // Even if the quote provider is "stooq", Finnhub may still know the base ticker.
        const finnhubSym = normalizeFinnhubSymbol(symbol);
        if (finnhubSym) url = await fetchFinnhubLogo(finnhubSym);
      }

      cache.set(key, { ts: now, value: url });
      logos[item.id] = url;
    }

    return jsonWithRequestId({ logos } satisfies LogoResponse, requestId);
  } catch (error) {
    logger.error('market-logo-route-failed', {
      requestId,
      error: error instanceof Error ? error.message : 'unknown'
    });
    return jsonWithRequestId({ logos: {} } satisfies LogoResponse, requestId);
  }
}
