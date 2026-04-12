'use client';

import { useState, useTransition } from 'react';
import { upsertNotificationPreference } from '@/lib/actions/notificationPreferenceActions';

const TYPES = [
  { key: 'health', label: 'Salud del mes' },
  { key: 'savings', label: 'Ahorro' },
  { key: 'investment', label: 'Inversion' },
  { key: 'goals', label: 'Objetivos' },
  { key: 'fixed', label: 'Fijos por categoria' },
  { key: 'weekly_summary', label: 'Resumen semanal' }
];

const CHANNELS = [
  { key: 'in_app', label: 'In-app' },
  { key: 'email', label: 'Email' },
  { key: 'push', label: 'Push' }
];

type Preference = {
  type: string;
  channel: string;
  enabled: boolean;
};

export function NotificationPreferences({ items }: { items: Preference[] }) {
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    items.forEach((p) => {
      map[`${p.type}:${p.channel}`] = p.enabled;
    });
    return map;
  });

  const toggle = (type: string, channel: string) => {
    const key = `${type}:${channel}`;
    const next = !state[key];
    setState((prev) => ({ ...prev, [key]: next }));
    startTransition(async () => {
      await upsertNotificationPreference({ type, channel, enabled: next });
    });
  };

  return (
    <div className="grid gap-3">
      {TYPES.map((t) => (
        <div key={t.key} className="rounded-2xl border border-border bg-card px-4 py-3">
          <div className="text-sm font-medium">{t.label}</div>
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
            {CHANNELS.map((c) => {
              const key = `${t.key}:${c.key}`;
              const checked = state[key] ?? (c.key === 'in_app');
              return (
                <label key={c.key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(t.key, c.key)}
                    disabled={isPending}
                  />
                  {c.label}
                </label>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
