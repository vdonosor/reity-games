import React from "react";

export default function HeroPanel({ hero }) {
  const hpPct = Math.max(
    0,
    Math.min(100, Math.round((hero.hp / hero.maxHp) * 100))
  );
  return (
    <div className="mx-auto max-w-2xl mb-4 px-4">
      <div className="rounded-2xl border border-border bg-background/60 backdrop-blur-md p-3 sm:p-4 shadow">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-secondary-500 to-teal-500 text-white flex items-center justify-center text-2xl shadow-lg">
            {hero.avatar}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <p className="font-semibold">{hero.name}</p>
              <div className="flex items-center gap-3 text-sm">
                <span
                  title="Monedas"
                  className="inline-flex items-center gap-1"
                >
                  <span>🪙</span>
                  {hero.coins}
                </span>
                <span title="Ataque" className="inline-flex items-center gap-1">
                  <span>⚔️</span>
                  {hero.attack}
                </span>
                <span
                  title="Defensa"
                  className="inline-flex items-center gap-1"
                >
                  <span>🛡️</span>
                  {hero.defense}
                </span>
              </div>
            </div>
            <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500"
                style={{ width: `${hpPct}%` }}
              />
            </div>
          </div>
        </div>
        {hero.items.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            {hero.items.map((item, idx) => (
              <span
                key={idx}
                title={`${item.name}: ${item.bonus || ""}`}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-border bg-card/70 hover:bg-card/90"
              >
                <span>{item.emoji}</span>
                <span>{item.name}</span>
                {item.bonus && (
                  <span className="text-xs text-muted-foreground">
                    — {item.bonus}
                  </span>
                )}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
