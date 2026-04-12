export const PREDEFINED_CATEGORIES = [
  { name: 'Vivienda', icon: '🏠', color: 'blue', importance: 'VITAL' },
  { name: 'Alimentación', icon: '🍕', color: 'green', importance: 'VITAL' },
  { name: 'Transporte', icon: '🚗', color: 'purple', importance: 'VITAL' },
  { name: 'Servicios', icon: '⚡', color: 'yellow', importance: 'VITAL' },
  { name: 'Internet/Móvil', icon: '📱', color: 'cyan', importance: 'NEUTRO' },
  { name: 'Salud', icon: '💊', color: 'red', importance: 'VITAL' },
  { name: 'Educación', icon: '📚', color: 'indigo', importance: 'NEUTRO' },
  { name: 'Hogar', icon: '🏡', color: 'slate', importance: 'NEUTRO' },
  { name: 'Mascotas', icon: '🐕', color: 'amber', importance: 'NEUTRO' },
  { name: 'Seguros', icon: '💰', color: 'emerald', importance: 'NEUTRO' },
  { name: 'Impuestos', icon: '📄', color: 'gray', importance: 'VITAL' },
  { name: 'Ropa', icon: '👕', color: 'pink', importance: 'SUPERFLUO' },
  { name: 'Ocio', icon: '🎬', color: 'violet', importance: 'SUPERFLUO' },
  { name: 'Suscripciones', icon: '📺', color: 'rose', importance: 'SUPERFLUO' },
  { name: 'Compras Online', icon: '🛒', color: 'orange', importance: 'SUPERFLUO' },
  { name: 'Restaurantes', icon: '🍔', color: 'lime', importance: 'SUPERFLUO' },
  { name: 'Tecnología', icon: '💻', color: 'sky', importance: 'SUPERFLUO' },
  { name: 'Variable', icon: '✨', color: 'slate', importance: 'NEUTRO' }
] as const;

export type PredefinedCategory = (typeof PREDEFINED_CATEGORIES)[number];
