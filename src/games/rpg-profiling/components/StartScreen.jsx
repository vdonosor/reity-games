import React from "react";
import AnimatedCard from "./AnimatedCard.jsx";
import LottiePlayer from "./LottiePlayer.jsx";
import Warriors from "../../../assets/animations/Warriors.json";
import sfx from "../utils/sound.js";

export default function StartScreen({ onStart }) {
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
            <div>
              <p className="text-xs text-muted-foreground">Reity</p>
              <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight">
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
    </div>
  );
}
