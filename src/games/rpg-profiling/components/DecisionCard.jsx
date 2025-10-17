import React, { useRef, useState } from "react";
import AnimatedCard from "./AnimatedCard.jsx";
import sfx from "../utils/sound.js";

/**
 * Swipeable decision card
 * - Drag right: choose A
 * - Drag left: choose B
 * - Tap buttons for accessibility
 */
export default function DecisionCard({ scenario, onChoose }) {
  const ref = useRef(null);
  const [dx, setDx] = useState(0);
  const [dy, setDy] = useState(0);
  const [dragging, setDragging] = useState(false);

  const threshold = 80; // px per axis
  const optionsLength = scenario.options.length;

  const start = (e) => {
    setDragging(true);
    ref.current.dataset.startX =
      (e.touches ? e.touches[0].clientX : e.clientX) ?? 0;
    ref.current.dataset.startY =
      (e.touches ? e.touches[0].clientY : e.clientY) ?? 0;
  };
  const move = (e) => {
    if (!dragging) return;
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const y = e.touches ? e.touches[0].clientY : e.clientY;
    const startX = Number(ref.current.dataset.startX || x);
    const startY = Number(ref.current.dataset.startY || y);
    setDx(x - startX);
    setDy(y - startY);
  };
  const end = () => {
    setDragging(false);
    if (dy < -threshold) {
      sfx.choice("up");
      onChoose(scenario.options[0]);
    } else if (dy > threshold) {
      sfx.choice("down");
      onChoose(scenario.options[optionsLength - 1]);
    } else if (optionsLength > 2 && dx < -threshold) {
      sfx.choice("left");
      onChoose(scenario.options[2]);
    } else if (optionsLength > 3 && dx > threshold) {
      sfx.choice("right");
      onChoose(scenario.options[3]);
    }
    setDx(0);
    setDy(0);
  };

  const rotate = Math.max(-8, Math.min(8, dx / 12));
  const rightOpacity = Math.max(0, Math.min(1, (dx - 30) / threshold));
  const leftOpacity = Math.max(0, Math.min(1, (-dx - 30) / threshold));
  const upOpacity = Math.max(0, Math.min(1, (-dy - 30) / threshold));
  const downOpacity = Math.max(0, Math.min(1, (dy - 30) / threshold));

  return (
    <div
      className="touch-pan-y"
      onMouseMove={move}
      onMouseUp={end}
      onMouseLeave={end}
      onTouchMove={move}
      onTouchEnd={end}
    >
      <AnimatedCard
        className="max-w-xl mx-auto cursor-grab active:cursor-grabbing"
        role="group"
        ariaLabel="Tarjeta de decisión"
      >
        <div
          ref={ref}
          onMouseDown={start}
          onTouchStart={start}
          style={{
            transform: `translate(${dx}px, ${dy}px) rotate(${rotate}deg)`,
          }}
          className="p-5 sm:p-7 transition-transform will-change-transform"
        >
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
              <span>Escena</span>
            </span>
            <span className="text-xl">{scenario.emoji}</span>
          </div>

          <h2 className="mt-3 text-xl sm:text-2xl font-bold leading-snug">
            {scenario.title}
          </h2>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground">
            {scenario.description}
          </p>

          <div className="relative mt-5 grid gap-3 sm:gap-4">
            <button
              onClick={() => {
                sfx.click();
                sfx.choice("up");
                onChoose(scenario.options[0]);
              }}
              className="inline-flex items-center justify-between rounded-xl bg-primary-600/90 hover:bg-primary-600 text-white px-4 py-3 sm:px-5 sm:py-4 shadow-lg ring-1 ring-black/5 transition-colors"
            >
              <span className="flex items-center gap-2 text-left">
                <span className="text-lg">⬆️</span>
                <span>
                  <span className="block font-semibold">
                    {scenario.options[0].label}
                  </span>
                  <span className="block text-xs opacity-85">
                    {scenario.options[0].hint}
                  </span>
                </span>
              </span>
              <span className="text-xs font-semibold bg-white/20 px-2 py-1 rounded">
                Elegir
              </span>
            </button>

            {optionsLength > 2 && (
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <button
                  onClick={() => {
                    sfx.click();
                    sfx.choice("left");
                    onChoose(scenario.options[1]);
                  }}
                  className="inline-flex items-center justify-between rounded-xl bg-secondary-600 hover:bg-secondary-600/90 text-white px-4 py-3 sm:px-5 sm:py-4 shadow-lg ring-1 ring-black/5 transition-colors"
                >
                  <span className="flex items-center gap-2 text-left">
                    <span className="text-lg">⬅️</span>
                    <span>
                      <span className="block font-semibold">
                        {scenario.options[1].label}
                      </span>
                      <span className="block text-xs opacity-85">
                        {scenario.options[1].hint}
                      </span>
                    </span>
                  </span>
                  <span className="text-xs font-semibold bg-white/20 px-2 py-1 rounded">
                    Elegir
                  </span>
                </button>
                {optionsLength > 3 && (
                  <button
                    onClick={() => {
                      sfx.click();
                      sfx.choice("right");
                      onChoose(scenario.options[2]);
                    }}
                    className="inline-flex items-center justify-between rounded-xl bg-rose-500 hover:bg-rose-600 text-white px-4 py-3 sm:px-5 sm:py-4 shadow-lg ring-1 ring-black/5 transition-colors"
                  >
                    <span className="flex items-center gap-2 text-left">
                      <span className="text-lg">➡️</span>
                      <span>
                        <span className="block font-semibold">
                          {scenario.options[2].label}
                        </span>
                        <span className="block text-xs opacity-85">
                          {scenario.options[2].hint}
                        </span>
                      </span>
                    </span>
                    <span className="text-xs font-semibold bg-white/20 px-2 py-1 rounded">
                      Elegir
                    </span>
                  </button>
                )}
              </div>
            )}

            <button
              onClick={() => {
                sfx.click();
                sfx.choice("down");
                onChoose(scenario.options[optionsLength - 1]);
              }}
              className="inline-flex items-center justify-between rounded-xl bg-accent-600/90 hover:bg-accent-600 text-white px-4 py-3 sm:px-5 sm:py-4 shadow-lg ring-1 ring-black/5 transition-colors"
            >
              <span className="flex items-center gap-2 text-left">
                <span className="text-lg">⬇️</span>
                <span>
                  <span className="block font-semibold">
                    {scenario.options[optionsLength - 1].label}
                  </span>
                  <span className="block text-xs opacity-85">
                    {scenario.options[optionsLength - 1].hint}
                  </span>
                </span>
              </span>
              <span className="text-xs font-semibold bg-white/20 px-2 py-1 rounded">
                Elegir
              </span>
            </button>

            {/* Drag labels */}
            <div className="pointer-events-none">
              <div
                className="absolute top-4 left-4 rounded-lg bg-primary-600 text-white text-[10px] font-bold px-2 py-1 shadow transition-opacity"
                style={{ opacity: upOpacity }}
              >
                Opción A
              </div>
              <div
                className="absolute top-4 right-4 rounded-lg bg-accent-600 text-white text-[10px] font-bold px-2 py-1 shadow transition-opacity"
                style={{ opacity: downOpacity }}
              >
                Opción B
              </div>
              {optionsLength > 2 && (
                <div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-12 rounded-lg bg-secondary-600 text-white text-[10px] font-bold px-2 py-1 shadow transition-opacity"
                  style={{ opacity: leftOpacity }}
                >
                  Opción C
                </div>
              )}
              {optionsLength > 3 && (
                <div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-12 rounded-lg bg-rose-600 text-white text-[10px] font-bold px-2 py-1 shadow transition-opacity"
                  style={{ opacity: rightOpacity }}
                >
                  Opción D
                </div>
              )}
            </div>
          </div>
        </div>
      </AnimatedCard>
    </div>
  );
}
