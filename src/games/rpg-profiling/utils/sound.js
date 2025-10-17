// import { playSound } from "react-sounds";

// Lightweight Web Audio SFX helper
let audioCtx = null;

function getCtx() {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audioCtx = new AC();
  }
  return audioCtx;
}

export async function resumeAudio() {
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state !== "running") {
    try {
      await ctx.resume();
    } catch {
      // ignore
    }
  }
}

function now() {
  const ctx = getCtx();
  return ctx ? ctx.currentTime : 0;
}

function tone({ freq = 440, duration = 0.12, type = "sine", volume = 0.15 }) {
  const ctx = getCtx();
  if (!ctx) return;
  const t0 = now();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}

function noise({ duration = 0.15, volume = 0.1 }) {
  const ctx = getCtx();
  if (!ctx) return;
  const bufferSize = Math.floor(44100 * duration);
  const buffer = ctx.createBuffer(1, bufferSize, 44100);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.6;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.value = volume;
  src.connect(gain);
  gain.connect(ctx.destination);
  src.start();
}

function seq(steps = []) {
  // steps: [{delay: seconds, action: fn}]
  const ctx = getCtx();
  if (!ctx) return;
  steps.forEach((s) => {
    setTimeout(() => s.action?.(), Math.max(0, (s.delay || 0) * 1000));
  });
}

// Public SFX API
const sfx = {
  click() {
    tone({ freq: 800, duration: 0.05, type: "square", volume: 0.08 });
  },
  start() {
    seq([
      { delay: 0.0, action: () => tone({ freq: 440, duration: 0.09 }) },
      { delay: 0.08, action: () => tone({ freq: 660, duration: 0.09 }) },
      { delay: 0.16, action: () => tone({ freq: 880, duration: 0.12 }) },
    ]);
  },
  choice(dir) {
    const map = { up: 740, down: 420, left: 520, right: 620 };
    tone({ freq: map[dir] || 600, duration: 0.08, type: "triangle" });
  },
  fightAppear() {
    seq([
      { delay: 0.0, action: () => noise({ duration: 0.06, volume: 0.08 }) },
      {
        delay: 0.02,
        action: () =>
          tone({ freq: 180, duration: 0.12, type: "sawtooth", volume: 0.08 }),
      },
      {
        delay: 0.12,
        action: () =>
          tone({ freq: 140, duration: 0.1, type: "sawtooth", volume: 0.07 }),
      },
    ]);
  },
  attack() {
    seq([
      { delay: 0.0, action: () => noise({ duration: 0.05, volume: 0.07 }) },
      {
        delay: 0.02,
        action: () =>
          tone({ freq: 500, duration: 0.06, type: "square", volume: 0.12 }),
      },
    ]);
  },
  hit() {
    tone({ freq: 220, duration: 0.08, type: "square", volume: 0.1 });
  },
  success() {
    seq([
      { delay: 0.0, action: () => tone({ freq: 660, duration: 0.08 }) },
      { delay: 0.08, action: () => tone({ freq: 880, duration: 0.1 }) },
      { delay: 0.18, action: () => tone({ freq: 990, duration: 0.12 }) },
    ]);
  },
  fail() {
    seq([
      {
        delay: 0.0,
        action: () => tone({ freq: 300, duration: 0.12, type: "sawtooth" }),
      },
      {
        delay: 0.12,
        action: () => tone({ freq: 220, duration: 0.12, type: "sawtooth" }),
      },
    ]);
  },
  victory() {
    seq([
      { delay: 0.0, action: () => tone({ freq: 523.25, duration: 0.08 }) },
      { delay: 0.08, action: () => tone({ freq: 659.25, duration: 0.08 }) },
      { delay: 0.16, action: () => tone({ freq: 783.99, duration: 0.12 }) },
    ]);
  },
  defeat() {
    seq([
      {
        delay: 0.0,
        action: () => tone({ freq: 196, duration: 0.12, type: "triangle" }),
      },
      {
        delay: 0.12,
        action: () => tone({ freq: 155, duration: 0.12, type: "triangle" }),
      },
    ]);
  },
  overlayOpen() {
    tone({ freq: 520, duration: 0.06, type: "triangle", volume: 0.08 });
  },
  overlayClose() {
    tone({ freq: 400, duration: 0.06, type: "triangle", volume: 0.08 });
  },
  coin() {
    seq([
      {
        delay: 0.0,
        action: () =>
          tone({ freq: 1200, duration: 0.05, type: "square", volume: 0.12 }),
      },
      {
        delay: 0.05,
        action: () =>
          tone({ freq: 1600, duration: 0.06, type: "square", volume: 0.1 }),
      },
    ]);
  },
  damage() {
    tone({ freq: 260, duration: 0.07, type: "square", volume: 0.09 });
  },
};

export default sfx;
