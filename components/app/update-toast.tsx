'use client';

import { useEffect, useState } from 'react';
import { Workbox } from 'workbox-window';
import { Button } from '@/components/ui/button';
import { isBrowser } from '@/lib/services/pwaService';

export function UpdateToast() {
  const [ready, setReady] = useState(false);
  const [wb, setWb] = useState<Workbox | null>(null);

  useEffect(() => {
    if (!isBrowser() || !('serviceWorker' in navigator)) return;
    if (process.env.NODE_ENV === 'development') return;

    const workbox = new Workbox('/sw.js');
    workbox.addEventListener('waiting', () => {
      setWb(workbox);
      setReady(true);
    });
    workbox.register().catch(() => {
      // ignore in environments where SW is not available
    });
  }, []);

  const reload = () => {
    if (!wb) return;
    wb.messageSkipWaiting();
    wb.addEventListener('controlling', () => {
      window.location.reload();
    });
  };

  if (!ready) return null;

  return (
    <div className="fixed bottom-6 left-1/2 z-[60] w-[90%] max-w-md -translate-x-1/2 rounded-2xl border border-border bg-card px-4 py-3 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm">Hay una actualizacion - Recargar</div>
        <Button onClick={reload}>Recargar</Button>
      </div>
    </div>
  );
}
