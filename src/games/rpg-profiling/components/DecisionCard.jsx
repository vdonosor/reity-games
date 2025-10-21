import React, { useEffect, useRef } from "react";
import AnimatedCard from "./AnimatedCard.jsx";
import sfx from "../utils/sound.js";

/**
 * Swipeable decision card
 * - Drag right: choose A
 * - Drag left: choose B
 * - Tap buttons for accessibility
 */
export default function DecisionCard({ scenario, onChoose }) {
  const cardRef = useRef(null);
  const upLabelRef = useRef(null);
  const downLabelRef = useRef(null);
  const leftLabelRef = useRef(null);
  const rightLabelRef = useRef(null);

  // runtime refs (avoid re-renders on every frame)
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const dxRef = useRef(0);
  const dyRef = useRef(0);
  const draggingRef = useRef(false);
  const rafRef = useRef(0);
  const isDownRef = useRef(false);

  const threshold = 80; // px per axis
  const activateSlop = 10; // px movement before starting a drag
  const optionsLength = scenario.options.length;

  const scheduleUpdate = () => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      const el = cardRef.current;
      if (!el) return;
      const dx = dxRef.current;
      const dy = dyRef.current;

      // visual transform
      const rotate = Math.max(-8, Math.min(8, dx / 12));
      el.style.transform = `translate(${dx}px, ${dy}px) rotate(${rotate}deg)`;

      // label opacities
      const rightOpacity = Math.max(0, Math.min(1, (dx - 30) / threshold));
      const leftOpacity = Math.max(0, Math.min(1, (-dx - 30) / threshold));
      const upOpacity = Math.max(0, Math.min(1, (-dy - 30) / threshold));
      const downOpacity = Math.max(0, Math.min(1, (dy - 30) / threshold));
      if (upLabelRef.current) upLabelRef.current.style.opacity = upOpacity;
      if (downLabelRef.current)
        downLabelRef.current.style.opacity = downOpacity;
      if (leftLabelRef.current)
        leftLabelRef.current.style.opacity = leftOpacity;
      if (rightLabelRef.current)
        rightLabelRef.current.style.opacity = rightOpacity;
    });
  };

  const onPointerDown = (e) => {
    const el = cardRef.current;
    if (!el) return;
    isDownRef.current = true;
    const x = e.clientX ?? 0;
    const y = e.clientY ?? 0;
    startXRef.current = x;
    startYRef.current = y;
    dxRef.current = 0;
    dyRef.current = 0;
    // Don't update visuals until drag activates
  };

  const onPointerMove = (e) => {
    if (!isDownRef.current && !draggingRef.current) return;
    const x = e.clientX ?? 0;
    const y = e.clientY ?? 0;
    const nextDx = x - startXRef.current;
    const nextDy = y - startYRef.current;

    if (!draggingRef.current) {
      // Check activation slop first
      if (Math.hypot(nextDx, nextDy) < activateSlop) return;
      draggingRef.current = true;
      const el = cardRef.current;
      if (el) {
        // Disable transitions while dragging for instant response
        el.style.transition = "none";
        // Prevent browser gestures like pull-to-refresh within the drag surface
        el.style.touchAction = "none";
      }
      if (
        e.currentTarget &&
        typeof e.currentTarget.setPointerCapture === "function"
      ) {
        e.currentTarget.setPointerCapture(e.pointerId);
      }
    }

    // On touch, prevent default to avoid scroll/refresh while dragging
    dxRef.current = nextDx;
    dyRef.current = nextDy;
    scheduleUpdate();
  };

  const resetPosition = () => {
    const el = cardRef.current;
    if (!el) return;
    // Smoothly snap back
    el.style.transition = "transform 180ms ease-out";
    el.style.transform = `translate(0px, 0px) rotate(0deg)`;
    // Fade out labels
    if (upLabelRef.current) upLabelRef.current.style.opacity = 0;
    if (downLabelRef.current) downLabelRef.current.style.opacity = 0;
    if (leftLabelRef.current) leftLabelRef.current.style.opacity = 0;
    if (rightLabelRef.current) rightLabelRef.current.style.opacity = 0;
  };

  const onPointerEnd = () => {
    if (!draggingRef.current) {
      // It was a tap or tiny move; ensure clean state
      isDownRef.current = false;
      dxRef.current = 0;
      dyRef.current = 0;
      resetPosition();
      return;
    }

    draggingRef.current = false;
    isDownRef.current = false;
    const dx = dxRef.current;
    const dy = dyRef.current;

    // Decide based on displacement
    if (dy < -threshold) {
      sfx.choice("up");
      onChoose(scenario.options[0]);
    } else if (dy > threshold) {
      sfx.choice("down");
      onChoose(scenario.options[optionsLength - 1]);
    } else if (optionsLength > 2 && dx < -threshold) {
      // Fix mapping: left swipe => options[1]
      sfx.choice("left");
      onChoose(scenario.options[1]);
    } else if (optionsLength > 3 && dx > threshold) {
      // Right swipe => options[2]
      sfx.choice("right");
      onChoose(scenario.options[2]);
    } else {
      // No decision, snap back
      resetPosition();
    }

    // Reset deltas
    dxRef.current = 0;
    dyRef.current = 0;
  };

  // Ensure card resets fully when scenario changes (prevents stuck transforms)
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    // Cancel any pending frame
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    draggingRef.current = false;
    isDownRef.current = false;
    dxRef.current = 0;
    dyRef.current = 0;
    // Hard reset styles
    el.style.transition = "none";
    el.style.transform = `translate(0px, 0px) rotate(0deg)`;
    if (upLabelRef.current) upLabelRef.current.style.opacity = 0;
    if (downLabelRef.current) downLabelRef.current.style.opacity = 0;
    if (leftLabelRef.current) leftLabelRef.current.style.opacity = 0;
    if (rightLabelRef.current) rightLabelRef.current.style.opacity = 0;
    // Re-enable transitions on next tick
    requestAnimationFrame(() => {
      if (el) el.style.transition = "";
    });
    return () => {};
  }, [scenario]);

  return (
    <div
      className="touch-pan-y"
      // Contain overscroll so pull-to-refresh doesn't trigger while interacting inside
      style={{ overscrollBehavior: "contain" }}
    >
      <AnimatedCard
        className="max-w-xl mx-auto cursor-grab active:cursor-grabbing"
        role="group"
        ariaLabel="Tarjeta de decisión"
      >
        <div
          ref={cardRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
          className="p-5 sm:p-7 will-change-transform select-none touch-none"
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

          {/* Gentle UX hint */}
          <p
            className="mt-6 text-xs sm:text-base text-white flex items-center gap-2"
            aria-live="polite"
          >
            <span aria-hidden="true">💡</span>
            <span>¿Qué harías? Arrastra la tarjeta o toca una opción.</span>
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
            </button>

            {/* Drag labels */}
            <div className="pointer-events-none">
              <div
                className="absolute top-4 left-4 rounded-lg bg-primary-600 text-white text-[10px] font-bold px-2 py-1 shadow transition-opacity"
                ref={upLabelRef}
                style={{ opacity: 0 }}
              >
                Opción A
              </div>
              <div
                className="absolute top-4 right-4 rounded-lg bg-accent-600 text-white text-[10px] font-bold px-2 py-1 shadow transition-opacity"
                ref={downLabelRef}
                style={{ opacity: 0 }}
              >
                Opción B
              </div>
              {optionsLength > 2 && (
                <div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-12 rounded-lg bg-secondary-600 text-white text-[10px] font-bold px-2 py-1 shadow transition-opacity"
                  ref={leftLabelRef}
                  style={{ opacity: 0 }}
                >
                  Opción C
                </div>
              )}
              {optionsLength > 3 && (
                <div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-12 rounded-lg bg-rose-600 text-white text-[10px] font-bold px-2 py-1 shadow transition-opacity"
                  ref={rightLabelRef}
                  style={{ opacity: 0 }}
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
