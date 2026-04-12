'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushSettings({ publicKey }: { publicKey: string }) {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const ok = 'serviceWorker' in navigator && 'PushManager' in window;
    setSupported(ok);
    setPermission(Notification.permission);
  }, []);

  const subscribe = async () => {
    if (!supported || !publicKey) return;
    setLoading(true);
    try {
      await navigator.serviceWorker.register('/push-sw.js', { scope: '/' });
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub)
      });

      setIsSubscribed(true);
      setPermission(Notification.permission);
    } finally {
      setLoading(false);
    }
  };

  const test = async () => {
    await fetch('/api/push/test', { method: 'POST' });
  };

  if (!supported) {
    return <div className="text-xs text-muted-foreground">Push no disponible en este navegador.</div>;
  }

  return (
    <div className="grid gap-2">
      <div className="text-xs text-muted-foreground">Permiso: {permission}</div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={subscribe} disabled={loading}>
          Activar push
        </Button>
        <Button type="button" variant="ghost" onClick={test}>
          Enviar prueba
        </Button>
      </div>
      {isSubscribed && <div className="text-xs text-muted-foreground">Push activo.</div>}
    </div>
  );
}
