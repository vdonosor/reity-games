import Warriors from "../../../../assets/animations/Warriors.json";
import Battle from "../../../../assets/animations/Battle.json";
import RunningCircle from "../../../../assets/animations/RunningCircle.json";

export default [
  {
    key: "inflation",
    emoji: "🟢",
    title: "Inflación",
    desc: "Defiéndete del alza de precios.",
    animation: Battle,
  },
  {
    key: "vacancy",
    emoji: "🔵",
    title: "Vacancia",
    desc: "Encuentra nuevas estrategias para ocupar.",
    animation: Warriors,
  },
  {
    key: "rates",
    emoji: "🔴",
    title: "Tasas Altas",
    desc: "Negocia para mejorar condiciones.",
    animation: RunningCircle,
  },
];
