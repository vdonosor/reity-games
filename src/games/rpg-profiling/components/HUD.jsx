import React from "react";

export default function HUD({ step, total }) {
  const progress = Math.round(((step + 1) / total) * 100);

  return (
    <div className="fixed top-0 left-0 right-0 z-40 p-3 sm:p-4">
      <div className="mx-auto max-w-5xl rounded-xl border border-border bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/40 shadow-lg">
        <div className="grid grid-cols-2 sm:grid-cols-3 items-center gap-3 px-4 py-3">
          <div className="col-span-1 flex items-center gap-3">
            <div className="h-9 w-9 shrink-0 rounded-lg bg-primary-600/15 text-primary-600 flex items-center justify-center shadow-inner">
              <span className="text-xl">🏠</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground leading-tight">
                Progreso
              </p>
              <p className="text-sm font-semibold leading-tight">{progress}%</p>
            </div>
          </div>

          <div className="col-span-1 hidden sm:flex flex-col gap-1">
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Inicio</span>
              <span>Meta</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-500 via-accent-500 to-rose-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="col-span-1 flex items-center justify-end sm:justify-center gap-2">
            <div className="h-9 px-3 rounded-lg bg-background/60 text-muted-foreground flex items-center gap-2">
              <span className="text-lg">🧩</span>
              <span className="text-sm font-medium">Toma decisiones</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
