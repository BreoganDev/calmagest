'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { LayoutDashboard, Receipt, PiggyBank, Wallet, MoreHorizontal, Settings, CreditCard, TrendingUp, Shield, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { isValidYearMonth } from '@/lib/services/monthService';

const primaryItems = [
  { href: '/app', label: 'Resumen', icon: LayoutDashboard },
  { href: '/app/expenses', label: 'Gastos', icon: Receipt },
  { href: '/app/fijos', label: 'Fijos', icon: PiggyBank },
  { href: '/app/savings', label: 'Ahorro', icon: Wallet },
];

const secondaryItems = [
  { href: '/app/investments', label: 'Inversión', icon: TrendingUp },
  { href: '/app/goals', label: 'Objetivos', icon: LayoutDashboard },
  { href: '/app/history', label: 'Histórico', icon: CalendarDays },
  { href: '/app/bank', label: 'Banco', icon: CreditCard },
  { href: '/app/settings', label: 'Ajustes', icon: Settings },
];

export function BottomNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ymFromQuery = searchParams?.get('ym') ?? null;
  const ym = isValidYearMonth(ymFromQuery) ? ymFromQuery : null;
  const [isOpen, setIsOpen] = useState(false);
  
  const allSecondaryItems = isAdmin 
    ? [...secondaryItems, { href: '/app/admin', label: 'Admin', icon: Shield }]
    : secondaryItems;

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

  const isPrimaryActive = primaryItems.some(item => item.href === pathname);
  const isSecondaryActive = allSecondaryItems.some(item => item.href === pathname);

  return (
    <>
      <nav className="fixed bottom-6 left-1/2 z-50 flex w-[95%] max-w-lg -translate-x-1/2 items-center justify-between rounded-2xl border border-border bg-card/95 px-4 py-3 shadow-xl backdrop-blur md:hidden">
        {primaryItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={hrefWithYm(item.href)}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex flex-col items-center gap-1 transition-all duration-200',
                'min-w-[3rem] px-1 py-1',
                isActive ? 'text-rd-rose' : 'text-rd-gray-500 hover:text-rd-gray-700'
              )}
            >
              <div className={cn(
                'flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200',
                isActive 
                  ? 'bg-rd-rose/10 text-rd-rose scale-110' 
                  : 'hover:bg-rd-gray-100'
              )}>
                <item.icon className="h-5 w-5" />
              </div>
              <span className={cn(
                'text-[11px] font-medium transition-all duration-200',
                isActive ? 'text-rd-rose scale-105' : 'text-rd-gray-500'
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* More Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'flex flex-col items-center gap-1 transition-all duration-200',
            'min-w-[3rem] px-1 py-1',
            isSecondaryActive ? 'text-rd-rose' : 'text-rd-gray-500 hover:text-rd-gray-700'
          )}
        >
          <div className={cn(
            'flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200',
            isSecondaryActive 
              ? 'bg-rd-rose/10 text-rd-rose scale-110' 
              : 'hover:bg-rd-gray-100',
            isOpen && 'bg-rd-rose text-white rotate-45'
          )}>
            <MoreHorizontal className="h-5 w-5" />
          </div>
          <span className={cn(
            'text-[11px] font-medium transition-all duration-200',
            isSecondaryActive ? 'text-rd-rose scale-105' : 'text-rd-gray-500'
          )}>
            Más
          </span>
        </button>
      </nav>

      {/* More Menu Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
        >
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-[95%] max-w-lg">
            <div className="rounded-2xl border border-border bg-card p-2 shadow-2xl animate-slide-in">
              {allSecondaryItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={hrefWithYm(item.href)}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200',
                      'hover:bg-rd-gray-100',
                      isActive && 'bg-rd-rose/10 text-rd-rose'
                    )}
                  >
                    <div className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-200',
                      isActive ? 'bg-rd-rose text-white' : 'bg-rd-gray-100 text-rd-gray-500'
                    )}>
                      <item.icon className="h-4.5 w-4.5" />
                    </div>
                    <span className={cn(
                      'text-sm font-medium',
                      isActive ? 'text-rd-rose' : 'text-rd-gray-700'
                    )}>
                      {item.label}
                    </span>
                    {isActive && (
                      <div className="ml-auto h-1.5 w-1.5 rounded-full bg-rd-rose" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
