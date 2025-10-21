import React, { useEffect, useRef, useState } from "react";
import AnimatedCard from "./AnimatedCard.jsx";
import LottiePlayer from "./LottiePlayer.jsx";
import Warriors from "../../../assets/animations/Warriors.json";
import sfx from "../utils/sound.js";
import { useSimplified } from "../context/SimplifiedContext.jsx";

export default function StartScreen({ onStart }) {
  const { simplified, toggleSimplified } = useSimplified();
  const [toast, setToast] = useState("");
  const tapCountRef = useRef(0);
  const lastTapRef = useRef(0);

  // Hidden gesture: 5 taps within 2.5s on the title area toggles mode
  const onSecretTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current > 2500) {
      tapCountRef.current = 0;
    }
    tapCountRef.current += 1;
    lastTapRef.current = now;
    if (tapCountRef.current >= 5) {
      tapCountRef.current = 0;
      toggleSimplified();
      sfx.click();
      setToast(`Modo ${!simplified ? "Simplificado" : "Avanzado"} activado`);
      // auto-hide toast
      setTimeout(() => setToast(""), 1800);
    }
  };

  // Keyboard fallback for devs: press Shift+S 3 times within 2s
  useEffect(() => {
    let count = 0;
    let timer;
    const onKey = (e) => {
      if (e.key?.toLowerCase() === "s" && (e.shiftKey || e.metaKey)) {
        count += 1;
        clearTimeout(timer);
        timer = setTimeout(() => {
          count = 0;
        }, 2000);
        if (count >= 3) {
          count = 0;
          toggleSimplified();
          sfx.click();
          setToast(
            `Modo ${!simplified ? "Simplificado" : "Avanzado"} activado`
          );
          setTimeout(() => setToast(""), 1800);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleSimplified, simplified]);

  return (
    <div className="min-h-dvh pt-16 pb-10 flex items-center justify-center p-4">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(1200px_circle_at_20%_10%,theme(colors.primary.500/12),transparent_40%),radial-gradient(800px_circle_at_80%_10%,theme(colors.accent.500/12),transparent_40%),radial-gradient(1000px_circle_at_50%_80%,theme(colors.rose.500/10),transparent_40%)]" />

      <AnimatedCard className="w-full max-w-3xl" includeContentInTilt={false}>
        <div className="p-6 sm:p-10">
          <div className="mb-4">
            <LottiePlayer
              animationData={Warriors}
              autoplay
              loop
              className="h-40 sm:h-52"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary-600 text-white flex items-center justify-center text-2xl shadow-lg">
              🏰
            </div>
            <div onClick={onSecretTap} className="select-none">
              <p className="text-xs text-muted-foreground">Reity</p>
              <h1
                className={`text-2xl sm:text-3xl font-extrabold leading-tight transition-colors ${
                  !simplified ? "text-primary-600" : ""
                }`}
                title=""
              >
                Aventura Inmobiliaria
              </h1>
            </div>
          </div>

          <p className="mt-4 text-sm sm:text-base text-muted-foreground">
            Recorre 5 escenas donde tus decisiones revelarán tu perfil de
            inversión. Un 90% mundo real, 10% magia. ¿Listo para conquistar el
            mercado?
          </p>

          <div className="mt-6 grid sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-border bg-background/60 p-4">
              <p className="text-2xl">🧭</p>
              <p className="text-sm font-semibold mt-2">Explora</p>
              <p className="text-xs text-muted-foreground">
                Escenarios reales con un toque fantástico.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-background/60 p-4">
              <p className="text-2xl">⚖️</p>
              <p className="text-sm font-semibold mt-2">Decide</p>
              <p className="text-xs text-muted-foreground">
                Elige entre opciones claras y táctiles.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-background/60 p-4">
              <p className="text-2xl">📈</p>
              <p className="text-sm font-semibold mt-2">Descubre</p>
              <p className="text-xs text-muted-foreground">
                Tu perfil: conservador a muy riesgoso.
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={async () => {
                sfx.start();
                onStart?.();
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 font-semibold shadow"
            >
              Comenzar aventura
            </button>
          </div>
        </div>
      </AnimatedCard>

      {/* Subtle toast for mode changes; not visible unless toggled */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 inset-x-0 mx-auto w-max max-w-[90vw] rounded-xl bg-black/80 text-white px-4 py-2 text-xs sm:text-sm shadow-lg backdrop-blur"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
