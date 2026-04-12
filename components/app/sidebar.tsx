'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useSearchParams } from 'next/navigation';
import { LayoutDashboard, Receipt, CalendarDays, SlidersHorizontal, PiggyBank, CreditCard, Target, Wallet, TrendingUp, Shield } from 'lucide-react';
import { isValidYearMonth } from '@/lib/services/monthService';
import { cn } from '@/lib/utils';

const items = [
  { href: '/app', label: 'Resumen', icon: LayoutDashboard },
  { href: '/app/expenses', label: 'Gastos', icon: Receipt },
  { href: '/app/fijos', label: 'Fijos', icon: PiggyBank },
  { href: '/app/savings', label: 'Ahorro', icon: Wallet },
  { href: '/app/investments', label: 'Inversi\u00f3n', icon: TrendingUp },
  { href: '/app/goals', label: 'Objetivos', icon: Target },
  { href: '/app/history', label: 'Hist\u00f3rico', icon: CalendarDays },
  { href: '/app/bank', label: 'Banco', icon: CreditCard },
  { href: '/app/settings', label: 'Ajustes', icon: SlidersHorizontal }
];

export function Sidebar({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ymFromQuery = searchParams?.get('ym') ?? null;
  const ym = isValidYearMonth(ymFromQuery) ? ymFromQuery : null;
  const navItems = isAdmin ? [...items, { href: '/app/admin', label: 'Admin', icon: Shield }] : items;

  const hrefWithYm = (href: string) => {
    if (!ym) return href;
    const isMonthlyHref =
      href === '/app' ||
      href === '/app/coach' ||
      href === '/app/expenses' ||
      href === '/app/fixed' ||
      href === '/app/fijos' ||
      href === '/app/savings' ||
      href === '/app/history';
    if (!isMonthlyHref) return href;
    return `${href}?ym=${ym}`;
  };

  return (
    <aside className="hidden h-full w-64 shrink-0 flex-col gap-6 p-6 md:flex card-glass border-white/60 dark:border-white/10">
      {/* Logo */}
      <div className="flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rd-rose/10">
          <Image src="/CalmaGest512.png" alt="Calma Gest" width={32} height={32} />
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-rd-gray-800">Calma Gest</span>
          <span className="text-xs text-rd-gray-500">Finanzas claras</span>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="grid gap-1.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={hrefWithYm(item.href)}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 font-app',
                // Active state
                isActive && 'bg-gradient-to-br from-rd-rose to-rd-rose-deep text-white shadow-md',
                // Hover state (inactive)
                !isActive && 'text-rd-gray-600 hover:bg-white/50 hover:text-rd-gray-900 border border-transparent hover:border-white/40 dark:hover:bg-white/5 dark:text-rd-gray-400 dark:hover:text-white',
                !isActive && 'hover:translate-x-1 hover:shadow-xs'
              )}
            >
              {/* Icon container */}
              <div className={cn(
                'flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-200',
                isActive ? 'bg-white/20 text-white' : 'bg-rd-gray-100 text-rd-gray-500 group-hover:bg-rd-rose/10 group-hover:text-rd-rose'
              )}>
                <item.icon className="h-5 w-5" />
              </div>
              <span className={cn(isActive ? 'text-white' : 'text-rd-gray-600 group-hover:text-rd-gray-800')}>
                {item.label}
              </span>
              {/* Active indicator */}
              {isActive && (
                <div className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-white shadow-lg" />
              )}
            </Link>
          );
        })}
      </nav>
      
      {/* Footer quote */}
      <div className="mt-auto rounded-2xl border border-white/40 dark:border-white/10 bg-white/30 dark:bg-black/20 p-4 shadow-inner backdrop-blur-md">
        <p className="text-sm font-medium text-rd-gray-800 dark:text-rd-gray-200 italic font-app">
          &quot;Un gasto a la vez.&quot;
        </p>
        <p className="mt-1 text-xs text-rd-gray-500">— Calma Gest</p>
      </div>
    </aside>
  );
}

