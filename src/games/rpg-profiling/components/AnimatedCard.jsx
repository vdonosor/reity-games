import React, { useRef, useEffect } from "react";

// Touch-friendly, animated card container with subtle parallax tilt
export default function AnimatedCard({
  className = "",
  children,
  onClick,
  role = "button",
  ariaLabel,
  includeContentInTilt = false, // If false, content stays flat to avoid breaking Lottie
}) {
  const ref = useRef(null);
  const rafRef = useRef(0);
  const current = useRef({ px: 0, py: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      const { px, py } = current.current;
      el.style.setProperty("--tilt-x", `${py * -6}deg`);
      el.style.setProperty("--tilt-y", `${px * 6}deg`);
      rafRef.current = requestAnimationFrame(update);
    };

    const handleMove = (e) => {
      const rect = el.getBoundingClientRect();
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
      const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
      current.current.px = x / rect.width - 0.5;
      current.current.py = y / rect.height - 0.5;
    };

    const reset = () => {
      current.current.px = 0;
      current.current.py = 0;
    };

    rafRef.current = requestAnimationFrame(update);
    el.addEventListener("mousemove", handleMove, { passive: true });
    el.addEventListener("touchmove", handleMove, { passive: true });
    el.addEventListener("mouseleave", reset);
    el.addEventListener("touchend", reset);

    return () => {
      el.removeEventListener("mousemove", handleMove);
      el.removeEventListener("touchmove", handleMove);
      el.removeEventListener("mouseleave", reset);
      el.removeEventListener("touchend", reset);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`group relative select-none [transform:perspective(800px)_rotateX(var(--tilt-x))_rotateY(var(--tilt-y))] transition-transform duration-200 ${className}`}
      onClick={onClick}
      role={role}
      aria-label={ariaLabel}
      tabIndex={0}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) onClick(e);
      }}
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary-500/15 via-accent-500/10 to-rose-500/15 blur-xl opacity-60 group-hover:opacity-90 transition-opacity will-change-transform" />
      <div
        className={`relative rounded-2xl border border-border bg-card/80 backdrop-blur-md shadow-xl overflow-hidden ${
          includeContentInTilt ? "[transform:inherit]" : "[transform:none]"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
