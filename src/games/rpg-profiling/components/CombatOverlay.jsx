import React, { useEffect, useMemo, useRef, useState } from "react";
import LottiePlayer from "./LottiePlayer.jsx";
import config from "../config/index.jsx";
import Battle from "../../../assets/animations/Battle.json";
import { playSound } from "react-sounds";
import clsx from "clsx";

const playVoid = () => {
  playSound("game/void");
};

const playHit = () => {
  playSound("game/hit");
};

export default function CombatOverlay({
  hero,
  enemies,
  onResolve,
  fightAnimation,
}) {
  const cardRef = useRef(null);
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
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    if (isResolving) return;
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
  }, [fightAnimation, isResolving]);

  const doResolve = () => {
    // Simple single-round: both deal damage, then finish
    const dmgToEnemy = Math.max(1, hero.attack);
    const dmgToHero = Math.max(0, (enemy?.attack ?? 1) - hero.defense);
    const heroHpAfter = Math.max(0, hero.hp - dmgToHero);
    const enemyHpAfter = Math.max(0, (enemy?.hp ?? 1) - dmgToEnemy);
    const victory = enemy && enemyHpAfter <= 0 && heroHpAfter > 0;

    onResolve({
      heroHpAfter,
      enemyHpAfter,
      dmgToHero,
      dmgToEnemy,
      victory,
      enemy,
    });
  };

  const animatePunches = async () => {
    const el = cardRef.current;
    if (!el) return;
    const to = (x, duration = 160, easing = "cubic-bezier(.2,.8,.2,1)") =>
      new Promise((resolve) => {
        el.style.transition = `transform ${duration}ms ${easing}`;
        el.style.transform = `translateX(${x}px)`;
        setTimeout(resolve, duration);
      });
    const pause = (ms = 120) => new Promise((r) => setTimeout(r, ms));

    // 1) Bounce to the right, return to center (elastic), then pause
    playHit();
    await to(20, 130, "cubic-bezier(.2,.8,.2,1)"); // quick push right
    await to(0, 220, "cubic-bezier(0.34, 1.56, 0.64, 1)"); // elastic back
    await pause(140);

    // 2) Bounce to the left, return to center (elastic), then pause
    playHit();
    await to(-20, 130, "cubic-bezier(.2,.8,.2,1)");
    await to(0, 220, "cubic-bezier(0.34, 1.56, 0.64, 1)");
    await pause(140);

    // 3) Bounce to the right again, return to center (elastic)
    playHit();
    await to(14, 120, "cubic-bezier(.2,.8,.2,1)");
    await to(0, 200, "cubic-bezier(0.34, 1.56, 0.64, 1)");
    await pause(140);
    // await sound;

    // Clean up inline styles to avoid affecting future transitions
    el.style.transition = "";
    el.style.transform = "";
  };

  const handleAttack = async () => {
    if (isResolving) return;
    setIsResolving(true);
    try {
      await animatePunches();
      doResolve();
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md" />
      <div
        ref={cardRef}
        className="relative w-full max-w-lg rounded-2xl border border-border bg-card/95 shadow-xl overflow-hidden will-change-transform"
      >
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

          <div
            className={clsx(
              "mt-4 flex items-center justify-between gap-2",
              "transition-opacity",
              isResolving ? "opacity-0" : "opacity-100"
            )}
          >
            <div className="text-sm text-left">
              <div className="text-muted-foreground">
                Pulsa “Atacar” para resolver la ronda
              </div>
            </div>
            <button
              className="inline-flex items-center justify-center rounded-xl bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 font-semibold shadow"
              onClick={handleAttack}
              disabled={isResolving}
            >
              Atacar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
