'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  defaultConsentState,
  notifyConsentChanged,
  readConsent,
  writeConsent,
  type ConsentState
} from '@/lib/analytics/consent';

export function ConsentBanner() {
  const [mounted, setMounted] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [consent, setConsent] = useState<ConsentState>(defaultConsentState);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);

  useEffect(() => {
    const storedConsent = readConsent();
    setConsent(storedConsent);
    setAnalyticsEnabled(storedConsent.analytics === 'granted');
    setMounted(true);
  }, []);

  const acceptAll = () => {
    setConsent(writeConsent('granted'));
    setExpanded(false);
    notifyConsentChanged();
  };

  const rejectAll = () => {
    setConsent(writeConsent('denied'));
    setExpanded(false);
    notifyConsentChanged();
  };

  const savePreferences = () => {
    const nextAnalytics = analyticsEnabled ? 'granted' : 'denied';
    setConsent(writeConsent(nextAnalytics));
    setExpanded(false);
    notifyConsentChanged();
  };

  if (!mounted || consent.analytics !== 'pending') {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-4 z-50 px-4 sm:px-6">
      <Card
        variant="glass"
        className="mx-auto max-w-5xl rounded-[2rem] border-border/70 bg-background/95 p-5 shadow-2xl"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-foreground">Tu privacidad, primero.</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Usamos cookies necesarias para que la app funcione y analítica para entender qué mejorar.
              Puedes aceptar, rechazar o configurar la analítica.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setAnalyticsEnabled(consent.analytics === 'granted');
                setExpanded((value) => !value);
              }}
            >
              Configurar
            </Button>
            <Button type="button" variant="default" onClick={rejectAll}>
              Rechazar
            </Button>
            <Button type="button" variant="primary" onClick={acceptAll}>
              Aceptar
            </Button>
          </div>
        </div>

        {expanded ? (
          <div className="mt-4 rounded-[1.5rem] border border-border/70 bg-card/70 p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold text-foreground">Analítica</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Nos ayuda a medir uso y mejorar la experiencia sin afectar a la funcionalidad básica.
                </p>
              </div>

              <label className="flex items-center gap-3 rounded-full border border-border/70 bg-background/80 px-4 py-2 text-sm font-medium text-foreground">
                <input
                  type="checkbox"
                  checked={analyticsEnabled}
                  onChange={(event) => setAnalyticsEnabled(event.target.checked)}
                  className="h-4 w-4 accent-current"
                />
                Activar
              </label>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button type="button" variant="primary" onClick={savePreferences}>
                Guardar preferencias
              </Button>
              <Button type="button" variant="ghost" onClick={() => setExpanded(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
