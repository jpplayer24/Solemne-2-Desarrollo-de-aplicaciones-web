// ============================================================================
// Base de datos local de 50 Mochilas con galería coherente por producto
// ============================================================================

const imagenesBase = [
  'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1581605405669-fcdf81165afa?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1546938576-6e6a64f317cc?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1577733966973-d680bffd2e80?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1491637639811-60e2756cc1c7?auto=format&fit=crop&w=800&q=80'
];

// Genera 4 vistas coherentes de la misma imagen (completa y recortes de detalle)
const generarGaleriaMismaMochila = (urlImagen) => [
  urlImagen,
  `${urlImagen}&crop=top&h=600`,
  `${urlImagen}&crop=bottom&h=600`,
  `${urlImagen}&crop=faces,entropy&h=600`
];

const categoriasConfig = [
  { tipo: 'Trekking', prefijo: 'Mochila Trekking', cat: 'Expedición / Outdoor', capacidades: [50, 55, 60, 65, 75], basePrecio: 79990, badge: 'Outdoor' },
  { tipo: 'Urbana', prefijo: 'Mochila Urbana', cat: 'Ciudad / Laptop 16"', capacidades: [18, 20, 22, 25, 28], basePrecio: 39990, badge: 'Impermeable' },
  { tipo: 'Táctica', prefijo: 'Mochila Táctica', cat: 'Militar / Cordura 1000D', capacidades: [30, 35, 40, 45, 50], basePrecio: 59990, badge: 'Ripstop' },
  { tipo: 'Montaña', prefijo: 'Mochila Alpina', cat: 'Alta Montaña / Nieve', capacidades: [45, 55, 65, 70, 80], basePrecio: 94990, badge: 'Térmica' },
  { tipo: 'Viaje', prefijo: 'Mochila Carry-On', cat: 'Cabina / Antirrobo', capacidades: [30, 35, 38, 40, 42], basePrecio: 54990, badge: 'Antirrobo' }
];

const sufijosModelo = [
  'Andina Pro', 'Stealth V2', 'Cordillera', 'Patagonia X', 'Nomad Lite',
  'Summit Elite', 'Glaciar', 'Atacama', 'Trailblazer', 'Vanguard'
];

const mochilasIniciales = [
  {
    id: 'mochila-trekking-65l',
    nombre: 'Mochila Trekking 65L Andina',
    categoria: 'Expedición / Outdoor',
    precio: 89990,
    capacidad_litros: 65,
    descripcion: 'Mochila de alta capacidad construida con Cordura Ripstop de 1000D, espalda ventilada y funda impermeable incluida.',
    stock_fisico: 12,
    stock_reservado: 2,
    badge: 'Más Vendida',
    imagenes: generarGaleriaMismaMochila(imagenesBase[0]),
    alt_imagenes: [
      'Vista frontal completa de la Mochila Trekking 65L Andina',
      'Detalle superior de asa reforzada y compartimento principal de la Mochila Trekking 65L Andina',
      'Detalle inferior de bolsillo frontal y base resistente de la Mochila Trekking 65L Andina',
      'Enfoque de textura y costuras selladas de la Mochila Trekking 65L Andina'
    ]
  },
  {
    id: 'mochila-urbana-25l',
    nombre: 'Mochila Urbana Stealth 25L',
    categoria: 'Ciudad / Laptop 16"',
    precio: 49990,
    capacidad_litros: 25,
    descripcion: 'Diseño minimalista hidrófugo con compartimento acolchado para notebook de hasta 16 pulgadas y puerto USB.',
    stock_fisico: 18,
    stock_reservado: 1,
    badge: 'Impermeable',
    imagenes: generarGaleriaMismaMochila(imagenesBase[1]),
    alt_imagenes: [
      'Vista frontal completa de la Mochila Urbana Stealth 25L',
      'Detalle superior de cierres y compartimento para laptop de la Mochila Urbana Stealth 25L',
      'Detalle inferior y bolsillo frontal de acceso rápido de la Mochila Urbana Stealth 25L',
      'Acercamiento al acabado mate impermeable de la Mochila Urbana Stealth 25L'
    ]
  }
];

const mochilasGeneradas = Array.from({ length: 48 }, (_, index) => {
  const num = index + 3;
  const config = categoriasConfig[index % categoriasConfig.length];
  const sufijo = sufijosModelo[index % sufijosModelo.length];
  const litros = config.capacidades[index % config.capacidades.length];
  const precioCalculado = config.basePrecio + ((index % 5) * 4500);
  const imgPrincipal = imagenesBase[index % imagenesBase.length];
  const nombreCompleto = `${config.prefijo} ${litros}L ${sufijo}`;

  return {
    id: `mochila-${config.tipo.toLowerCase()}-${litros}l-${num}`,
    nombre: nombreCompleto,
    categoria: config.cat,
    precio: precioCalculado,
    capacidad_litros: litros,
    descripcion: `Modelo ${sufijo} de ${litros} litros diseñada para ${config.cat.toLowerCase()}. Costuras reforzadas, cierres sellados y ergonomía lumbar.`,
    stock_fisico: 5 + (index % 15),
    stock_reservado: index % 3,
    badge: config.badge,
    imagenes: generarGaleriaMismaMochila(imgPrincipal),
    alt_imagenes: [
      `Vista frontal completa de ${nombreCompleto} (${litros}L)`,
      `Detalle superior y asa de transporte de ${nombreCompleto}`,
      `Detalle inferior y compartimento frontal de ${nombreCompleto}`,
      `Acercamiento a la tela y terminaciones de ${nombreCompleto}`
    ]
  };
});

export const LISTA_MOCHILAS = [...mochilasIniciales, ...mochilasGeneradas];