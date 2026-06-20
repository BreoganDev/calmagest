# Cookie Consent Analytics Design

## Objetivo

Añadir un sistema mínimo y extensible de consentimiento para cookies que bloquee Google Analytics 4 hasta que la usuaria acepte la analítica.

El sistema debe:

- Mostrar un banner fijo abajo en toda la aplicación.
- Permitir `Aceptar`, `Rechazar` y `Configurar`.
- Guardar la decisión en cliente con `localStorage`.
- Cargar GA4 solo cuando `analytics` esté en `granted`.
- Evitar dependencias externas y mantener una base fácil de ampliar.

## Alcance

Incluido en esta fase:

- Banner inferior global.
- Persistencia local del consentimiento.
- Panel simple de configuración dentro del propio banner.
- Carga condicional de GA4 basada en consentimiento.

Fuera de alcance en esta fase:

- CMP externa o integración con IAB TCF.
- Registro de consentimientos en backend.
- Geolocalización o reglas distintas por país.
- Gestión de más categorías aparte de analítica.
- Enlace dedicado de preferencias en footer o ajustes.

## Enfoque recomendado

Se implementará una solución interna ligera con estado local en cliente.

En lugar de cargar GA4 directamente desde el layout, se moverá la carga a un componente cliente responsable de:

1. Leer el estado de consentimiento guardado.
2. Decidir si se muestra el banner.
3. Inyectar GA4 solo si `analytics === 'granted'`.

Este enfoque evita disparar analítica antes de tiempo y deja una estructura lista para futuras categorías.

## Modelo de datos

Clave de almacenamiento:

`calmagest-consent`

Estructura:

```ts
type ConsentState = {
  necessary: true;
  analytics: 'pending' | 'granted' | 'denied';
  updatedAt: string;
};
```

Reglas:

- Si no existe valor en `localStorage`, el estado inicial será `pending`.
- `necessary` siempre será `true`.
- Solo `analytics` será configurable.

## Arquitectura

### 1. Componente cliente de Analytics

Se creará un componente, por ejemplo `components/analytics/google-analytics.tsx`, que:

- Lea `NEXT_PUBLIC_GA_ID`.
- Lea el consentimiento guardado.
- Inyecte `next/script` solo cuando haya ID y consentimiento `granted`.

Este componente reemplaza la lógica actual de inyección directa en el layout.

### 2. Banner de consentimiento

Se creará un componente cliente, por ejemplo `components/analytics/consent-banner.tsx`, que:

- Se monte globalmente desde `app/layout.tsx`.
- Muestre un banner fijo abajo.
- Permita aceptar o rechazar rápidamente.
- Abra un panel compacto de configuración al pulsar `Configurar`.

### 3. Utilidades de consentimiento

Se extraerá la lógica a una utilidad compartida, por ejemplo `lib/analytics/consent.ts`, para evitar duplicación. Esta capa contendrá:

- Tipos.
- Clave de almacenamiento.
- Estado por defecto.
- Helpers seguros de lectura y escritura.

## Comportamiento UX

### Estado inicial

- Si no hay consentimiento guardado, se muestra el banner.
- GA4 no carga.

### Aceptar

- Guarda `analytics: 'granted'`.
- Oculta el banner.
- Activa la carga de GA4 en esa misma sesión.

### Rechazar

- Guarda `analytics: 'denied'`.
- Oculta el banner.
- GA4 no carga.

### Configurar

- Despliega una vista compacta dentro del banner.
- Muestra la categoría `Analítica`.
- Permite guardar la preferencia sin forzar aceptación global.

## Diseño visual

El banner seguirá el lenguaje actual del proyecto:

- Fijo abajo, centrado y con buen padding.
- Fondo sólido con contraste alto.
- Bordes redondeados y sombra suave.
- Copy corto y claro.
- CTA principal más visible en `Aceptar`.
- `Rechazar` y `Configurar` con menor peso visual, pero claramente accionables.

No será modal ni bloqueante.

## Manejo de errores

- Si `localStorage` falla o devuelve datos corruptos, se usará el estado por defecto.
- Si no existe `NEXT_PUBLIC_GA_ID`, GA4 no se cargará aunque haya consentimiento.
- El banner seguirá funcionando aunque Analytics no esté configurado.

## Testing y verificación

Verificación mínima:

- Confirmar que con estado vacío aparece el banner.
- Confirmar que `Aceptar` guarda consentimiento y monta GA4.
- Confirmar que `Rechazar` guarda consentimiento y no monta GA4.
- Confirmar que recargar la página respeta la decisión previa.
- Confirmar que sin `NEXT_PUBLIC_GA_ID` no se inyecta GA4.

## Riesgos

- `localStorage` implica que el consentimiento es por navegador/dispositivo, no centralizado.
- Sin CMP externa no se cubren flujos avanzados de cumplimiento.
- Si en el futuro añades más trackers sin pasar por esta capa, romperías la garantía de bloqueo previo.

## Resultado esperado

El proyecto tendrá una base limpia de consentimiento que bloquea GA4 hasta aceptación explícita, sin añadir complejidad innecesaria y dejando preparado el crecimiento futuro.
