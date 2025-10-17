import React, { useEffect, useMemo, useState } from "react";
import LottiePlayer from "./LottiePlayer.jsx";
import config from "../config/index.jsx";
import Battle from "../../../assets/animations/Battle.json";
import { useSound } from "react-sounds";

export default function CombatOverlay({
  hero,
  enemies,
  onResolve,
  fightAnimation,
}) {
  const enemy = useMemo(() => {
    if (!enemies || enemies.length === 0) return null;
    const weights = enemies.map(
      (e) => 1 / Math.max(1, Math.abs(e.hp - hero.attack))
    );
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < enemies.length; i++) {
      r -= weights[i];
      if (r <= 0) return enemies[i];
    }
    return enemies[enemies.length - 1];
  }, [enemies, hero.attack]);
  const [animData, setAnimData] = useState(null);

  const { play: playVictory } = useSound("notification/completed");
  const { play: playDefeat } = useSound("notification/error");
  const { play: playVoid } = useSound("game/void");

  useEffect(() => {
    playVoid();
    if (fightAnimation) {
      setAnimData(fightAnimation);
      return;
    }
    const events = config.events.fight;
    if (Array.isArray(events) && events.length) {
      const picked = events[Math.floor(Math.random() * events.length)];
      if (picked.animation) setAnimData(picked.animation);
      return;
    }
    setAnimData(Battle);
  }, [fightAnimation, playVoid]);

  const resolve = () => {
    // Simple single-round: both deal damage, then finish
    const dmgToEnemy = Math.max(1, hero.attack);
    const dmgToHero = Math.max(0, (enemy?.attack ?? 1) - hero.defense);
    const heroHpAfter = Math.max(0, hero.hp - dmgToHero);
    const enemyHpAfter = Math.max(0, (enemy?.hp ?? 1) - dmgToEnemy);
    const victory = enemy && enemyHpAfter <= 0 && heroHpAfter > 0;
    if (victory) {
      playVictory();
    } else {
      playDefeat();
    }

    onResolve({
      heroHpAfter,
      enemyHpAfter,
      dmgToHero,
      dmgToEnemy,
      victory,
      enemy,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md" />
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card/95 shadow-xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-accent-500/10 to-rose-500/10" />
        <div className="relative p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary-600/20 flex items-center justify-center text-xl">
                {hero.avatar}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Héroe</p>
                <div className="flex items-center gap-3">
                  <p className="font-semibold">♥️ {hero.hp}</p>
                  <p className="font-semibold">⚔️ {hero.attack}</p>
                  <p className="font-semibold">🛡️ {hero.defense}</p>
                </div>
              </div>
            </div>
            <div className="text-2xl"></div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-rose-500/20 flex items-center justify-center text-xl">
                {enemy?.emoji}
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">
                  {enemy?.name || "?"}
                </p>
                <div className="flex items-center gap-3">
                  <p className="font-semibold">♥️ {enemy?.hp ?? "?"}</p>
                  <p className="font-semibold">⚔️ {enemy?.attack ?? "?"}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4">
            {animData && (
              <LottiePlayer
                animationData={animData}
                autoplay
                loop={true}
                className="h-40"
              />
            )}
          </div>

          <div className="mt-4 flex items-center justify-between gap-2">
            <div className="text-sm text-left">
              <div className="text-muted-foreground">
                Pulsa “Atacar” para resolver la ronda
              </div>
            </div>
            <button
              className="inline-flex items-center justify-center rounded-xl bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 font-semibold shadow"
              onClick={resolve}
            >
              Atacar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
