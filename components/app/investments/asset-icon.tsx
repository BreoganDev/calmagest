'use client';

import type { InvestmentAssetKind } from '@prisma/client';
import {
  Banknote,
  Bitcoin,
  CandlestickChart,
  Gem,
  Landmark,
  Layers3,
  PieChart,
  BriefcaseBusiness
} from 'lucide-react';
import { cn } from '@/lib/utils';

function kindStyle(kind: InvestmentAssetKind) {
  switch (kind) {
    case 'CRYPTO':
      return 'border-amber-200/60 bg-gradient-to-br from-amber-50 to-orange-50 text-amber-800';
    case 'STOCK':
      return 'border-sky-200/60 bg-gradient-to-br from-sky-50 to-indigo-50 text-slate-900';
    case 'ETF':
      return 'border-emerald-200/60 bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-800';
    case 'BOND':
      return 'border-slate-200/70 bg-gradient-to-br from-slate-50 to-slate-100 text-slate-700';
    case 'FUND':
      return 'border-fuchsia-200/60 bg-gradient-to-br from-fuchsia-50 to-pink-50 text-fuchsia-800';
    case 'PENSION':
      return 'border-violet-200/60 bg-gradient-to-br from-violet-50 to-purple-50 text-violet-800';
    case 'CASH':
      return 'border-lime-200/60 bg-gradient-to-br from-lime-50 to-emerald-50 text-lime-800';
    default:
      return 'border-border bg-card/80 text-slate-700';
  }
}

export function AssetIcon({
  kind,
  size = 'md',
  className
}: {
  kind: InvestmentAssetKind;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const S =
    size === 'sm'
      ? { box: 'h-9 w-9 rounded-2xl', icon: 'h-4 w-4' }
      : size === 'lg'
        ? { box: 'h-12 w-12 rounded-3xl', icon: 'h-6 w-6' }
        : { box: 'h-10 w-10 rounded-2xl', icon: 'h-5 w-5' };

  const Icon =
    kind === 'CRYPTO'
      ? Bitcoin
      : kind === 'STOCK'
        ? CandlestickChart
        : kind === 'ETF'
          ? Layers3
          : kind === 'BOND'
            ? Landmark
            : kind === 'FUND'
              ? PieChart
              : kind === 'PENSION'
                ? BriefcaseBusiness
                : kind === 'CASH'
                  ? Banknote
                  : Gem;

  return (
    <div className={cn('grid place-items-center border shadow-sm', S.box, kindStyle(kind), className)}>
      <Icon className={S.icon} />
    </div>
  );
}

