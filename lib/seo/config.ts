/**
 * Configuración centralizada de SEO para Calma Gest.
 * Cambiar SITE_URL aquí propaga el dominio a metadata, sitemap, robots y JSON-LD.
 */

export const SITE_CONFIG = {
  name: 'Calma Gest',
  shortName: 'Calma Gest',
  url: 'https://calmagest.rosadeliacabrera.com',
  description:
    'Controla tu dinero sin que el dinero te controle a ti. Calma Gest es la app de finanzas personales y familiares que combina presupuesto, gastos compartidos, ahorro y un coach financiero con IA para reducir tu ansiedad económica.',
  shortDescription: 'Finanzas personales y familiares sin ansiedad. Presupuesto, gastos compartidos y coach IA.',
  locale: 'es_ES',
  alternateLocales: ['es-ES', 'es-MX', 'es-AR', 'es-CO', 'es'],
  language: 'es',
  themeColor: '#070C18',
  backgroundColor: '#070C18',

  // Branding / autor
  creator: 'Calma Gest',
  publisher: 'Calma Gest',

  // Redes sociales (placeholders hasta que se creen las cuentas reales)
  social: {
    twitter: '@calmagest',
    twitterCardType: 'summary_large_image' as const
  },

  // Keywords core del producto (España + LATAM)
  keywords: [
    // España
    'gestión de gastos familiares',
    'finanzas personales sin estrés',
    'app presupuesto familiar',
    'control de gastos en pareja',
    'ahorro familiar app',
    'app finanzas familia España',
    'gestionar dinero en casa',
    'reparto de gastos compartidos',
    'fondo común familiar app',
    'bienestar financiero',
    'salud financiera personal',
    'coach financiero IA',
    // LATAM (términos genéricos en español)
    'presupuesto familiar app',
    'control de gastos personales',
    'app para ahorrar dinero',
    'finanzas en pareja',
    'gastos compartidos app',
    'organizar finanzas del hogar',
    'app de presupuesto en español',
    'control financiero familiar'
  ],

  // Imagen OG por defecto (1200x630, requisito estándar)
  ogImage: '/opengraph-image',
  ogImageAlt: 'Calma Gest — Controla tu dinero sin que el dinero te controle',

  // Datos de organización para JSON-LD
  organization: {
    legalName: 'Calma Gest',
    foundingYear: '2026',
    logo: '/CalmaGest512.png'
  }
} as const;

export function absoluteUrl(path: string = ''): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_CONFIG.url}${cleanPath === '/' ? '' : cleanPath}`;
}
