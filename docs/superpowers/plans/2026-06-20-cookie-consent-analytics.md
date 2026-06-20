# Cookie Consent Analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bloquear Google Analytics 4 hasta que la usuaria acepte la analítica y mostrar un banner inferior de consentimiento con preferencias mínimas.

**Architecture:** La lógica de consentimiento vivirá en una utilidad compartida de cliente para centralizar lectura, escritura y estado por defecto. El layout raíz montará dos componentes cliente: uno para mostrar el banner y otro para inyectar GA4 únicamente cuando el consentimiento guardado sea `granted`.

**Tech Stack:** Next.js App Router, React 19, TypeScript, `next/script`, `localStorage`, TailwindCSS

---

### Task 1: Crear la capa de consentimiento compartida

**Files:**
- Create: `lib/analytics/consent.ts`

- [ ] **Step 1: Write the failing test**

No hay infraestructura de tests de UI/DOM en el repo para cubrir `localStorage` de forma fiable sin introducir nuevas dependencias. Para esta tarea, sustituir TDD automatizado por verificación manual dirigida y mantener la lógica en helpers puros y pequeños.

- [ ] **Step 2: Write minimal implementation**

Crear `lib/analytics/consent.ts` con este contenido:

```ts
export const CONSENT_STORAGE_KEY = 'calmagest-consent';

export type ConsentStatus = 'pending' | 'granted' | 'denied';

export type ConsentState = {
  necessary: true;
  analytics: ConsentStatus;
  updatedAt: string;
};

export const defaultConsentState = (): ConsentState => ({
  necessary: true,
  analytics: 'pending',
  updatedAt: new Date(0).toISOString()
});

export function isConsentState(value: unknown): value is ConsentState {
  if (!value || typeof value !== 'object') return false;

  const candidate = value as Partial<ConsentState>;

  return (
    candidate.necessary === true &&
    (candidate.analytics === 'pending' ||
      candidate.analytics === 'granted' ||
      candidate.analytics === 'denied') &&
    typeof candidate.updatedAt === 'string'
  );
}

export function readConsent(): ConsentState {
  if (typeof window === 'undefined') {
    return defaultConsentState();
  }

  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return defaultConsentState();

    const parsed: unknown = JSON.parse(raw);
    return isConsentState(parsed) ? parsed : defaultConsentState();
  } catch {
    return defaultConsentState();
  }
}

export function writeConsent(analytics: Exclude<ConsentStatus, 'pending'>): ConsentState {
  const nextState: ConsentState = {
    necessary: true,
    analytics,
    updatedAt: new Date().toISOString()
  };

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(nextState));
    } catch {
      // Ignore storage failures and keep the in-memory state.
    }
  }

  return nextState;
}
```

- [ ] **Step 3: Run targeted verification**

Run: `Get-Content -Raw lib\analytics\consent.ts`
Expected: aparecen `CONSENT_STORAGE_KEY`, `defaultConsentState`, `readConsent` y `writeConsent` con los tipos esperados.

- [ ] **Step 4: Commit**

```bash
git add lib/analytics/consent.ts
git commit -m "feat: add consent storage helpers"
```

### Task 2: Extraer la carga de GA4 a un componente condicional

**Files:**
- Create: `components/analytics/google-analytics.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Write the failing test**

No hay harness de render React en el proyecto para validar render condicional de `next/script`. Hacer verificación manual directa en navegador y revisión de marcado generado.

- [ ] **Step 2: Write minimal implementation**

Crear `components/analytics/google-analytics.tsx` con este contenido:

```tsx
'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { readConsent } from '@/lib/analytics/consent';

const googleAnalyticsId = process.env.NEXT_PUBLIC_GA_ID;

export function GoogleAnalytics() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const sync = () => {
      const consent = readConsent();
      setEnabled(consent.analytics === 'granted');
    };

    sync();
    window.addEventListener('calmagest:consent-changed', sync);

    return () => {
      window.removeEventListener('calmagest:consent-changed', sync);
    };
  }, []);

  if (!googleAnalyticsId || !enabled) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${googleAnalyticsId}');
        `}
      </Script>
    </>
  );
}
```

Actualizar `app/layout.tsx` para eliminar la inyección directa actual de GA4, eliminar el `import Script from 'next/script'` si deja de ser necesario en ese archivo y montar `<GoogleAnalytics />` dentro de `<body>` antes de `</body>`.

- [ ] **Step 3: Run targeted verification**

Run: `Get-Content -Raw app\layout.tsx`
Expected: el layout ya no contiene el bloque inline de GA4 y monta `GoogleAnalytics`.

Run: `Get-Content -Raw components\analytics\google-analytics.tsx`
Expected: el componente usa `readConsent()` y solo devuelve scripts cuando `enabled` es `true`.

- [ ] **Step 4: Commit**

```bash
git add app/layout.tsx components/analytics/google-analytics.tsx
git commit -m "feat: gate google analytics behind consent"
```

### Task 3: Implementar el banner inferior y la configuración mínima

