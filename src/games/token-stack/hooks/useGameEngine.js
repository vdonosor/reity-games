import { useReducer, useRef, useEffect, useCallback } from 'react';
import { createInitialState, reduce } from '../engine/stack.js';

function engineReducer(state, event) {
  if (event.type === '__init__') return createInitialState(event.seed);
  return reduce(state, event);
}

/**
 * Drives the game engine with a requestAnimationFrame loop.
 * Exposes: state, placeBlock(), restartGame(newSeed?)
 */
export function useGameEngine(initialSeed) {
  const seedRef = useRef(initialSeed);

  const [state, dispatch] = useReducer(
    engineReducer,
    initialSeed,
    createInitialState,
  );

  const lastTimestamp = useRef(null);
  const rafId = useRef(null);
  const stateRef = useRef(state);
  stateRef.current = state;
  const loopActiveRef = useRef(false);

  const startLoop = useCallback(() => {
    if (loopActiveRef.current) return;
    loopActiveRef.current = true;
    lastTimestamp.current = null;

    const loop = (timestamp) => {
      if (!loopActiveRef.current) return;
      if (stateRef.current.gameOver) {
        loopActiveRef.current = false;
        return;
      }
      if (lastTimestamp.current !== null) {
        const dt = (timestamp - lastTimestamp.current) / 1000;
        dispatch({ type: 'tick', dt });
      }
      lastTimestamp.current = timestamp;
      rafId.current = requestAnimationFrame(loop);
    };

    rafId.current = requestAnimationFrame(loop);
  }, []);

  useEffect(() => {
    dispatch({ type: 'start', ts: Date.now() });
    startLoop();
    return () => {
      loopActiveRef.current = false;
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [startLoop]);

  const placeBlock = useCallback(() => {
    if (stateRef.current.gameOver) return;
    dispatch({ type: 'place_block', ts: Date.now() });
  }, []);

  const restartGame = useCallback((newSeed) => {
    const s = newSeed ?? seedRef.current;
    seedRef.current = s;
    loopActiveRef.current = false;
    if (rafId.current) cancelAnimationFrame(rafId.current);
    dispatch({ type: '__init__', seed: s });
    // Start loop on next tick after state settles
    setTimeout(() => {
      dispatch({ type: 'start', ts: Date.now() });
      loopActiveRef.current = false;
      startLoop();
    }, 0);
  }, [startLoop]);

  return { state, placeBlock, restartGame };
}
