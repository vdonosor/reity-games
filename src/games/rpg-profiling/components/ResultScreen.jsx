import React, { useMemo, useState, useCallback } from "react";
import AnimatedCard from "./AnimatedCard.jsx";
import VirtualKeyboard from "./VirtualKeyboard.jsx";
import config from "../config/index.jsx";

function getProfile(pct) {
  if (pct <= 20)
    return {
      key: "muy-conservador",
      label: "Muy Conservador",
      color: "from-emerald-500 to-teal-500",
      emoji: "🛡️",
    };
  if (pct <= 40)
    return {
      key: "conservador",
      label: "Conservador",
      color: "from-green-500 to-emerald-500",
      emoji: "🏡",
    };
  if (pct <= 60)
    return {
      key: "moderado",
      label: "Moderado",
      color: "from-sky-500 to-indigo-500",
      emoji: "⚖️",
    };
  if (pct <= 80)
    return {
      key: "riesgoso",
      label: "Riesgoso",
      color: "from-orange-500 to-amber-500",
      emoji: "🚀",
    };
  return {
    key: "muy-riesgoso",
    label: "Muy Riesgoso",
    color: "from-rose-500 to-pink-500",
    emoji: "🔥",
  };
}

// Simple prize tiers that can be easily tweaked
const DEFAULT_PRIZES = [
  { minCoins: 0, label: "Sticker Reity", emoji: "🎟️", article: "un" },
  { minCoins: 5, label: "Taza Reity", emoji: "🍵", article: "una" },
];

