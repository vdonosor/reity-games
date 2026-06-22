import { useState, useCallback, useEffect, useRef } from 'react';
import { CaptureForm } from './components/CaptureForm.jsx';
import { GameOver } from './components/GameOver.jsx';
import { GameScene } from './three/GameScene.jsx';
import { useGameEngine } from './hooks/useGameEngine.js';

const SESSION_KEY = 'ts_lead';

function generateSeed() {
  return `ts-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getStoredLead() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Inner component that runs after lead is established
function TokenStackGame({ lead }) {
  const seedRef = useState(() => generateSeed())[0];
  const { state, placeBlock, restartGame } = useGameEngine(seedRef);

  const [gameOverData, setGameOverData] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [releaseInfo, setReleaseInfo] = useState(null);
  const tapIdRef = useRef(0);

  const handleTap = useCallback(() => {
    if (state.gameOver) return;
    // Capture pendulum kinematics at release for falling animation
    const cb = state.currentBlock;
    const SWING_AMP = 0.58;
    const ROPE = 3.5;
    const angVel = SWING_AMP * (cb.phaseSpeed || 0.02) * 60 * Math.cos(cb.phase || 0);
    const theta = cb.theta || 0;
    tapIdRef.current += 1;
    setReleaseInfo({
      id: tapIdRef.current,
      x: cb.x,
      y: cb.y,
      vx: ROPE * Math.cos(theta) * angVel * 0.18,   // damped horizontal arc
      vy: ROPE * Math.sin(theta) * angVel * 1.6,    // amplified for visible arc
      colorIndex: state.blocks.length,
    });
    placeBlock();
  }, [state.gameOver, state.currentBlock, state.blocks.length, placeBlock]);

  // Detect game over and submit score
  useEffect(() => {
    if (!state.gameOver || gameOverData || submitting) return;
    setSubmitting(true);
    submitScore(lead, state).then((result) => {
      setGameOverData(result);
      setSubmitting(false);
    });
  }, [state.gameOver, gameOverData, submitting, lead, state]);

  const handleRestart = useCallback(() => {
    setGameOverData(null);
    setSubmitting(false);
    restartGame(generateSeed());
  }, [restartGame]);

  return (
    <div
      className="relative w-full h-dvh bg-gray-950 overflow-hidden select-none"
      onPointerDown={handleTap}
      data-testid="tap-zone"
    >
      {/* Score HUD */}
      <div className="absolute top-4 left-0 right-0 flex justify-center z-10 pointer-events-none">
        <div className="bg-gray-900/80 rounded-full px-6 py-2">
          <span className="text-white text-2xl font-black tabular-nums">{state.score}</span>
        </div>
      </div>

      {/* Branding */}
      <div className="absolute top-4 right-4 z-10 pointer-events-none">
        <p className="text-green-400 text-xs font-semibold tracking-widest uppercase opacity-70">Reity</p>
      </div>

      {/* First-time tap hint */}
      {state.score === 0 && !state.gameOver && (
        <div className="absolute bottom-16 left-0 right-0 flex justify-center z-10 pointer-events-none">
          <p className="text-white text-sm font-medium animate-pulse">TAP para apilar</p>
        </div>
      )}

      {/* Lives HUD */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none flex gap-1.5">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full transition-colors ${i <= state.lives ? 'bg-red-500' : 'bg-gray-700'}`}
          />
        ))}
      </div>

      {/* 3D scene */}
      <div className="absolute inset-0">
        <GameScene
          blocks={state.blocks}
          currentBlock={state.currentBlock}
          imbalance={state.imbalance}
          gameOver={state.gameOver}
          releaseInfo={releaseInfo}
        />
      </div>

      {/* Game Over overlay */}
      {state.gameOver && (
        <GameOver
          score={state.score}
          serverScore={gameOverData?.server_score ?? state.score}
          valid={gameOverData?.valid ?? false}
          rankToday={gameOverData?.rank_today}
          top5={gameOverData?.top5 ?? []}
          onRestart={handleRestart}
          loading={submitting}
        />
      )}
    </div>
  );
}

export default function TokenStack() {
  const [lead, setLead] = useState(() => getStoredLead());
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  async function handleFormSubmit(formData) {
    setFormLoading(true);
    setFormError(null);
    try {
      // Store lead in session — backend call happens in TokenStackGame on first game over
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(formData));
      setLead(formData);
    } catch {
      setFormError('Error al guardar datos. Intentá de nuevo.');
    } finally {
      setFormLoading(false);
    }
  }

  function handleClearLead() {
    sessionStorage.removeItem(SESSION_KEY);
    setLead(null);
  }

  if (!lead) {
    return (
      <>
        <CaptureForm onSubmit={handleFormSubmit} loading={formLoading} />
        {formError && (
          <p className="text-red-400 text-sm text-center mt-2 px-4">{formError}</p>
        )}
      </>
    );
  }

  return <TokenStackGame lead={lead} onClearLead={handleClearLead} />;
}

// Score submission — works even if backend is not yet configured (graceful degradation)
async function submitScore(lead, state) {
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    // No backend configured yet — return local score as valid for dev purposes
    return { server_score: state.score, valid: true, rank_today: null, top5: [] };
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/end_game`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        lead,
        seed: state.seed,
        client_score: state.score,
        events: state.events,
        client_ts: Date.now(),
      }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    // If backend fails, show local score as non-ranked
    return { server_score: state.score, valid: false, rank_today: null, top5: [] };
  }
}
