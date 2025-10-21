import React from "react";

/**
 * VirtualKeyboard
 * Minimal, responsive on-screen keyboard focused on email input.
 * Props:
 * - onKeyPress: (val: string | 'BACKSPACE' | 'CLEAR' | 'SPACE') => void
 * - className?: string
 */
export default function VirtualKeyboard({ onKeyPress, className = "" }) {
  const row1 = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];
  const row2 = ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"];
  const row3 = ["a", "s", "d", "f", "g", "h", "j", "k", "l", "ñ"];
  const row4 = ["z", "x", "c", "v", "b", "n", "m", "@", ".", "-", "_"];

  const special = [
    { label: "Espacio", value: "SPACE", grow: true },
    { label: ".com", value: ".com" },
    { label: "⌫", value: "BACKSPACE" },
    { label: "Limpiar", value: "CLEAR" },
  ];

  const keyBase =
    "inline-flex items-center justify-center select-none rounded-lg border border-border bg-background/70 hover:bg-background active:scale-[0.98] transition text-sm sm:text-base h-10 px-3 shadow-sm";

  const handlePress = (val) => {
    if (typeof onKeyPress === "function") onKeyPress(val);
  };

  return (
    <div
      className={`rounded-xl border border-border bg-card/60 p-3 ${className}`}
    >
      <div className="grid grid-cols-10 gap-2">
        {row1.map((k) => (
          <button
            key={k}
            type="button"
            className={`${keyBase} col-span-1`}
            onClick={() => handlePress(k)}
          >
            {k}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-10 gap-2 mt-2">
        {row2.map((k) => (
          <button
            key={k}
            type="button"
            className={`${keyBase} col-span-1`}
            onClick={() => handlePress(k)}
          >
            {k}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-10 gap-2 mt-2">
        {row3.map((k) => (
          <button
            key={k}
            type="button"
            className={`${keyBase} col-span-1`}
            onClick={() => handlePress(k)}
          >
            {k}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-11 gap-2 mt-2">
        {row4.map((k) => (
          <button
            key={k}
            type="button"
            className={`${keyBase} col-span-1`}
            onClick={() => handlePress(k)}
          >
            {k}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-12 gap-2 mt-2">
        {special.map((s, i) => (
          <button
            key={i}
            type="button"
            className={`${keyBase} ${s.grow ? "col-span-6" : "col-span-2"}`}
            onClick={() => handlePress(s.value)}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
