'use client';

import { Plus, TrendingUp, Target, Upload, MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { isValidYearMonth } from '@/lib/services/monthService';
import { trackUxEvent } from '@/lib/client/ux-events';

const actions = [
  {
    icon: Plus,
    label: 'Gasto',
    href: '/app/expenses',
    tone: {
      bg: 'bg-rose-50',
      border: 'border-rose-200/70',
      icon: 'text-rose-700',
      halo: 'from-rose-300/40 to-rose-100/10'
    }
  },
  {
    icon: Upload,
    label: 'Importar',
    href: '/app/bank',
    tone: {
      bg: 'bg-sky-50',
      border: 'border-sky-200/70',
      icon: 'text-sky-700',
      halo: 'from-sky-300/40 to-sky-100/10'
    }
  },
  {
    icon: TrendingUp,
    label: 'Ingreso',
    href: '/app/fijos',
    tone: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200/70',
      icon: 'text-emerald-700',
      halo: 'from-emerald-300/40 to-emerald-100/10'
    }
  },
  {
    icon: Target,
    label: 'Meta',
    href: '/app/goals',
    tone: {
      bg: 'bg-indigo-50',
      border: 'border-indigo-200/70',
      icon: 'text-indigo-700',
      halo: 'from-indigo-300/40 to-indigo-100/10'
    }
  },
  {
    icon: MoreHorizontal,
    label: 'Más',
    href: '/app',
    tone: {
      bg: 'bg-slate-50',
      border: 'border-slate-200/70',
      icon: 'text-slate-700',
      halo: 'from-slate-300/40 to-slate-100/10'
    }
  }
];

export function QuickActionBar() {
  const searchParams = useSearchParams();
  const ymFromQuery = searchParams?.get('ym') ?? null;
  const ym = isValidYearMonth(ymFromQuery) ? ymFromQuery : null;

  const hrefWithYm = (href: string) => {
    if (!ym) return href;
    const monthlyHref =
      href === '/app' ||
      href === '/app/coach' ||
      href === '/app/expenses' ||
      href === '/app/fixed' ||
      href === '/app/fijos' ||
      href === '/app/savings' ||
      href === '/app/history';
    if (!monthlyHref) return href;
    return `${href}?ym=${ym}`;
  };

  const onActionClick = (action: { label: string; href: string }) => {
    trackUxEvent('quick_action_clicked', { action: action.label, href: action.href, ym });
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:hidden">
        {actions.map((action, index) => {
          const isLast = index === actions.length - 1;
          return (
            <Link
              key={`${action.label}-mobile`}
              href={hrefWithYm(action.href)}
              onClick={() => onActionClick(action)}
              className={cn('group min-w-0', isLast && 'col-span-2')}
              style={{ animationDelay: `${index * 75}ms` }}
            >
              <div
                className={cn(
                  'relative w-full rounded-2xl p-4 shadow-none transition-all duration-300',
                  'group-hover:-translate-y-0.5',
                  'animate-rise',
                  action.tone.bg
                )}
              >
                <div className="quick-action-flash" />
                <div
                  className={cn(
                    'mb-3 flex h-11 w-11 items-center justify-center rounded-xl border',
                    'bg-white/80 shadow-sm backdrop-blur',
                    action.tone.border
                  )}
                >
                  <action.icon className={cn('h-5 w-5', action.tone.icon)} />
                </div>
                <div className={cn('text-sm font-semibold text-slate-900', isLast && 'text-center')}>
                  {action.label}
                </div>
                <div className={cn('mt-2 h-1.5 w-full rounded-full bg-gradient-to-r', action.tone.halo)} />
              </div>
            </Link>
          );
        })}
      </div>

      <div className="hidden gap-4 md:grid md:grid-cols-5">
        {actions.map((action, index) => (
          <Link
            key={action.label}
            href={hrefWithYm(action.href)}
            onClick={() => onActionClick(action)}
            className="group"
            style={{ animationDelay: `${index * 75}ms` }}
          >
            <div
              className={cn(
                'relative rounded-2xl p-4 shadow-none transition-all duration-300',
                'group-hover:-translate-y-1',
                'animate-rise',
                action.tone.bg
              )}
            >
              <div className="quick-action-flash" />
              <div
                className={cn(
                  'mb-3 flex h-11 w-11 items-center justify-center rounded-xl border',
                  'bg-white/80 shadow-sm backdrop-blur',
                  action.tone.border
                )}
              >
                <action.icon className={cn('h-5 w-5', action.tone.icon)} />
              </div>
              <div className="text-sm font-semibold text-slate-900">{action.label}</div>
              <div className={cn('mt-2 h-1.5 w-full rounded-full bg-gradient-to-r', action.tone.halo)} />
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
