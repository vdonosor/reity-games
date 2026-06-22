// Seedeable PRNG (mulberry32). Produces deterministic sequences from a seed integer.
function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

// Constants
const BLOCK_HEIGHT = 0.2;
const BASE_SPEED = 0.012;
const SPEED_INCREMENT = 0.0003;
const MAX_SPEED = 0.025;
const PERFECT_THRESHOLD = 0.95; // overlap ratio vs previous block
const PERFECT_SCORE_BONUS = 5;
const NORMAL_SCORE = 1;
const SWING_RANGE = 1.5; // multiplier of block width for oscillation range

/**
 * Creates the initial game state.
 * @param {string} seed - Deterministic seed string.
 * @returns {object} Initial state.
 */
export function createInitialState(seed) {
  const rng = mulberry32(hashSeed(seed));
  const baseWidth = 1.0;
  const baseDepth = 1.0;

  return {
    seed,
    rng,
    blocks: [
      { x: 0, z: 0, width: baseWidth, depth: baseDepth, y: 0 },
    ],
    currentBlock: {
      x: -SWING_RANGE * baseWidth,
      z: 0,
      width: baseWidth,
      depth: baseDepth,
      y: BLOCK_HEIGHT,
      axis: 'x',
      direction: 1,
      speed: BASE_SPEED,
    },
    score: 0,
    perfectStreak: 0,
    gameOver: false,
    startedAt: null,
    events: [],
  };
}

/**
 * Pure reducer: takes current state + event, returns next state.
 * State is never mutated.
 */
export function reduce(state, event) {
  if (state.gameOver) return state;

  switch (event.type) {
    case 'start':
      return { ...state, startedAt: event.ts };

    case 'tick':
      return tick(state, event.dt);

    case 'place_block':
      return placeBlock(state, event.ts);

    default:
      return state;
  }
}

function tick(state, dt) {
  const cb = state.currentBlock;
  const topBlock = state.blocks[state.blocks.length - 1];

  const range = SWING_RANGE * (cb.axis === 'x' ? topBlock.width : topBlock.depth);
  const center = cb.axis === 'x' ? topBlock.x : topBlock.z;

  let pos = cb.axis === 'x' ? cb.x : cb.z;
  let dir = cb.direction;

  pos += dir * cb.speed * dt * 60; // normalize to 60fps

  const min = center - range;
  const max = center + range;
  if (pos >= max) { pos = max; dir = -1; }
  if (pos <= min) { pos = min; dir = 1; }

  const updatedBlock = cb.axis === 'x'
    ? { ...cb, x: pos, direction: dir }
    : { ...cb, z: pos, direction: dir };

  return { ...state, currentBlock: updatedBlock };
}

function placeBlock(state, ts) {
  const cb = state.currentBlock;
  const topBlock = state.blocks[state.blocks.length - 1];

  // Calculate overlap on the moving axis
  if (cb.axis === 'x') {
    const cbLeft = cb.x - cb.width / 2;
    const cbRight = cb.x + cb.width / 2;
    const tbLeft = topBlock.x - topBlock.width / 2;
    const tbRight = topBlock.x + topBlock.width / 2;

    const overlapLeft = Math.max(cbLeft, tbLeft);
    const overlapRight = Math.min(cbRight, tbRight);
    const overlap = overlapRight - overlapLeft;

    if (overlap <= 0) {
      return {
        ...state,
        gameOver: true,
        events: [...state.events, { type: 'place_block', ts, result: 'miss' }],
      };
    }

    const isPerfect = overlap / topBlock.width >= PERFECT_THRESHOLD;
    const newWidth = isPerfect ? topBlock.width : overlap;
    const newX = isPerfect ? topBlock.x : (overlapLeft + overlapRight) / 2;
    const newScore = state.score + (isPerfect ? PERFECT_SCORE_BONUS : NORMAL_SCORE);
    const newStreak = isPerfect ? state.perfectStreak + 1 : 0;
    const newSpeed = Math.min(BASE_SPEED + newScore * SPEED_INCREMENT, MAX_SPEED);
    const newY = cb.y + BLOCK_HEIGHT;

    const newBlock = {
      x: newX,
      z: cb.z,
      width: newWidth,
      depth: cb.depth,
      y: cb.y,
    };

    const nextBlock = {
      x: cb.x,
      z: newX - (SWING_RANGE * newWidth),
      width: newWidth,
      depth: cb.depth,
      y: newY,
      axis: 'z',
      direction: 1,
      speed: newSpeed,
    };

    return {
      ...state,
      blocks: [...state.blocks, newBlock],
      currentBlock: nextBlock,
      score: newScore,
      perfectStreak: newStreak,
      events: [...state.events, {
        type: 'place_block',
        ts,
        result: isPerfect ? 'perfect' : 'normal',
        position_x: cb.x,
        overlap,
      }],
    };
  } else {
    // axis === 'z'
    const cbBack = cb.z - cb.depth / 2;
    const cbFront = cb.z + cb.depth / 2;
    const tbBack = topBlock.z - topBlock.depth / 2;
    const tbFront = topBlock.z + topBlock.depth / 2;

    const overlapBack = Math.max(cbBack, tbBack);
    const overlapFront = Math.min(cbFront, tbFront);
    const overlap = overlapFront - overlapBack;

    if (overlap <= 0) {
      return {
        ...state,
        gameOver: true,
        events: [...state.events, { type: 'place_block', ts, result: 'miss' }],
      };
    }

    const isPerfect = overlap / topBlock.depth >= PERFECT_THRESHOLD;
    const newDepth = isPerfect ? topBlock.depth : overlap;
    const newZ = isPerfect ? topBlock.z : (overlapBack + overlapFront) / 2;
    const newScore = state.score + (isPerfect ? PERFECT_SCORE_BONUS : NORMAL_SCORE);
    const newStreak = isPerfect ? state.perfectStreak + 1 : 0;
    const newSpeed = Math.min(BASE_SPEED + newScore * SPEED_INCREMENT, MAX_SPEED);
    const newY = cb.y + BLOCK_HEIGHT;

    const newBlock = {
      x: cb.x,
      z: newZ,
      width: cb.width,
      depth: newDepth,
      y: cb.y,
    };

    const nextBlock = {
      x: newZ - (SWING_RANGE * newDepth),
      z: newZ,
      width: cb.width,
      depth: newDepth,
      y: newY,
      axis: 'x',
      direction: 1,
      speed: newSpeed,
    };

    return {
      ...state,
      blocks: [...state.blocks, newBlock],
      currentBlock: nextBlock,
      score: newScore,
      perfectStreak: newStreak,
      events: [...state.events, {
        type: 'place_block',
        ts,
        result: isPerfect ? 'perfect' : 'normal',
        position_z: cb.z,
        overlap,
      }],
    };
  }
}
