// Central registry for items/powerups/loot
// Each item: { key, emoji, name, type, risks: number[], desc, bonus, effects(hero) }

import config from "../config/index.jsx";

export function toItemSnapshot(item) {
  // Snapshots to store in hero.items list without functions
  return {
    key: item.key,
    emoji: item.emoji,
    name: item.name,
    desc: item.desc,
    bonus: item.bonus,
    type: item.type,
  };
}

export function itemsByRisk(risk, { type, excludeKeys = [] } = {}) {
  const list = Object.values(config.items).filter(
    (it) =>
      (Array.isArray(it.risks) ? it.risks.includes(risk) : true) &&
      (!type || it.type === type) &&
      (!excludeKeys.length || !excludeKeys.includes(it.key))
  );
  return list;
}

export function randomItemForRisk(risk, opts = {}) {
  const candidates = itemsByRisk(risk, opts);
  if (!candidates.length) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

export function heroHasItem(hero, key) {
  return hero.items?.some((i) => i.key === key);
}
