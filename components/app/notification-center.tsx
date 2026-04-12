'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { createPortal } from 'react-dom';
import { Bell, CheckCheck, Inbox, AlertTriangle, Info, PiggyBank, TrendingUp, DollarSign } from 'lucide-react';
import type { Notification } from '@prisma/client';
import { readAllNotifications, readNotification } from '@/lib/actions/notificationActions';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/providers/toast-provider';

type NotificationView = Pick<Notification, 'id' | 'title' | 'body' | 'severity' | 'type'> & {
  readAt: string | null;
  createdAt: string;
};

export function NotificationCenter({
  items,
  unreadCount
}: {
  items: NotificationView[];
  unreadCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [isPending, startTransition] = useTransition();
  const { success } = useToast();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const sorted = useMemo(
    () => [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [items]
  );

  const filtered = useMemo(() => {
    if (filter === 'unread') return sorted.filter((i) => !i.readAt);
    return sorted;
  }, [sorted, filter]);

  const markAll = () => {
    startTransition(async () => {
      await readAllNotifications();
      success('Todas las notificaciones marcadas como leídas');
    });
  };

  const markOne = (id: string, isRead: boolean) => {
    if (isRead) return;
    startTransition(async () => {
      await readNotification(id);
    });
  };

  const getIcon = (type: string, severity: string) => {
    if (type === 'health' && severity === 'critical') return <AlertTriangle className="h-4 w-4 text-rd-danger" />;
    if (type === 'health') return <TrendingUp className="h-4 w-4 text-orange-500" />;
    if (type === 'savings') return <PiggyBank className="h-4 w-4 text-rd-calm-green" />;
    if (type === 'investment') return <TrendingUp className="h-4 w-4 text-blue-500" />;
    if (type === 'fixed') return <DollarSign className="h-4 w-4 text-purple-500" />;
    return <Info className="h-4 w-4 text-rd-gray-500" />;
  };

  const panel = (
    <div className="w-full rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
      <div className="p-4 border-b border-border bg-rd-nude/50">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-rd-gray-800">Notificaciones</h3>
          {unreadCount > 0 && (
            <button
              type="button"
              className="text-xs font-medium text-rd-calm-green hover:text-rd-calm-green/80 flex items-center gap-1 transition-colors"
              onClick={markAll}
              disabled={isPending}
            >
              <CheckCheck className="h-3 w-3" />
              Marcar todo
            </button>
          )}
        </div>

        <div className="mt-3 flex p-1 bg-white rounded-xl border border-border/50">
          <button
            onClick={() => setFilter('all')}
            className={cn(
              'flex-1 text-xs font-medium py-2 rounded-lg transition-all duration-200',
              filter === 'all'
                ? 'bg-rd-gray-100 text-rd-gray-800 shadow-sm'
                : 'text-rd-gray-500 hover:text-rd-gray-700'
            )}
          >
            Todas
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={cn(
              'flex-1 text-xs font-medium py-2 rounded-lg transition-all duration-200',
              filter === 'unread'
                ? 'bg-rd-gray-100 text-rd-gray-800 shadow-sm'
                : 'text-rd-gray-500 hover:text-rd-gray-700'
            )}
          >
            No leídas
          </button>
        </div>
      </div>

      <div className="max-h-[calc(100dvh-14rem)] overflow-y-auto p-2 space-y-1.5 md:max-h-[60vh]">
        {filtered.length === 0 && (
          <div className="py-12 flex flex-col items-center justify-center text-rd-gray-500">
            <Inbox className="h-10 w-10 opacity-30 mb-2" />
            <p className="text-xs font-medium">No tienes notificaciones</p>
          </div>
        )}

        {filtered.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => markOne(item.id, !!item.readAt)}
            className={cn(
              'w-full relative group flex gap-3 rounded-xl p-3.5 text-left transition-all duration-200',
              'hover:bg-rd-gray-100 border',
              !item.readAt ? 'bg-rd-rose-soft/30 border-rd-rose/30' : 'bg-transparent border-transparent opacity-60'
            )}
          >
            <div className="mt-0.5 shrink-0 h-9 w-9 rounded-full bg-white border border-border/60 flex items-center justify-center shadow-sm">
              {getIcon(item.type, item.severity)}
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn('text-xs font-semibold leading-tight', !item.readAt ? 'text-rd-gray-800' : 'text-rd-gray-600')}>
                {item.title}
              </p>
              <p className="mt-1.5 text-xs text-rd-gray-500 line-clamp-2 leading-relaxed">{item.body}</p>
              <p className="mt-2 text-[10px] text-rd-gray-400 font-medium">
                {new Intl.RelativeTimeFormat('es', { numeric: 'auto' }).format(
                  -Math.ceil((Date.now() - new Date(item.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
                  'day'
                )}
              </p>
            </div>
            {!item.readAt && <div className="absolute right-3.5 top-3.5 h-2 w-2 rounded-full bg-rd-rose shadow-sm" />}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="relative z-50">
      <button
        type="button"
        className={cn(
          'relative inline-flex h-10 w-10 items-center justify-center rounded-xl',
          'border border-border bg-card transition-all duration-200',
          'hover:bg-rd-gray-100 hover:scale-105',
          'active:scale-95'
        )}
        onClick={() => setOpen((v) => !v)}
      >
        <Bell className="h-4.5 w-4.5 text-rd-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-rd-rose px-1 text-xs font-bold text-white shadow-md border-2 border-card">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Desktop dropdown */}
          <div className="absolute right-0 mt-3 hidden w-96 md:block">{panel}</div>

          {/* Mobile portal so it can never be clipped by layout/overflow/transform */}
          {mounted &&
            createPortal(
              <>
                <div
                  className="fixed inset-0 z-[60] bg-black/10 backdrop-blur-[2px] md:hidden"
                  onClick={() => setOpen(false)}
                />
                <div className="fixed inset-x-0 z-[70] px-4 md:hidden" style={{ top: 'calc(env(safe-area-inset-top) + 5rem)' }}>
                  <div className="mx-auto w-full max-w-[420px]">{panel}</div>
                </div>
              </>,
              document.body
            )}
        </>
      )}
    </div>
  );
}
