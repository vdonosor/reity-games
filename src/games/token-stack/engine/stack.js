// Constants
const BLOCK_HEIGHT = 0.85;
const BLOCK_WIDTH = 1.0;
const BLOCK_DEPTH = 0.85;

const SWING_RANGE = 2.0;         // pendulum half-amplitude (~2 block widths from tower)
const BASE_PHASE_SPEED = 0.020;  // radians per frame at 60fps
const SPEED_INCREMENT = 0.0003;
const MAX_PHASE_SPEED = 0.048;
const PERFECT_THRESHOLD = 0.92;  // overlap ratio >= this = perfect
const PERFECT_SCORE_BONUS = 5;
const NORMAL_SCORE = 1;
const MISS_THRESHOLD = 0.50;     // overlap ratio < this = lose a life
const MAX_LIVES = 3;

export function createInitialState(seed) {
  return {
    seed,
    blocks: [{ x: 0, z: 0, width: BLOCK_WIDTH, depth: BLOCK_DEPTH, y: 0 }],
    currentBlock: {
      x: SWING_RANGE,          // starts at right extreme
      z: 0,
      width: BLOCK_WIDTH,
      depth: BLOCK_DEPTH,
      y: BLOCK_HEIGHT,
      phase: Math.PI / 2,      // sin(π/2)=1 → right extreme
      phaseSpeed: BASE_PHASE_SPEED,
    },
    score: 0,
    lives: MAX_LIVES,
    imbalance: 0,
    gameOver: false,
    startedAt: null,
    events: [],
  };
}

export function reduce(state, event) {
  if (state.gameOver) return state;
  switch (event.type) {
    case 'start': return { ...state, startedAt: event.ts };
    case 'tick': return tick(state, event.dt);
    case 'place_block': return placeBlock(state, event.ts);
    default: return state;
  }
}

function tick(state, dt) {
  const cb = state.currentBlock;
  const topBlock = state.blocks[state.blocks.length - 1];
  const newPhase = cb.phase + cb.phaseSpeed * dt * 60;
  const newX = topBlock.x + SWING_RANGE * Math.sin(newPhase);
  return { ...state, currentBlock: { ...cb, x: newX, phase: newPhase } };
}

function placeBlock(state, ts) {
  const cb = state.currentBlock;
  const topBlock = state.blocks[state.blocks.length - 1];

  // Overlap on X axis (single-axis pendulum)
  const overlapPx = Math.max(
    0,
    Math.min(cb.x + cb.width / 2, topBlock.x + topBlock.width / 2) -
    Math.max(cb.x - cb.width / 2, topBlock.x - topBlock.width / 2),
  );
  const overlapRatio = overlapPx / cb.width;

  // Miss: more than 50% outside → lose a life
  if (overlapRatio < MISS_THRESHOLD) {
    const newLives = state.lives - 1;
    const newImbalance = Math.min(3, state.imbalance + 1.5);

    if (newLives <= 0) {
      return {
        ...state,
        lives: 0,
        imbalance: newImbalance,
        gameOver: true,
        events: [...state.events, { type: 'place_block', ts, result: 'miss', overlap: overlapRatio }],
      };
    }

    // Retry same floor level
    const retryBlock = {
      x: topBlock.x + SWING_RANGE,
      z: 0,
      width: cb.width,
      depth: cb.depth,
      y: cb.y,
      phase: Math.PI / 2,
      phaseSpeed: Math.min(BASE_PHASE_SPEED + state.score * SPEED_INCREMENT, MAX_PHASE_SPEED),
    };

    return {
      ...state,
      lives: newLives,
      imbalance: newImbalance,
      currentBlock: retryBlock,
      events: [...state.events, { type: 'place_block', ts, result: 'miss', overlap: overlapRatio }],
    };
  }

  // Valid placement — no trimming, block stays full size at current position
  const isPerfect = overlapRatio >= PERFECT_THRESHOLD;
  const newScore = state.score + (isPerfect ? PERFECT_SCORE_BONUS : NORMAL_SCORE);
  const newImbalance = isPerfect
    ? Math.max(0, state.imbalance - 0.3)
    : Math.min(3, state.imbalance + (1 - overlapRatio) * 0.6);

  const placedBlock = { x: cb.x, z: 0, width: cb.width, depth: cb.depth, y: cb.y };

  const nextBlock = {
    x: placedBlock.x + SWING_RANGE,
    z: 0,
    width: cb.width,
    depth: cb.depth,
    y: placedBlock.y + BLOCK_HEIGHT,
    phase: Math.PI / 2,
    phaseSpeed: Math.min(BASE_PHASE_SPEED + newScore * SPEED_INCREMENT, MAX_PHASE_SPEED),
  };

  return {
    ...state,
    blocks: [...state.blocks, placedBlock],
    currentBlock: nextBlock,
    score: newScore,
    imbalance: newImbalance,
    events: [...state.events, {
      type: 'place_block', ts,
      result: isPerfect ? 'perfect' : 'normal',
      overlap: overlapRatio,
    }],
  };
}
