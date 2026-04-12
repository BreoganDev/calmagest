'use client';

import { useMemo, useState, useTransition } from 'react';
import { Bell } from 'lucide-react';
import type { Notification } from '@prisma/client';
import { readAllNotifications, readNotification } from '@/lib/actions/notificationActions';
import { cn } from '@/lib/utils';

type NotificationView = Pick<Notification, 'id' | 'title' | 'body' | 'severity' | 'readAt' | 'createdAt'>;

export function NotificationBell({
  items,
  unreadCount
}: {
  items: NotificationView[];
  unreadCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const sorted = useMemo(
    () => [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [items]
  );

  const markAll = () => {
    startTransition(async () => {
      await readAllNotifications();
    });
  };

  const markOne = (id: string) => {
    startTransition(async () => {
      await readNotification(id);
    });
  };

  return (
    <div className="relative">
      <button
        type="button"
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card"
        onClick={() => setOpen((v) => !v)}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-rd-rose px-1 text-xs font-medium text-rd-text">
            {unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-border bg-card p-3 shadow-soft">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Notificaciones</div>
            <button
              type="button"
              className="text-xs text-muted-foreground"
              onClick={markAll}
              disabled={isPending}
            >
              Marcar todo
            </button>
          </div>
          <div className="mt-3 grid gap-2">
            {sorted.length === 0 && (
              <div className="text-xs text-muted-foreground">Sin alertas por ahora.</div>
            )}
            {sorted.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => markOne(item.id)}
                className={cn(
                  'rounded-2xl border border-border px-3 py-2 text-left text-xs',
                  item.severity === 'critical' && 'border-rd-rose-deep/40 bg-rd-rose-soft/40',
                  item.severity === 'warning' && 'border-rd-rose/40 bg-rd-rose-soft/30',
                  item.readAt ? 'opacity-70' : 'opacity-100'
                )}
              >
                <div className="font-medium">{item.title}</div>
                <div className="text-muted-foreground">{item.body}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
