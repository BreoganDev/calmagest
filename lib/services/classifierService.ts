
export type Suggestion = {
  category: string;
  isFixed: boolean;
  importance: 'VITAL' | 'NEUTRO' | 'SUPERFLUO';
  reason: string;
};

const baseRules: Array<{ keywords: string[]; category: string; isFixed: boolean; importance: Suggestion['importance']; reason: string; }> = [
  // VIVIENDA (Vital, Fijo)
  { keywords: ['alquiler', 'rent', 'arrendamiento'], category: 'Vivienda', isFixed: true, importance: 'VITAL', reason: 'Alquiler' },
  { keywords: ['hipoteca', 'mortgage', 'prestamo hipotecario'], category: 'Vivienda', isFixed: true, importance: 'VITAL', reason: 'Hipoteca' },
  { keywords: ['comunidad', 'comunidad de propietarios'], category: 'Vivienda', isFixed: true, importance: 'VITAL', reason: 'Comunidad' },
  { keywords: ['seguro hogar', 'seguro casa', 'seguro vivienda'], category: 'Vivienda', isFixed: true, importance: 'NEUTRO', reason: 'Seguro' },

  // SERVICIOS BÁSICOS (Vital, Fijo)
  { keywords: ['luz', 'electricidad', 'endesa', 'iberdrola', 'naturgy'], category: 'Servicios', isFixed: true, importance: 'VITAL', reason: 'Electricidad' },
  { keywords: ['agua', 'aqualia', 'canal isabel'], category: 'Servicios', isFixed: true, importance: 'VITAL', reason: 'Agua' },
  { keywords: ['gas', 'gas natural', 'butano'], category: 'Servicios', isFixed: true, importance: 'VITAL', reason: 'Gas' },

  // TELECOMUNICACIONES (Neutro, Fijo)
  { keywords: ['internet', 'fibra', 'adsl', 'wifi'], category: 'Internet/Móvil', isFixed: true, importance: 'NEUTRO', reason: 'Internet' },
  { keywords: ['telefono', 'movil', 'movistar', 'vodafone', 'orange', 'yoigo', 'jazztel', 'masmovil'], category: 'Internet/Móvil', isFixed: true, importance: 'NEUTRO', reason: 'Telefonía' },

  // ALIMENTACIÓN (Vital, Variable)
  { keywords: ['super', 'supermercado', 'mercadona', 'carrefour', 'lidl', 'aldi', 'dia', 'eroski'], category: 'Alimentación', isFixed: false, importance: 'VITAL', reason: 'Supermercado' },
  { keywords: ['hiperdino', 'hiper dino', 'hd '], category: 'Alimentación', isFixed: false, importance: 'VITAL', reason: 'Supermercado' },
  { keywords: ['panaderia', 'fruteria', 'carniceria', 'pescaderia'], category: 'Alimentación', isFixed: false, importance: 'VITAL', reason: 'Alimentación fresca' },
  { keywords: ['restaurante', 'bar', 'cafeteria', 'comida', 'cena'], category: 'Restaurantes', isFixed: false, importance: 'SUPERFLUO', reason: 'Restauración' },
  { keywords: ['mcdonalds', 'burger king', 'kfc', 'dominos', 'telepizza'], category: 'Restaurantes', isFixed: false, importance: 'SUPERFLUO', reason: 'Comida rápida' },

  // TRANSPORTE (Neutro, Mixto)
  { keywords: ['gasolina', 'diesel', 'combustible', 'repsol', 'cepsa', 'bp'], category: 'Transporte', isFixed: false, importance: 'NEUTRO', reason: 'Combustible' },
  { keywords: ['parking', 'aparcamiento', 'garaje'], category: 'Transporte', isFixed: true, importance: 'NEUTRO', reason: 'Parking' },
  { keywords: ['uber', 'cabify', 'bolt', 'taxi'], category: 'Transporte', isFixed: false, importance: 'NEUTRO', reason: 'Taxi' },
  { keywords: ['metro', 'bus', 'autobus', 'tren', 'renfe', 'cercanias'], category: 'Transporte', isFixed: false, importance: 'NEUTRO', reason: 'Transporte público' },
  { keywords: ['seguro coche', 'seguro auto', 'seguro vehiculo'], category: 'Transporte', isFixed: true, importance: 'NEUTRO', reason: 'Seguro' },
  { keywords: ['itv', 'revision', 'taller', 'mecanico'], category: 'Transporte', isFixed: false, importance: 'NEUTRO', reason: 'Mantenimiento' },

  // SALUD (Vital/Neutro, Mixto)
  { keywords: ['farmacia', 'medicamento', 'medicina'], category: 'Salud', isFixed: false, importance: 'VITAL', reason: 'Farmacia' },
  { keywords: ['medico', 'doctor', 'clinica', 'hospital'], category: 'Salud', isFixed: false, importance: 'VITAL', reason: 'Atención médica' },
  { keywords: ['seguro medico', 'seguro salud', 'sanitas', 'adeslas'], category: 'Salud', isFixed: true, importance: 'NEUTRO', reason: 'Seguro médico' },
  { keywords: ['dentista', 'odontologo'], category: 'Salud', isFixed: false, importance: 'NEUTRO', reason: 'Dental' },
  { keywords: ['gimnasio', 'gym', 'fitness'], category: 'Salud', isFixed: true, importance: 'NEUTRO', reason: 'Deporte' },

  // SUSCRIPCIONES (Superfluo, Fijo)
  { keywords: ['netflix', 'hbo', 'disney', 'amazon prime', 'apple tv'], category: 'Suscripciones', isFixed: true, importance: 'SUPERFLUO', reason: 'Streaming' },
  { keywords: ['spotify', 'apple music', 'youtube premium'], category: 'Suscripciones', isFixed: true, importance: 'SUPERFLUO', reason: 'Música' },
  { keywords: ['playstation', 'xbox', 'nintendo'], category: 'Suscripciones', isFixed: true, importance: 'SUPERFLUO', reason: 'Gaming' },

  // EDUCACIÓN (Neutro, Mixto)
  { keywords: ['colegio', 'escuela', 'universidad', 'matricula'], category: 'Educación', isFixed: true, importance: 'NEUTRO', reason: 'Educación' },
  { keywords: ['libros', 'libreria', 'material escolar'], category: 'Educación', isFixed: false, importance: 'NEUTRO', reason: 'Material' },
  { keywords: ['academia', 'curso', 'formacion'], category: 'Educación', isFixed: false, importance: 'NEUTRO', reason: 'Formación' },

  // ROPA Y CALZADO (Superfluo, Variable)
  { keywords: ['zara', 'h&m', 'mango', 'pull bear', 'bershka'], category: 'Ropa', isFixed: false, importance: 'SUPERFLUO', reason: 'Moda' },
  { keywords: ['zapateria', 'zapatos', 'calzado'], category: 'Ropa', isFixed: false, importance: 'SUPERFLUO', reason: 'Calzado' },

  // HOGAR (Neutro, Variable)
  { keywords: ['ikea', 'leroy merlin', 'bricomart'], category: 'Hogar', isFixed: false, importance: 'NEUTRO', reason: 'Mobiliario' },
  { keywords: ['electrodomestico', 'media markt', 'worten'], category: 'Hogar', isFixed: false, importance: 'NEUTRO', reason: 'Electrodomésticos' },
  { keywords: ['limpieza', 'detergente', 'lejia'], category: 'Hogar', isFixed: false, importance: 'NEUTRO', reason: 'Limpieza' },

  // OCIO Y ENTRETENIMIENTO (Superfluo, Variable)
  { keywords: ['cine', 'teatro', 'concierto', 'entradas'], category: 'Ocio', isFixed: false, importance: 'SUPERFLUO', reason: 'Entretenimiento' },
  { keywords: ['viaje', 'hotel', 'airbnb', 'booking'], category: 'Ocio', isFixed: false, importance: 'SUPERFLUO', reason: 'Viajes' },
  { keywords: ['regalo', 'cumpleaños'], category: 'Ocio', isFixed: false, importance: 'SUPERFLUO', reason: 'Regalos' },

  // MASCOTAS (Neutro, Mixto)
  { keywords: ['veterinario', 'mascota', 'perro', 'gato'], category: 'Mascotas', isFixed: false, importance: 'NEUTRO', reason: 'Veterinario' },
  { keywords: ['pienso', 'comida mascota'], category: 'Mascotas', isFixed: false, importance: 'NEUTRO', reason: 'Alimentación' },

  // SEGUROS (Neutro, Fijo)
  { keywords: ['seguro vida', 'seguro decesos'], category: 'Seguros', isFixed: true, importance: 'NEUTRO', reason: 'Seguro de vida' },

  // IMPUESTOS Y TASAS (Vital, Fijo)
  { keywords: ['impuesto', 'tasa', 'hacienda', 'iva', 'irpf'], category: 'Impuestos', isFixed: true, importance: 'VITAL', reason: 'Impuestos' },
  { keywords: ['multa', 'sancion'], category: 'Impuestos', isFixed: false, importance: 'NEUTRO', reason: 'Multas' },

  // TECNOLOGÍA (Superfluo, Variable)
  { keywords: ['amazon', 'ebay', 'aliexpress'], category: 'Compras Online', isFixed: false, importance: 'SUPERFLUO', reason: 'E-commerce' },
  { keywords: ['apple', 'samsung', 'xiaomi', 'huawei'], category: 'Tecnología', isFixed: false, importance: 'SUPERFLUO', reason: 'Electrónica' },
];

export function suggestClassification(name: string): Suggestion | null {
  const text = name.toLowerCase();
  if (!text.trim()) return null;

  for (const rule of baseRules) {
    if (rule.keywords.some((k) => text.includes(k))) {
      return {
        category: rule.category,
        isFixed: rule.isFixed,
        importance: rule.importance,
        reason: rule.reason
      };
    }
  }

  return {
    category: 'Variable',
    isFixed: false,
    importance: 'NEUTRO',
    reason: 'General'
  };
}
