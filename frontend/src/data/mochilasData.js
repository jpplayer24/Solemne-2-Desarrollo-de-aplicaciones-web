

const imagenesBase = [
  'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1581605405669-fcdf81165afa?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1546938576-6e6a64f317cc?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1577733966973-d680bffd2e80?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1491637639811-60e2756cc1c7?auto=format&fit=crop&w=600&q=80'
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
    imagenes: [imagenesBase[0], imagenesBase[1], imagenesBase[2], imagenesBase[3]],
    alt_imagenes: [
      'Vista frontal de la Mochila Trekking 65L Andina en tela oscura impermeable con bolsillo frontal con cierre',
      'Detalle lateral de las correas de compresión y acolchado lumbar de la Mochila Trekking 65L Andina',
      'Compartimento superior y costuras reforzadas Ripstop de la Mochila Trekking 65L Andina',
      'Vista trasera mostrando el sistema de ventilación de espalda y tirantes ergonómicos de 65 litros'
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
    imagenes: [imagenesBase[1], imagenesBase[2], imagenesBase[4], imagenesBase[0]],
    alt_imagenes: [
      'Vista frontal minimalista de la Mochila Urbana Stealth 25L con acabado mate resistente al agua',
      'Apertura del compartimento acolchado para computador portátil de hasta 16 pulgadas',
      'Detalle de cierres estancos y bolsillo oculto antirrobo de la Mochila Urbana Stealth 25L',
      'Vista de perfil mostrando las correas ajustables acolchadas para uso diario en ciudad'
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

  const galeria = [
    imgPrincipal,
    imagenesBase[(index + 1) % imagenesBase.length],
    imagenesBase[(index + 2) % imagenesBase.length],
    imagenesBase[(index + 3) % imagenesBase.length]
  ];

  // Generamos 4 descripciones alt únicas por producto para cumplir WCAG 1.1.1
  const descripcionesAlt = [
    `Vista frontal principal de ${nombreCompleto}, capacidad de ${litros} litros para ${config.cat.toLowerCase()}`,
    `Detalle lateral y correas de ajuste reforzadas de ${nombreCompleto}`,
    `Vista interior de los compartimentos organizadores y cierres sellados de ${nombreCompleto}`,
    `Respaldo ergonómico acolchado y tirantes respirables de ${nombreCompleto}`
  ];

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
    imagenes: galeria,
    alt_imagenes: descripcionesAlt
  };
});

export const LISTA_MOCHILAS = [...mochilasIniciales, ...mochilasGeneradas];