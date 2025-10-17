export default {
  GEM_PLUSVALIA: {
    key: "GEM_PLUSVALIA",
    emoji: "💎",
    name: "Gema de Plusvalía",
    type: "loot",
    risks: [2, 3],
    desc: "Incrementa el valor de tu inversión a largo plazo.",
    bonus: "+1 Ataque (confianza y negociación)",
    effects(hero) {
      hero.attack += 1;
      return hero;
    },
  },
  CONTRATO_BLINDADO: {
    key: "CONTRATO_BLINDADO",
    emoji: "📜",
    name: "Contrato Blindado",
    type: "defense",
    risks: [1, 2, 3],
    desc: "Cláusulas sólidas que mitigan eventos adversos.",
    bonus: "+1 Defensa (menor impacto de riesgos)",
    effects(hero) {
      hero.defense += 1;
      return hero;
    },
  },
  LLAVE_BUEN_BARRIO: {
    key: "LLAVE_BUEN_BARRIO",
    emoji: "🔑",
    name: "Llave del Buen Barrio",
    type: "utility",
    risks: [0, 1],
    desc: "Ubicación deseable que facilita ocupación y liquidez.",
    bonus: "+1 Moneda (flujo adicional)",
    effects(hero) {
      hero.coins += 1;
      return hero;
    },
  },
  SEGURO_COBERTURA: {
    key: "SEGURO_COBERTURA",
    emoji: "🛡️",
    name: "Seguro de Cobertura",
    type: "defense",
    risks: [1, 2, 3],
    desc: "Póliza que reduce el impacto de eventos negativos.",
    bonus: "+1 Defensa (protección ante siniestros)",
    effects(hero) {
      hero.defense += 1;
      return hero;
    },
  },
};
