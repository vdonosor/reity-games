import { toItemSnapshot } from "./items.js";
import RunningCircle from "../../../assets/animations/RunningCircle.json";
import LottiePlayer from "../components/LottiePlayer.jsx";

export function createHero() {
  return {
    name: "Inver-hero",
    // avatar: "🧙",
    avatar: (
      <LottiePlayer
        animationData={RunningCircle}
        autoplay
        loop
        className="h-40 sm:h-52"
      />
    ),
    hp: 10,
    maxHp: 10,
    attack: 1,
    defense: 0,
    coins: 0,
    items: [],
  };
}

export function giveItem(hero, item) {
  const h = { ...hero };
  h.items = [...h.items, toItemSnapshot(item)];
  return h;
}

export function applyDamage(hero, dmg) {
  const h = { ...hero };
  const realDmg = Math.max(0, dmg - h.defense);
  h.hp = Math.max(0, h.hp + Math.min(0, -realDmg));
  return h;
}