export default function ResultScreen({
  score,
  steps,
  onRestart,
  hero,
  prizeTiers = DEFAULT_PRIZES,
  onSubmitEmail,
}) {
  const pct = Math.round((score / steps / 3) * 100);
  const profile = getProfile(pct);

  // Prize based on coins (fallback to score if no hero)
  const prize = useMemo(() => {
    const coins = hero?.coins ?? Math.max(0, Math.round(score));
    // pick the highest tier with minCoins <= coins
    const sorted = [...prizeTiers].sort((a, b) => a.minCoins - b.minCoins);
    let selected = sorted[0];
    for (const t of sorted) if (coins >= t.minCoins) selected = t;
    return selected;
  }, [hero?.coins, prizeTiers, score]);

  // Email capture state
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const emailRegex = useMemo(
    () => /^(?:[A-Z0-9._%+-]+)@(?:[A-Z0-9.-]+)\.[A-Z]{2,}$/i,
    []
  );
  const isValid = emailRegex.test(email);

  const handleKeyPress = useCallback(
    (val) => {
      setSubmitted(false);
      if (val === "BACKSPACE") {
        setEmail((e) => e.slice(0, -1));
      } else if (val === "CLEAR") {
        setEmail("");
      } else if (val === "SPACE") {
        setEmail((e) => e + " ");
      } else if (typeof val === "string") {
        setEmail((e) => e + val);
      }
    },
    [setEmail]
  );

  const handleSubmit = useCallback(() => {
    if (!isValid) return;
    setSubmitted(true);
    // Always persist locally in a JSON list on localStorage
    try {
      const KEY = "reity_rpg_emails";
      const raw = window?.localStorage?.getItem(KEY);
      let list = [];
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) list = parsed;
        } catch {
          // If corrupt, reset to empty array
          list = [];
          // Save raw in localStorage with uuid key for debugging
          const debugKey = `reity_rpg_emails_corrupt_${Date.now()}`;
          window?.localStorage?.setItem(debugKey, raw);
        }
      }
      // Append the email; requirement says only add to the JSON list
      list.push({ email, profile: profile.label, pct });
      window?.localStorage?.setItem(KEY, JSON.stringify(list));
    } catch (e) {
      // Non-blocking: if storage fails, we still update UI state
      console.error("No se pudo guardar el email en localStorage", e);
    }

    if (typeof onSubmitEmail === "function")
      onSubmitEmail({ email, profile: profile.label, pct });
  }, [email, isValid, onSubmitEmail, pct, profile.label]);

  return (
    <div className="min-h-dvh pt-16 pb-10 flex items-center justify-center p-4">
      <AnimatedCard className="w-full max-w-2xl">
        <div className="p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`h-12 w-12 rounded-xl bg-gradient-to-br ${profile.color} text-white flex items-center justify-center text-2xl shadow-lg`}
              >
                {profile.emoji}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  Tu perfil de inversión
                </p>
                <h2 className="text-2xl font-extrabold">{profile.label}</h2>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Índice de riesgo</p>
              <p className="text-xl font-bold">{pct}%</p>
            </div>
          </div>

          <div className="mt-6">
            <div className="h-3 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${profile.color}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* TEMPORAL: Simplify HUD */}
          {!config.simplified && hero && (
            <div className="mt-6 rounded-xl border border-border bg-background/60 p-4">
              <p className="text-sm text-muted-foreground">Tu aventura</p>
              <div className="mt-3 flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary-500 to-teal-500 text-white flex items-center justify-center text-2xl shadow-lg">
                  {hero.avatar}
                </div>
                <div className="flex-1 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    HP: {hero.hp}/{hero.maxHp}
                  </div>
                  <div>Monedas: {hero.coins}</div>
                  <div>Ataque: {hero.attack}</div>
                  <div>Defensa: {hero.defense}</div>
                </div>
              </div>
              {hero.items?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2 text-sm">
                  {hero.items.map((it, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-border bg-card/70"
                    >
                      <span>{it.emoji}</span>
                      <span>{it.name}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="mt-6 grid sm:grid-cols-1 gap-4">
            {/* <div className="rounded-xl border border-border bg-background/50 p-4">
              <p className="text-sm text-muted-foreground">Descripción</p>
              <p className="text-sm mt-1">
                Este perfil refleja tu tolerancia al riesgo según tus decisiones
                en escenarios inmobiliarios. Úsalo como guía para explorar
                oportunidades alineadas a tu estilo.
              </p>
            </div> */}
            <div className="rounded-xl border border-border bg-background/50 p-4">
              <p className="text-sm text-muted-foreground">Ganaste</p>
              <div className="mt-1 flex items-center gap-2 text-sm">
                <span className="text-xl">{prize.emoji}</span>
                <span>
                  Ganaste {prize.article}{" "}
                  <span className="font-semibold">{prize.label}</span>
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Premio basado en tus monedas:{" "}
                {hero?.coins ?? Math.max(0, Math.round(score))} 🪙
              </p>
            </div>
          </div>

          {/* Email capture with on-screen keyboard */}
          <div className="mt-6 rounded-xl border border-border bg-background/50 p-4">
            <p className="text-sm text-muted-foreground">Recibe tu premio</p>
            <p className="text-sm mt-1">
              Para recibir tu premio, comparte tu correo electrónico. Usá el
              teclado en pantalla para escribir.
            </p>
            <div className="mt-3 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              <input
                type="text"
                inputMode="none"
                value={email}
                readOnly
                className="flex-1 rounded-xl border border-border bg-card/70 px-4 py-3 text-base outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="tu-email@ejemplo.com"
              />
              <button
                onClick={handleSubmit}
                disabled={!isValid || submitted}
                className={`inline-flex items-center justify-center rounded-xl px-5 py-3 font-semibold shadow w-full sm:w-auto ${
                  !isValid || submitted
                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                    : "bg-primary-600 hover:bg-primary-700 text-white"
                }`}
              >
                {submitted ? "¡Enviado!" : "Enviar"}
              </button>
            </div>
            <div className="mt-3">
              <VirtualKeyboard onKeyPress={handleKeyPress} />
            </div>
            {!isValid && email.length > 0 && (
              <p className="text-xs text-rose-500 mt-2">
                Ingresa un correo válido.
              </p>
            )}
          </div>

          <div className="mt-8 flex items-center justify-center">
            <button
              onClick={onRestart}
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-primary-600 hover:bg-primary-700 text-white px-5 py-3 font-semibold shadow"
            >
              Cerrar
            </button>
          </div>
        </div>
      </AnimatedCard>
    </div>
  );
}
