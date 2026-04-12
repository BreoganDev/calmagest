'use client';

import { ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { NotificationCenter } from '@/components/app/notification-center';
import { useZenMode } from '@/components/providers/zen-provider';
import { buildYearMonthRange, formatYearMonthLabel, isValidYearMonth, addMonths } from '@/lib/services/monthService';
import { trackUxEvent } from '@/lib/client/ux-events';
import { cn } from '@/lib/utils';

const MONTHLY_PREFIXES = ['/app/coach', '/app/expenses', '/app/fixed', '/app/fijos', '/app/savings'];
const ROUTE_LABELS: Array<{ prefix: string; label: string }> = [
  { prefix: '/app/expenses', label: 'Gastos' },
  { prefix: '/app/fijos', label: 'Fijos' },
  { prefix: '/app/fixed', label: 'Fijos' },
  { prefix: '/app/savings', label: 'Ahorro' },
  { prefix: '/app/investments', label: 'Inversión' },
  { prefix: '/app/goals', label: 'Objetivos' },
  { prefix: '/app/history', label: 'Histórico' },
  { prefix: '/app/coach', label: 'Coach IA' },
  { prefix: '/app/bank', label: 'Banco' },
  { prefix: '/app/settings', label: 'Ajustes' },
  { prefix: '/app/admin', label: 'Admin' }
];

function isMonthlyRoute(pathname: string) {
  if (pathname === '/app') return true;
  return MONTHLY_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function getRouteLabel(pathname: string) {
  if (pathname === '/app') return 'Resumen';
  const found = ROUTE_LABELS.find((route) => pathname === route.prefix || pathname.startsWith(`${route.prefix}/`));
  return found?.label ?? 'Calma Gest';
}

export function Topbar({
  userName,
  currentYearMonth,
  notifications,
  unreadCount
}: {
  userName?: string | null;
  currentYearMonth: string;
  notifications: Array<{
    id: string;
    title: string;
    body: string;
    severity: string;
    type: string;
    readAt: string | null;
    createdAt: string;
  }>;
  unreadCount: number;
}) {
  const { isZenMode, toggleZenMode } = useZenMode();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const safePathname = pathname ?? '/app';

  const ymFromQuery = searchParams?.get('ym') ?? null;
  const selectedYearMonth = isValidYearMonth(ymFromQuery) ? ymFromQuery : currentYearMonth;
  const monthLabel = formatYearMonthLabel(selectedYearMonth);
  const routeLabel = getRouteLabel(safePathname);
  const monthlyRoute = isMonthlyRoute(safePathname);
  const isCurrentMonth = selectedYearMonth === currentYearMonth;

  const navigateToYearMonth = (targetYearMonth: string) => {
    if (!monthlyRoute || !isValidYearMonth(targetYearMonth)) return;
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    params.set('ym', targetYearMonth);
    params.delete('page');
    const nextQuery = params.toString();
    trackUxEvent('month_changed', { from: selectedYearMonth, to: targetYearMonth, route: safePathname });
    router.push(nextQuery ? `${safePathname}?${nextQuery}` : safePathname);
  };

  const range = buildYearMonthRange(currentYearMonth, 24, 12);
  const uniqueMonths = Array.from(new Set([...range, selectedYearMonth])).sort();

  return (
    <div className="relative z-40 flex flex-col gap-2 rounded-2xl border border-border bg-card/95 px-3 py-2.5 shadow-lg backdrop-blur sm:px-6 sm:py-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rd-rose/10 md:hidden">
            <Image src="/CalmaGest512.png" alt="Calma Gest" width={28} height={28} />
          </div>
          <div className="flex flex-col">
            <p className="text-[11px] sm:text-sm text-rd-gray-500">Hola{userName ? `, ${userName}` : ''}</p>
            <h1 className="text-sm sm:text-lg font-semibold text-rd-gray-800">{routeLabel}</h1>
            <span className="mt-0.5 text-xs text-rd-gray-600/70 sm:hidden">{monthLabel}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleZenMode}
            className={cn(
              'h-9 w-9 rounded-xl transition-all duration-200',
              'hover:bg-rd-rose-soft/60',
              isZenMode && 'bg-rd-rose-soft/80 text-rd-rose'
            )}
            title={isZenMode ? 'Desactivar Modo Zen' : 'Activar Modo Zen'}
          >
            {isZenMode ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
          </Button>
          <NotificationCenter items={notifications} unreadCount={unreadCount} />
        </div>
      </div>

      <div className={cn('flex items-center gap-2', !monthlyRoute && 'opacity-50')}>
        <div className="flex w-full items-center gap-2 rounded-xl bg-rd-nude/80 p-1 shadow-sm sm:max-w-[420px]">
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 rounded-lg"
            aria-label="Mes anterior"
            onClick={() => navigateToYearMonth(addMonths(selectedYearMonth, -1))}
            disabled={!monthlyRoute}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Select
            className="h-11 flex-1 rounded-lg px-2 text-xs font-medium text-rd-gray-700 sm:text-sm"
            value={selectedYearMonth}
            onChange={(event) => navigateToYearMonth(event.target.value)}
            disabled={!monthlyRoute}
            aria-label="Seleccionar mes"
          >
            {uniqueMonths.map((ym) => (
              <option key={ym} value={ym}>
                {formatYearMonthLabel(ym)}
              </option>
            ))}
          </Select>

          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 rounded-lg"
            aria-label="Mes siguiente"
            onClick={() => navigateToYearMonth(addMonths(selectedYearMonth, 1))}
            disabled={!monthlyRoute}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {monthlyRoute && !isCurrentMonth && (
          <Button
            variant="ghost"
            className="hidden h-11 rounded-lg border border-border bg-white/70 px-3 text-xs font-medium text-rd-gray-700 hover:bg-white sm:inline-flex"
            onClick={() => navigateToYearMonth(currentYearMonth)}
          >
            Volver a mes actual
          </Button>
        )}
      </div>
    </div>
  );
}