**Files:**
- Create: `components/analytics/consent-banner.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Write the failing test**

La verificación será manual porque el repo no tiene pruebas de interacción cliente. El criterio de fallo inicial es: con `localStorage` vacío no existe ningún banner de consentimiento.

- [ ] **Step 2: Write minimal implementation**

Crear `components/analytics/consent-banner.tsx` con este contenido:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { defaultConsentState, readConsent, writeConsent, type ConsentState } from '@/lib/analytics/consent';

function notifyConsentChanged() {
  window.dispatchEvent(new Event('calmagest:consent-changed'));
}

export function ConsentBanner() {
  const [mounted, setMounted] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [consent, setConsent] = useState<ConsentState>(defaultConsentState);

  useEffect(() => {
    setConsent(readConsent());
    setMounted(true);
  }, []);

  if (!mounted || consent.analytics !== 'pending' && !expanded) {
    if (consent.analytics !== 'pending') {
      return null;
    }
  }

  const acceptAll = () => {
    setConsent(writeConsent('granted'));
    notifyConsentChanged();
  };

  const rejectAll = () => {
    setConsent(writeConsent('denied'));
    notifyConsentChanged();
  };

  const savePreferences = () => {
    setConsent(writeConsent(consent.analytics === 'denied' ? 'denied' : 'granted'));
    setExpanded(false);
    notifyConsentChanged();
  };

  return (
    <div className="fixed inset-x-0 bottom-4 z-50 px-4">
      <div className="mx-auto max-w-4xl rounded-3xl border border-border bg-background/95 p-5 shadow-2xl backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-foreground">Tu privacidad, primero.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Usamos cookies necesarias para que la app funcione y analítica para entender qué mejorar.
              Puedes aceptar, rechazar o configurar la analítica.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
            >
              Configurar
            </button>
            <button
              type="button"
              onClick={rejectAll}
              className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
            >
              Rechazar
            </button>
            <button
              type="button"
              onClick={acceptAll}
              className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition hover:opacity-90"
            >
              Aceptar
            </button>
          </div>
        </div>

        {expanded ? (
          <div className="mt-4 rounded-2xl border border-border bg-muted/40 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-foreground">Analítica</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Nos ayuda a medir uso y mejorar la experiencia sin afectar a la funcionalidad básica.
                </p>
              </div>

              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <input
                  type="checkbox"
                  checked={consent.analytics === 'granted'}
                  onChange={(event) =>
                    setConsent((current) => ({
                      ...current,
                      analytics: event.target.checked ? 'granted' : 'denied'
                    }))
                  }
                />
                Activar
              </label>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={savePreferences}
                className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition hover:opacity-90"
              >
                Guardar preferencias
              </button>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
```

Actualizar `app/layout.tsx` para montar `<ConsentBanner />` dentro de `<body>`, junto a `GoogleAnalytics`.

- [ ] **Step 3: Run targeted verification**

Run: `Get-Content -Raw components\analytics\consent-banner.tsx`
Expected: existen acciones `Aceptar`, `Rechazar`, `Configurar` y la preferencia `analytics`.

Run: `Get-Content -Raw app\layout.tsx`
Expected: el layout monta `ConsentBanner` globalmente.

- [ ] **Step 4: Commit**

```bash
git add app/layout.tsx components/analytics/consent-banner.tsx
git commit -m "feat: add cookie consent banner"
```

### Task 4: Ajustar la sincronización y el comportamiento de cierre

**Files:**
- Modify: `components/analytics/consent-banner.tsx`
- Modify: `lib/analytics/consent.ts`

- [ ] **Step 1: Write the failing test**

Verificación manual dirigida: tras aceptar o rechazar, el banner debe desaparecer inmediatamente y GA4 debe cambiar de estado sin recargar.

- [ ] **Step 2: Write minimal implementation**

Hacer estos ajustes si no quedaron resueltos en la primera versión:

- Asegurar que `writeConsent()` guarda `updatedAt`.
- Asegurar que el banner retorna `null` cuando el estado almacenado ya no es `pending`.
- Asegurar que el evento `calmagest:consent-changed` se dispara en aceptar, rechazar y guardar preferencias.
- Asegurar que el panel `Configurar` no reaparece tras guardar o rechazar.

- [ ] **Step 3: Run targeted verification**

Verificar manualmente en navegador:

1. Abrir la home con `localStorage.removeItem('calmagest-consent')`.
2. Confirmar que el banner aparece abajo.
3. Pulsar `Rechazar`.
4. Confirmar que el banner desaparece.
5. Recargar y confirmar que no reaparece.
6. Borrar el storage y repetir con `Aceptar`.
7. Confirmar en DevTools que se inyecta `gtag/js` solo tras aceptar.

- [ ] **Step 4: Commit**

```bash
git add components/analytics/consent-banner.tsx lib/analytics/consent.ts
git commit -m "fix: sync consent updates across banner and analytics"
```

### Task 5: Documentar la variable pública y verificar el flujo final

**Files:**
- Modify: `.env.example`
- Modify: `README.md`

- [ ] **Step 1: Write the failing test**

No aplica test automatizado. La verificación se hará comprobando que la documentación refleja el comportamiento real.

- [ ] **Step 2: Write minimal implementation**

Actualizar `README.md` con una nota breve en la sección de configuración indicando:

- que `NEXT_PUBLIC_GA_ID` habilita GA4,
- que el script no se carga hasta aceptar consentimiento,
- y que si se deja vacío no se inyecta analítica.

Mantener `.env.example` con `NEXT_PUBLIC_GA_ID=""`.

- [ ] **Step 3: Run full verification**

Run: `git diff -- app/layout.tsx components/analytics/consent-banner.tsx components/analytics/google-analytics.tsx lib/analytics/consent.ts .env.example README.md`
Expected: el diff muestra solo los cambios de consentimiento y GA4.

Verificación manual final:

1. `localStorage.removeItem('calmagest-consent')`
2. Cargar página.
3. Confirmar banner visible y ausencia de request a `gtag/js`.
4. Aceptar.
5. Confirmar desaparición del banner y presencia de request a `gtag/js`.
6. Recargar.
7. Confirmar persistencia de la decisión.

- [ ] **Step 4: Commit**

```bash
git add .env.example README.md app/layout.tsx components/analytics/consent-banner.tsx components/analytics/google-analytics.tsx lib/analytics/consent.ts
git commit -m "docs: document analytics consent setup"
```
