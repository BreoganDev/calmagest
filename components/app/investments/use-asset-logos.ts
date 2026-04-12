'use client';

import { useEffect, useMemo, useState } from 'react';
import type { InvestmentAssetKind } from '@prisma/client';

type LogoItem = {
  id: string;
  kind: InvestmentAssetKind;
  provider: string | null;
  symbol: string | null;
  providerId: string | null;
};

// Small client-side cache to avoid refetching when switching between tabs/pages.
const clientLogoCache = new Map<string, string | null>();

function cacheKey(i: LogoItem) {
  return `${i.id}:${i.kind}:${i.provider ?? ''}:${i.symbol ?? ''}:${i.providerId ?? ''}`;
}

export function useAssetLogos(items: LogoItem[]) {
  const [logos, setLogos] = useState<Record<string, string | null>>({});

  const normalized = useMemo(() => {
    // Remove duplicates by id (id is stable per holding).
    const byId = new Map<string, LogoItem>();
    for (const i of items) byId.set(i.id, i);
    return Array.from(byId.values());
  }, [items]);

  useEffect(() => {
    if (normalized.length === 0) return;

    // Serve from cache when possible.
    const next: Record<string, string | null> = {};
    const missing: LogoItem[] = [];

    for (const i of normalized) {
      const ck = cacheKey(i);
      if (clientLogoCache.has(ck)) {
        next[i.id] = clientLogoCache.get(ck) ?? null;
      } else {
        missing.push(i);
      }
    }

    if (Object.keys(next).length > 0) setLogos((prev) => ({ ...prev, ...next }));
    if (missing.length === 0) return;

    let cancelled = false;
    const run = async () => {
      const res = await fetch('/api/market/logo', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          items: missing.map((i) => ({
            id: i.id,
            kind: i.kind,
            provider: i.provider,
            symbol: i.symbol,
            providerId: i.providerId
          }))
        })
      });
      if (!res.ok) return;
      const json = (await res.json()) as { logos?: Record<string, string | null> };
      const got = json?.logos ?? {};

      for (const i of missing) {
        const ck = cacheKey(i);
        clientLogoCache.set(ck, got[i.id] ?? null);
      }

      if (!cancelled) setLogos((prev) => ({ ...prev, ...got }));
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [normalized]);

  return logos;
}

