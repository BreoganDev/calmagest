import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  monthLabel,
  actions,
  className
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  monthLabel?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn('flex flex-wrap items-start justify-between gap-4', className)}>
      <div className="min-w-0">
        {eyebrow && <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{eyebrow}</p>}
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        {(subtitle || monthLabel) && (
          <p className="text-sm text-muted-foreground">
            {monthLabel ? `${monthLabel}${subtitle ? ' · ' : ''}` : ''}
            {subtitle}
          </p>
        )}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}
