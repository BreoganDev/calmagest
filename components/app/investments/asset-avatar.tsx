'use client';

import { useEffect, useState } from 'react';
import type { InvestmentAssetKind } from '@prisma/client';
import { cn } from '@/lib/utils';
import { AssetIcon } from '@/components/app/investments/asset-icon';

export function AssetAvatar({
  kind,
  src,
  alt,
  size = 'md',
  className
}: {
  kind: InvestmentAssetKind;
  src: string | null | undefined;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const [broken, setBroken] = useState(false);

  // Reset broken state when logo changes.
  useEffect(() => setBroken(false), [src]);

  if (!src || broken) return <AssetIcon kind={kind} size={size} className={className} />;

  const S =
    size === 'sm'
      ? { box: 'h-9 w-9 rounded-2xl', img: 'h-9 w-9' }
      : size === 'lg'
        ? { box: 'h-12 w-12 rounded-3xl', img: 'h-12 w-12' }
        : { box: 'h-10 w-10 rounded-2xl', img: 'h-10 w-10' };

  return (
    <div className={cn('grid place-items-center overflow-hidden border border-border bg-white shadow-sm', S.box, className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className={cn('object-contain', S.img)}
        src={src}
        alt={alt}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
      />
    </div>
  );
}

