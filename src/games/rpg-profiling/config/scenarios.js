export const SCENARIOS = [
  {
    emoji: "🧭",
    title: "Mapa del barrio encantado",
    description:
      "Te llega información de un nuevo desarrollo en un barrio emergente con rumores de ‘plusvalía mágica’. ¿Cómo avanzas?",
    options: [
      {
        label: "Explorar preventa",
        hint: "Reserva con descuento",
        risk: 2,
      },
      { label: "Esperar entrega", hint: "Precio más alto", risk: 0 },
    ],
  },
  {
    emoji: "🏗️",
    title: "Construcción con gremio de enanos",
    description:
      "La constructora ofrece opciones de financiamiento. Las tasas varían con la ‘bendición’ del consejo enano.",
    options: [
      { label: "Tasa variable", hint: "Potencial ahorro", risk: 2 },
      { label: "Tasa fija", hint: "Costo seguro", risk: 1 },
    ],
  },
  {
    emoji: "🏘️",
    title: "Arriendo en villa luminosa",
    description:
      "Alta demanda por cercanía al portal de transporte, pero requiere remodelación de runas.",
    options: [
      { label: "Remodelar y amoblar", hint: "Mayor renta", risk: 2 },
      { label: "Arriendo simple", hint: "Menor inversión", risk: 1 },
    ],
  },
  {
    emoji: "📜",
    title: "Reglamento del condominio místico",
    description:
      "Permiten arriendo temporal con permisos; aumenta rotación de viajeros.",
    options: [
      { label: "Temporales", hint: "Más gestión", risk: 2 },
      { label: "Contrato anual", hint: "Estable", risk: 0 },
      { label: "Gestor externo", hint: "Te cobran fee", risk: 1 },
      { label: "Larga estadía", hint: "Menos trabajo", risk: 0 },
    ],
  },
  {
    emoji: "🔮",
    title: "Oráculo de valorización",
    description:
      "Escenarios de plusvalía futura con desarrollo urbano y alineación de estrellas.",
    options: [
      { label: "Apostar crecimiento", hint: "Polo emergente", risk: 2 },
      {
        label: "Zona consolidada",
        hint: "Menos incertidumbre",
        risk: 0,
      },
      { label: "Híbrido", hint: "Mitad y mitad", risk: 1 },
      {
        label: "Mantener liquidez",
        hint: "Esperar oportunidad",
        risk: 0,
      },
    ],
  },
  {
    emoji: "🏰",
    title: "Castillo en ruinas con potencial",
    description:
      "Encuentras una antigua fortaleza con vistas al valle, perfecta para restaurar o vender como reliquia turística.",
    options: [
      {
        label: "Restaurar",
        hint: "Gran retorno si atraes nobles",
        risk: 3,
      },
      { label: "Revender terreno", hint: "Ganancia rápida", risk: 1 },
      {
        label: "Esperar inversión de reyes",
        hint: "Tiempo incierto",
        risk: 2,
      },
    ],
  },
  {
    emoji: "🧙‍♂️",
    title: "Hechicero de créditos hipotecarios",
    description:
      "Un mago financiero te ofrece un crédito con ‘interés encantado’. A veces baja, a veces desaparece… o explota.",
    options: [
      {
        label: "Aceptar trato mágico",
        hint: "Podrías ahorrar oro",
        risk: 3,
      },
      {
        label: "Banco mortal tradicional",
        hint: "Seguro y predecible",
        risk: 1,
      },
    ],
  },
  {
    emoji: "🏰",
    title: "Torre del sabio hipotecado",
    description:
      "Un anciano mago vende su torre: vista panorámica, pero llena de libros que no puedes mover sin activar maldiciones.",
    options: [
      {
        label: "Comprar y convertirla en biblioteca mágica",
        hint: "Valor cultural, mantenimiento alto",
        risk: 2,
      },
      {
        label: "Vender los derechos de hechizo",
        hint: "Retorno rápido",
        risk: 1,
      },
      {
        label: "Negociar uso parcial",
        hint: "Compartes con el mago",
        risk: 1,
      },
      {
        label: "Evitar el trato",
        hint: "Sin ganancia ni riesgo",
        risk: 0,
      },
    ],
  },
  {
    emoji: "🌋",
    title: "Terreno sobre lava dormida",
    description:
      "Zona energética de alta plusvalía. El calor natural reduce gastos… o derrite tus cimientos.",
    options: [
      {
        label: "Construir con materiales resistentes",
        hint: "Costo inicial alto",
        risk: 2,
      },
      {
        label: "Usar para energía geotérmica",
        hint: "Ingresos sostenibles",
        risk: 1,
      },
      {
        label: "Esperar que el volcán despierte (literalmente)",
        hint: "Apuesta arriesgada",
        risk: 3,
      },
    ],
  },
  {
    emoji: "🐉",
    title: "Suburbio del dragón jubilado",
    description:
      "Un dragón viejo vende su finca. El área es segura, pero el seguro aún teme incendios pasados.",
    options: [
      { label: "Restaurar y alquilar", hint: "Demanda alta", risk: 2 },
      {
        label: "Comprar y revender",
        hint: "Beneficio inmediato",
        risk: 1,
      },
    ],
  },
  {
    emoji: "🧚",
    title: "Terrenos en el Valle de las Hadas",
    description:
      "Cada noche cambian de forma y color, lo que confunde a los tasadores.",
    options: [
      {
        label: "Invertir en realidad aumentada",
        hint: "Permite ubicar terrenos",
        risk: 2,
      },
      {
        label: "Esperar estabilización mágica",
        hint: "Más lento pero seguro",
        risk: 1,
      },
      {
        label: "Vender derechos turísticos",
        hint: "Menor esfuerzo",
        risk: 1,
      },
    ],
  },
  {
    emoji: "⚖️",
    title: "Disputa por los derechos del pozo",
    description:
      "Tu terreno incluye un pozo de agua pura compartido con tres gremios. Nadie sabe quién manda.",
    options: [
      {
        label: "Negociar con los gremios",
        hint: "Tiempo y diplomacia",
        risk: 1,
      },
      {
        label: "Comprar sus participaciones",
        hint: "Control total",
        risk: 2,
      },
      {
        label: "Ceder el pozo por beneficios fiscales",
        hint: "Rentabilidad indirecta",
        risk: 1,
      },
      {
        label: "Demandar al consejo",
        hint: "Resultado incierto",
        risk: 3,
      },
    ],
  },
  {
    emoji: "🧱",
    title: "Materiales vivientes",
    description:
      "Un alquimista te ofrece ladrillos que crecen solos con la humedad. Geniales… si no desarrollan conciencia.",
    options: [
      {
        label: "Construir rápido",
        hint: "Innovación rentable",
        risk: 2,
      },
      {
        label: "Probar en un proyecto pequeño",
        hint: "Control del experimento",
        risk: 1,
      },
      {
        label: "Esperar versión estable",
        hint: "Más predecible",
        risk: 0,
      },
    ],
  },
  {
    emoji: "🏝️",
    title: "Isla flotante en preventa",
    description:
      "El archipiélago de nubes vende parcelas con vistas al infinito. Los contratos son con duendes notariales.",
    options: [
      {
        label: "Comprar parcela entera",
        hint: "Alta plusvalía, alto riesgo",
        risk: 3,
      },
      {
        label: "Invertir en tiempo compartido",
        hint: "Rendimiento menor pero seguro",
        risk: 1,
      },
      {
        label: "Esperar que bajen del cielo",
        hint: "Menor precio, más espera",
        risk: 0,
      },
    ],
  },
  {
    emoji: "🪄",
    title: "Permiso de hechicería urbana",
    description:
      "El consejo exige licencia mágica para usar energía arcana en propiedades.",
    options: [
      {
        label: "Contratar gestor rúnico",
        hint: "Costo inicial",
        risk: 1,
      },
      {
        label: "Ignorar el requisito",
        hint: "Sanción o maldición",
        risk: 3,
      },
      {
        label: "Aliarte con un mago",
        hint: "Repartes ganancias",
        risk: 2,
      },
    ],
  },
  {
    emoji: "🦇",
    title: "Hostal para vampiros",
    description:
      "Negocio nocturno prometedor, pero las quejas de vecinos vivos abundan.",
    options: [
      {
        label: "Reforzar insonorización",
        hint: "Mitiga problemas",
        risk: 1,
      },
      {
        label: "Promocionarlo como experiencia exótica",
        hint: "Gran ganancia, reputación incierta",
        risk: 3,
      },
      {
        label: "Vender la licencia a otro",
        hint: "Salida rápida",
        risk: 1,
      },
    ],
  },
  {
    emoji: "🌳",
    title: "Árbol inmobiliario",
    description:
      "Un druida te ofrece invertir en un árbol que crece y genera casas entre sus ramas.",
    options: [
      {
        label: "Financiar el crecimiento",
        hint: "Proyecto a largo plazo",
        risk: 2,
      },
      {
        label: "Comprar derechos de recolección",
        hint: "Ingresos pasivos",
        risk: 1,
      },
      {
        label: "Vender la idea a una constructora",
        hint: "Ganancia intelectual",
        risk: 0,
      },
    ],
  },
  {
    emoji: "🕰️",
    title: "Casa que retrocede en el tiempo",
    description:
      "Cada día regresa al estado del día anterior, incluidos los pagos atrasados.",
    options: [
      {
        label: "Alquilarla a historiadores",
        hint: "Nicho rentable",
        risk: 1,
      },
      {
        label: "Intentar romper el bucle",
        hint: "Difícil pero lucrativo",
        risk: 3,
      },
      {
        label: "Usarla como atracción turística",
        hint: "Ingresos variables",
        risk: 2,
      },
    ],
  },
  {
    emoji: "🧊",
    title: "Inversión en el Reino del Hielo",
    description:
      "Los precios están congelados, literalmente. Pero se rumorea que el deshielo traerá turismo.",
    options: [
      {
        label: "Comprar barato y esperar deshielo",
        hint: "Largo plazo",
        risk: 2,
      },
      {
        label: "Invertir en calefacción mágica",
        hint: "Atracción inmediata",
        risk: 3,
      },
      {
        label: "Esperar señales del clima",
        hint: "Decisión prudente",
        risk: 1,
      },
    ],
  },
  {
    emoji: "🪙",
    title: "Moneda encantada",
    description:
      "Los alquileres en tu zona solo se pagan con monedas que cambian de valor cada medianoche.",
    options: [
      {
        label: "Apostar a la fluctuación",
        hint: "Puede multiplicarse",
        risk: 3,
      },
      { label: "Convertir a renta fija", hint: "Estabilidad", risk: 1 },
      {
        label: "Hacer trueque mágico",
        hint: "Menos control, más relaciones",
        risk: 2,
      },
    ],
  },
  {
    emoji: "📜",
    title: "Contrato con letra invisible",
    description:
      "Firmar el pergamino podría darte descuentos… o una deuda eterna.",
    options: [
      {
        label: "Leer con tinta de luna",
        hint: "Aseguras transparencia",
        risk: 1,
      },
      {
        label: "Firmar sin mirar",
        hint: "Alta ganancia o catástrofe",
        risk: 3,
      },
      {
        label: "Llevarlo al notario duende",
        hint: "Costo extra",
        risk: 2,
      },
    ],
  },
  {
    emoji: "🐀",
    title: "Ratas alquimistas en el sótano",
    description:
      "Transforman basura en oro falso. Podría ser negocio... o un delito.",
    options: [
      {
        label: "Controlar la producción",
        hint: "Beneficio ilegal",
        risk: 3,
      },
      {
        label: "Vender la propiedad",
        hint: "Evitas sanciones",
        risk: 1,
      },
      {
        label: "Capacitarlas legalmente",
        hint: "Innovación responsable",
        risk: 2,
      },
    ],
  },
  {
    emoji: "🧬",
    title: "Casas que se replican",
    description:
      "Una startup promete propiedades que se copian solas. Cada copia reduce su valor, pero aumenta tu inventario.",
    options: [
      {
        label: "Invertir agresivamente",
        hint: "Crecimiento exponencial",
        risk: 3,
      },
      {
        label: "Controlar replicación",
        hint: "Rentabilidad sostenida",
        risk: 2,
      },
      {
        label: "Vender antes de saturar mercado",
        hint: "Toma de ganancias",
        risk: 1,
      },
    ],
  },
  {
    emoji: "🎭",
    title: "Teatro de ilusiones en ruinas",
    description:
      "El edificio parece derrumbado, pero es solo un hechizo. Requiere mantenimiento constante para mantener la ilusión.",
    options: [
      {
        label: "Restaurar físicamente",
        hint: "Más inversión, más valor real",
        risk: 2,
      },
      {
        label: "Mantener la ilusión",
        hint: "Bajo costo, frágil",
        risk: 1,
      },
      { label: "Combinar ambas", hint: "Equilibrio rentable", risk: 2 },
    ],
  },
  {
    emoji: "💡",
    title: "Distrito de energía luminosa",
    description:
      "Paneles de cristal solar con subsidios del reino. Pero los duendes proveedores son volátiles.",
    options: [
      { label: "Firmar contrato largo", hint: "Estabilidad", risk: 1 },
      { label: "Negociar variable", hint: "Mejor retorno", risk: 2 },
      {
        label: "Esperar nueva tecnología",
        hint: "Menor riesgo",
        risk: 0,
      },
    ],
  },
  {
    emoji: "🏗️",
    title: "Gremio constructor de golems",
    description:
      "Ofrecen construcción en tiempo récord, pero sus obreros tienden a rebelarse si no se les paga en esencia mágica.",
    options: [
      { label: "Usarlos igual", hint: "Velocidad récord", risk: 2 },
      {
        label: "Pagarles con tu energía",
        hint: "Exigente pero seguro",
        risk: 1,
      },
      {
        label: "Contratar humanos",
        hint: "Más lento, sin sorpresas",
        risk: 0,
      },
    ],
  },
  {
    emoji: "🪞",
    title: "Casa reflejada",
    description:
      "Tu propiedad tiene un doble perfecto en otra dimensión, y ambos influyen en el valor del otro.",
    options: [
      {
        label: "Intercambiar uso con el reflejo",
        hint: "Beneficio compartido",
        risk: 2,
      },
      {
        label: "Romper el vínculo",
        hint: "Independencia total",
        risk: 1,
      },
      {
        label: "Explotarlo turísticamente",
        hint: "Rendimiento variable",
        risk: 2,
      },
    ],
  },
].map((s, i) => ({
  ...s,
  id: i + 1,
  options: s.options.sort((a, b) => (a.risk || 0) - (b.risk || 0)),
}));
