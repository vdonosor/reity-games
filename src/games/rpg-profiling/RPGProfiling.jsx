import React, { useMemo, useState } from "react";
import HUD from "./components/HUD.jsx";
import StartScreen from "./components/StartScreen.jsx";
import DecisionCard from "./components/DecisionCard.jsx";
import ResultScreen from "./components/ResultScreen.jsx";
import HeroPanel from "./components/HeroPanel.jsx";
import EventOverlay from "./components/EventOverlay.jsx";
import CombatOverlay from "./components/CombatOverlay.jsx";
import { resolveChoice } from "./core/engine.js";
import { createHero } from "./core/hero.jsx";
import config from "./config/index.jsx";
import Battle from "../../assets/animations/Battle.json";
import { SoundProvider } from "react-sounds";
import { useNavigate } from "react-router-dom";

const enemies = config.enemies;

export default function RPGProfiling() {
  const allScenarios = useMemo(() => config.scenarios, []);
  const [started, setStarted] = useState(false);
  const [riskScore, setRiskScore] = useState(0);
  const [overlay, setOverlay] = useState(null); // { type: 'success'|'fail'|'fight', detail?: string }
  const [hero, setHero] = useState(createHero());
  const [remaining, setRemaining] = useState([]); // queue of scenarios left (shuffled)
  const [current, setCurrent] = useState(null); // current scenario being played
  const [playedCount, setPlayedCount] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [lastRisk, setLastRisk] = useState(0); // risk of last chosen option (for fight rewards)

  const navigate = useNavigate();

  const maxSteps = config.max_steps ?? allScenarios.length;

  const handleChoose = (opt) => {
    const s = current;
    if (!s) return;

    if (!opt) return;
    const { nextHero } = resolveChoice({
      hero,
      option: opt,
    });
    setHero(nextHero);
    setRiskScore((r) => r + (opt.risk ?? 0));
    setLastRisk(opt.risk ?? 0);
    // setOverlay({ type: outcome, detail, effects }); // TEMPORAL: disable effects display
    const nextCount = playedCount + 1;
    const reachedMax = nextCount >= maxSteps;
    if (reachedMax || remaining.length === 0) {
      setPlayedCount(nextCount);
      setCurrent(null);
      setGameOver(true);
      return;
    }
    // Siguiente escenario del queue
    const [next, ...rest] = remaining;
    setPlayedCount(nextCount);
    setCurrent(next ?? null);
    setRemaining(rest);
  };

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  const startGame = () => {
    const queue = shuffle(allScenarios);
    const first = queue[0] ?? null;
    setRemaining(queue.slice(1));
    setCurrent(first);
    setPlayedCount(0);
    setRiskScore(0);
    setOverlay(null);
    setHero(createHero());
    setGameOver(false);
    setStarted(true);
    setLastRisk(0);
  };

  const restart = () => {
    // Force refresh
    navigate(0);
  };

  return (
    <SoundProvider
      // Optional: preload both built-in and custom sounds
      preload={[
        "notification/completed",
        "notification/error",
        "game/void",
        "game/hit",
      ]}
      // Optional: set initial sound enabled state (defaults to true)
      initialEnabled={true}
    >
      <div className="min-h-dvh bg-gradient-to-b from-background via-background to-background relative">
        {started && !gameOver && <HUD step={playedCount} total={maxSteps} />}

        {!started && <StartScreen onStart={startGame} />}

        {started && !gameOver && current && (
          <div className="min-h-dvh pt-16 pb-10 flex items-center justify-center p-4">
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(700px_circle_at_20%_20%,theme(colors.primary.500/12),transparent_40%),radial-gradient(700px_circle_at_80%_10%,theme(colors.accent.500/12),transparent_40%),radial-gradient(800px_circle_at_50%_90%,theme(colors.rose.500/10),transparent_40%)]" />
            <div className="w-full max-w-2xl">
              <HeroPanel hero={hero} />
              <DecisionCard scenario={current} onChoose={handleChoose} />
              <div className="mt-4 text-center text-xs text-muted-foreground">
                Arrastra la tarjeta o toca un botón para decidir
              </div>
            </div>
          </div>
        )}

        {gameOver && (
          <ResultScreen
            score={riskScore}
            steps={playedCount}
            onRestart={restart}
            hero={hero}
          />
        )}

        {overlay && overlay.type !== "fight" && (
          <EventOverlay
            type={overlay.type}
            detail={overlay.detail}
            fightResult={overlay.fightResult}
            effects={overlay.effects}
            onDone={() => {
              setOverlay(null);
              // Avanza o finaliza: muerte, máximo de pasos o sin escenarios restantes
              const isDead = hero.hp <= 0;
              const nextCount = playedCount + 1;
              const reachedMax = nextCount >= maxSteps;
              if (isDead || reachedMax || remaining.length === 0) {
                setPlayedCount(nextCount);
                setCurrent(null);
                setGameOver(true);
                return;
              }
              // Siguiente escenario del queue
              const [next, ...rest] = remaining;
              setPlayedCount(nextCount);
              setCurrent(next ?? null);
              setRemaining(rest);
            }}
          />
        )}

        {overlay && overlay.type === "fight" && enemies.length > 0 && (
          <CombatOverlay
            hero={hero}
            enemies={enemies}
            fightAnimation={Battle}
            onResolve={(res) => {
              if (!res) {
                setOverlay(null);
                // Si se cancela la pelea, seguimos el mismo flujo que un evento finalizado
                const isDead = hero.hp <= 0;
                const nextCount = playedCount + 1;
                const reachedMax = nextCount >= maxSteps;
                if (isDead || reachedMax || remaining.length === 0) {
                  setPlayedCount(nextCount);
                  setCurrent(null);
                  setGameOver(true);
                } else {
                  const [next, ...rest] = remaining;
                  setPlayedCount(nextCount);
                  setCurrent(next ?? null);
                  setRemaining(rest);
                }
                return;
              }

              const damage = res.heroHpAfter - hero.hp;
              const coins = 2 + (lastRisk ?? 0);
              const attackUp = res.victory ? 1 : 0;
              if (res.victory) {
                // Give rewards
                setHero((prev) => ({
                  ...prev,
                  hp: res.heroHpAfter,
                  coins: prev.coins + coins,
                  attack: prev.attack + attackUp,
                }));
              } else {
                setHero((prev) => ({ ...prev, hp: res.heroHpAfter }));
              }
              // Show a result overlay with explicit fight outcome
              const msg = res.victory
                ? `¡Victoria! Has derrotado a ${res.enemy.name}.`
                : `Derrota… ${res.enemy.name} te ha superado.`;
              setOverlay({
                type: res.victory ? "success" : "fail",
                detail: msg,
                fightResult: true,
                effects: [
                  ...(damage !== 0
                    ? [
                        {
                          type: "hp",
                          delta: damage,
                          label: `${damage} HP`,
                        },
                      ]
                    : []),
                  ...(res.victory
                    ? [
                        {
                          type: "coins",
                          delta: coins,
                          label: `+${coins} monedas`,
                        },
                        {
                          type: "attack",
                          delta: attackUp,
                          label: `+${attackUp} Ataque`,
                        },
                      ]
                    : []),
                ],
              });
            }}
          />
        )}
      </div>
    </SoundProvider>
  );
}
