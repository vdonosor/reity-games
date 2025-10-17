import React from "react";
import AnimatedCard from "./AnimatedCard.jsx";

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

export default function ResultScreen({ score, steps, onRestart, hero }) {
  const pct = Math.round((score / steps / 3) * 100);
  const profile = getProfile(pct);

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

          <div className="mt-6 grid sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-border bg-background/50 p-4">
              <p className="text-sm text-muted-foreground">Descripción</p>
              <p className="text-sm mt-1">
                Este perfil refleja tu tolerancia al riesgo según tus decisiones
                en escenarios inmobiliarios. Úsalo como guía para explorar
                oportunidades alineadas a tu estilo.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-background/50 p-4">
              <p className="text-sm text-muted-foreground">Siguiente paso</p>
              <ul className="mt-1 text-sm list-disc pl-5 space-y-1">
                <li>
                  Escanea el QR en el stand y recibe recomendaciones sugeridas.
                </li>
                <li>Comparte tu resultado y participa por premios.</li>
              </ul>
            </div>
          </div>

          {hero && (
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

          <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={onRestart}
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-primary-600 hover:bg-primary-700 text-white px-5 py-3 font-semibold shadow"
            >
              Jugar de nuevo
            </button>
            <button
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-border bg-background/60 hover:bg-background px-5 py-3 font-medium"
              onClick={() => {
                // Optional: print or save
                window.print?.();
              }}
            >
              Guardar resultado
            </button>
          </div>
        </div>
      </AnimatedCard>
    </div>
  );
}
