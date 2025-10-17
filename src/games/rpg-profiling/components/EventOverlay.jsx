import React, { useEffect, useRef, useState } from "react";
import LottiePlayer from "./LottiePlayer.jsx";
import config from "../config/index.jsx";

export default function EventOverlay({ type, onDone, detail, effects = [] }) {
  const [visible, setVisible] = useState(true);
  const [dy, setDy] = useState(0);
  const startY = useRef(null);
  const threshold = 80;

  const start = (e) => {
    startY.current = e.touches ? e.touches[0].clientY : e.clientY;
  };
  const move = (e) => {
    if (startY.current == null) return;
    const y = e.touches ? e.touches[0].clientY : e.clientY;
    setDy(y - startY.current);
  };
  const end = () => {
    if (Math.abs(dy) > threshold) {
      setVisible(false);
      setTimeout(() => onDone?.(), 150);
    }
    startY.current = null;
    setDy(0);
  };

  const fallbackContent = {
    success: {
      emoji: "✨",
      title: "¡Bien!",
      desc: detail || "Tu jugada rindió frutos.",
    },
    fail: {
      emoji: "💥",
      title: "Ups…",
      desc: detail || "El riesgo te pasó la cuenta.",
    },
    fight_result: {
      emoji: "🏆",
      title: "Victoria",
      desc: detail || "Has derrotado al enemigo.",
    },
    fight: {
      emoji: "⚔️",
      title: "Combate",
      desc: detail || "Te enfrentaste a un desafío y avanzaste.",
    },
  }[type || "success"];

  const [animData, setAnimData] = useState(null);
  const [variant, setVariant] = useState(null);
  useEffect(() => {
    const evs = config.events?.[(type || "success").toLowerCase()];
    if (Array.isArray(evs) && evs.length) {
      const picked = evs[Math.floor(Math.random() * evs.length)];
      setVariant(picked);
      if (picked.animation) setAnimData(picked.animation);
      return;
    }
    const anim = config.animations[(type || "success").toLowerCase()];
    if (anim) setAnimData(anim);
  }, [type]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-6 transition-opacity ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      onMouseMove={move}
      onMouseUp={end}
      onTouchMove={move}
      onTouchEnd={end}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-md"
        onClick={() => {
          setVisible(false);
          setTimeout(() => onDone?.(), 150);
        }}
      />
      <div
        className="relative w-full max-w-sm rounded-2xl border border-border bg-card/90 shadow-xl overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={start}
        onTouchStart={start}
        style={{ transform: `translateY(${dy}px)` }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-accent-500/10 to-rose-500/10" />
        <div className="relative p-6 text-center">
          {animData ? (
            <LottiePlayer
              animationData={animData}
              autoplay
              loop={true}
              className="h-40"
            />
          ) : (
            <div className="text-5xl animate-pulse">
              {(variant && variant.emoji) || fallbackContent.emoji}
            </div>
          )}
          <h3 className="mt-2 text-xl font-extrabold">
            {(variant && variant.title) || fallbackContent.title}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {variant?.desc || fallbackContent.desc}
          </p>
          {detail && (
            <p className="text-sm text-muted-foreground mt-1">{detail}</p>
          )}
          {effects && effects.length > 0 && (
            <div className="mt-3 text-left text-sm">
              <p className="font-semibold mb-1">Efectos:</p>
              <ul className="space-y-1">
                {effects.map((eff, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span>
                      {eff.type === "hp" && "❤️"}
                      {eff.type === "coins" && "🪙"}
                      {eff.type === "attack" && "⚔️"}
                      {eff.type === "defense" && "🛡️"}
                      {eff.type === "item" && (eff.item?.emoji || "🎁")}
                    </span>
                    <span>{eff.label}</span>
                    {eff.item && (
                      <span className="text-muted-foreground">
                        — {eff.item.name}: {eff.item.bonus}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-4 flex flex-col items-center gap-2">
            <button
              className="inline-flex items-center justify-center rounded-xl bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 font-semibold shadow"
              onClick={() => {
                setVisible(false);
                setTimeout(() => onDone?.(), 150);
              }}
            >
              Continuar
            </button>
            <p className="text-xs text-muted-foreground">
              Toca fuera, presiona Continuar o desliza para cerrar
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
