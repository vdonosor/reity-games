// Constants
const BLOCK_HEIGHT = 0.85;
const BLOCK_WIDTH = 1.0;
const BLOCK_DEPTH = 0.85;

export const ROPE_L = 3.5;          // rope length pivot→block center
export const PIVOT_H = 5.0;         // crane pivot above top of last placed block
const SWING_ANGLE_AMP = 0.58;       // pendulum amplitude (rad, ~33°)

const BASE_PHASE_SPEED = 0.020;
const SPEED_INCREMENT = 0.0003;
const MAX_PHASE_SPEED = 0.048;
const PERFECT_THRESHOLD = 0.92;
const PERFECT_SCORE_BONUS = 5;
const NORMAL_SCORE = 1;
const MISS_THRESHOLD = 0.50;
const MAX_LIVES = 3;

// Pendulum position from top of last placed block and oscillation phase.
// Pivot tracks topBlock.x so the crane follows the tower center.
function pendulumPos(topBlock, phase) {
  const theta = SWING_ANGLE_AMP * Math.sin(phase);
  const pivotX = topBlock.x;
  const pivotY = topBlock.y + BLOCK_HEIGHT + PIVOT_H;
  return {
    x: pivotX + ROPE_L * Math.sin(theta),
    y: (pivotY - ROPE_L * Math.cos(theta)) - BLOCK_HEIGHT / 2,  // block bottom
    theta,
    pivotX,
    pivotY,
  };
}

export function createInitialState(seed) {
  const baseBlock = { x: 0, z: 0, width: BLOCK_WIDTH, depth: BLOCK_DEPTH, y: 0 };
  const pos = pendulumPos(baseBlock, Math.PI / 2);
  return {
    seed,
    blocks: [baseBlock],
    currentBlock: {
      ...pos,
      z: 0,
      width: BLOCK_WIDTH,
      depth: BLOCK_DEPTH,
      phase: Math.PI / 2,
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
  const pos = pendulumPos(topBlock, newPhase);
  return { ...state, currentBlock: { ...cb, ...pos, phase: newPhase } };
}

function placeBlock(state, ts) {
  const cb = state.currentBlock;
  const topBlock = state.blocks[state.blocks.length - 1];

  // Overlap on X axis — cb.x is pendulum block center
  const overlapPx = Math.max(
    0,
    Math.min(cb.x + cb.width / 2, topBlock.x + topBlock.width / 2) -
    Math.max(cb.x - cb.width / 2, topBlock.x - topBlock.width / 2),
  );
  const overlapRatio = overlapPx / cb.width;

  // Miss: more than 50% outside → lose a life
  if (overlapRatio < MISS_THRESHOLD) {
    const newLives = state.lives - 1;
    // Gradual imbalance: each miss adds 0.6 (max 5 total)
    const newImbalance = Math.min(5, state.imbalance + 0.6);

    if (newLives <= 0) {
      return {
        ...state,
        lives: 0,
        imbalance: newImbalance,
        gameOver: true,
        events: [...state.events, { type: 'place_block', ts, result: 'miss', overlap: overlapRatio }],
      };
    }

    const retryPos = pendulumPos(topBlock, Math.PI / 2);
    return {
      ...state,
      lives: newLives,
      imbalance: newImbalance,
      currentBlock: {
        ...retryPos,
        z: 0,
        width: cb.width,
        depth: cb.depth,
        phase: Math.PI / 2,
        phaseSpeed: Math.min(BASE_PHASE_SPEED + state.score * SPEED_INCREMENT, MAX_PHASE_SPEED),
      },
      events: [...state.events, { type: 'place_block', ts, result: 'miss', overlap: overlapRatio }],
    };
  }

  // Valid placement — block snaps to stack, no trimming
  const isPerfect = overlapRatio >= PERFECT_THRESHOLD;
  const newScore = state.score + (isPerfect ? PERFECT_SCORE_BONUS : NORMAL_SCORE);
  // Gradual imbalance: near-miss adds at most 0.25 per block
  const newImbalance = isPerfect
    ? Math.max(0, state.imbalance - 0.5)
    : Math.min(5, state.imbalance + (1 - overlapRatio) * 0.25);

  const placedBlock = {
    x: cb.x,
    z: 0,
    width: cb.width,
    depth: cb.depth,
    y: topBlock.y + BLOCK_HEIGHT,  // always stacks cleanly on top
  };

  const nextPos = pendulumPos(placedBlock, Math.PI / 2);
  const nextBlock = {
    ...nextPos,
    z: 0,
    width: cb.width,
    depth: cb.depth,
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
