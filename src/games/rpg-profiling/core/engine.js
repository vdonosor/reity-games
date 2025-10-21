import { randomItemForRisk, heroHasItem } from "./items.js";
import { giveItem } from "./hero.jsx";
import config from "../config/index.jsx";

export function rollOutcome(risk, simplified, rng = Math.random) {
  const failProb = config.probabilities.fail[risk] ?? 0.35;
  const fightProb = simplified
    ? 0
    : config.probabilities.fightBase + risk * 0.1; // TEMPORAL: enable fights
  const roll = rng();
  if (roll < failProb) return "fail";
  if (roll < failProb + fightProb) return "fight";
  return "success";
}

export function resolveChoice({ hero, option, simplified }) {
  const outcome = rollOutcome(option.risk, simplified);
  let nextHero = { ...hero };
  let detail = "";
  const effects = []; // { type: 'hp'|'coins'|'attack'|'defense'|'item', delta, label }

  if (outcome === "success") {
    const coins = 1 + option.risk;
    nextHero.coins += coins;
    effects.push({ type: "coins", delta: coins, label: `+${coins} monedas` });
    // Random item suitable for this risk (no duplicates)
    const exclude = (nextHero.items || []).map((i) => i.key);
    let item =
      randomItemForRisk(option.risk, { excludeKeys: exclude }) ||
      config.items.LLAVE_BUEN_BARRIO;

    if (simplified) {
      item = null; // TEMPORAL: disable items for now
    } else {
      if (!heroHasItem(nextHero, item.key)) {
        nextHero = giveItem(nextHero, item);
      } else {
        item = null; // no item awarded if already owned and no alternatives
      }
    }

    // Apply item effect for immediate stat change visualization
    const before = {
      a: nextHero.attack,
      d: nextHero.defense,
      c: nextHero.coins,
    };
    if (item) item.effects(nextHero);
    const after = {
      a: nextHero.attack,
      d: nextHero.defense,
      c: nextHero.coins,
    };
    if (after.a !== before.a)
      effects.push({
        type: "attack",
        delta: after.a - before.a,
        label: `Ataque ${after.a - before.a > 0 ? "+" : ""}${
          after.a - before.a
        }`,
      });
    if (after.d !== before.d)
      effects.push({
        type: "defense",
        delta: after.d - before.d,
        label: `Defensa ${after.d - before.d > 0 ? "+" : ""}${
          after.d - before.d
        }`,
      });
    if (after.c - before.c !== 0) {
      const more = after.c - before.c;
      effects.push({ type: "coins", delta: more, label: `+${more} monedas` });
    }
    if (item) {
      effects.push({ type: "item", delta: 1, label: `${item.name}`, item });
      detail = `Obtienes ${item.name}. ${item.desc}`;
    }
  } else if (outcome === "fail") {
    if (!simplified) {
      // TEMPORAL: simplified fail outcome without fights
      const dmg = 1 + option.risk;
      const realDmg = Math.max(1, dmg - nextHero.defense);
      nextHero.hp = Math.max(0, nextHero.hp - realDmg);
      effects.push({ type: "hp", delta: -realDmg, label: `-${realDmg} HP` });
    }
  }

  return { outcome, nextHero, detail, effects };
}
