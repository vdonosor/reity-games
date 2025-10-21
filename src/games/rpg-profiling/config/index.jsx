import PiggyBank from "../../../assets/animations/PiggyBank.json";
import Fire from "../../../assets/animations/Fire.json";
import Battle from "../../../assets/animations/Battle.json";
import success from "./events/success.jsx";
import fail from "./events/fail.jsx";
import fight from "./events/fight.jsx";
import enemies from "./enemies.jsx";
import items from "./items.jsx";
import { SCENARIOS } from "./scenarios.js";

export default {
  simplified: true,
  max_steps: 8,
  probabilities: {
    fail: [0.1, 0.25, 0.5, 0.75],
    fightBase: 0.15, // added with risk*0.1
  },
  animations: {
    success: PiggyBank,
    fail: Fire,
    fight: Battle,
  },
  scenarios: SCENARIOS,
  events: {
    success,
    fail,
    fight,
  },
  enemies,
  items,
};
